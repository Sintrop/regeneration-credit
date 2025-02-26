require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");
require("dotenv").config({ path: __dirname + "/.env" });

const infuraKey = process.env.INFURA_API_KEY;
const privateKey = process.env.PRIVATE_KEY_ACCOUNT_TO_DEPLOY || "set private key";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const coinMarketcapApiKey = process.env.COINMARKETCAP_API_KEY;
const gasReportEnabled = process.env.GAS_REPORT_ENABLED;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        count: 30,
      },
    },
    localhost: {
      allowUnlimitedContractSize: true,
    },
    // mainnet: {
    //   url: `https://infura.io/v3/${infuraKey}`,
    //   accounts: [privateKey],
    // },
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${infuraKey}`,
    //   accounts: [privateKey],
    // },
    // zkevm: {
    //   url: `https://rpc.public.zkevm-test.net`,
    //   accounts: [privateKey],
    // },
    // holesky: {
    //   url: `https://rpc.holesky.ethpandaops.io`,
    //   accounts: [privateKey],
    // },
    // sequoiaTestnet: {
    //   url: "https://sequoiarpc.sintrop.com",
    //   accounts: [privateKey],
    // }
  },
  etherscan: {
    apiKey: {
      "sequoiaTestnet": "empty"
    },
    customChains: [
      {
        network: "sequoiaTestnet",
        chainId: 1600,
        urls: {
          apiURL: "https://sequoiaapi.sintrop.com/api",
          browserURL: "https://sequoiaapi.sintrop.com:5000"
        }
      }
    ]
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
  gasReporter: {
    enabled: gasReportEnabled == 'true',
    currency: "USD",
    L1Etherscan: etherscanApiKey,
    currencyDisplayPrecision: 2,
    outputFile: "gas_reporter.txt",
    noColors: true,
    coinmarketcap: coinMarketcapApiKey,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    bail: false,
    parallel: false,
    jobs: 3,
    color: true,
    checkLeaks: false,
    reporter: "spec",
    ui: "bdd",
  },
};
