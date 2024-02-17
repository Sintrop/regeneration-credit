const fs = require("node:fs");

function saveContractAddress(contractName, contractAddress) {
  const contractsDir = `/app/scripts/deployedContracts`;
  const filepath = `${contractsDir}/${contractName.toLowerCase()}.json`;

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(filepath, JSON.stringify({ [contractName.toLowerCase()]: contractAddress }));
}

module.exports = saveContractAddress;
