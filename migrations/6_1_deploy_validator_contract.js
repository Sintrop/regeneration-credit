const UserContract = artifacts.require("UserContract");
const ValidatorContract = artifacts.require("ValidatorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    await deployer.deploy(
      ValidatorContract,
      userContract.address
    );
  });
};
