import { LogEntry } from '../types';
import { Download, Activity } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
  clearLog: () => void;
}

export default function ActivityLog({ logs, clearLog }: ActivityLogProps) {
  const exportLog = () => {
    const textStr = logs.map(l => `[${l.timestamp}] ${l.message}`).join('\\n');
    const blob = new Blob([textStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot_log_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-400';
      case 'out': return 'text-purple-400';
      case 'err': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-bg-card border border-purple-500/30 rounded-xl p-6 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-orbitron font-semibold text-purple-200 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Log Aktivitas
        </h2>
        <div className="flex gap-2">
          <button onClick={clearLog} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Clear</button>
          <button onClick={exportLog} className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-bg-main p-3 rounded rounded-xl border border-purple-500/10 font-mono text-xs space-y-1">
        {logs.length === 0 && <div className="text-gray-600 text-center mt-10 italic">Log kosong</div>}
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 border-b border-gray-800/50 pb-1">
            <span className="text-gray-500 whitespace-nowrap">[{log.timestamp}]</span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
