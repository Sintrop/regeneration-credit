/**
 * Hardhat configuration for a local node with the Sintrop chain id, used to open a migrated deployment in the apps.
 *
 * Node:      npx hardhat node --config scripts/migration/hardhat.local.config.js
 * Migration: MIGRATION_SNAPSHOT=<dir> npx hardhat run --config scripts/migration/hardhat.local.config.js \
 *              --network localhost scripts/migration/rehearsal.js
 */
const path = require("path");
const config = require("../../hardhat.config.js");

const SINTROP_CHAIN_ID = 250225;

module.exports = {
  ...config,
  paths: { ...(config.paths || {}), root: path.join(__dirname, "../..") },
  networks: {
    ...config.networks,
    hardhat: { ...config.networks.hardhat, chainId: SINTROP_CHAIN_ID },
    localhost: {
      ...config.networks.localhost,
      url: "http://127.0.0.1:8545",
      chainId: SINTROP_CHAIN_ID,
      timeout: 600000,
    },
  },
};
