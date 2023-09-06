const UserContract = artifacts.require("UserContract");
const ActivistContract = artifacts.require("ActivistContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(ActivistContract, userContract.address);
  });
};
