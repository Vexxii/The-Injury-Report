import { describe, it, expect } from "vitest";
import { getVerdict } from "@/lib/verdict";
import type { ScoredComparable, Player, Injury, MatchBreakdown } from "@/lib/types";

function makeComparable(overrides: Partial<ScoredComparable> = {}): ScoredComparable {
  return {
    player: {
      id: "p1",
      name: "Test",
      position: "RB",
      team: "NYG",
      birthDate: "1995-01-01",
      heightInches: 72,
      weightLbs: 220,
    } as Player,
    injury: {
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
    } as Injury,
    matchScore: 80,
    matchBreakdown: {
      injuryType: 1,
      position: 1,
      age: 0.7,
      workload: 0,
      era: 1,
    } as MatchBreakdown,
    preInjuryWeeklyPPG: [],
    preInjuryPPG: 20,
    postReturnPPG: [18, 19, 20, 21],
    gamesMissed: 2,
    ...overrides,
  };
}

function makeComps(
  count: number,
  overrides: Partial<ScoredComparable> = {}
): ScoredComparable[] {
  return Array.from({ length: count }, (_, i) =>
    makeComparable({
      player: { ...makeComparable().player, id: `p${i}` },
      injury: { ...makeComparable().injury, id: `inj${i}`, playerId: `p${i}` },
      ...overrides,
    })
  );
}

