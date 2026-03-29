import { describe, it, expect } from "vitest";
import {
  findPlayerByName,
  searchPlayers,
  getPlayerInjuries,
  getCurrentNFLWeek,
  getBodyPartsWithCounts,
  getDefaultBodyPartForPosition,
} from "@/lib/data";
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

describe("getCurrentNFLWeek", () => {
  it("returns Week 1 during off-season (February)", () => {
    const result = getCurrentNFLWeek(new Date(2025, 1, 15)); // Feb 15
    expect(result).toEqual({ season: 2025, week: 1 });
  });

  it("returns Week 1 during off-season (July)", () => {
    const result = getCurrentNFLWeek(new Date(2025, 6, 4)); // Jul 4
    expect(result).toEqual({ season: 2025, week: 1 });
  });

  it("returns Week 1 before season starts in September", () => {
    // 2025: Labor Day is Sep 1, Week 1 Thursday is Sep 4
    const result = getCurrentNFLWeek(new Date(2025, 8, 2)); // Sep 2
    expect(result).toEqual({ season: 2025, week: 1 });
  });

  it("returns Week 1 on Week 1 Thursday", () => {
    // 2025: Labor Day Sep 1, Week 1 Thursday = Sep 4
    const result = getCurrentNFLWeek(new Date(2025, 8, 4, 20, 0)); // Sep 4 8pm
    expect(result).toEqual({ season: 2025, week: 1 });
  });

  it("returns correct mid-season week", () => {
    // 2025: Week 1 Thursday = Sep 4. Week 6 starts ~Oct 9
    const result = getCurrentNFLWeek(new Date(2025, 9, 10)); // Oct 10
    expect(result.season).toBe(2025);
    expect(result.week).toBeGreaterThanOrEqual(5);
    expect(result.week).toBeLessThanOrEqual(6);
  });

  it("clamps to Week 18 maximum", () => {
    // Late January, well past Week 18
    const result = getCurrentNFLWeek(new Date(2025, 11, 31)); // Dec 31
    expect(result.week).toBeLessThanOrEqual(18);
  });

  it("never returns week below 1", () => {
    const result = getCurrentNFLWeek(new Date(2025, 0, 1)); // Jan 1
    expect(result.week).toBeGreaterThanOrEqual(1);
  });
});

describe("getBodyPartsWithCounts", () => {
  it("counts body parts and sorts by count descending", () => {
    const testInjuries: Injury[] = [
      { ...injuries[0], bodyPart: "hamstring" },
      { ...injuries[0], bodyPart: "hamstring", id: "x1" },
      { ...injuries[0], bodyPart: "knee", id: "x2" },
    ];
    const result = getBodyPartsWithCounts(testInjuries);
    expect(result[0]).toEqual({ name: "hamstring", count: 2 });
    expect(result[1]).toEqual({ name: "knee", count: 1 });
  });

  it("excludes 'other' body part", () => {
    const testInjuries: Injury[] = [
      { ...injuries[0], bodyPart: "other", id: "x1" },
      { ...injuries[0], bodyPart: "knee", id: "x2" },
    ];
    const result = getBodyPartsWithCounts(testInjuries);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("knee");
  });

  it("returns empty array for empty input", () => {
    expect(getBodyPartsWithCounts([])).toHaveLength(0);
  });
});

describe("getDefaultBodyPartForPosition", () => {
  const wrInjuries: Injury[] = [
    { ...injuries[0], playerId: "p2", bodyPart: "hamstring", id: "w1" },
    { ...injuries[0], playerId: "p2", bodyPart: "hamstring", id: "w2" },
    { ...injuries[0], playerId: "p2", bodyPart: "ankle", id: "w3" },
  ];

  it("returns the most common body part for a position", () => {
    const result = getDefaultBodyPartForPosition("WR", wrInjuries, players);
    expect(result).toBe("hamstring");
  });

  it("excludes 'other' body parts", () => {
    const otherInjuries: Injury[] = [
      { ...injuries[0], playerId: "p2", bodyPart: "other", id: "o1" },
      { ...injuries[0], playerId: "p2", bodyPart: "other", id: "o2" },
      { ...injuries[0], playerId: "p2", bodyPart: "ankle", id: "o3" },
    ];
    const result = getDefaultBodyPartForPosition("WR", otherInjuries, players);
    expect(result).toBe("ankle");
  });

  it("returns 'knee' as fallback when no injuries for position", () => {
    const result = getDefaultBodyPartForPosition("TE", [], players);
    expect(result).toBe("knee");
  });
});
