/**
 * Era 0 scenario: the v2 starts at era 1 with a new era clock, and the whole v1 history becomes era 0.
 *
 * `toEra0(snapshot)` returns a new snapshot, so the same importer, event replay and verification run on it:
 * - users, inspections, resources, offsets and balances are kept;
 * - realized inspections, researches, reports and contributions move to era 0, so they keep counting in the
 *   token impact but cannot be voted on or give pool levels again;
 * - the impact of eras 1 and 2 is settled as era 0 (`impactPerEra[0]`, `lastSettledEra = 0`), leaving era 1 free
 *   for the v2 inspections;
 * - every user restarts the pool withdrawals at era 1 (`pool.currentEra = 1`);
 * - the pools start empty: v1 eras, levels and withdrawals are not imported, and their events are not replayed;
 * - the pool levels of eras 1 and 2 are paid at the deploy (era 0 payout), as a pre-launch distribution. The total
 *   supply grows by the same amount. Tokens already withdrawn in v1 stay with their holders.
 *
 * Payout modes (ERA0_PAYOUT):
 * - `owed` (default): each user receives what v1 still owed them, era by era (levels / era levels x tokens per era).
 * - `unified`: eras 1 and 2 become one era with the tokens of both: each user receives levels / total levels x the
 *   tokens of two eras, minus what was already withdrawn in v1 (never negative).
 * - `single`: era 0 is a single era: each user receives their levels of eras 1 and 2 / all those levels x the tokens
 *   of one era.
 *
 * Net balances (ERA0_NET=true): era 0 replaces the v1 pool rewards instead of adding to them. Each user's balance
 * becomes v1 balance - tokens withdrawn from the v1 pools + era 0 payout (never below zero), so tokens that did not
 * come from the pools (pre-launch, purchases, transfers) are kept. The pools start with their full allocation, and
 * the supply grows only by the era 0 payout plus the withdrawn tokens already spent.
 *
 * Funding from pre-launch wallets (ERA0_FUND_FROM=<file with one address per line>, requires ERA0_NET): that growth
 * is taken from the listed wallets, in proportion to the tokens each holds that did not come from the v1 pools, so
 * the v2 supply equals the v1 supply. Wallets in ERA0_FUND_FULL (comma separated) give all such tokens first.
 */
const POOLS = {
  RegeneratorPool: 750_000_000n,
  InspectorPool: 230_000_000n,
  ResearcherPool: 40_000_000n,
  DeveloperPool: 40_000_000n,
  ContributorPool: 40_000_000n,
  ActivistPool: 40_000_000n,
  ValidationPool: 10_000_000n,
};
const WEI = 10n ** 18n;
const HALVING = 12n;
const V1_ERAS = ["1", "2"];

const USERS = {
  RegeneratorRules: "getRegenerator",
  InspectorRules: "getInspector",
  ResearcherRules: "getResearcher",
  DeveloperRules: "getDeveloper",
  ContributorRules: "getContributor",
  ActivistRules: "getActivist",
};
// Getter and public mapping of each resource (the snapshot keeps both).
const RESOURCES = {
  ResearcherRules: ["getResearch", "researches"],
  DeveloperRules: ["getReport", "reports"],
  ContributorRules: ["getContribution", "contributions"],
};
const POOL_MAPPINGS = ["eras", "eraLevels", "eraTokens", "hasWithdrawn", "hasProcessedLevel", "getEra"];

const clone = (value) => JSON.parse(JSON.stringify(value));
const big = (value) => BigInt(value ?? 0);

/** Tokens of one era in the first epoch, as `Poolable.tokensPerEra(1, halving)`. */
const tokensPerEra = (pool) => (POOLS[pool] * WEI) / 2n / HALVING;

/**
 * Era 0 payout of every pool.
 * @returns { payouts: { address: wei }, byPool: { pool: { total, users: { address: wei } } }, total }
 */
