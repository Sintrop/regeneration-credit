const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");

async function invitationContractDeploy() {
  const userContract = await getDeployedContract("UserContract");

  const invitationDelayBlocks = process.env["INVITATION_DELAY_BLOCKS"];

  const InvitationContract = await ethers.getContractFactory("InvitationContract");

  const invitationContract = await InvitationContract.deploy(
    userContract.target,
    invitationDelayBlocks
  );

  saveContractAddress("InvitationContract", invitationContract.target);

}

module.exports = invitationContractDeploy;
