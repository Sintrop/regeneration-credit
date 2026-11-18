/**
 * Production migration, run step by step on the target network with the migrator (deployer) account.
 *
 * Steps (MIGRATION_STEP), in order:
 * - deploy:   deploys the protocol with the v1 parameters and era clocks read from the snapshot, configures it like
 *             migrations/after_deploy.js and saves the addresses to MIGRATION_ADDRESSES.
 * - import:   imports the snapshot state and replays the v1 events.
 * - verify:   reads the new deployment with the snapshot reader and compares it with v1. Read only, can be repeated.
 * - close:    closes the migration in every contract and checks that migrator() is zero everywhere. Irreversible.
 * - renounce: renounces the ownership of every contract. MIGRATION_KEEP_INVITATION_OWNER must be "true" or "false"
 *             to decide whether InvitationRules keeps its owner. Irreversible.
 *
 * If a step fails before `close`, the deployment is discarded and the migration starts again from `deploy`.
 *
 * Usage:
 * MIGRATION_SNAPSHOT=<snapshot dir> MIGRATION_ADDRESSES=<addresses file> MIGRATION_STEP=<step> \
 *   npx hardhat run --config scripts/migration/hardhat.mainnet.config.js --network mainnet scripts/migration/migrate.js
 *
 * The same steps run on a local node with scripts/migration/hardhat.local.config.js and --network localhost.
 *
 * Era 0 scenario (see era0.js): MIGRATION_SCENARIO=era0 in every step. The v2 starts at era 1 with a new era clock,
 * the v1 history becomes era 0 and the era 0 payout follows MIGRATION_ERA0_CONFIG (default
 * migration/era0/config.json). The deploy step saves the scenario and the payout next to the addresses file
 * (<addresses>.scenario.json and <addresses>.era0-payout.json), and the next steps refuse to run with another
 * scenario or configuration.
 */
const hre = require("hardhat");
const fs = require("fs");
const { loadSnapshot, importSnapshot, closeMigration } = require("./import");
const { POOL_IMPORTERS } = require("./pools");
const { deployProtocol, configure, attachProtocol, checkMigrationClosed, renounceOwnership } = require("./protocol");
const { verifyDeployment, printReport } = require("./verify");
const { toEra0, loadEra0Config, payoutJson } = require("./era0");

const { ethers } = hre;

const STEPS = ["deploy", "import", "verify", "close", "renounce"];
const SCENARIOS = ["era3", "era0"];
const DEFAULT_ERA0_CONFIG = "migration/era0/config.json";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

function readAddresses(file) {
  if (!fs.existsSync(file)) throw new Error(`Addresses file ${file} not found. Run the deploy step first.`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** The steps after deploy must run with the scenario and configuration used by the deploy step. */
function checkScenario(file, current) {
  if (!fs.existsSync(file)) throw new Error(`${file} not found. Run the deploy step first.`);
  const deployed = fs.readFileSync(file, "utf8");
  if (deployed !== JSON.stringify(current, null, 2) + "\n") {
    throw new Error(`Scenario or configuration differs from the deploy step (${file}). Use the same settings.`);
  }
}

async function main() {
  const step = required("MIGRATION_STEP");
  if (!STEPS.includes(step)) throw new Error(`MIGRATION_STEP must be one of: ${STEPS.join(", ")}`);
  const scenario = process.env.MIGRATION_SCENARIO || "era3";
  if (!SCENARIOS.includes(scenario)) throw new Error(`MIGRATION_SCENARIO must be one of: ${SCENARIOS.join(", ")}`);
  const era0 = scenario === "era0";
  const addressesFile = required("MIGRATION_ADDRESSES");
  const scenarioFile = `${addressesFile}.scenario.json`;

  let v1 = loadSnapshot(required("MIGRATION_SNAPSHOT"));
  const scenarioInfo = { scenario, snapshotBlock: v1.meta.snapshotBlock };
  let payout;
  if (era0) {
    const configFile = process.env.MIGRATION_ERA0_CONFIG || DEFAULT_ERA0_CONFIG;
    scenarioInfo.era0 = loadEra0Config(configFile);
    ({ snapshot: v1, payout } = toEra0(v1, scenarioInfo.era0));
  }
  const [migrator] = await ethers.getSigners();
  if (!migrator && step !== "verify") throw new Error("Set PRIVATE_KEY_ACCOUNT_TO_DEPLOY to run this step");

  console.log(
    `Network ${hre.network.name}, block ${await ethers.provider.getBlockNumber()}, signer ${
      migrator?.address ?? "none"
    }`
  );
  console.log(`Snapshot of block ${v1.meta.snapshotBlock}, scenario ${scenario}, step ${step}`);

  if (step === "deploy") {
    if (fs.existsSync(addressesFile))
      throw new Error(`${addressesFile} already exists. Use a new file to deploy again.`);
    const contracts = await deployProtocol(v1, { keepEraClock: !era0 });
    const addresses = Object.fromEntries(Object.entries(contracts).map(([name, contract]) => [name, contract.target]));
    fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2) + "\n");
    fs.writeFileSync(scenarioFile, JSON.stringify(scenarioInfo, null, 2) + "\n");
    console.log(`Addresses saved to ${addressesFile}`);
    if (era0) {
      fs.writeFileSync(`${addressesFile}.era0-payout.json`, payoutJson(payout));
      console.log(`Era 0 payout saved to ${addressesFile}.era0-payout.json`);
    }
    await configure(contracts, v1);
    return;
  }

  const addresses = readAddresses(addressesFile);
  checkScenario(scenarioFile, scenarioInfo);
  if (step === "verify") {
    printReport(await verifyDeployment(v1, addresses, { includeEra0: era0 }));
    return;
  }

  const contracts = await attachProtocol(addresses);
  if (step === "import") {
    await importSnapshot(v1, contracts, { importers: era0 ? {} : POOL_IMPORTERS });
  } else if (step === "close") {
    await closeMigration(contracts);
    await checkMigrationClosed(contracts);
  } else if (step === "renounce") {
    const keepInvitationOwner = required("MIGRATION_KEEP_INVITATION_OWNER");
    if (!["true", "false"].includes(keepInvitationOwner)) {
      throw new Error('MIGRATION_KEEP_INVITATION_OWNER must be "true" or "false"');
    }
    await checkMigrationClosed(contracts);
    await renounceOwnership(contracts, new Set(keepInvitationOwner === "true" ? ["InvitationRules"] : []));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