function era0Payouts(snapshot, mode = "owed") {
  if (!["owed", "unified", "single"].includes(mode)) throw new Error(`Unknown era 0 payout mode: ${mode}`);
  const payouts = {};
  const byPool = {};
  let total = 0n;
  for (const pool of Object.keys(POOLS)) {
    const m = snapshot.state[pool].mappings;
    const perEra = tokensPerEra(pool);
    const users = {};
    const eraTotal = Object.fromEntries(V1_ERAS.map((era) => [era, 0n]));
    for (const [key, levels] of Object.entries(m.eraLevels || {})) {
      const [era, user] = key.split(":");
      if (!(era in eraTotal)) continue;
      (users[user] ??= { levels: {}, withdrawn: 0n }).levels[era] = big(levels);
      eraTotal[era] += big(levels);
    }
    for (const [key, tokens] of Object.entries(m.eraTokens || {})) {
      const [era, user] = key.split(":");
      if (era in eraTotal) (users[user] ??= { levels: {}, withdrawn: 0n }).withdrawn += big(tokens);
    }

    const allLevels = Object.values(eraTotal).reduce((a, b) => a + b, 0n);
    const result = {};
    for (const [user, u] of Object.entries(users)) {
      let amount = 0n;
      if (mode === "single") {
        const levels = Object.values(u.levels).reduce((a, b) => a + b, 0n);
        amount = allLevels ? (levels * perEra) / allLevels : 0n;
      } else if (mode === "unified") {
        const levels = Object.values(u.levels).reduce((a, b) => a + b, 0n);
        const share = allLevels ? (levels * perEra * BigInt(V1_ERAS.length)) / allLevels : 0n;
        amount = share > u.withdrawn ? share - u.withdrawn : 0n;
      } else {
        for (const [era, levels] of Object.entries(u.levels)) {
          if (!levels || m.hasWithdrawn?.[`${era}:${user}`]) continue;
          amount += (levels * perEra) / eraTotal[era];
        }
      }
      if (!amount) continue;
      result[user] = amount;
      payouts[user] = (payouts[user] ?? 0n) + amount;
      total += amount;
    }
    byPool[pool] = { total: Object.values(result).reduce((a, b) => a + b, 0n), users: result };
  }
  return { payouts, byPool, total };
}

/** Tokens each user withdrew from all the v1 pools. */
function withdrawnFromPools(snapshot) {
  const out = {};
  for (const pool of Object.keys(POOLS)) {
    for (const [key, tokens] of Object.entries(snapshot.state[pool].mappings.eraTokens || {})) {
      const user = key.split(":")[1];
      out[user] = (out[user] ?? 0n) + big(tokens);
    }
  }
  return out;
}

/**
 * Takes the supply growth of the era 0 (payout + withdrawn tokens already spent) from the given wallets. Each wallet
 * gives from the tokens it holds that did not come from the v1 pools: the `full` wallets give all of them first, and
 * the rest is split among the other wallets in proportion to those tokens. The last wallet absorbs the rounding.
 */
function fundFromWallets(snapshot, balances, keyOf, wallets, payout, full = []) {
  const lower = (mapping) => Object.fromEntries(Object.entries(mapping).map(([key, v]) => [key.toLowerCase(), big(v)]));
  const v1 = lower(snapshot.state.RegenerationCredit.mappings.balanceOf);
  const pools = lower(withdrawnFromPools(snapshot));
  const baseOf = (wallet) => {
    const held = v1[wallet] ?? 0n;
    const fromPools = pools[wallet] ?? 0n;
    return held > fromPools ? held - fromPools : 0n;
  };
  const fullSet = [...new Set(full.map((wallet) => wallet.toLowerCase()))];
  const shared = [...new Set(wallets.map((wallet) => wallet.toLowerCase()))].filter((w) => !fullSet.includes(w));
  const needed = payout.total + payout.spent;

  payout.funded = {};
  const take = (wallet, amount) => {
    if (!amount) return;
    const key = keyOf(wallet);
    const balance = big(balances[key]) - amount;
    if (balance === 0n) delete balances[key];
    else balances[key] = balance.toString();
    payout.funded[key] = amount;
  };

  let left = needed;
  for (const wallet of fullSet) {
    const amount = baseOf(wallet) < left ? baseOf(wallet) : left;
    take(wallet, amount);
    left -= amount;
  }
  const base = shared.map(baseOf);
  const totalBase = base.reduce((a, b) => a + b, 0n);
  if (left > totalBase) throw new Error("The listed wallets do not hold enough tokens to fund the era 0");
  const proportional = left;
  const last = base.findLastIndex((value) => value > 0n);
  shared.forEach((wallet, i) => {
    if (!base[i]) return;
    const amount = i === last ? left : (proportional * base[i]) / totalBase;
    left -= amount;
    take(wallet, amount);
  });
  payout.fundedTotal = needed;
  payout.fundedProportional = proportional;
  payout.fundedBase = totalBase;
}

function sumImpact(impacts) {
  const out = { trees: 0n, biodiversity: 0n, realizedInspections: 0n };
  for (const impact of Object.values(impacts || {})) for (const key of Object.keys(out)) out[key] += big(impact[key]);
  return Object.fromEntries(Object.entries(out).map(([key, value]) => [key, value.toString()]));
}

