const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function invitationRulesDeploy() {
  const userRules = await getDeployedContract("UserRules");

  const InvitationRules = await ethers.getContractFactory("InvitationRules");

  const args = [userRules.target];

  const invitationRules = await InvitationRules.deploy(...args);

  saveContractAddress("InvitationRules", invitationRules.target);

  console.log(`InvitationRules address ${invitationRules.target}`);

  await userRules.newAllowedCaller(invitationRules.target);

  await verifyContract(invitationRules, "InvitationRules", args);

  return invitationRules;
}

module.exports = invitationRulesDeploy;
