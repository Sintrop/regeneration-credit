const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function invitationContractDeploy() {
  const userContract = await getDeployedContract("UserContract");

  const InvitationContract = await ethers.getContractFactory("InvitationContract");

  const args = [userContract.target];

  const invitationContract = await InvitationContract.deploy(...args);

  saveContractAddress("InvitationContract", invitationContract.target);

  console.log(`InvitationContract address ${invitationContract.target}`);

  await userContract.newAllowedCaller(invitationContract.target);

  await verifyContract(invitationContract, "InvitationContract", args);

  return invitationContract;
}

module.exports = invitationContractDeploy;
