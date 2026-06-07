import { useEffect, useRef, useState } from 'react';
import { Thermometer, Droplets } from 'lucide-react';
import { SensorPoint } from '../types';

export default function SensorPanel({ suhu, kelembapan }: { suhu: number | null, kelembapan: number | null }) {
  const [historyTimer, setHistoryTimer] = useState(Date.now());
  const suhuHistoryRef = useRef<SensorPoint[]>([]);
  const kelembapanHistoryRef = useRef<SensorPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [limit, setLimit] = useState(() => parseFloat(localStorage.getItem('alertLimit') || '35'));
  const [isAlert, setIsAlert] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play beep
  const playBeep = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  };

  useEffect(() => {
    localStorage.setItem('alertLimit', limit.toString());
  }, [limit]);

  // Alert check
  useEffect(() => {
    if (suhu !== null && suhu > limit) {
      if (!isAlert) {
        setIsAlert(true);
        playBeep();
      }
    } else {
      setIsAlert(false);
    }
  }, [suhu, limit, isAlert]);

  // Record history
  useEffect(() => {
    if (suhu !== null) {
      suhuHistoryRef.current.push({ val: suhu, time: Date.now() });
      if (suhuHistoryRef.current.length > 20) suhuHistoryRef.current.shift();
    }
    if (kelembapan !== null) {
      kelembapanHistoryRef.current.push({ val: kelembapan, time: Date.now() });
      if (kelembapanHistoryRef.current.length > 20) kelembapanHistoryRef.current.shift();
    }
    
    if (suhu !== null || kelembapan !== null) {
       drawChart();
    }
  }, [suhu, kelembapan]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const drawLine = (data: SensorPoint[], color: string, minV: number, maxV: number) => {
      if (data.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      const xStep = width / 19; // 20 points = 19 segments

      data.forEach((point, i) => {
        // align left if less than 20 points, but normally draw from left to right
        const x = i * xStep; 
        // Normalize
        const range = maxV - minV || 1;
        const normalized = (point.val - minV) / range;
        const y = height - (normalized * height * 0.8) - (height * 0.1);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Draw Suhu (Red-ish or Purple)
    drawLine(suhuHistoryRef.current, '#A855F7', 0, 50);
    // Draw Kelembapan (Blue)
    drawLine(kelembapanHistoryRef.current, '#3b82f6', 0, 100);
  };

  return (
    <div className={`bg-bg-card rounded-xl p-6 border ${isAlert ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'border-purple-500/30'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-orbitron font-semibold text-purple-200">Panel Sensor</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <label>Batas Suhu:</label>
          <input 
            type="number" 
            value={limit} 
            onChange={e => setLimit(parseFloat(e.target.value))} 
            className="bg-bg-main border border-purple-500/50 rounded w-16 px-2 py-1 outline-none text-white text-center"
          />
          <span>°C</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-main rounded-lg p-4 flex items-center justify-between border border-purple-500/10">
          <div>
            <p className="text-gray-400 text-sm mb-1">Suhu</p>
            <p className="text-4xl font-orbitron font-bold text-white">
              {suhu !== null ? suhu.toFixed(1) : '--'} <span className="text-xl text-purple-500">°C</span>
            </p>
          </div>
          <Thermometer className={`w-10 h-10 ${suhu !== null ? 'text-purple-500' : 'text-gray-600'} ${suhu !== null ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="bg-bg-main rounded-lg p-4 flex items-center justify-between border border-purple-500/10">
          <div>
            <p className="text-gray-400 text-sm mb-1">Kelembapan</p>
            <p className="text-4xl font-orbitron font-bold text-white">
              {kelembapan !== null ? kelembapan.toFixed(1) : '--'} <span className="text-xl text-blue-500">%</span>
            </p>
          </div>
          <Droplets className={`w-10 h-10 ${kelembapan !== null ? 'text-blue-500' : 'text-gray-600'}`} />
        </div>
      </div>

      <div className="bg-bg-main rounded-lg p-4 border border-purple-500/10 h-32 relative">
         <p className="absolute top-2 left-2 text-xs text-gray-500">Historis (20 data terakhir)</p>
         <div className="absolute top-2 right-2 text-xs flex gap-3">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Suhu</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Kelembapan</span>
         </div>
         <canvas ref={canvasRef} width={600} height={120} className="w-full h-full mt-4" />
      </div>
      
      {isAlert && (
         <div className="mt-4 bg-red-500/20 border border-red-500 text-red-300 p-3 rounded text-center animate-bounce">
           ⚠️ PERINGATAN: Suhu mencapai batas ({suhu}°C)
         </div>
      )}
    </div>
  );
}
