import { loadData, findPlayerByName, searchPlayers, getPlayerInjuries } from "@/lib/data";
import { findComparables } from "@/lib/comparison";
import { getVerdict } from "@/lib/verdict";
import SearchBar from "@/components/SearchBar";
import PlayerCard from "@/components/PlayerCard";
import ComparableCard from "@/components/ComparableCard";
import VerdictBox from "@/components/VerdictBox";

interface PageProps {
  searchParams: Promise<{ player?: string; injury?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const playerQuery = params.player?.trim() ?? "";
  const parsedIndex = params.injury ? parseInt(params.injury, 10) : 0;
  const injuryIndex = isNaN(parsedIndex) || parsedIndex < 0 ? 0 : parsedIndex;

  const { players, injuries, gameLogs } = loadData();

  // No search yet — show landing state
  if (!playerQuery) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              The Injury Report
            </h1>
            <p className="text-gray-500 text-lg">
              Historical injury comparables for smarter fantasy decisions
            </p>
          </div>
          <SearchBar players={players} />
          <div className="mt-12 text-center text-sm text-gray-400">
            <p>Search any NFL player to see how comparable injuries played out historically.</p>
            <p className="mt-1">
              Try: Derrick Henry, Ja&apos;Marr Chase, Josh Allen
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Search for player
  const matchedPlayer = findPlayerByName(players, playerQuery);

  if (!matchedPlayer) {
    const suggestions = searchPlayers(players, playerQuery);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              The Injury Report
            </h1>
          </div>
          <SearchBar players={players} />
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              No player found for &ldquo;{playerQuery}&rdquo;
            </p>
            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Did you mean:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s) => (
                    <a
                      key={s.id}
                      href={`/?player=${encodeURIComponent(s.name)}`}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-colors"
                    >
                      {s.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get player injuries
  const playerInjuries = getPlayerInjuries(injuries, matchedPlayer.id);

  if (playerInjuries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              The Injury Report
            </h1>
          </div>
          <SearchBar players={players} />
          <div className="mt-8">
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
              <h2 className="text-xl font-bold">{matchedPlayer.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {matchedPlayer.position} · {matchedPlayer.team}
              </p>
              <p className="text-gray-600 mt-4">
                No injury records found in our database for this player.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Select injury (default to most recent)
  const selectedInjury =
    playerInjuries[Math.min(injuryIndex, playerInjuries.length - 1)];

  // Run comparison algorithm
  const comparables = findComparables(
    matchedPlayer,
    selectedInjury,
    players,
    injuries,
    gameLogs
  );

  // Get verdict
  const verdict = getVerdict(comparables);

  // Top comparables (show up to 10)
  const topComparables = comparables.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            The Injury Report
          </h1>
        </div>
        <SearchBar players={players} />

        <div className="mt-8 space-y-4">
          {/* Injury selector if multiple injuries */}
          {playerInjuries.length > 1 && (
            <nav aria-label="Injury history" className="flex gap-2 flex-wrap">
              {playerInjuries.map((inj, i) => (
                <a
                  key={inj.id}
                  href={`/?player=${encodeURIComponent(matchedPlayer.name)}&injury=${i}`}
                  aria-label={`${inj.bodyPart} injury, ${inj.seasonYear} week ${inj.weekNumber}${i === injuryIndex ? " (selected)" : ""}`}
                  aria-current={i === injuryIndex ? "true" : undefined}
                  className={`px-3 py-2 min-h-[44px] flex items-center rounded-full text-sm border transition-colors ${
                    i === injuryIndex
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {inj.bodyPart} · {inj.seasonYear} Wk {inj.weekNumber}
                </a>
              ))}
            </nav>
          )}

          <PlayerCard
            player={matchedPlayer}
            injury={selectedInjury}
            comparables={topComparables}
          />

          <VerdictBox verdict={verdict} />

          {topComparables.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Comparable Cases ({comparables.length} found, showing top{" "}
                {topComparables.length})
              </h3>
              <div className="space-y-3">
                {topComparables.map((comp, i) => (
                  <ComparableCard
                    key={comp.injury.id}
                    comparable={comp}
                    rank={i + 1}
                  />
                ))}
              </div>
            </div>
          )}

          {topComparables.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
              <p className="text-gray-600">
                No comparable injuries found in our database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
