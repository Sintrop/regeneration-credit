const saveContractAddress = require("./shared/saveContractAddress");

async function userContractDeploy() {
  const inspectorProportionality = process.env["INSPECTOR_PROPORTIONALITY"];
  const activistProportionality = process.env["ACTIVIST_PROPORTIONALITY"];
  const researcherProportionality = process.env["RESEARCHER_PROPORTIONALITY"];
  const developerProportionality = process.env["DEVELOPER_PROPORTIONALITY"];
  const validatorProportionality = process.env["VALIDATOR_PROPORTIONALITY"];

  const UserContract = await ethers.getContractFactory("UserContract");

  var userContract = await UserContract.deploy(
    inspectorProportionality,
    activistProportionality,
    researcherProportionality,
    developerProportionality,
    validatorProportionality
  );

  saveContractAddress("UserContract", userContract.target);

  return userContract;
}

module.exports = userContractDeploy;
