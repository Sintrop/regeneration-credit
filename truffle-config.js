require("dotenv").config({path: __dirname + "/.env"});
const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env["PRIVATE_KEY_ACCOUNT_TO_DEPLOY_GOERLI"];
const infuraKey = process.env["INFURA_API_KEY"];

const provider = new HDWalletProvider(privateKey, `https://goerli.infura.io/v3/${infuraKey}`);

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },

    goerli: {
      provider: () => provider,
      network_id: "5",
      gas: 4465030,
      gasPrice: 10000000000,
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
};
