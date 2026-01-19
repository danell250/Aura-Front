import React from "react";

type MiniBarsProps = {
  data: number[];
  label?: string;
  sublabel?: string;
  colorStart?: string;
  colorMid?: string;
  colorEnd?: string;
};

export default function MiniBars({ 
  data, 
  label = "Momentum", 
  sublabel = "Last 7 updates",
  colorStart = "#4ADE80",
  colorMid = "#10B981",
  colorEnd = "#064E3B"
}: MiniBarsProps) {
  const max = Math.max(1, ...data);
  
  // Pad data if less than 7 items to keep spacing consistent, or just use what we have
  const displayData = data.length > 0 ? data : [0, 0, 0, 0, 0];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-3">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2 h-16">
        {displayData.map((v, i) => (
          <div
            key={i}
            className="flex-1 w-3 rounded-full max-w-[12px]"
            style={{
              height: `${Math.round((v / max) * 100)}%`,
              background: `linear-gradient(180deg, ${colorStart} 0%, ${colorMid} 55%, ${colorEnd} 100%)`,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
    </div>
  );
}
