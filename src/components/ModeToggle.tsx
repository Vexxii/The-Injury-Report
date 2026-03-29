"use client";

import { useSearchParams } from "next/navigation";

interface ModeToggleProps {
  playerName: string;
  defaultBodyPart: string;
}

export default function ModeToggle({ playerName, defaultBodyPart }: ModeToggleProps) {
  const searchParams = useSearchParams();
  const isWhatIf = searchParams.has("whatif");

  const encodedPlayer = encodeURIComponent(playerName);
  const historyHref = `/?player=${encodedPlayer}`;
  const whatIfHref = `/?player=${encodedPlayer}&whatif=${encodeURIComponent(defaultBodyPart)}`;

  return (
    <div className="flex gap-1 bg-surface border border-border-custom rounded-lg p-1">
      <a
        href={historyHref}
        className={`flex-1 text-center font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-md transition-colors ${
          !isWhatIf
            ? "bg-surface-elevated text-foreground"
            : "text-text-muted hover:text-foreground"
        }`}
      >
        Injury History
      </a>
      <a
        href={whatIfHref}
        className={`flex-1 text-center font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-md transition-colors ${
          isWhatIf
            ? "bg-surface-elevated text-foreground"
            : "text-text-muted hover:text-foreground"
        }`}
      >
        What If
      </a>
    </div>
  );
}
