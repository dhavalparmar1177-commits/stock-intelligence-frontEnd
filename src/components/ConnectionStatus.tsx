// ConnectionStatus — shows WebSocket connection health in the UI.
// Green = connected, Yellow = reconnecting, Red = disconnected.

import type { WsStatus } from "../hooks/useMarketSocket";

interface ConnectionStatusProps {
  status: WsStatus;
  isStale?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<WsStatus, { color: string; label: string; pulse: boolean }> = {
  connected: { color: "bg-green-500", label: "Live", pulse: false },
  connecting: { color: "bg-yellow-500", label: "Connecting", pulse: true },
  reconnecting: { color: "bg-yellow-500", label: "Reconnecting", pulse: true },
  disconnected: { color: "bg-red-500", label: "Offline", pulse: false },
};

export default function ConnectionStatus({ status, isStale, className = "" }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status];
  const displayColor = isStale ? "bg-yellow-500" : config.color;
  const displayLabel = isStale ? "Stale" : config.label;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      <span className={`w-2 h-2 rounded-full ${displayColor} ${config.pulse ? "animate-pulse" : ""}`} />
      <span className="text-gray-500 dark:text-gray-400">{displayLabel}</span>
    </div>
  );
}
