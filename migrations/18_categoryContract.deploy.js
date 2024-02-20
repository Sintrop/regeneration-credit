const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function categoryContractDeploy() {
  const CategoryContract = await ethers.getContractFactory("CategoryContract");

  const categoryContract = await CategoryContract.deploy();

  saveContractAddress("CategoryContract", categoryContract.target);

  console.log(`CategoryContract address ${categoryContract.target}`)

  return categoryContract;
}

module.exports = categoryContractDeploy;
