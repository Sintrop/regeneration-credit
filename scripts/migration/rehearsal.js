/**
 * Migration rehearsal on a local Hardhat network.
 *
 * Deploys the protocol at the snapshot block, imports the v1 snapshot, closes the migration, reads the new deployment
 * with the same snapshot reader and compares both, contract by contract, and the replayed events log by log.
 *
 * Usage: MIGRATION_SNAPSHOT=<snapshot dir> npx hardhat run scripts/migration/rehearsal.js
 * Era 0 scenario (see era0.js): MIGRATION_SCENARIO=era0 [MIGRATION_ERA0_CONFIG=migration/era0/config.json]
 * or [ERA0_PAYOUT=owed|unified|single] [ERA0_NET=true]
 * [ERA0_FUND_FROM=<file>] [ERA0_FUND_FULL=<a,b>] [ERA0_PAYOUT_OUT=<file>]
 */
const hre = require("hardhat");
const fs = require("fs");
const { loadSnapshot, importSnapshot, closeMigration } = require("./import");
const { POOL_IMPORTERS } = require("./pools");
const { deployProtocol, configure, checkMigrationClosed } = require("./protocol");
const { verifyDeployment, printReport } = require("./verify");
const { toEra0, loadEra0Config, payoutJson } = require("./era0");

const { ethers } = hre;

async function main() {
  const dir = process.env.MIGRATION_SNAPSHOT;
  if (!dir) throw new Error("Set MIGRATION_SNAPSHOT to the snapshot directory");
  const era0 = process.env.MIGRATION_SCENARIO === "era0";
  const keepEraClock = !era0 && process.env.MIGRATION_ERA_CLOCK !== "new";
  let v1 = loadSnapshot(dir);
  if (era0) {
    // Same configuration file as migrate.js, or the ERA0_* variables to compare other settings.
    const options = process.env.MIGRATION_ERA0_CONFIG
      ? loadEra0Config(process.env.MIGRATION_ERA0_CONFIG)
      : {
          mode: process.env.ERA0_PAYOUT || "owed",
          net: process.env.ERA0_NET === "true",
          fundFrom: process.env.ERA0_FUND_FROM
            ? fs.readFileSync(process.env.ERA0_FUND_FROM, "utf8").split(/\s+/).filter(Boolean)
            : [],
          fundFull: (process.env.ERA0_FUND_FULL || "").split(",").filter(Boolean),
        };
    const result = toEra0(v1, options);
    v1 = result.snapshot;
    printPayout(result.payout);
    if (process.env.ERA0_PAYOUT_OUT) {
      fs.writeFileSync(process.env.ERA0_PAYOUT_OUT, payoutJson(result.payout));
    }
  }

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
  printReport(await verifyDeployment(v1, addresses, { skipContracts, includeEra0: era0 }));
}

function printPayout(payout) {
  const rc = (wei) => (Number(wei / 10n ** 14n) / 1e4).toLocaleString("en-US");
  console.log(`Era 0 payout: ${rc(payout.total)} RC to ${Object.keys(payout.payouts).length} users`);
  for (const [pool, item] of Object.entries(payout.byPool)) {
    console.log(`  ${pool}: ${rc(item.total)} RC, ${Object.keys(item.users).length} users`);
  }
  if (payout.netted !== undefined) {
    console.log(
      `  taken back from the v1 pool rewards: ${rc(payout.netted)} RC (already spent: ${rc(payout.spent)} RC)`
    );
  }
  if (payout.fundedTotal !== undefined) {
    const share = Number((payout.fundedProportional * 1000000n) / payout.fundedBase) / 10000;
    console.log(
      `  funded by ${Object.keys(payout.funded).length} wallets: ${rc(payout.fundedTotal)} RC (${share}% of ${rc(
        payout.fundedBase
      )} RC)`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
