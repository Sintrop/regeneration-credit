const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function communityRulesDeploy() {
  const inspectorProportionality = process.env["INSPECTOR_PROPORTIONALITY"];
  const activistProportionality = process.env["ACTIVIST_PROPORTIONALITY"];
  const researcherProportionality = process.env["RESEARCHER_PROPORTIONALITY"];
  const developerProportionality = process.env["DEVELOPER_PROPORTIONALITY"];
  const validatorProportionality = process.env["VALIDATOR_PROPORTIONALITY"];
  const contributorProportionality = process.env["CONTRIBUTOR_PROPORTIONALITY"];

  const CommunityRules = await ethers.getContractFactory("CommunityRules");

  const args = [
    inspectorProportionality,
    activistProportionality,
    researcherProportionality,
    developerProportionality,
    validatorProportionality,
    contributorProportionality,
  ];

  var communityRules = await CommunityRules.deploy(...args);

  saveContractAddress("CommunityRules", communityRules.target);

  console.log(`CommunityRules address ${communityRules.target}`);

  await verifyContract(communityRules, "CommunityRules", args);

  return communityRules;
}

module.exports = communityRulesDeploy;
