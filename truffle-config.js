require("dotenv").config({path: __dirname + "/.env"});
const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env["PRIVATE_KEY_ACCOUNT_TO_DEPLOY_GOERLI"];
const infuraKey = process.env["INFURA_API_KEY"];

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
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
