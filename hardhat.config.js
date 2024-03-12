require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");
require("dotenv").config({ path: __dirname + "/.env" });

const infuraKey = process.env.INFURA_API_KEY;
const privateKey = process.env.PRIVATE_KEY_ACCOUNT_TO_DEPLOY || "set private key";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.2",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    localhost: {
      allowUnlimitedContractSize: true,
    },
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${infuraKey}`,
    //   accounts: [privateKey],
    // },
    // zkevm: {
    //   url: `https://rpc.public.zkevm-test.net`,
    //   accounts: [privateKey],
    // },
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
  sourcify: {
    enabled: false,
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
      details: {
        yul: true,
        yulDetails: {
          stackAllocation: true,
          optimizerSteps: "dhfoDgvulfnTUtnIf",
        },
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    bail: false,
    parallel: true,
    jobs: 3,
    color: true,
    checkLeaks: false,
    reporter: "spec",
    ui: "bdd",
  },
};
