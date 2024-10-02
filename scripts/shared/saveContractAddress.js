const hre = require("hardhat");
const fs = require("node:fs");

function saveContractAddress(contractName, contractAddress) {
  const contractsDir = `/app/deployed_contracts/${hre.network.name}`;
  const filepath = `${contractsDir}/${contractName.toLowerCase()}.json`;
  const currentDateTime = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const data = {
    name: contractName,
    address: contractAddress,
    [contractName.toLowerCase()]: contractAddress,
    deployedAt: currentDateTime,
  };

  fs.writeFileSync(filepath, JSON.stringify(data));
}

module.exports = saveContractAddress;
