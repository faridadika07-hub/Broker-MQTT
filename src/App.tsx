import { useState, useEffect, useCallback } from 'react';
import { useMQTT } from './hooks/useMQTT';
import { LogEntry, LogType } from './types';

import Header from './components/Header';
import SensorPanel from './components/SensorPanel';
import Controllers from './components/Controllers';
import BrokerStatusPanel from './components/BrokerStatusPanel';
import ActivityLog from './components/ActivityLog';
import VoiceCommand from './components/VoiceCommand';

export default function App() {
  const [flespiToken, setFlespiToken] = useState(() => localStorage.getItem('flespiToken') || '');
  
  const { brokerStatuses, suhu, kelembapan, publishToAll, setLogCallback } = useMQTT(flespiToken);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // States to sync with voice command changes
  const [extRelays, setExtRelays] = useState({ r1: false, r2: false, r3: false, r4: false });
  const [extPatterns, setExtPatterns] = useState({ p1: false, p2: false });
  
  const addLog = useCallback((message: string, type: LogType = 'info') => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        message,
        type
      };
      return [newLog, ...prev].slice(0, 100);
    });
  }, []);

  useEffect(() => {
    setLogCallback(addLog);
  }, [addLog, setLogCallback]);

  // Command handlers for Voice
  const setAllRelaysVoice = (state: boolean) => {
    if (extPatterns.p1 || extPatterns.p2) return;
    setExtRelays({ r1: state, r2: state, r3: state, r4: state });
    ['1','2','3','4'].forEach(n => publishToAll(`iot/farid_2026_xk9p/relay/${n}`, state ? 'ON' : 'OFF'));
  };

  const setRelayVoice = (id: number, state: boolean) => {
    if (extPatterns.p1 || extPatterns.p2) return;
    setExtRelays(prev => ({ ...prev, [`r${id}`]: state }));
    publishToAll(`iot/farid_2026_xk9p/relay/${id}`, state ? 'ON' : 'OFF');
  };

  const setAllPatternsVoice = (state: boolean) => {
    setExtPatterns({ p1: state, p2: state });
    ['1','2'].forEach(n => publishToAll(`iot/farid_2026_xk9p/pola/${n}`, state ? 'ON' : 'OFF'));
  };

  const setPatternVoice = (id: number, state: boolean) => {
    setExtPatterns(prev => ({ ...prev, [`p${id}`]: state }));
    publishToAll(`iot/farid_2026_xk9p/pola/${id}`, state ? 'ON' : 'OFF');
  };

  const shutdownVoice = () => {
    setExtRelays({ r1: false, r2: false, r3: false, r4: false });
    setExtPatterns({ p1: false, p2: false });
    ['1','2','3','4'].forEach(n => publishToAll(`iot/farid_2026_xk9p/relay/${n}`, 'OFF'));
    ['1','2'].forEach(n => publishToAll(`iot/farid_2026_xk9p/pola/${n}`, 'OFF'));
  };

  const getSensorTTS = (type: 'suhu' | 'kelembapan' | 'semua') => {
    if (type === 'suhu') return `Suhu saat ini ${suhu !== null ? suhu.toFixed(1) : 'tidak diketahui'} derajat celcius`;
    if (type === 'kelembapan') return `Kelembapan saat ini ${kelembapan !== null ? kelembapan.toFixed(1) : 'tidak diketahui'} persen`;
    return `Suhu ${suhu !== null ? suhu.toFixed(1) : 'belum dibaca'} derajat, kelembapan ${kelembapan !== null ? kelembapan.toFixed(1) : 'belum dibaca'} persen`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 galaxy-bg pb-20">
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        <h1 className="text-4xl lg:text-5xl font-orbitron font-bold text-center text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] tracking-widest mb-8">
          IoT DASHBOARD
        </h1>
        
        <Header flespiToken={flespiToken} setFlespiToken={setFlespiToken} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <SensorPanel suhu={suhu} kelembapan={kelembapan} />
              
              <Controllers 
                publish={publishToAll} 
                externalPatterns={extPatterns} 
                externalRelays={extRelays}
                onSync={(p, r) => { setExtPatterns(p); setExtRelays(r); }}
              />
           </div>
           
           <div className="space-y-6">
              <VoiceCommand 
                addLog={addLog}
                onCommandRecognized={() => {}}
                commands={{
                  setAllRelays: setAllRelaysVoice,
                  setRelay: setRelayVoice,
                  setAllPatterns: setAllPatternsVoice,
                  setPattern: setPatternVoice,
                  clearLog: () => setLogs([]),
                  shutdown: shutdownVoice,
                  getSensorTTS
                }}
              />
              
              <BrokerStatusPanel statuses={brokerStatuses} />
              
              <ActivityLog logs={logs} clearLog={() => setLogs([])} />
           </div>
        </div>
      </div>
    </div>
  );
}
