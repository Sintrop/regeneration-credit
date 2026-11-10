/**
 * Migration rehearsal on a local Hardhat network.
 *
 * Deploys the protocol at the snapshot block, imports the v1 snapshot, reads the new deployment with the same
 * snapshot reader and compares both, contract by contract, and the replayed events log by log.
 *
 * Usage: MIGRATION_SNAPSHOT=<snapshot dir> npx hardhat run scripts/migration/rehearsal.js
 */
const hre = require("hardhat");
const fs = require("fs");
const { loadSnapshot, importSnapshot, closeMigration, NOT_REPLAYED } = require("./import");
const { takeSnapshot } = require("./snapshot");
const { POOL_IMPORTERS } = require("./pools");

const { ethers } = hre;

const POOL_HALVING = Number(process.env.POOL_HALVING || 12);

// Values that legitimately differ between deployments.
const IGNORED_SCALARS = new Set(["owner", "migrator"]);

async function deploy(name, args) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function deployProtocol(snapshot, options) {
  const s = (name) => snapshot.state[name].scalars;
  const settings = snapshot.state.CommunityRules.mappings.getUserTypeSettings;
  const proportionality = (type) => settings[type]?.proportionalityOnRegister ?? 0;
  const clocks = snapshot.meta.clocks;
  const deployedAt = (pool) => (options.keepEraClock ? clocks[pool].deployedAt : 0);
  const blocksPerEra = clocks.RegeneratorPool.blocksPerEra;

  const c = {};
  c.RegenerationCredit = await deploy("RegenerationCredit", [s("RegenerationCredit").totalSupply]);
  const token = c.RegenerationCredit.target;
  c.CommunityRules = await deploy("CommunityRules", [2, 6, 3, 4, 5].map(proportionality));
  const community = c.CommunityRules.target;
  for (const pool of [
    "DeveloperPool",
    "InspectorPool",
    "RegeneratorPool",
    "ResearcherPool",
    "ContributorPool",
    "ActivistPool",
    "ValidationPool",
  ]) {
    c[pool] = await deploy(pool, [token, POOL_HALVING, blocksPerEra, deployedAt(pool)]);
  }
  const works = (name) => [s(name).timeBetweenWorks, s(name).maxPenalties, s(name).securityBlocksToValidation];
  c.DeveloperRules = await deploy("DeveloperRules", works("DeveloperRules"));
  c.InspectorRules = await deploy("InspectorRules", [
    community,
    c.InspectorPool.target,
    s("InspectorRules").maxPenalties,
  ]);
  c.RegeneratorRules = await deploy("RegeneratorRules", [community, c.RegeneratorPool.target]);
  c.ResearcherRules = await deploy("ResearcherRules", works("ResearcherRules"));
  c.ContributorRules = await deploy("ContributorRules", works("ContributorRules"));
  c.ValidationRules = await deploy("ValidationRules", [s("ValidationRules").timeBetweenVotes]);
  c.ActivistRules = await deploy("ActivistRules", [community, c.ActivistPool.target]);
  c.SupporterRules = await deploy("SupporterRules", [community, c.ResearcherRules.target, token]);
  c.InvitationRules = await deploy("InvitationRules", [
    community,
    c.ResearcherRules.target,
    c.DeveloperRules.target,
    c.ActivistRules.target,
    c.ContributorRules.target,
  ]);
  c.RegenerationIndexRules = await deploy("RegenerationIndexRules", []);
  const i = s("InspectionRules");
  c.InspectionRules = await deploy("InspectionRules", [
    i.timeBetweenInspections,
    i.blocksToExpireAcceptedInspection,
    i.allowedInitialRequests,
    i.acceptInspectionDelayBlocks,
    i.securityBlocksToValidation,
  ]);
  c.RegenerationCreditImpact = await deploy("RegenerationCreditImpact", [
    token,
    c.InspectionRules.target,
    c.RegeneratorRules.target,
  ]);
  c.VoteRules = await deploy("VoteRules", [
    community,
    c.ContributorRules.target,
    c.DeveloperRules.target,
    c.ResearcherRules.target,
  ]);
  return c;
}

