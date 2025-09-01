require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");
require("dotenv").config({ path: __dirname + "/.env" });
require('solidity-docgen');

const infuraKey = process.env.INFURA_API_KEY;
const privateKey = process.env.PRIVATE_KEY_ACCOUNT_TO_DEPLOY || "set private key";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const coinMarketcapApiKey = process.env.COINMARKETCAP_API_KEY;
const gasReportEnabled = process.env.GAS_REPORT_ENABLED;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
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
    //   url: `https://rpc.sintrop.com`,
    //   accounts: [privateKey]
    // },
    // sequoiaTestnet: {
    //   url: "https://sequoiarpc.sintrop.com",
    //   accounts: [privateKey],
    // }
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
  docgen: {
    outputDir: './docs-site/docs/contracts',         
    pages: 'files',
    templates: './docs-site/docgen-templates', 
    clear: true, 
    runOnCompile: true,
    only: ['^contracts/'], 
    except: [],
  },  
};
