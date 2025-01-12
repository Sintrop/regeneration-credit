const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function categoryContractDeploy() {
  const RegenerationIndexRules = await ethers.getContractFactory("RegenerationIndexRules");

  const categoryContract = await RegenerationIndexRules.deploy();

  saveContractAddress("RegenerationIndexRules", categoryContract.target);

  console.log(`RegenerationIndexRules address ${categoryContract.target}`);

  await verifyContract(categoryContract, "RegenerationIndexRules");

  return categoryContract;
}

module.exports = categoryContractDeploy;
