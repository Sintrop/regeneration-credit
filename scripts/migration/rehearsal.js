/**
 * Migration rehearsal on a local Hardhat network.
 *
 * Deploys the protocol at the snapshot block, imports the v1 snapshot, closes the migration, reads the new deployment
 * with the same snapshot reader and compares both, contract by contract, and the replayed events log by log.
 *
 * Usage: MIGRATION_SNAPSHOT=<snapshot dir> npx hardhat run scripts/migration/rehearsal.js
 */
const hre = require("hardhat");
const fs = require("fs");
const { loadSnapshot, importSnapshot, closeMigration } = require("./import");
const { POOL_IMPORTERS } = require("./pools");
const { deployProtocol, configure, checkMigrationClosed } = require("./protocol");
const { verifyDeployment, printReport } = require("./verify");

const { ethers } = hre;

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
  await checkMigrationClosed(contracts);

  const addresses = Object.fromEntries(Object.entries(contracts).map(([name, contract]) => [name, contract.target]));
  if (process.env.MIGRATION_ADDRESSES_OUT) {
    fs.writeFileSync(process.env.MIGRATION_ADDRESSES_OUT, JSON.stringify(addresses, null, 2) + "\n");
  }

  const skipContracts = new Set((process.env.MIGRATION_SKIP_COMPARE || "").split(",").filter(Boolean));
  printReport(await verifyDeployment(v1, addresses, { skipContracts }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
