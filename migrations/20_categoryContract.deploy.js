const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function categoryContractDeploy() {
  const CategoryContract = await ethers.getContractFactory("CategoryContract");

  const categoryContract = await CategoryContract.deploy();

  saveContractAddress("CategoryContract", categoryContract.target);

  console.log(`CategoryContract address ${categoryContract.target}`);

  await verifyContract(categoryContract.target);

  return categoryContract;
}

module.exports = categoryContractDeploy;
