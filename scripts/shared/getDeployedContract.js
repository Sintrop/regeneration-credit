const hre = require("hardhat");
const fs = require("node:fs");

async function getDeployedContract(contractName) {
  const contractNameLower = contractName.toLowerCase();
  const contractsDir = `/app/deployed_contracts/${hre.network.name}`;
  const filepath = `${contractsDir}/${contractNameLower}.json`;

  const data = fs.readFileSync(filepath, "utf8");
  object = JSON.parse(data);
  let contractAddress = object[contractNameLower];

  const Contract = await ethers.getContractFactory(contractName);

  const instance = Contract.attach(contractAddress);

  return instance;
}

module.exports = getDeployedContract;
