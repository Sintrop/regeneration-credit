const { ZERO_ADDRESS } = require("./zeroAddress");

const rcTokenDeployed = async () => {
  const rcTokenIcoAddress = ZERO_ADDRESS;

  const rcTokenContractFactory = await ethers.getContractFactory("RcToken");

  const rcToken = await rcTokenContractFactory.deploy("150000000000000000000000000000", rcTokenIcoAddress);

  return rcToken;
};

module.exports = { rcTokenDeployed };
