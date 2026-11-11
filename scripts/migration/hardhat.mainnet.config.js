/**
 * Hardhat configuration for the production migration on the Sintrop mainnet.
 *
 * The deployer (migrator) key is read from PRIVATE_KEY_ACCOUNT_TO_DEPLOY in the .env file and is only required
 * when this configuration is used.
 *
 * Usage: MIGRATION_STEP=<step> ... npx hardhat run --config scripts/migration/hardhat.mainnet.config.js \
 *          --network mainnet scripts/migration/migrate.js
 */
const path = require("path");
const config = require("../../hardhat.config.js");

const SINTROP_CHAIN_ID = 250225;

const privateKey = process.env.PRIVATE_KEY_ACCOUNT_TO_DEPLOY;
if (!privateKey) throw new Error("Set PRIVATE_KEY_ACCOUNT_TO_DEPLOY in the .env file");

module.exports = {
  ...config,
  paths: { ...(config.paths || {}), root: path.join(__dirname, "../..") },
  networks: {
    ...config.networks,
    mainnet: {
      url: process.env.MIGRATION_RPC_URL || "https://rpc.sintrop.com",
      chainId: SINTROP_CHAIN_ID,
      accounts: [privateKey],
      timeout: 600000,
    },
  },
};
