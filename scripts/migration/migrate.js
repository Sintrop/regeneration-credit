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
 */
const hre = require("hardhat");
const fs = require("fs");
const { loadSnapshot, importSnapshot, closeMigration } = require("./import");
const { POOL_IMPORTERS } = require("./pools");
const { deployProtocol, configure, attachProtocol, checkMigrationClosed, renounceOwnership } = require("./protocol");
const { verifyDeployment, printReport } = require("./verify");

const { ethers } = hre;

const STEPS = ["deploy", "import", "verify", "close", "renounce"];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

function readAddresses(file) {
  if (!fs.existsSync(file)) throw new Error(`Addresses file ${file} not found. Run the deploy step first.`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function main() {
  const step = required("MIGRATION_STEP");
  if (!STEPS.includes(step)) throw new Error(`MIGRATION_STEP must be one of: ${STEPS.join(", ")}`);
  const v1 = loadSnapshot(required("MIGRATION_SNAPSHOT"));
  const addressesFile = required("MIGRATION_ADDRESSES");
  const [migrator] = await ethers.getSigners();

  console.log(
    `Network ${hre.network.name}, block ${await ethers.provider.getBlockNumber()}, signer ${migrator.address}`
  );
  console.log(`Snapshot of block ${v1.meta.snapshotBlock}, step ${step}`);

  if (step === "deploy") {
    if (fs.existsSync(addressesFile))
      throw new Error(`${addressesFile} already exists. Use a new file to deploy again.`);
    const contracts = await deployProtocol(v1, { keepEraClock: true });
    const addresses = Object.fromEntries(Object.entries(contracts).map(([name, contract]) => [name, contract.target]));
    fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2) + "\n");
    console.log(`Addresses saved to ${addressesFile}`);
    await configure(contracts, v1);
    return;
  }

  const addresses = readAddresses(addressesFile);
  const contracts = await attachProtocol(addresses);

  if (step === "import") {
    await importSnapshot(v1, contracts, { importers: POOL_IMPORTERS });
  } else if (step === "verify") {
    printReport(await verifyDeployment(v1, addresses));
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
