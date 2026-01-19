import React from "react";

type RingProps = {
  value: number;          // current value
  max: number;            // max value
  label: string;
  sublabel?: string;
};

export default function Ring({ value, max, label, sublabel }: RingProps) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="auraRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={stroke}
            className="dark:stroke-slate-700"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#auraRing)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Center */}
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill="#0F172A"
            className="dark:fill-white"
          >
            {Math.round(pct * 100)}%
          </text>
        </svg>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {value.toLocaleString()} / {max.toLocaleString()}
          </p>
          {sublabel && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
