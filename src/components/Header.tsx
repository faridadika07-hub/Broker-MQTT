import { useState, useEffect } from 'react';
import { Clock, Key } from 'lucide-react';

export default function Header({ flespiToken, setFlespiToken }: { flespiToken: string, setFlespiToken: (v: string) => void }) {
  const [time, setTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [temp, setTemp] = useState(flespiToken);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveToken = () => {
    setFlespiToken(temp);
    localStorage.setItem('flespiToken', temp);
    setIsEditing(false);
  };

  return (
    <div className="bg-bg-card border border-purple-500/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 text-purple-400 font-orbitron text-xl">
        <Clock className="w-6 h-6" />
        <span>{time.toLocaleTimeString('id-ID')}</span>
        <span className="text-gray-400 text-sm ml-2 font-rajdhani">{time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="flex items-center gap-3">
        <Key className="w-5 h-5 text-gray-400" />
        {isEditing ? (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={temp} 
              onChange={e => setTemp(e.target.value)} 
              placeholder="Flespi Token"
              className="bg-bg-main border border-purple-500/50 rounded px-3 py-1 text-sm outline-none focus:border-purple-500 text-white"
            />
            <button onClick={saveToken} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm transition-colors">Simpan</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{flespiToken ? 'Token Terisi' : 'Token Flespi Kosong'}</span>
            <button onClick={() => setIsEditing(true)} className="text-purple-400 hover:text-purple-300 text-sm underline">Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}