// Same configuration as migrations/after_deploy.js, without invitations, transfers and ownership renounce.
async function configure(c, snapshot) {
  const t = (name) => c[name].target;
  const balances = snapshot.state.RegenerationCredit.mappings.balanceOf;
  const v1 = snapshot.meta.addresses;
  for (const pool of [
    "RegeneratorPool",
    "InspectorPool",
    "DeveloperPool",
    "ResearcherPool",
    "ContributorPool",
    "ActivistPool",
    "ValidationPool",
  ]) {
    await (await c.RegenerationCredit.addContractPool(t(pool), balances[v1[pool]] || 0)).wait();
  }

  await c.ValidationRules.setContractInterfaces({
    communityRulesAddress: t("CommunityRules"),
    regeneratorRulesAddress: t("RegeneratorRules"),
    inspectorRulesAddress: t("InspectorRules"),
    developerRulesAddress: t("DeveloperRules"),
    researcherRulesAddress: t("ResearcherRules"),
    activistRulesAddress: t("ActivistRules"),
    contributorRulesAddress: t("ContributorRules"),
    voteRulesAddress: t("VoteRules"),
    validationPoolAddress: t("ValidationPool"),
  });
  for (const name of ["ResearcherRules", "DeveloperRules", "ContributorRules", "InspectionRules"]) {
    await c.ValidationRules.newAllowedCaller(t(name));
  }
  await c.InspectionRules.setContractInterfaces({
    communityRulesAddress: t("CommunityRules"),
    regeneratorRulesAddress: t("RegeneratorRules"),
    validationRulesAddress: t("ValidationRules"),
    inspectorRulesAddress: t("InspectorRules"),
    activistRulesAddress: t("ActivistRules"),
    regenerationIndexRulesAddress: t("RegenerationIndexRules"),
    voteRulesAddress: t("VoteRules"),
  });
  for (const [rules, pool, key] of [
    ["DeveloperRules", "DeveloperPool", "developerPoolAddress"],
    ["ContributorRules", "ContributorPool", "contributorPoolAddress"],
    ["ResearcherRules", "ResearcherPool", "researcherPoolAddress"],
  ]) {
    await c[rules].setContractInterfaces({
      communityRulesAddress: t("CommunityRules"),
      validationRulesAddress: t("ValidationRules"),
      [key]: t(pool),
      voteRulesAddress: t("VoteRules"),
    });
    await c[rules].newAllowedCaller(t("ValidationRules"));
    await c[rules].setContractCall(t("ValidationRules"));
  }
  for (const name of ["ActivistRules", "RegeneratorRules"]) {
    await c[name].newAllowedCaller(t("ValidationRules"));
    await c[name].newAllowedCaller(t("InspectionRules"));
    await c[name].setContractCall(t("InspectionRules"), t("ValidationRules"));
  }
  await c.InspectorRules.newAllowedCaller(t("ValidationRules"));
  await c.InspectorRules.newAllowedCaller(t("InspectionRules"));
  await c.InspectorRules.setContractCall(t("InspectionRules"));
  for (const name of [
    "ActivistRules",
    "DeveloperRules",
    "InspectorRules",
    "RegeneratorRules",
    "ResearcherRules",
    "ContributorRules",
    "SupporterRules",
    "ValidationRules",
    "InvitationRules",
  ]) {
    await c.CommunityRules.newAllowedCaller(t(name));
  }
  await c.CommunityRules.setContractCall(t("InvitationRules"), t("ValidationRules"));
  for (const [pool, rules] of [
    ["ActivistPool", "ActivistRules"],
    ["ContributorPool", "ContributorRules"],
    ["DeveloperPool", "DeveloperRules"],
    ["ResearcherPool", "ResearcherRules"],
    ["InspectorPool", "InspectorRules"],
    ["RegeneratorPool", "RegeneratorRules"],
    ["ValidationPool", "ValidationRules"],
  ]) {
    await c[pool].newAllowedCaller(t(rules));
    await c[pool].setContractCall(t(rules));
  }
}

// --- Comparison ---

function replaceAddresses(value, map) {
  if (typeof value === "string") return map[value.toLowerCase()] ?? value;
  if (Array.isArray(value)) return value.map((item) => replaceAddresses(item, map));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key
          .split(":")
          .map((part) => map[part.toLowerCase()] ?? part)
          .join(":"),
        replaceAddresses(item, map),
      ])
    );
  }
  return value;
}

function diff(expected, actual, prefix, out) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return;
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (isObject(expected) && isObject(actual)) {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      diff(expected[key], actual[key], `${prefix}.${key}`, out);
    }
    return;
  }
  out.push({ path: prefix, expected, actual });
}

