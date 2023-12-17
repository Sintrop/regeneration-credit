const userContractDeployed = async ({
  inspectorProportionality = 0,
  activistProportionality = 0,
  researcherProportionality = 0,
  developerProportionality = 0,
  validatorProportionality = 0,
} = {}) => {
  const INSPECTOR_PROPORTIONALITY = inspectorProportionality;
  const ACTIVIST_PROPORTIONALITY = activistProportionality;
  const RESEARCHER_PROPORTIONALITY = researcherProportionality;
  const DEVELOPER_PROPORTIONALITY = developerProportionality;
  const VALIDATOR_PROPORTIONALITY = validatorProportionality;

  const userContractFactory = await ethers.getContractFactory("UserContract");
  userContract = await userContractFactory.deploy(
    INSPECTOR_PROPORTIONALITY,
    ACTIVIST_PROPORTIONALITY,
    RESEARCHER_PROPORTIONALITY,
    DEVELOPER_PROPORTIONALITY,
    VALIDATOR_PROPORTIONALITY
  );

  return userContract;
};

module.exports = { userContractDeployed };
