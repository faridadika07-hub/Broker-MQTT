import { useState, useEffect } from 'react';
import { Power, Edit2, Play, Square } from 'lucide-react';

interface ControllersProps {
  publish: (topic: string, msg: string) => void;
  // External control might be needed for voice commands
  externalPatterns: { p1: boolean, p2: boolean };
  externalRelays: { r1: boolean, r2: boolean, r3: boolean, r4: boolean };
  onSync: (p: any, r: any) => void;
}

export default function Controllers({ publish, externalPatterns, externalRelays, onSync }: ControllersProps) {
  const [relays, setRelays] = useState(externalRelays);
  const [patterns, setPatterns] = useState(externalPatterns);

  const [names, setNames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('relayNames') || 'null') || { r1: 'Relay 1', r2: 'Relay 2', r3: 'Relay 3', r4: 'Relay 4' };
    } catch {
      return { r1: 'Relay 1', r2: 'Relay 2', r3: 'Relay 3', r4: 'Relay 4' };
    }
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Sync with external state (e.g. from Voice Commands)
  useEffect(() => {
    setRelays(externalRelays);
    setPatterns(externalPatterns);
  }, [externalRelays, externalPatterns]);

  useEffect(() => {
    localStorage.setItem('relayNames', JSON.stringify(names));
  }, [names]);

  const anyPatternActive = patterns.p1 || patterns.p2;

  const toggleRelay = (id: keyof typeof relays, num: number) => {
    if (anyPatternActive) return; // disabled
    const newState = !relays[id];
    const next = { ...relays, [id]: newState };
    setRelays(next);
    onSync(patterns, next);
    publish(`iot/relay/${num}`, newState ? 'ON' : 'OFF');
  };

  const togglePattern = (id: keyof typeof patterns, num: number) => {
    const newState = !patterns[id];
    const next = { ...patterns, [id]: newState };
    setPatterns(next);
    onSync(next, relays);
    publish(`iot/pola/${num}`, newState ? 'ON' : 'OFF');
  };

  const setAllRelays = (state: boolean) => {
    if (anyPatternActive) return;
    setRelays({ r1: state, r2: state, r3: state, r4: state });
    onSync(patterns, { r1: state, r2: state, r3: state, r4: state });
    ['1','2','3','4'].forEach(n => publish(`iot/relay/${n}`, state ? 'ON' : 'OFF'));
  };

  const setAllPatterns = (state: boolean) => {
    setPatterns({ p1: state, p2: state });
    onSync({ p1: state, p2: state }, relays);
    ['1','2'].forEach(n => publish(`iot/pola/${n}`, state ? 'ON' : 'OFF'));
  };

  const startEdit = (id: string, name: string) => {
    setEditing(id);
    setTempName(name);
  };

  const saveEdit = (id: string) => {
    setNames((prev: any) => ({ ...prev, [id]: tempName }));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Relays */}
      <div className="bg-bg-card border border-purple-500/30 rounded-xl p-6 relative overflow-hidden">
        <h2 className="text-xl font-orbitron font-semibold text-purple-200 mb-6">Kontrol Relay</h2>
        
        {anyPatternActive && (
           <div className="absolute top-0 left-0 right-0 bg-yellow-500/20 text-yellow-300 text-xs text-center py-1">
             Pola Sedang Aktif - Kontrol Manual Dinonaktifkan
           </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['r1', 'r2', 'r3', 'r4'] as const).map((id, idx) => (
            <div key={id} className="bg-bg-main p-4 rounded-lg flex flex-col items-center justify-center gap-3 border border-purple-500/10">
              {editing === id ? (
                <input 
                  autoFocus
                  className="w-full bg-transparent border-b border-purple-500 text-center outline-none text-white text-sm"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onBlur={() => saveEdit(id)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(id)}
                />
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => startEdit(id, names[id])}>
                  <span className="text-gray-300 text-sm">{names[id]}</span>
                  <Edit2 className="w-3 h-3 text-gray-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              
              <button 
                onClick={() => toggleRelay(id, idx + 1)}
                disabled={anyPatternActive}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${anyPatternActive ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' : relays[id] ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                <Power className="w-8 h-8" />
              </button>
              
              <span className={`text-xs ${relays[id] ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                {relays[id] ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
           <button 
             disabled={anyPatternActive}
             onClick={() => setAllRelays(true)}
             className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 py-2 rounded border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >Semua ON</button>
           <button 
             disabled={anyPatternActive}
             onClick={() => setAllRelays(false)}
             className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >Semua OFF</button>
        </div>
      </div>

      {/* Patterns */}
      <div className="bg-bg-card border border-purple-500/30 rounded-xl p-6">
        <h2 className="text-xl font-orbitron font-semibold text-purple-200 mb-6">Pola Lampu (Animasi)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
           <button 
             onClick={() => togglePattern('p1', 1)}
             className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${patterns.p1 ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-bg-main border-purple-500/10 text-gray-400 hover:border-purple-500/30'}`}
           >
             {patterns.p1 ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
             <span>Pola 1: Kiri ke Kanan</span>
           </button>
           <button 
             onClick={() => togglePattern('p2', 2)}
             className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${patterns.p2 ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-bg-main border-purple-500/10 text-gray-400 hover:border-purple-500/30'}`}
           >
             {patterns.p2 ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
             <span>Pola 2: Strobe</span>
           </button>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setAllPatterns(true)}
             className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 py-2 rounded border border-purple-500/50 transition-colors"
           >Semua Pola ON</button>
           <button 
             onClick={() => setAllPatterns(false)}
             className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded border border-gray-600 transition-colors"
           >Semua Pola OFF</button>
        </div>
      </div>
    </div>
  );
}
