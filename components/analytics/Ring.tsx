import React, { useId, useMemo } from "react";

type RingProps = {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
};

export default function Ring({ value, max, label, sublabel }: RingProps) {
  const uid = useId();
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  // Use dashoffset (cleaner + animates nicely)
  const dashOffset = useMemo(() => c * (1 - pct), [c, pct]);
  const gradId = `auraRing-${uid}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>

            {/* subtle glow */}
            <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={stroke}
          />

          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)" }}
            filter={`url(#glow-${uid})`}
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
          >
            {Math.round(pct * 100)}%
          </text>
        </svg>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {value.toLocaleString()} / {max.toLocaleString()}
          </p>
          {sublabel && (
            <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
