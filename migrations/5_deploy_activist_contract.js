const UserContract = artifacts.require("UserContract");
const InspectorContract = artifacts.require("InspectorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(InspectorContract, userContract.address);
  });
};
