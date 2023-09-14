const UserContract = artifacts.require("UserContract");
const InspectorContract = artifacts.require("InspectorContract");
const InspectorPool = artifacts.require("InspectorPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const inspectorPool = await InspectorPool.deployed();

    const inspectorContract = await deployer.deploy(InspectorContract, userContract.address, inspectorPool.address);

    await inspectorPool.newAllowedCaller(inspectorContract.address);
  });
};
