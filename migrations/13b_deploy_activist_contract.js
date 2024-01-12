const UserContract = artifacts.require("UserContract");
const ActivistContract = artifacts.require("ActivistContract");
const ActivistPool = artifacts.require("ActivistPool");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const activistPool = await ActivistPool.deployed();

    const activistContract = await deployer.deploy(ActivistContract, userContract.address, activistPool.address);

    await userContract.newAllowedCaller(activistContract.address);
    await activistPool.newAllowedCaller(activistContract.address);
  });
};