/**
 * @param snapshot Result of loadSnapshot (not modified).
 * @param options.mode Payout mode: `owed`, `unified` or `single`.
 * @param options.net Replace the v1 pool rewards with the era 0 payout (see ERA0_NET above).
 * @param options.fundFrom Wallets that fund the era 0 in proportion (see ERA0_FUND_FROM above).
 * @param options.fundFull Wallets that fund the era 0 with all their tokens first (see ERA0_FUND_FULL above).
 * @returns { snapshot, payout } The era 0 snapshot and the payout used in it.
 */
function toEra0(snapshot, options = {}) {
  const s = clone(snapshot);
  const payout = era0Payouts(snapshot, options.mode);
  const state = (name) => s.state[name];

  // Users restart the pool withdrawals at era 1, on a new clock.
  for (const [name, getter] of Object.entries(USERS)) {
    if ("poolCurrentEra" in state(name).scalars) state(name).scalars.poolCurrentEra = "1";
    for (const user of Object.values(state(name).mappings[getter] || {})) {
      if (user.pool) user.pool.currentEra = "1";
    }
  }

  // Published resources and realized inspections belong to era 0.
  for (const [name, mappings] of Object.entries(RESOURCES)) {
    for (const mapping of mappings) {
      for (const resource of Object.values(state(name).mappings[mapping] || {})) resource.era = "0";
    }
  }
  const inspections = state("InspectionRules");
  for (const inspection of Object.values(inspections.mappings.getInspection || {})) {
    if (inspection.inspectedAtEra !== "0") inspection.inspectedAtEra = "0";
  }

  // Impact of the v1 eras, already settled, becomes the settled era 0.
  inspections.mappings.impactPerEra = { 0: sumImpact(inspections.mappings.impactPerEra) };
  inspections.scalars.lastSettledEra = "0";
  const regenerators = state("RegeneratorRules");
  const certified = Object.values(regenerators.mappings.newCertificationRegenerators || {}).reduce(
    (a, b) => a + big(b),
    0n
  );
  regenerators.mappings.newCertificationRegenerators = { 0: certified.toString() };

  // Pools start empty at era 1; their v1 history is paid as era 0.
  for (const pool of Object.keys(POOLS)) {
    for (const mapping of POOL_MAPPINGS) delete state(pool).mappings[mapping];
    state(pool).scalars.currentContractEra = "1";
    state(pool).scalars.currentEpoch = "1";
  }
  const pools = new Set(Object.keys(POOLS).map((pool) => s.meta.addresses[pool].toLowerCase()));
  s.events = s.events.filter((event) => !pools.has((s.meta.addresses[event.contract] || "").toLowerCase()));

  // Era 0 payout: added to the balances and to the supply.
  const token = state("RegenerationCredit");
  const balances = token.mappings.balanceOf;
  const keyOf = (user) => Object.keys(balances).find((holder) => holder.toLowerCase() === user.toLowerCase()) ?? user;
  for (const [user, amount] of Object.entries(payout.payouts)) {
    const key = keyOf(user);
    balances[key] = (big(balances[key]) + amount).toString();
  }
  token.scalars.totalSupply = (big(token.scalars.totalSupply) + payout.total).toString();

  if (options.net) {
    // The tokens withdrawn from the v1 pools are taken back, as far as the wallet still holds them.
    payout.netted = 0n;
    payout.spent = 0n;
    for (const [user, withdrawn] of Object.entries(withdrawnFromPools(snapshot))) {
      const key = keyOf(user);
      const balance = big(balances[key]);
      const taken = balance < withdrawn ? balance : withdrawn;
      if (balance === taken) delete balances[key];
      else balances[key] = (balance - taken).toString();
      payout.netted += taken;
      payout.spent += withdrawn - taken;
    }
    for (const pool of Object.keys(POOLS)) balances[keyOf(s.meta.addresses[pool])] = (POOLS[pool] * WEI).toString();
    const locked = Object.values(POOLS)
      .reduce((a, b) => a + b * WEI, 0n)
      .toString();
    token.scalars.totalLocked = locked;
    token.scalars.totalLocked_ = locked;
    if (options.fundFrom?.length || options.fundFull?.length) {
      fundFromWallets(snapshot, balances, keyOf, options.fundFrom || [], payout, options.fundFull || []);
    }
    token.scalars.totalSupply = Object.values(balances)
      .reduce((a, b) => a + big(b), 0n)
      .toString();
  }

  return { snapshot: s, payout };
}

module.exports = { toEra0, era0Payouts, tokensPerEra, POOLS };
