const fs = require("node:fs");

function contractAddress(contractName) {
  contractName = contractName.toLowerCase();
  const contractsDir = `/app/scripts/deployedContracts`;
  const filepath = `${contractsDir}/${contractName}.json`;

  let address = null;

  try {
    const data = fs.readFileSync(filepath, 'utf8');

    object = JSON.parse(data)

    address = object[contractName];
  } catch (err) {
    console.error(err);
  }

  return address;
}

module.exports = contractAddress;
