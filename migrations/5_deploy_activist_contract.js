const UserContract = artifacts.require("UserContract");
const InspectorContract = artifacts.require("InspectorContract");

const inspectorMaxPenalties = process.env["INSPECTOR_MAX_PENALTIES"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(InspectorContract, userContract.address, inspectorMaxPenalties);
  });
};
