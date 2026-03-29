import { describe, it, expect } from "vitest";
import { getCurrentNFLWeek } from "@/lib/data";
import { findComparables } from "@/lib/comparison";
import { getVerdict } from "@/lib/verdict";
import { loadData } from "@/lib/data";
import type { Injury, Player } from "@/lib/types";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p-test",
    name: "Test WR",
    position: "WR",
    team: "CIN",
    birthDate: "1998-06-15",
    heightInches: 72,
    weightLbs: 200,
    ...overrides,
  };
}

function makeSyntheticInjury(
  playerId: string,
  bodyPart: string,
  overrides: Partial<Injury> = {}
): Injury {
  const { season, week } = getCurrentNFLWeek();
  return {
    id: "hypothetical",
    playerId,
    bodyPart,
    reportStatus: "Unknown",
    practiceStatus: "Unknown",
    gamesMissed: 0,
    seasonYear: season,
    weekNumber: week,
    returnWeek: null,
    returnSeasonYear: null,
    ...overrides,
  };
}

describe("Synthetic Injury Construction", () => {
  it("creates a valid Injury object", () => {
    const injury = makeSyntheticInjury("p1", "hamstring");
    expect(injury.id).toBe("hypothetical");
    expect(injury.bodyPart).toBe("hamstring");
    expect(injury.reportStatus).toBe("Unknown");
    expect(injury.practiceStatus).toBe("Unknown");
    expect(injury.gamesMissed).toBe(0);
    expect(injury.returnWeek).toBeNull();
    expect(injury.returnSeasonYear).toBeNull();
  });

  it("uses getCurrentNFLWeek for season and week", () => {
    const { season, week } = getCurrentNFLWeek();
    const injury = makeSyntheticInjury("p1", "knee");
    expect(injury.seasonYear).toBe(season);
    expect(injury.weekNumber).toBe(week);
  });

  it("accepts any body part string", () => {
    const injury = makeSyntheticInjury("p1", "concussion");
    expect(injury.bodyPart).toBe("concussion");
  });
});

describe("What If mode with real data", () => {
  const { players, injuries, gameLogs } = loadData();

  it("finds comparables for a WR hamstring hypothetical", () => {
    const wr = players.find((p) => p.position === "WR");
    if (!wr) throw new Error("No WR found in dataset");

    const syntheticInjury = makeSyntheticInjury(wr.id, "hamstring");
    const comparables = findComparables(
      wr,
      syntheticInjury,
      players,
      injuries,
      gameLogs
    );

    expect(comparables.length).toBeGreaterThan(0);
    // All comparables should have matching body part
    comparables.forEach((c) => {
      expect(c.injury.bodyPart).toBe("hamstring");
    });
  });

  it("finds comparables for a QB shoulder hypothetical", () => {
    const qb = players.find((p) => p.position === "QB");
    if (!qb) throw new Error("No QB found in dataset");

    const syntheticInjury = makeSyntheticInjury(qb.id, "shoulder");
    const comparables = findComparables(
      qb,
      syntheticInjury,
      players,
      injuries,
      gameLogs
    );

    expect(comparables.length).toBeGreaterThan(0);
    comparables.forEach((c) => {
      expect(c.injury.bodyPart).toBe("shoulder");
    });
  });

  it("returns fewer results for rare body parts", () => {
    const rb = players.find((p) => p.position === "RB");
    if (!rb) throw new Error("No RB found in dataset");

    const hamstringInjury = makeSyntheticInjury(rb.id, "hamstring");
    const neckInjury = makeSyntheticInjury(rb.id, "neck");

    const hamstringComps = findComparables(
      rb,
      hamstringInjury,
      players,
      injuries,
      gameLogs
    );
    const neckComps = findComparables(
      rb,
      neckInjury,
      players,
      injuries,
      gameLogs
    );

    // Hamstring is much more common than neck
    expect(hamstringComps.length).toBeGreaterThan(neckComps.length);
  });

  it("generates a valid verdict from hypothetical comparables", () => {
    const wr = players.find((p) => p.position === "WR");
    if (!wr) throw new Error("No WR found in dataset");

    const syntheticInjury = makeSyntheticInjury(wr.id, "ankle");
    const comparables = findComparables(
      wr,
      syntheticInjury,
      players,
      injuries,
      gameLogs
    );
    const verdict = getVerdict(comparables);

    expect(verdict).toBeDefined();
    expect(verdict.comparablesUsed).toBeGreaterThan(0);
    // With enough comparables, verdict type should not be null
    if (comparables.length >= 5) {
      expect(verdict.type).not.toBeNull();
    }
  });

  it("returns zero comparables for a nonexistent body part", () => {
    const wr = players.find((p) => p.position === "WR");
    if (!wr) throw new Error("No WR found in dataset");

    const syntheticInjury = makeSyntheticInjury(wr.id, "foobar");
    const comparables = findComparables(
      wr,
      syntheticInjury,
      players,
      injuries,
      gameLogs
    );

    expect(comparables).toHaveLength(0);
  });
});
