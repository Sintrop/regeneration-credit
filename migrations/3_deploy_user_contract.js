const UserContract = artifacts.require("UserContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(UserContract);
  });
};
