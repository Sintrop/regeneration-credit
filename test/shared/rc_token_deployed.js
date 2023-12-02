const RcToken = artifacts.require("RcToken");

const zeroAddress = require("@openzeppelin/test-helpers/src/constants").ZERO_ADDRESS;

const rcTokenDeployed = async () => {
  const rcTokenIcoAddress = zeroAddress;

  const rcToken = await RcToken.new("150000000000000000000000000000", rcTokenIcoAddress);

  return rcToken;
};

module.exports = { rcTokenDeployed };
