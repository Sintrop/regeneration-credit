const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function voteRulesDeploy() {
    const communityRules = await getDeployedContract("CommunityRules");
    const researcherRules = await getDeployedContract("ResearcherRules");
    const developerRules = await getDeployedContract("DeveloperRules");
    const contributorRules = await getDeployedContract("ContributorRules");

    const VoteRules = await ethers.getContractFactory("VoteRules");

    const args = [
        communityRules.target,
        contributorRules.target,
        developerRules.target,
        researcherRules.target,
      ];    

    const voteRules = await VoteRules.deploy(...args);

    saveContractAddress("VoteRules", voteRules.target);

    console.log(`VoteRules address ${voteRules.target}`);
    
    await verifyContract(voteRules, "VoteRules", args);
  
    return voteRules;
  }
  
  module.exports = voteRulesDeploy;
  