import { describe, it, expect } from "vitest";
import { findComparables } from "@/lib/comparison";
import type { Player, Injury, GameLog } from "@/lib/types";

// --- Test fixtures ---

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    name: "Test Player",
    position: "RB",
    team: "NYG",
    birthDate: "1995-01-01",
    heightInches: 72,
    weightLbs: 220,
    ...overrides,
  };
}

function makeInjury(overrides: Partial<Injury> = {}): Injury {
  return {
    id: "inj1",
    playerId: "p1",
    bodyPart: "hamstring",
    reportStatus: "Questionable",
    practiceStatus: "Limited",
    gamesMissed: 2,
    seasonYear: 2024,
    weekNumber: 6,
    returnWeek: 8,
    returnSeasonYear: 2024,
    ...overrides,
  };
}

function makeGameLog(overrides: Partial<GameLog> = {}): GameLog {
  return {
    playerId: "p1",
    seasonYear: 2024,
    week: 1,
    fantasyPointsPPR: 15.0,
    snaps: 50,
    receptions: 3,
    ...overrides,
  };
}

function generatePreInjuryLogs(
  playerId: string,
  season: number,
  injuryWeek: number,
  ppg: number
): GameLog[] {
  const logs: GameLog[] = [];
  for (let w = 1; w < injuryWeek && w < injuryWeek; w++) {
    logs.push(
      makeGameLog({
        playerId,
        seasonYear: season,
        week: w,
        fantasyPointsPPR: ppg + (w % 2 === 0 ? 1 : -1),
        snaps: 50,
      })
    );
  }
  return logs;
}

function generatePostReturnLogs(
  playerId: string,
  season: number,
  returnWeek: number,
  values: number[]
): GameLog[] {
  return values.map((v, i) =>
    makeGameLog({
      playerId,
      seasonYear: season,
      week: returnWeek + i,
      fantasyPointsPPR: v,
      snaps: 40,
    })
  );
}

// --- Tests ---

