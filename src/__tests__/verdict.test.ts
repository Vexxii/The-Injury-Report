import { describe, it, expect } from "vitest";
import { getVerdict } from "@/lib/verdict";
import type { ScoredComparable, Player, Injury } from "@/lib/types";

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
    preInjuryPPG: 20,
    postReturnPPG: [18, 19, 20, 21],
    gamesMissed: 2,
    ...overrides,
  };
}

describe("getVerdict", () => {
  it("returns null verdict when fewer than 5 comparables", () => {
    const comps = [makeComparable(), makeComparable(), makeComparable()];
    const verdict = getVerdict(comps);

    expect(verdict.type).toBeNull();
    expect(verdict.medianRecoveryPct).toBeNull();
    expect(verdict.message).toContain("Not enough data");
  });

  it("returns HOLD when median recovery > 85%", () => {
    // 90% recovery: preInjury 20, postReturn avg weeks 1-2 = 18
    const comps = Array.from({ length: 6 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `p${i}` },
        injury: { ...makeComparable().injury, id: `inj${i}`, playerId: `p${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [18, 18, 20, 21], // avg 18 = 90% of 20
      })
    );

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("HOLD");
    expect(verdict.medianRecoveryPct).toBe(90);
    expect(verdict.message).toContain("bounces back");
  });

  it("returns MONITOR when median recovery 70-85%", () => {
    const comps = Array.from({ length: 6 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `p${i}` },
        injury: { ...makeComparable().injury, id: `inj${i}`, playerId: `p${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [15, 15, 18, 20], // avg 15 = 75% of 20
      })
    );

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("MONITOR");
    expect(verdict.medianRecoveryPct).toBe(75);
    expect(verdict.message).toContain("typical but not guaranteed");
  });

  it("returns CONSIDER_SELLING when median recovery < 70%", () => {
    const comps = Array.from({ length: 6 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `p${i}` },
        injury: { ...makeComparable().injury, id: `inj${i}`, playerId: `p${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [10, 12, 14, 16], // avg 11 = 55% of 20
      })
    );

    const verdict = getVerdict(comps);
    expect(verdict.type).toBe("CONSIDER_SELLING");
    expect(verdict.message).toContain("struggled significantly");
  });

  it("excludes comparables with 0 preInjuryPPG", () => {
    // 3 valid + 3 with 0 baseline = only 3 valid, below MIN_COMPARABLES
    const valid = Array.from({ length: 3 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `v${i}` },
        injury: { ...makeComparable().injury, id: `vinj${i}`, playerId: `v${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [18, 19],
      })
    );
    const invalid = Array.from({ length: 3 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `x${i}` },
        injury: { ...makeComparable().injury, id: `xinj${i}`, playerId: `x${i}` },
        preInjuryPPG: 0,
        postReturnPPG: [10, 12],
      })
    );

    const verdict = getVerdict([...valid, ...invalid]);
    expect(verdict.type).toBeNull();
    expect(verdict.comparablesUsed).toBe(3);
  });

  it("excludes comparables with fewer than 2 post-return games", () => {
    const valid = Array.from({ length: 3 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `v${i}` },
        injury: { ...makeComparable().injury, id: `vinj${i}`, playerId: `v${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [18, 19],
      })
    );
    const insufficient = Array.from({ length: 3 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `s${i}` },
        injury: { ...makeComparable().injury, id: `sinj${i}`, playerId: `s${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [18], // only 1 post-return game
      })
    );

    const verdict = getVerdict([...valid, ...insufficient]);
    expect(verdict.type).toBeNull();
    expect(verdict.comparablesUsed).toBe(3);
  });

  it("uses median, not mean, for recovery percentage", () => {
    // 5 comps: 4 at 90% recovery, 1 outlier at 20%
    // Mean would be ~76%, but median should be 90%
    const normal = Array.from({ length: 4 }, (_, i) =>
      makeComparable({
        player: { ...makeComparable().player, id: `n${i}` },
        injury: { ...makeComparable().injury, id: `ninj${i}`, playerId: `n${i}` },
        preInjuryPPG: 20,
        postReturnPPG: [18, 18, 20, 21],
      })
    );
    const outlier = makeComparable({
      player: { ...makeComparable().player, id: "out" },
      injury: { ...makeComparable().injury, id: "outinj", playerId: "out" },
      preInjuryPPG: 20,
      postReturnPPG: [4, 4, 6, 8], // 20% recovery
    });

    const verdict = getVerdict([...normal, outlier]);
    expect(verdict.type).toBe("HOLD"); // median 90%, not mean ~76%
  });
});
