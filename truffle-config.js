require("dotenv").config({ path: __dirname + "/.env" });
const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env["PRIVATE_KEY_ACCOUNT_TO_DEPLOY"];
const infuraKey = process.env["INFURA_API_KEY"];
const etherscanApiKey = process.env["ETHERSCAN_API_KEY"];

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    goerli: {
      provider: () => new HDWalletProvider(privateKey, `https://goerli.infura.io/v3/${infuraKey}`),
      network_id: "5",
      gas: 4465030,
      gasPrice: 10000000000,
      skipDryRun: true,
    },
    sepolia: {
      provider: () => new HDWalletProvider(privateKey, `https://sepolia.infura.io/v3/${infuraKey}`),
      network_id: 11155111,
      gas: 4000000,
      gasPrice: 10000000000,
      confirmations: 2,
      timeoutBlocks: 15000,
      skipDryRun: true,
    },
  },
  contracts_directory: "./contracts/",
  contracts_build_directory: "./abis/",
  compilers: {
    solc: {
      version: "0.8.2",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  environments: {
    development: {
      ipfs: {
        address: "http://127.0.0.1:5001",
      },
    },
  },
  api_keys: {
    etherscan: etherscanApiKey,
  },
  plugins: ["truffle-plugin-verify"],
};
