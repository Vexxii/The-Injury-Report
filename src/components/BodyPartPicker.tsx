"use client";

import type { BodyPartCount } from "@/lib/data";

interface BodyPartPickerProps {
  playerName: string;
  bodyParts: BodyPartCount[];
  selected?: string;
}

export default function BodyPartPicker({
  playerName,
  bodyParts,
  selected,
}: BodyPartPickerProps) {
  const encodedPlayer = encodeURIComponent(playerName);

  return (
    <div>
      <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-3">
        Select injury type
      </p>
      <div className="flex flex-wrap gap-2">
        {bodyParts.map((bp) => {
          const isSelected = bp.name === selected;
          return (
            <a
              key={bp.name}
              href={`/?player=${encodedPlayer}&whatif=${encodeURIComponent(bp.name)}`}
              className={`font-mono text-xs px-3 py-2 min-h-[44px] flex items-center gap-1.5 rounded-full border transition-colors ${
                isSelected
                  ? "bg-foreground text-background border-foreground"
                  : "bg-surface text-foreground border-border-custom hover:bg-surface-elevated"
              }`}
            >
              {bp.name}
              <span
                className={`font-mono text-[10px] ${
                  isSelected ? "text-background/60" : "text-text-muted"
                }`}
              >
                {bp.count}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