describe("findComparables", () => {
  it("returns empty array when no matching injuries exist", () => {
    const target = makePlayer();
    const targetInjury = makeInjury({ bodyPart: "hamstring" });
    const otherInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      bodyPart: "ankle",
    });

    const result = findComparables(
      target,
      targetInjury,
      [target, makePlayer({ id: "p2" })],
      [targetInjury, otherInjury],
      []
    );

    expect(result).toEqual([]);
  });

  it("matches injuries with the same body part", () => {
    const target = makePlayer({ id: "p1" });
    const comp = makePlayer({ id: "p2", name: "Comp Player" });
    const targetInjury = makeInjury({
      id: "inj1",
      playerId: "p1",
      bodyPart: "hamstring",
    });
    const compInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      bodyPart: "hamstring",
      returnWeek: 10,
    });

    const logs = [
      ...generatePreInjuryLogs("p2", 2024, 6, 15),
      ...generatePostReturnLogs("p2", 2024, 10, [12, 14, 15, 16]),
    ];

    const result = findComparables(
      target,
      targetInjury,
      [target, comp],
      [targetInjury, compInjury],
      logs
    );

    expect(result.length).toBe(1);
    expect(result[0].player.id).toBe("p2");
  });

  it("excludes the target injury itself", () => {
    const target = makePlayer({ id: "p1" });
    const targetInjury = makeInjury({
      id: "inj1",
      playerId: "p1",
      bodyPart: "hamstring",
    });

    const result = findComparables(
      target,
      targetInjury,
      [target],
      [targetInjury],
      []
    );

    expect(result).toEqual([]);
  });

  it("gives higher scores to same position matches", () => {
    const target = makePlayer({ id: "p1", position: "RB" });
    const samePos = makePlayer({ id: "p2", position: "RB" });
    const diffPos = makePlayer({ id: "p3", position: "WR" });

    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const samePosInjury = makeInjury({ id: "inj2", playerId: "p2" });
    const diffPosInjury = makeInjury({ id: "inj3", playerId: "p3" });

    const result = findComparables(
      target,
      targetInjury,
      [target, samePos, diffPos],
      [targetInjury, samePosInjury, diffPosInjury],
      []
    );

    expect(result.length).toBe(2);
    const samePosResult = result.find((c) => c.player.id === "p2")!;
    const diffPosResult = result.find((c) => c.player.id === "p3")!;
    expect(samePosResult.matchScore).toBeGreaterThan(diffPosResult.matchScore);
  });

  it("gives higher scores to similar age players", () => {
    const target = makePlayer({ id: "p1", birthDate: "1995-01-01" }); // age 29 in 2024
    const sameAge = makePlayer({ id: "p2", birthDate: "1994-01-01" }); // age 30
    const farAge = makePlayer({ id: "p3", birthDate: "1988-01-01" }); // age 36

    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const sameAgeInjury = makeInjury({ id: "inj2", playerId: "p2" });
    const farAgeInjury = makeInjury({ id: "inj3", playerId: "p3" });

    const result = findComparables(
      target,
      targetInjury,
      [target, sameAge, farAge],
      [targetInjury, sameAgeInjury, farAgeInjury],
      []
    );

    const sameAgeResult = result.find((c) => c.player.id === "p2")!;
    const farAgeResult = result.find((c) => c.player.id === "p3")!;
    expect(sameAgeResult.matchScore).toBeGreaterThan(farAgeResult.matchScore);
  });

  it("penalizes age differences beyond 5 years", () => {
    const target = makePlayer({ id: "p1", birthDate: "1995-01-01" }); // age 29
    const farAge = makePlayer({ id: "p2", birthDate: "1987-01-01" }); // age 37 — 8 year diff

    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const farAgeInjury = makeInjury({ id: "inj2", playerId: "p2" });

    const result = findComparables(
      target,
      targetInjury,
      [target, farAge],
      [targetInjury, farAgeInjury],
      []
    );

    // Age score should be 0 for 8 year diff (beyond MAX_AGE_DIFF of 5)
    const farResult = result.find((c) => c.player.id === "p2")!;
    // matchScore should not include age component (0)
    expect(farResult.matchScore).toBeLessThan(100);
  });

  it("calculates pre-injury PPG from prior games", () => {
    const target = makePlayer({ id: "p1" });
    const comp = makePlayer({ id: "p2" });
    const targetInjury = makeInjury({
      id: "inj1",
      playerId: "p1",
      weekNumber: 8,
    });
    const compInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      weekNumber: 8,
      returnWeek: 10,
    });

    const logs = [
      ...generatePreInjuryLogs("p2", 2024, 8, 20),
      ...generatePostReturnLogs("p2", 2024, 10, [15, 18, 20, 22]),
    ];

    const result = findComparables(
      target,
      targetInjury,
      [target, comp],
      [targetInjury, compInjury],
      logs
    );

    expect(result[0].preInjuryPPG).toBeGreaterThan(0);
  });

  it("calculates post-return PPG from return week onwards", () => {
    const target = makePlayer({ id: "p1" });
    const comp = makePlayer({ id: "p2" });
    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const compInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      returnWeek: 10,
      returnSeasonYear: 2024,
    });

    const logs = [
      ...generatePreInjuryLogs("p2", 2024, 6, 15),
      ...generatePostReturnLogs("p2", 2024, 10, [10, 12, 14, 16]),
    ];

    const result = findComparables(
      target,
      targetInjury,
      [target, comp],
      [targetInjury, compInjury],
      logs
    );

    expect(result[0].postReturnPPG).toEqual([10, 12, 14, 16]);
  });

  it("returns empty postReturnPPG when no return week", () => {
    const target = makePlayer({ id: "p1" });
    const comp = makePlayer({ id: "p2" });
    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const compInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      returnWeek: null,
      returnSeasonYear: null,
    });

    const result = findComparables(
      target,
      targetInjury,
      [target, comp],
      [targetInjury, compInjury],
      []
    );

    expect(result[0].postReturnPPG).toEqual([]);
  });

  it("sorts results by matchScore descending", () => {
    const target = makePlayer({ id: "p1", position: "RB" });
    const highMatch = makePlayer({ id: "p2", position: "RB" }); // same position
    const lowMatch = makePlayer({ id: "p3", position: "WR" }); // different

    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const highInjury = makeInjury({ id: "inj2", playerId: "p2" });
    const lowInjury = makeInjury({ id: "inj3", playerId: "p3" });

    const result = findComparables(
      target,
      targetInjury,
      [target, highMatch, lowMatch],
      [targetInjury, highInjury, lowInjury],
      []
    );

    expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore);
  });

  it("handles player injured before week 4 (short baseline)", () => {
    const target = makePlayer({ id: "p1" });
    const comp = makePlayer({ id: "p2" });
    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const compInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      weekNumber: 2,
      returnWeek: 4,
    });

    // Only 1 game before injury week 2
    const logs = [
      makeGameLog({ playerId: "p2", week: 1, fantasyPointsPPR: 20 }),
      ...generatePostReturnLogs("p2", 2024, 4, [15, 18]),
    ];

    const result = findComparables(
      target,
      targetInjury,
      [target, comp],
      [targetInjury, compInjury],
      logs
    );

    // Should still return the comparable, but preInjuryPPG = 0 (insufficient data < 2 games)
    expect(result.length).toBe(1);
    expect(result[0].preInjuryPPG).toBe(0);
  });

  it("gives higher era scores to recent injuries", () => {
    const target = makePlayer({ id: "p1" });
    const recent = makePlayer({ id: "p2" });
    const old = makePlayer({ id: "p3" });

    const targetInjury = makeInjury({ id: "inj1", playerId: "p1" });
    const recentInjury = makeInjury({
      id: "inj2",
      playerId: "p2",
      seasonYear: 2023,
    });
    const oldInjury = makeInjury({
      id: "inj3",
      playerId: "p3",
      seasonYear: 2012,
    });

    const result = findComparables(
      target,
      targetInjury,
      [target, recent, old],
      [targetInjury, recentInjury, oldInjury],
      []
    );

    const recentResult = result.find((c) => c.player.id === "p2")!;
    const oldResult = result.find((c) => c.player.id === "p3")!;
    expect(recentResult.matchScore).toBeGreaterThan(oldResult.matchScore);
  });
});