function compareState(v1, v2, map, options) {
  const report = {};
  for (const name of Object.keys(v1.state)) {
    if (options.skipContracts.has(name)) continue;
    const expected = replaceAddresses(v1.state[name], map);
    const actual = v2.state[name];
    const out = [];
    for (const section of ["scalars", "mappings", "storage"]) {
      const e = { ...(expected[section] || {}) };
      const a = { ...(actual[section] || {}) };
      if (section === "scalars") for (const key of IGNORED_SCALARS) delete e[key], delete a[key];
      if (section === "mappings") {
        for (const key of Object.keys(a)) if (!(key in e)) delete a[key];
        // Permission views (can*, is*, has*, waited*) of addresses that are not users, such as the migrator.
        for (const [fn, entries] of Object.entries(a)) {
          if (!/^(can|is|has|waited)/.test(fn)) continue;
          a[fn] = Object.fromEntries(Object.entries(entries).filter(([key]) => key in (e[fn] || {})));
        }
      }
      diff(e, a, `${name}.${section}`, out);
    }
    if (out.length) report[name] = out;
  }
  return report;
}

function compareEvents(v1, v2) {
  const report = {};
  for (const name of Object.keys(v1.meta.addresses)) {
    const skip = new Set([...NOT_REPLAYED["*"], ...(NOT_REPLAYED[name] || [])]);
    const key = (event) => JSON.stringify([event.topics, event.data]);
    const expected = v1.events.filter((event) => event.contract === name && !skip.has(event.event)).map(key);
    const actual = v2.events
      .filter((event) => event.contract === name && !skip.has(event.event) && event.event !== "MigrationClosed")
      .map(key);
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      report[name] = { expected: expected.length, actual: actual.length };
    }
  }
  return report;
}

async function main() {
  const dir = process.env.MIGRATION_SNAPSHOT;
  if (!dir) throw new Error("Set MIGRATION_SNAPSHOT to the snapshot directory");
  const keepEraClock = process.env.MIGRATION_ERA_CLOCK !== "new";
  const v1 = loadSnapshot(dir);

  const current = await ethers.provider.getBlockNumber();
  const target = Number(v1.meta.snapshotBlock);
  if (target > current) await hre.network.provider.send("hardhat_mine", [ethers.toQuantity(target - current)]);

  const [migrator] = await ethers.getSigners();
  console.log(`Deploying at block ${await ethers.provider.getBlockNumber()} with ${migrator.address}`);
  const contracts = await deployProtocol(v1, { keepEraClock });
  await configure(contracts, v1);

  await importSnapshot(v1, contracts, { importers: keepEraClock ? POOL_IMPORTERS : {} });
  await closeMigration(contracts);

  const addresses = Object.fromEntries(Object.entries(contracts).map(([name, contract]) => [name, contract.target]));
  if (process.env.MIGRATION_ADDRESSES_OUT) {
    fs.writeFileSync(process.env.MIGRATION_ADDRESSES_OUT, JSON.stringify(addresses, null, 2) + "\n");
  }
  const map = {};
  for (const [name, address] of Object.entries(v1.meta.addresses)) map[address.toLowerCase()] = addresses[name];
  const extraAddresses = [...new Set([...(v1.meta.addressList || []), ...v1.events.map((event) => event.from)])].map(
    (address) => map[address.toLowerCase()] ?? address
  );

  const v2 = await takeSnapshot({
    provider: new ethers.BrowserProvider(hre.network.provider),
    addresses,
    block: await ethers.provider.getBlockNumber(),
    extraAddresses,
    checkCreationBlock: false,
  });

  const skipContracts = new Set((process.env.MIGRATION_SKIP_COMPARE || "").split(",").filter(Boolean));
  const stateReport = compareState(v1, v2, map, { skipContracts });
  const eventsReport = compareEvents(v1, v2);

  console.log("\n=== State differences ===");
  for (const [name, items] of Object.entries(stateReport)) {
    console.log(`${name}: ${items.length}`);
    for (const item of items.slice(0, 15)) {
      console.log(`  ${item.path}\n    v1: ${JSON.stringify(item.expected)}\n    v2: ${JSON.stringify(item.actual)}`);
    }
  }
  console.log("\n=== Event differences ===");
  for (const [name, item] of Object.entries(eventsReport))
    console.log(`${name}: v1 ${item.expected}, v2 ${item.actual}`);
  if (!Object.keys(stateReport).length && !Object.keys(eventsReport).length) console.log("No differences");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
