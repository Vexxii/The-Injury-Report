"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Player } from "@/lib/types";

interface SearchBarProps {
  players: Player[];
}

export default function SearchBar({ players }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const q = value.toLowerCase();
      const matches = players
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    },
    [players]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <form action="/" method="GET" className="flex gap-0">
        <input
          ref={inputRef}
          type="text"
          name="player"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search player... e.g. Derrick Henry"
          className="flex-1 px-4 py-3 bg-surface border border-border-custom rounded-l-lg text-base text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-accent text-white rounded-r-lg text-base font-semibold hover:bg-accent-hover transition-colors"
        >
          Search
        </button>
      </form>

      {showSuggestions && (
        <ul className="absolute z-10 w-full mt-1 bg-surface border border-border-custom rounded-lg shadow-lg max-h-64 overflow-auto">
          {suggestions.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left hover:bg-surface-elevated flex items-center justify-between transition-colors"
                onClick={() => {
                  setQuery(player.name);
                  setShowSuggestions(false);
                  window.location.href = `/?player=${encodeURIComponent(player.name)}`;
                }}
              >
                <span className="font-medium text-foreground">{player.name}</span>
                <span className="text-sm font-mono text-text-muted">
                  {player.position} · {player.team}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
