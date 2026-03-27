import { describe, it, expect } from "vitest";
import { findPlayerByName, searchPlayers, getPlayerInjuries } from "@/lib/data";
import type { Player, Injury } from "@/lib/types";

const players: Player[] = [
  {
    id: "p1",
    name: "Test Player",
    position: "RB",
    team: "NYG",
    birthDate: "1995-01-01",
    heightInches: 72,
    weightLbs: 220,
  },
  {
    id: "p2",
    name: "Another Player",
    position: "WR",
    team: "DAL",
    birthDate: "1997-06-15",
    heightInches: 74,
    weightLbs: 200,
  },
  {
    id: "p3",
    name: "Third Guy",
    position: "QB",
    team: "KC",
    birthDate: "1996-03-10",
    heightInches: 75,
    weightLbs: 230,
  },
];

const injuries: Injury[] = [
  {
    id: "inj1",
    playerId: "p1",
    bodyPart: "hamstring",
    reportStatus: "Out",
    practiceStatus: "DNP",
    gamesMissed: 3,
    seasonYear: 2024,
    weekNumber: 6,
    returnWeek: 9,
    returnSeasonYear: 2024,
  },
  {
    id: "inj2",
    playerId: "p1",
    bodyPart: "ankle",
    reportStatus: "Questionable",
    practiceStatus: "Limited",
    gamesMissed: 1,
    seasonYear: 2023,
    weekNumber: 10,
    returnWeek: 12,
    returnSeasonYear: 2023,
  },
  {
    id: "inj3",
    playerId: "p2",
    bodyPart: "knee_acl",
    reportStatus: "Out",
    practiceStatus: "DNP",
    gamesMissed: 8,
    seasonYear: 2024,
    weekNumber: 3,
    returnWeek: null,
    returnSeasonYear: null,
  },
];

describe("findPlayerByName", () => {
  it("matches exact name case-insensitively", () => {
    expect(findPlayerByName(players, "test player")?.id).toBe("p1");
    expect(findPlayerByName(players, "TEST PLAYER")?.id).toBe("p1");
    expect(findPlayerByName(players, "Test Player")?.id).toBe("p1");
  });

  it("trims whitespace", () => {
    expect(findPlayerByName(players, "  Test Player  ")?.id).toBe("p1");
  });

  it("returns undefined for no match", () => {
    expect(findPlayerByName(players, "nonexistent")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(findPlayerByName(players, "")).toBeUndefined();
  });
});

describe("searchPlayers", () => {
  it("returns partial matches", () => {
    const results = searchPlayers(players, "player");
    expect(results).toHaveLength(2);
    expect(results.map((p) => p.id)).toContain("p1");
    expect(results.map((p) => p.id)).toContain("p2");
  });

  it("is case-insensitive", () => {
    const results = searchPlayers(players, "THIRD");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("p3");
  });

  it("returns empty for empty query", () => {
    expect(searchPlayers(players, "")).toHaveLength(0);
    expect(searchPlayers(players, "   ")).toHaveLength(0);
  });

  it("returns empty for no matches", () => {
    expect(searchPlayers(players, "zzzzz")).toHaveLength(0);
  });

  it("limits results to 10", () => {
    const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
      ...players[0],
      id: `p${i}`,
      name: `Player ${i}`,
    }));
    const results = searchPlayers(manyPlayers, "player");
    expect(results).toHaveLength(10);
  });
});

describe("getPlayerInjuries", () => {
  it("filters by playerId", () => {
    const result = getPlayerInjuries(injuries, "p1");
    expect(result).toHaveLength(2);
    expect(result.every((inj) => inj.playerId === "p1")).toBe(true);
  });

  it("sorts by season descending, then week descending", () => {
    const result = getPlayerInjuries(injuries, "p1");
    expect(result[0].seasonYear).toBe(2024);
    expect(result[1].seasonYear).toBe(2023);
  });

  it("returns empty for unknown player", () => {
    expect(getPlayerInjuries(injuries, "unknown")).toHaveLength(0);
  });
});
