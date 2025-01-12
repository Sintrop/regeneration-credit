const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function userContractDeploy() {
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

  var userContract = await UserRules.deploy(...args);

  saveContractAddress("UserRules", userContract.target);

  console.log(`UserRules address ${userContract.target}`);

  await verifyContract(userContract, "UserRules", args);

  return userContract;
}

module.exports = userContractDeploy;
