const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function invitationContractDeploy() {
  const userContract = await getDeployedContract("UserRules");

  const InvitationRules = await ethers.getContractFactory("InvitationRules");

  const args = [userContract.target];

  const invitationContract = await InvitationRules.deploy(...args);

  saveContractAddress("InvitationRules", invitationContract.target);

  console.log(`InvitationRules address ${invitationContract.target}`);

  await userContract.newAllowedCaller(invitationContract.target);

  await verifyContract(invitationContract, "InvitationRules", args);

  return invitationContract;
}

module.exports = invitationContractDeploy;
