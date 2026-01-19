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
  colorEnd = "#064E3B",
}: MiniBarsProps) {
  const displayData = data.length ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...displayData);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 mb-3">
        {label}
      </p>

      <div className="flex items-end justify-between gap-2 h-20">
        {displayData.map((v, i) => {
          const pct = Math.max(0.08, v / max); // min 8% so tiny values still look intentional

          return (
            <div
              key={i}
              className="flex-1 max-w-[14px] h-full rounded-full bg-slate-100 overflow-hidden"
              title={`${v}`}
            >
              <div
                className="w-full rounded-full"
                style={{
                  height: `${Math.round(pct * 100)}%`,
                  marginTop: `${Math.round((1 - pct) * 100)}%`,
                  background: `linear-gradient(180deg, ${colorStart} 0%, ${colorMid} 55%, ${colorEnd} 100%)`,
                  transition: "height 650ms cubic-bezier(0.16,1,0.3,1), margin-top 650ms cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}
