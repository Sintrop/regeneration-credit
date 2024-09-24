const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function userContractDeploy() {
  const inspectorProportionality = process.env["INSPECTOR_PROPORTIONALITY"];
  const activistProportionality = process.env["ACTIVIST_PROPORTIONALITY"];
  const researcherProportionality = process.env["RESEARCHER_PROPORTIONALITY"];
  const developerProportionality = process.env["DEVELOPER_PROPORTIONALITY"];
  const validatorProportionality = process.env["VALIDATOR_PROPORTIONALITY"];
  const contributorProportionality = process.env["CONTRIBUTOR_PROPORTIONALITY"];

  const UserContract = await ethers.getContractFactory("UserContract");

  const args = [
    inspectorProportionality,
    activistProportionality,
    researcherProportionality,
    developerProportionality,
    validatorProportionality,
    contributorProportionality
  ]

  var userContract = await UserContract.deploy(...args);

  saveContractAddress("UserContract", userContract.target);

  console.log(`UserContract address ${userContract.target}`)
  
  await verifyContract(userContract.target, args);

  return userContract;
}

module.exports = userContractDeploy;
