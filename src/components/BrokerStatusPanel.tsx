import { Server, Activity } from 'lucide-react';
import { BrokerStatus as BrokerStatusType } from '../types';

export default function BrokerStatusPanel({ statuses }: { statuses: BrokerStatusType[] }) {
  return (
    <div className="bg-bg-card border border-purple-500/30 rounded-xl p-6">
      <h2 className="text-xl font-orbitron font-semibold text-purple-200 mb-4 flex items-center gap-2">
        <Server className="w-5 h-5" />
        Status Broker
      </h2>
      
      <div className="space-y-3">
        {statuses.map(broker => (
          <div key={broker.id} className="flex items-center justify-between p-3 bg-bg-main rounded border border-purple-500/10">
            <span className="text-gray-300 font-medium">{broker.name}</span>
            <div className="flex items-center gap-3">
              {broker.connected ? (
                <>
                  <span className="text-xs text-gray-400">{broker.latency !== null ? `${broker.latency} ms` : '-- ms'}</span>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                </>
              ) : (
                <>
                  <span className="text-xs text-red-400">Disconnected</span>
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
