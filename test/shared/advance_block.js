const { mine } = require("@nomicfoundation/hardhat-network-helpers");

const advanceBlock = async (blocksNumber) => {
  await mine(blocksNumber);
};

module.exports = { advanceBlock };
