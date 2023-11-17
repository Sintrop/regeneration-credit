const UserContract = artifacts.require("UserContract");

const userContractDeployed = async ({
  inspectorProportionality = 2,
  activistProportionality = 1,
  researcherProportionality = 1,
  developerProportionality = 1,
  validatorProportionality = 1,
} = {}) => {
  const INSPECTOR_PROPORTIONALITY = inspectorProportionality;
  const ACTIVIST_PROPORTIONALITY = activistProportionality;
  const RESEARCHER_PROPORTIONALITY = researcherProportionality;
  const DEVELOPER_PROPORTIONALITY = developerProportionality;
  const VALIDATOR_PROPORTIONALITY = validatorProportionality;

  const userContract = await UserContract.new(
    INSPECTOR_PROPORTIONALITY,
    ACTIVIST_PROPORTIONALITY,
    RESEARCHER_PROPORTIONALITY,
    DEVELOPER_PROPORTIONALITY,
    VALIDATOR_PROPORTIONALITY
  );

  return userContract;
};

module.exports = { userContractDeployed };
