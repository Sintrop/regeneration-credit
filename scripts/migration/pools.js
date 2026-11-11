/**
 * Pool importers for a migration that keeps the v1 era clock: eras, user levels, claimed tokens, withdrawals and
 * processed level events are imported as they are, so pending eras stay claimable and withdrawn eras stay withdrawn.
 */
const { chunk, send } = require("./import");

const POOLS = [
  "ActivistPool",
  "ContributorPool",
  "DeveloperPool",
  "InspectorPool",
  "RegeneratorPool",
  "ResearcherPool",
];

async function importPool(pool, s) {
  const eras = Object.entries(s.mappings.eras || {});
  if (eras.length) {
    await send(
      "eras",
      pool.migrateEras(
        eras.map(([era]) => era),
        eras.map(([, data]) => data)
      )
    );
  }

  const keys = new Set([
    ...Object.keys(s.mappings.eraLevels || {}),
    ...Object.keys(s.mappings.eraTokens || {}),
    ...Object.keys(s.mappings.hasWithdrawn || {}),
  ]);
  const entries = [...keys].map((key) => key.split(":"));
  for (const part of chunk(entries, 100)) {
    const value = (mapping, [era, user], fallback) => s.mappings[mapping]?.[`${era}:${user}`] ?? fallback;
    await send(
      "user eras",
      pool.migrateUserEras(
        part.map(([era]) => era),
        part.map(([, user]) => user),
        part.map((key) => value("eraLevels", key, "0")),
        part.map((key) => value("eraTokens", key, "0")),
        part.map((key) => value("hasWithdrawn", key, false))
      )
    );
  }

  const processed = Object.keys(s.mappings.hasProcessedLevel || {});
  for (const part of chunk(processed, 200)) await send("processed levels", pool.migrateProcessedLevels(part));
}

const POOL_IMPORTERS = Object.fromEntries(POOLS.map((name) => [name, importPool]));

module.exports = { POOL_IMPORTERS };
