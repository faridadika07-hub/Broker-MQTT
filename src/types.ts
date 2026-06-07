export type LogType = 'in' | 'out' | 'err' | 'info';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
}

export interface BrokerStatus {
  id: string;
  name: string;
  connected: boolean;
  latency: number | null;
}

export interface SensorPoint {
  val: number;
  time: number;
}
