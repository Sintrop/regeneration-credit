module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
  },
  contracts_directory: './contracts/',
  contracts_build_directory: './abis/', 
  compilers: {
    solc: {
      version: "0.8.2",
      settings: { 
        optimizer: {
          enabled: false,
          runs: 200 
        }
      },
    }
  },
  environments: {
    development: {
      ipfs: {
        address: 'http://127.0.0.1:5001'
      }
    }
  }
};
