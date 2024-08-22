const { ZERO_ADDRESS } = require("./zeroAddress");

const regenerationCreditDeployed = async () => {
  const regenerationCreditIcoAddress = ZERO_ADDRESS;

  const regenerationCreditContractFactory = await ethers.getContractFactory("RegenerationCredit");

  const regenerationCredit = await regenerationCreditContractFactory.deploy("150000000000000000000000000000", regenerationCreditIcoAddress);

  return regenerationCredit;
};

module.exports = { regenerationCreditDeployed };
