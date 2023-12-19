require("@nomicfoundation/hardhat-toolbox");
require('solidity-coverage')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.2",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    sepolia: {
      url: "...",
      accounts: {
        mnemonic: "sintrop smart contract solicity js people community developers nature agriculture world life",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
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
