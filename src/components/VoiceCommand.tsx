import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCommandProps {
  onCommandRecognized: (text: string) => void;
  commands: {
    setAllRelays: (state: boolean) => void;
    setRelay: (id: number, state: boolean) => void;
    setAllPatterns: (state: boolean) => void;
    setPattern: (id: number, state: boolean) => void;
    clearLog: () => void;
    shutdown: () => void;
    getSensorTTS: (type: 'suhu' | 'kelembapan' | 'semua') => string;
  };
  addLog: (msg: string, type: 'info' | 'err') => void;
}

export default function VoiceCommand({ onCommandRecognized, commands, addLog }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [micState, setMicState] = useState<'Belum Diizinkan' | 'Meminta Izin...' | 'Aktif'>('Belum Diizinkan');
  const [errorBanner, setErrorBanner] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const permissionGranted = useRef(false);
  const isListeningRef = useRef(false);

  useEffect(() => {
    // Check permission on mount
    navigator.permissions.query({ name: 'microphone' as unknown as PermissionName }).then((result) => {
      if (result.state === 'granted') {
        permissionGranted.current = true;
      } else if (result.state === 'denied') {
        setErrorBanner(true);
      }
    });

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        onCommandRecognized(transcript);
        processCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          permissionGranted.current = false;
          setIsListening(false);
          isListeningRef.current = false;
          setMicState('Belum Diizinkan');
          addLog('Izin mikrofon ditolak. Izinkan di pengaturan browser.', 'err');
        } else if (event.error === 'aborted') {
          // DO NOT LOG ABORTED
          return;
        } else {
          addLog(`Voice Error: ${event.error}`, 'err');
          isListeningRef.current = false; // Stop restarting on unknown errors
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && permissionGranted.current) {
          try {
            recognition.start();
          } catch(e) {}
        } else {
          setIsListening(false);
          isListeningRef.current = false;
          setMicState(permissionGranted.current ? 'Belum Diizinkan' : 'Belum Diizinkan');
        }
      };

      recognitionRef.current = recognition;
    } else {
      addLog('Browser tidak mendukung Web Speech API.', 'err');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    window.speechSynthesis.speak(utterance);
  };

  const processCommand = (text: string) => {
    let handled = false;

    // Relay Semua
    if (text.match(/semua relay nyala|hidupkan semua relay|nyalakan semua relay|semua relay on|aktifkan semua relay|relay semua nyala|semua relay hidup|hidupkan seluruh relay|nyalakan seluruh relay|aktifkan seluruh relay|seluruh relay nyala|semua relay aktif|relay on semua|on semua relay|semua on|nyalain semua relay|on kan semua relay/)) {
      commands.setAllRelays(true);
      speak("Semua relay dinyalakan");
      handled = true;
    }
    else if (text.match(/semua relay mati|matikan semua relay|semua relay off|nonaktifkan semua relay|relay semua mati|semua relay padam|matikan seluruh relay|nonaktifkan seluruh relay|seluruh relay mati|semua relay nonaktif|padamkan semua relay|relay off semua|off semua relay|semua off|matiin semua relay|off kan semua relay/)) {
      commands.setAllRelays(false);
      speak("Semua relay dimatikan");
      handled = true;
    }
    
    // Pola Semua
    else if (text.match(/semua pola nyala|hidupkan semua pola|aktifkan semua pola|nyalakan semua pola|semua pola on|semua pola aktif|aktifkan seluruh pola|hidupkan seluruh pola|seluruh pola nyala|pola on semua|on semua pola|nyalain semua pola|hidupkan pola semua|pola semua on|on kan semua pola/)) {
      commands.setAllPatterns(true);
      speak("Semua pola dinyalakan");
      handled = true;
    }
    else if (text.match(/matikan semua pola|stop pola|semua pola mati|nonaktifkan semua pola|semua pola off|matikan seluruh pola|stop semua pola|nonaktifkan seluruh pola|seluruh pola mati|padamkan semua pola|pola off semua|off semua pola|matiin semua pola|matikan pola semua|hentikan semua pola/)) {
      commands.setAllPatterns(false);
      speak("Semua pola dimatikan");
      handled = true;
    }

    // Shutdown
    else if (text.match(/semua mati|matikan semua|shutdown/)) {
      commands.shutdown();
      speak("Semua perangkat dimatikan");
      handled = true;
    }

    // Individual Pola
    else if (text.match(/hidupkan pola satu|pola satu nyala|aktifkan pola satu|pola 1 nyala|nyalakan pola satu|pola satu on|pola 1 on|jalankan pola satu/)) {
      commands.setPattern(1, true);
      speak("Pola satu dinyalakan, pola kiri ke kanan aktif");
      handled = true;
    }
    else if (text.match(/matikan pola satu|stop pola satu|pola satu mati|pola 1 mati|pola 1 off|nonaktifkan pola satu|hentikan pola satu/)) {
      commands.setPattern(1, false);
      speak("Pola satu dimatikan");
      handled = true;
    }
    else if (text.match(/hidupkan pola dua|pola dua nyala|aktifkan pola dua|pola 2 nyala|nyalakan pola dua|pola dua on|pola 2 on|jalankan pola dua/)) {
      commands.setPattern(2, true);
      speak("Pola dua dinyalakan, pola strobe aktif");
      handled = true;
    }
    else if (text.match(/matikan pola dua|stop pola dua|pola dua mati|pola 2 mati|pola 2 off|nonaktifkan pola dua|hentikan pola dua/)) {
      commands.setPattern(2, false);
      speak("Pola dua dimatikan");
      handled = true;
    }

    // Individual Relays
    else if (text.match(/relay satu nyala|hidupkan relay satu|relay satu on|relay 1 nyala|relay 1 on|aktifkan relay satu|nyalakan relay satu|relay pertama nyala/)) {
      commands.setRelay(1, true); handled = true;
    }
    else if (text.match(/relay satu mati|matikan relay satu|relay satu off|relay 1 mati|relay 1 off|nonaktifkan relay satu|padamkan relay satu|relay pertama mati/)) {
      commands.setRelay(1, false); handled = true;
    }
    else if (text.match(/relay dua nyala|hidupkan relay dua|relay dua on|relay 2 nyala|relay 2 on|aktifkan relay dua|nyalakan relay dua|relay kedua nyala/)) {
      commands.setRelay(2, true); handled = true;
    }
    else if (text.match(/relay dua mati|matikan relay dua|relay dua off|relay 2 mati|relay 2 off|nonaktifkan relay dua|padamkan relay dua|relay kedua mati/)) {
      commands.setRelay(2, false); handled = true;
    }
    else if (text.match(/relay tiga nyala|hidupkan relay tiga|relay tiga on|relay 3 nyala|relay 3 on|aktifkan relay tiga|nyalakan relay tiga|relay ketiga nyala/)) {
      commands.setRelay(3, true); handled = true;
    }
    else if (text.match(/relay tiga mati|matikan relay tiga|relay tiga off|relay 3 mati|relay 3 off|nonaktifkan relay tiga|padamkan relay tiga|relay ketiga mati/)) {
      commands.setRelay(3, false); handled = true;
    }
    else if (text.match(/relay empat nyala|hidupkan relay empat|relay empat on|relay 4 nyala|relay 4 on|aktifkan relay empat|nyalakan relay empat|relay keempat nyala/)) {
      commands.setRelay(4, true); handled = true;
    }
    else if (text.match(/relay empat mati|matikan relay empat|relay empat off|relay 4 mati|relay 4 off|nonaktifkan relay empat|padamkan relay empat|relay keempat mati/)) {
      commands.setRelay(4, false); handled = true;
    }

    // Sensors
    else if (text.match(/tampilkan suhu|berapa suhu|cek suhu|baca suhu|suhu sekarang|suhu saat ini/)) {
      speak(commands.getSensorTTS('suhu')); handled = true;
    }
    else if (text.match(/tampilkan kelembapan|berapa kelembapan|cek kelembapan|kelembapan sekarang/)) {
      speak(commands.getSensorTTS('kelembapan')); handled = true;
    }
    else if (text.match(/tampilkan sensor|cek sensor|baca sensor|status sensor|info sensor/)) {
      speak(commands.getSensorTTS('semua')); handled = true;
    }

    // Clear Log
    else if (text.match(/bersihkan log|hapus log|clear log/)) {
      commands.clearLog();
      speak("Log dibersihkan");
      handled = true;
    }

    if (handled) {
      addLog(`Perintah Suara Dikenali: "${text}"`, 'info');
    }
  };

  const toggleMic = async () => {
    if (!recognitionRef.current) return;

    if (isListeningRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setIsListening(false);
      setMicState('Belum Diizinkan');
      return;
    }

    try {
      setMicState('Meminta Izin...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionGranted.current = true;
      isListeningRef.current = true;
      setIsListening(true);
      setMicState('Aktif');
      recognitionRef.current.start();
      addLog('Mikrofon diizinkan, voice command aktif', 'info');
    } catch (err) {
      permissionGranted.current = false;
      setMicState('Belum Diizinkan');
      addLog('Izin mikrofon ditolak. Izinkan di pengaturan browser.', 'err');
    }
  };

  return (
    <div className="bg-bg-card border border-purple-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center">
      <h2 className="text-xl font-orbitron font-semibold text-purple-200 mb-2">Voice Command</h2>
      
      <p className="text-sm mb-6 max-w-sm text-gray-400">
        Gunakan perintah suara seperti "Nyalakan semua relay", "Suhu saat ini", atau "Jalankan pola strobe"
      </p>

      {errorBanner && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm p-3 mb-6 rounded">
          Mikrofon diblokir. Klik ikon kunci di address bar → izinkan Mikrofon → Reload
        </div>
      )}

      <button
        onClick={toggleMic}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 mb-4 ${
          isListening 
            ? 'bg-purple-600 shadow-[0_0_30px_rgba(168,85,247,0.8)]' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
        }`}
      >
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full border border-purple-500 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
            <span className="absolute inset-0 rounded-full border border-purple-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] delay-150"></span>
          </>
        )}
        {isListening ? <Mic className="w-10 h-10 text-white relative z-10" /> : <MicOff className="w-10 h-10 relative z-10" />}
      </button>

      <div className={`text-sm font-semibold ${
        micState === 'Aktif' ? 'text-green-400' : 
        micState === 'Meminta Izin...' ? 'text-yellow-400' : 
        'text-red-400'
      }`}>
        Mikrofon: {micState}
      </div>
    </div>
  );
}
