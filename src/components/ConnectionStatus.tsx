// ConnectionStatus — shows market connection health and data latency in the UI.
// Green = Live, Yellow = Reconnecting/Stale, Gray = Standby, Red = Offline.

import type { WsStatus } from "../hooks/useMarketSocket";

interface ConnectionStatusProps {
  status: WsStatus;
  isStale?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<WsStatus, { color: string; label: string; pulse: boolean }> = {
  connected: { color: "bg-[#2BD67B]", label: "Live Tick", pulse: false },
  connecting: { color: "bg-amber-500", label: "Connecting", pulse: true },
  reconnecting: { color: "bg-amber-500", label: "Reconnecting", pulse: true },
  disconnected: { color: "bg-slate-400 dark:bg-[#6B7792]", label: "Standby", pulse: false },
  offline: { color: "bg-rose-500", label: "Offline", pulse: false },
};

export default function ConnectionStatus({ status, isStale, className = "" }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
  const displayColor = isStale ? "bg-amber-500" : config.color;
  const displayLabel = isStale ? "Stale Feed" : config.label;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${className}`}
      title={isStale ? "Data feed has not updated recently" : `Connection: ${displayLabel}`}
    >
      <span className={`w-2 h-2 rounded-full ${displayColor} ${config.pulse ? "animate-pulse" : ""}`} />
      <span className="text-slate-600 dark:text-[#A3AEC7]">{displayLabel}</span>
    </div>
  );
}
