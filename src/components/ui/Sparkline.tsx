import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

/**
 * Lightweight SVG Sparkline with smooth bezier curve and soft area gradient.
 */
export function Sparkline({
  data,
  width = 100,
  height = 36,
  positive,
  className = "",
}: SparklineProps) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Padding inside SVG
    const padTop = 3;
    const padBottom = 3;
    const usableHeight = height - padTop - padBottom;

    const pts = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - padBottom - ((val - min) / range) * usableHeight;
      return { x, y };
    });

    // Build SVG path
    const path = pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      // Simple smooth curve control points
      const prev = pts[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, "");

    const firstPt = pts[0];
    const lastPt = pts[pts.length - 1];
    const area = `${path} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;

    return { path, area, lastPt };
  }, [data, width, height]);

  if (!points) {
    return <div style={{ width, height }} className={`opacity-20 bg-slate-200 dark:bg-slate-800 rounded ${className}`} />;
  }

  const isUp = positive !== undefined ? positive : data[data.length - 1] >= data[0];
  const strokeColor = isUp ? "#2BD67B" : "#FF5C6C";
  const gradId = `spark-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={points.area} fill={`url(#${gradId})`} />
      <path d={points.path} fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.lastPt.x} cy={points.lastPt.y} r={2.5} fill={strokeColor} />
    </svg>
  );
}

export default Sparkline;
