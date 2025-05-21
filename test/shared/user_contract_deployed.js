const communityRulesDeployed = async ({
  inspectorProportionality = 0,
  activistProportionality = 0,
  researcherProportionality = 0,
  developerProportionality = 0,
  contributorProportionality = 0,
} = {}) => {
  const INSPECTOR_PROPORTIONALITY = inspectorProportionality;
  const ACTIVIST_PROPORTIONALITY = activistProportionality;
  const RESEARCHER_PROPORTIONALITY = researcherProportionality;
  const DEVELOPER_PROPORTIONALITY = developerProportionality;
  const CONTRIBUTOR_PROPORTIONALITY = contributorProportionality;

  const communityRulesFactory = await ethers.getContractFactory("CommunityRules");
  communityRules = await communityRulesFactory.deploy(
    INSPECTOR_PROPORTIONALITY,
    ACTIVIST_PROPORTIONALITY,
    RESEARCHER_PROPORTIONALITY,
    DEVELOPER_PROPORTIONALITY,
    CONTRIBUTOR_PROPORTIONALITY
  );

  return communityRules;
};

module.exports = { communityRulesDeployed };
