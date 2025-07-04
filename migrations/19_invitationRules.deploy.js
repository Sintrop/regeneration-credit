const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function invitationRulesDeploy() {
  const communityRules = await getDeployedContract("CommunityRules");
  const researcherRules = await getDeployedContract("ResearcherRules");
  const developerRules = await getDeployedContract("DeveloperRules");
  const activistRules = await getDeployedContract("ActivistRules");
  const contributorRules = await getDeployedContract("ContributorRules");

  const InvitationRules = await ethers.getContractFactory("InvitationRules");

  const args = [
    communityRules.target,
    researcherRules.target,
    developerRules.target,
    activistRules.target,
    contributorRules.target,
  ];

  const invitationRules = await InvitationRules.deploy(...args);

  saveContractAddress("InvitationRules", invitationRules.target);

  console.log(`InvitationRules address ${invitationRules.target}`);

  await communityRules.newAllowedCaller(invitationRules.target);

  await verifyContract(invitationRules, "InvitationRules", args);

  return invitationRules;
}

module.exports = invitationRulesDeploy;
