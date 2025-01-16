const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function userRulesDeploy() {
  const inspectorProportionality = process.env["INSPECTOR_PROPORTIONALITY"];
  const activistProportionality = process.env["ACTIVIST_PROPORTIONALITY"];
  const researcherProportionality = process.env["RESEARCHER_PROPORTIONALITY"];
  const developerProportionality = process.env["DEVELOPER_PROPORTIONALITY"];
  const validatorProportionality = process.env["VALIDATOR_PROPORTIONALITY"];
  const contributorProportionality = process.env["CONTRIBUTOR_PROPORTIONALITY"];

  const UserRules = await ethers.getContractFactory("UserRules");

  const args = [
    inspectorProportionality,
    activistProportionality,
    researcherProportionality,
    developerProportionality,
    validatorProportionality,
    contributorProportionality,
  ];

  var userRules = await UserRules.deploy(...args);

  saveContractAddress("UserRules", userRules.target);

  console.log(`UserRules address ${userRules.target}`);

  await verifyContract(userRules, "UserRules", args);

  return userRules;
}

module.exports = userRulesDeploy;
