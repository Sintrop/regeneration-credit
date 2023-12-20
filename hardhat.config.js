require("@nomicfoundation/hardhat-toolbox");
require('solidity-coverage');
require("dotenv").config({path: __dirname + "/.env"});

const infuraKey = process.env["INFURA_API_KEY"];
const privateKey = process.env["PRIVATE_KEY_ACCOUNT_TO_DEPLOY"];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.2",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${infuraKey}`,
      accounts: [privateKey]
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      details: {
        yul: true,
        yulDetails: {
          stackAllocation: true,
          optimizerSteps: "dhfoDgvulfnTUtnIf"
        }
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    bail: true,
    parallel: false,
    jobs: 0,
    color: true,
    checkLeaks: false,
    reporter: "spec",
    ui: "bdd"
  }
};