describe("getVerdict", () => {
  // ============================================================
  // Existing behavior: recovery % thresholds
  // ============================================================

  it("returns null verdict when fewer than 5 comparables", () => {
    const comps = makeComps(3);
    const verdict = getVerdict(comps);

    expect(verdict.type).toBeNull();
    expect(verdict.medianRecoveryPct).toBeNull();
    expect(verdict.message).toContain("Not enough data");
  });

  it("returns HOLD when median recovery > 85%", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21], // avg 18 = 90% of 20
    });

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("HOLD");
    expect(verdict.medianRecoveryPct).toBe(90);
    expect(verdict.message).toContain("bounces back");
  });

  it("returns MONITOR when median recovery 70-85%", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [15, 15, 18, 20], // avg 15 = 75% of 20
    });

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("MONITOR");
    expect(verdict.medianRecoveryPct).toBe(75);
    expect(verdict.message).toContain("typical but not guaranteed");
  });

  it("returns CONSIDER_SELLING when median recovery < 70%", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [10, 12, 14, 16], // avg 11 = 55% of 20
    });

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("CONSIDER_SELLING");
    expect(verdict.message).toContain("struggled significantly");
  });

  it("excludes comparables with 0 preInjuryPPG", () => {
    const valid = makeComps(3, { preInjuryPPG: 20, postReturnPPG: [18, 19] });
    const invalid = makeComps(3, { preInjuryPPG: 0, postReturnPPG: [10, 12] });
    // Give unique ids to avoid collisions
    invalid.forEach((c, i) => {
      c.player.id = `x${i}`;
      c.injury.id = `xinj${i}`;
      c.injury.playerId = `x${i}`;
    });

    const verdict = getVerdict([...valid, ...invalid]);
    expect(verdict.type).toBeNull();
    expect(verdict.comparablesUsed).toBe(3);
  });

  it("excludes comparables with fewer than 2 post-return games", () => {
    const valid = makeComps(3, { preInjuryPPG: 20, postReturnPPG: [18, 19] });
    const insufficient = makeComps(3, {
      preInjuryPPG: 20,
      postReturnPPG: [18], // only 1 game
    });
    insufficient.forEach((c, i) => {
      c.player.id = `s${i}`;
      c.injury.id = `sinj${i}`;
      c.injury.playerId = `s${i}`;
    });

    const verdict = getVerdict([...valid, ...insufficient]);
    expect(verdict.type).toBeNull();
    expect(verdict.comparablesUsed).toBe(3);
  });

  it("uses median, not mean, for recovery percentage", () => {
    const normal = makeComps(4, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21], // 90% recovery
    });
    const outlier = makeComparable({
      player: { ...makeComparable().player, id: "out" },
      injury: { ...makeComparable().injury, id: "outinj", playerId: "out" },
      preInjuryPPG: 20,
      postReturnPPG: [4, 4, 6, 8], // 20% recovery
    });

    const verdict = getVerdict([...normal, outlier]);
    expect(verdict.type).toBe("HOLD"); // median 90%, not mean ~76%
  });

  // ============================================================
  // New: games missed + severity
  // ============================================================

  it("computes medianGamesMissed and absenceSeverity SHORT", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21],
      gamesMissed: 2,
    });

    const verdict = getVerdict(comps);
    expect(verdict.medianGamesMissed).toBe(2);
    expect(verdict.absenceSeverity).toBe("SHORT");
  });

  it("computes absenceSeverity MODERATE for 3-5 games", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21],
      gamesMissed: 4,
    });

    const verdict = getVerdict(comps);
    expect(verdict.medianGamesMissed).toBe(4);
    expect(verdict.absenceSeverity).toBe("MODERATE");
  });

  it("computes absenceSeverity EXTENDED for 6+ games", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21],
      gamesMissed: 8,
    });

    const verdict = getVerdict(comps);
    expect(verdict.medianGamesMissed).toBe(8);
    expect(verdict.absenceSeverity).toBe("EXTENDED");
  });

  it("boundary: gamesMissed=2 is SHORT, gamesMissed=3 is MODERATE", () => {
    const shortComps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 2,
    });
    const modComps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 3,
    });

    expect(getVerdict(shortComps).absenceSeverity).toBe("SHORT");
    expect(getVerdict(modComps).absenceSeverity).toBe("MODERATE");
  });

  it("boundary: gamesMissed=5 is MODERATE, gamesMissed=6 is EXTENDED", () => {
    const modComps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 5,
    });
    const extComps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 6,
    });

    expect(getVerdict(modComps).absenceSeverity).toBe("MODERATE");
    expect(getVerdict(extComps).absenceSeverity).toBe("EXTENDED");
  });

  it("returns null severity when all gamesMissed = 0", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21],
      gamesMissed: 0,
    });

    const verdict = getVerdict(comps);
    expect(verdict.medianGamesMissed).toBeNull();
    expect(verdict.absenceSeverity).toBeNull();
  });

  it("returns null severity when fewer than 3 comps have gamesMissed > 0", () => {
    const withGames = makeComps(2, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 4,
    });
    const noGames = makeComps(4, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 0,
    });
    noGames.forEach((c, i) => {
      c.player.id = `ng${i}`;
      c.injury.id = `nginj${i}`;
      c.injury.playerId = `ng${i}`;
    });

    const verdict = getVerdict([...withGames, ...noGames]);
    expect(verdict.medianGamesMissed).toBeNull();
    expect(verdict.absenceSeverity).toBeNull();
  });

  it("uses broader filter: comps without post-return data counted for games missed", () => {
    // 3 recovery-valid comps (not enough for verdict type)
    const recoveryValid = makeComps(3, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 2,
    });
    // 5 comps with no post-return data but gamesMissed > 0
    const noReturn = makeComps(5, {
      preInjuryPPG: 20,
      postReturnPPG: [], // excluded from recovery filter
      gamesMissed: 10,
    });
    noReturn.forEach((c, i) => {
      c.player.id = `nr${i}`;
      c.injury.id = `nrinj${i}`;
      c.injury.playerId = `nr${i}`;
    });

    const verdict = getVerdict([...recoveryValid, ...noReturn]);
    // Verdict type is null (only 3 recovery-valid)
    expect(verdict.type).toBeNull();
    // But games missed uses all 8 comps (3 with gm=2, 5 with gm=10)
    // median of [2,2,2,10,10,10,10,10] = (10+2)/2 = 6... wait
    // sorted: [2,2,2,10,10,10,10,10], mid = 4, even: (arr[3]+arr[4])/2 = (10+10)/2 = 10
    // Actually: length=8, mid=4, even: (arr[3]+arr[4])/2 = (10+10)/2 = 10
    // Wait, sorted = [2,2,2,10,10,10,10,10], mid=4, arr[3]=10, arr[4]=10 → 10
    expect(verdict.medianGamesMissed).toBe(10);
    expect(verdict.absenceSeverity).toBe("EXTENDED");
  });

  it("includes Expected absence in message when games missed is available", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21],
      gamesMissed: 3,
    });

    const verdict = getVerdict(comps);
    expect(verdict.message).toContain("Expected absence:");
    expect(verdict.message).toContain("~3 games");
  });

  it("omits Expected absence from message when games missed is null", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21],
      gamesMissed: 0,
    });

    const verdict = getVerdict(comps);
    expect(verdict.message).not.toContain("Expected absence");
  });

  it("shows games missed in insufficient data verdict when available", () => {
    // Only 3 recovery-valid comps (below MIN_COMPARABLES)
    // but all have gamesMissed > 0
    const comps = makeComps(3, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18],
      gamesMissed: 5,
    });

    const verdict = getVerdict(comps);
    expect(verdict.type).toBeNull();
    expect(verdict.medianGamesMissed).toBe(5);
    expect(verdict.absenceSeverity).toBe("MODERATE");
    expect(verdict.message).toContain("Expected absence:");
  });

  it("HOLD + EXTENDED is a valid combination (no downgrade)", () => {
    const comps = makeComps(6, {
      preInjuryPPG: 20,
      postReturnPPG: [18, 18, 20, 21], // 90% recovery → HOLD
      gamesMissed: 8, // EXTENDED
    });

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("HOLD");
    expect(verdict.absenceSeverity).toBe("EXTENDED");
  });
});
