const { ZERO_ADDRESS } = require("./zeroAddress");

const regenerationCreditDeployed = async () => {
  const regenerationCreditContractFactory = await ethers.getContractFactory("RegenerationCredit");

  const regenerationCredit = await regenerationCreditContractFactory.deploy("150000000000000000000000000000");

  return regenerationCredit;
};

module.exports = { regenerationCreditDeployed };
