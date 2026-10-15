import { useEffect, useState } from "react";

export interface MarketStatusInfo {
  state: "open" | "closed" | "pre-open" | "post-market";
  label: string;
  sub: string;
}

export function getIndianMarketStatus(): MarketStatusInfo {
  // Convert current time to Indian Standard Time (UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);

  const day = ist.getDay(); // 0 is Sunday, 6 is Saturday
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    const daysUntilMon = day === 6 ? 2 : 1;
    return {
      state: "closed",
      label: "Market Closed",
      sub: `Opens 9:15 AM Mon`,
    };
  }

  // Pre-market: 9:00 AM (540 mins) to 9:15 AM (555 mins)
  if (timeInMinutes >= 540 && timeInMinutes < 555) {
    return {
      state: "pre-open",
      label: "Pre-Open Session",
      sub: "Orders open till 9:08 AM",
    };
  }

  // Regular market: 9:15 AM (555 mins) to 3:30 PM (930 mins)
  if (timeInMinutes >= 555 && timeInMinutes < 930) {
    return {
      state: "open",
      label: "Market Open",
      sub: "Closes 3:30 PM IST",
    };
  }

  // Post-market: 3:40 PM (940 mins) to 4:00 PM (960 mins)
  if (timeInMinutes >= 930 && timeInMinutes < 960) {
    return {
      state: "post-market",
      label: "Post-Market Session",
      sub: "Closing price settlement",
    };
  }

  // Before 9:00 AM on weekdays
  if (timeInMinutes < 540) {
    return {
      state: "closed",
      label: "Market Closed",
      sub: "Opens 9:15 AM today",
    };
  }

  // After 4:00 PM on weekdays
  const nextDayName = day === 5 ? "Mon" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(day + 1) % 7];
  return {
    state: "closed",
    label: "Market Closed",
    sub: `Opens 9:15 AM ${nextDayName}`,
  };
}

export function MarketStatus({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<MarketStatusInfo>(getIndianMarketStatus);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getIndianMarketStatus());
    }, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, []);

  const dotColor =
    status.state === "open"
      ? "bg-emerald-500 animate-pulse"
      : status.state === "pre-open"
      ? "bg-amber-500 animate-pulse"
      : "bg-slate-400 dark:bg-slate-500";

  const chipBg =
    status.state === "open"
      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
      : status.state === "pre-open"
      ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300"
      : "bg-slate-100/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-300";

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium border ${chipBg} transition-colors ${className}`}
      title={`${status.label} — ${status.sub}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span className="font-semibold">{status.label}</span>
      <span className="opacity-40 select-none">·</span>
      <span className="opacity-85 hidden sm:inline">{status.sub}</span>
    </div>
  );
}

export default MarketStatus;
