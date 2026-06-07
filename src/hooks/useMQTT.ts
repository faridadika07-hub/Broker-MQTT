import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt from 'mqtt';
import { BrokerStatus, LogEntry } from '../types';

export function useMQTT(flespiToken: string) {
  const [brokerStatuses, setBrokerStatuses] = useState<BrokerStatus[]>([
    { id: 'b1', name: 'Mosquitto Public', connected: false, latency: null },
    { id: 'b2', name: 'Flespi', connected: false, latency: null },
    { id: 'b3', name: 'Mosquitto Auth', connected: false, latency: null },
  ]);

  const [suhu, setSuhu] = useState<number | null>(null);
  const [kelembapan, setKelembapan] = useState<number | null>(null);
  
  const clientsRef = useRef<{ [key: string]: any }>({});
  
  // Custom log callback to be assigned by App
  const onLogRef = useRef<(msg: string, type: 'in' | 'out' | 'err' | 'info') => void>(() => {});

  const setLogCallback = useCallback((cb: (msg: string, type: 'in' | 'out' | 'err' | 'info') => void) => {
    onLogRef.current = cb;
  }, []);

  const pingIntervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const clients: { [key: string]: any } = {};
    const timestamp = Date.now();

    const connectBroker = (id: string, name: string, url: string, options: any) => {
      onLogRef.current(`Connecting to ${name}...`, 'info');
      
      const client = mqtt.connect(url, {
        clientId: `react-iot-${id}-${Math.random().toString(16).substring(2, 8)}-${timestamp}`,
        reconnectPeriod: 2000,
        ...options
      });

      clients[id] = client;
      clientsRef.current[id] = client;

      client.on('connect', () => {
        setBrokerStatuses(prev => prev.map(b => b.id === id ? { ...b, connected: true } : b));
        onLogRef.current(`Connected to ${name}`, 'info');

        // Subscribe to topics
        if (id === 'b1') { // Only need to subscribe from one, or all? "SUBSCRIBE (terima dari ESP32)..."
          // We subscribe on all just in case, but handle deduplication or just update state. 
          // Usually better to subscribe on all to ensure delivery if one fails.
        }
        client.subscribe('iot/sensor/suhu', { qos: 0 });
        client.subscribe('iot/sensor/kelembapan', { qos: 0 });
        client.subscribe(`iot/ping/${id}`, { qos: 0 });

        // Start ping loop for latency
        pingIntervalsRef.current[id] = setInterval(() => {
          if (client.connected) {
            client.publish(`iot/ping/${id}`, Date.now().toString(), { qos: 0 });
          }
        }, 5000);
      });

      client.on('message', (topic: string, message: Buffer) => {
        const payload = message.toString();
        
        if (topic === `iot/ping/${id}`) {
          const sentTime = parseInt(payload, 10);
          const latency = Date.now() - sentTime;
          setBrokerStatuses(prev => prev.map(b => b.id === id ? { ...b, latency } : b));
          return; // don't log ping messages to avoid spam
        }

        if (topic === 'iot/sensor/suhu') {
          setSuhu(parseFloat(payload));
        } else if (topic === 'iot/sensor/kelembapan') {
          setKelembapan(parseFloat(payload));
        }

        // Only log sensor data if from one broker to avoid 3x duplicate logs, 
        // OR log specifically. Let's just log from b1 to keep it clean.
        if (id === 'b1') {
          onLogRef.current(`[${name}] ${topic}: ${payload}`, 'in');
        }
      });

      client.on('close', () => {
        setBrokerStatuses(prev => prev.map(b => b.id === id ? { ...b, connected: false } : b));
      });

      client.on('offline', () => {
        setBrokerStatuses(prev => prev.map(b => b.id === id ? { ...b, connected: false } : b));
      });

      client.on('error', (err: Error) => {
        onLogRef.current(`[${name}] Error: ${err.message}`, 'err');
        setBrokerStatuses(prev => prev.map(b => b.id === id ? { ...b, connected: false } : b));
        client.end(); // close on critical error, reconnect will be handled or we might need manual reconnect
      });
    };

    // Broker 1 (Using WSS over 8081 for HTTPS compatibility)
    connectBroker('b1', 'Mosquitto Public', 'wss://test.mosquitto.org:8081/mqtt', {});
    
    // Broker 2
    if (flespiToken && flespiToken.trim() !== '') {
      // Using WSS over 443 for HTTPS compatibility
      connectBroker('b2', 'Flespi', 'wss://mqtt.flespi.io:443', { 
        username: flespiToken, 
        password: '' 
      });
    } else {
      setBrokerStatuses(prev => prev.map(b => b.id === 'b2' ? { ...b, connected: false, latency: null } : b));
      onLogRef.current('[Flespi] Broker skipped (Token kosong)', 'info');
    }

    // Broker 3 (Using WSS over 8091 for HTTPS compatibility)
    connectBroker('b3', 'Mosquitto Auth', 'wss://test.mosquitto.org:8091/mqtt', {
      username: 'rw',
      password: 'readwrite'
    });

    return () => {
      Object.keys(clients).forEach(id => {
        clients[id].end();
        if (pingIntervalsRef.current[id]) {
          clearInterval(pingIntervalsRef.current[id]);
        }
      });
    };
  }, [flespiToken]);

  const publishToAll = useCallback((topic: string, message: string) => {
    Object.values(clientsRef.current).forEach((client: any) => {
      if (client.connected) {
        client.publish(topic, message, { qos: 0 });
      }
    });
    onLogRef.current(`PUB > ${topic}: ${message}`, 'out');
  }, []);

  return {
    brokerStatuses,
    suhu,
    kelembapan,
    publishToAll,
    setLogCallback
  };
}

