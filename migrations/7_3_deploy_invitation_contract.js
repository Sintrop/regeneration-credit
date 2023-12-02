const UserContract = artifacts.require("UserContract");
const InvitationContract = artifacts.require("InvitationContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();

    const invitationDelayBlocks = process.env["INVITATION_DELAY_BLOCKS"];

    const invitationContract = await deployer.deploy(
      InvitationContract,
      userContract.address,
      invitationDelayBlocks
    );

    await userContract.newAllowedCaller(invitationContract.address);
  });
};
