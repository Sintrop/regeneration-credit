require("dotenv").config({path: __dirname + "/.env"});

const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");
const CategoryContract = artifacts.require("CategoryContract");
const DeveloperPool = artifacts.require("DeveloperPool");
const Sintrop = artifacts.require("Sintrop");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const ContributorContract = artifacts.require("ContributorContract");
const AdvisorContract = artifacts.require("AdvisorContract");
const InvestorContract = artifacts.require("InvestorContract");
const UserContract = artifacts.require("UserContract");

const sacTokensTotalTokens = process.env["SAC_TOKENS_TOTAL_TOKENS"];
const developerPoolEraMax = process.env["DEVELOPER_POOL_ERA_MAX"];
const developerPoolBlocksPerEra = process.env["DEVELOPER_POOL_BLOCKS_PER_ERA"];
const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];
const isaPoolFunds = process.env["ISA_POOL_FUNDS"];
const sintropTimeBetweenProducerInsertions =
  process.env["SINTROP_TIME_BETWEEN_PRODUCER_INSPECTIONS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(UserContract);
    const userContract = await UserContract.deployed();

    const sacToken = await deployer.deploy(SacToken, sacTokensTotalTokens);

    await deployer.deploy(
      DeveloperPool,
      SacToken.address,
      developerPoolBlocksPerEra,
      developerPoolEraMax
    );

    await deployer.deploy(ActivistContract, UserContract.address);
    await deployer.deploy(ProducerContract, UserContract.address);
    await deployer.deploy(ResearcherContract, UserContract.address);
    await deployer.deploy(DeveloperContract, UserContract.address, DeveloperPool.address);
    await deployer.deploy(ContributorContract, UserContract.address);
    await deployer.deploy(AdvisorContract, UserContract.address);
    await deployer.deploy(InvestorContract, UserContract.address);

    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const developerContract = await DeveloperContract.deployed();
    const contributorContract = await ContributorContract.deployed();
    const advisorContract = await AdvisorContract.deployed();
    const investorContract = await InvestorContract.deployed();

    await deployer.deploy(
      Sintrop,
      activistContract.address,
      producerContract.address,
      sintropTimeBetweenProducerInsertions
    );

    const sintrop = await Sintrop.deployed();
    const developerPool = await DeveloperPool.deployed();

    await developerPool.newAllowedCaller(developerContract.address);

    await activistContract.newAllowedCaller(sintrop.address);
    await producerContract.newAllowedCaller(sintrop.address);

    await userContract.newAllowedCaller(activistContract.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(researcherContract.address);
    await userContract.newAllowedCaller(developerContract.address);
    await userContract.newAllowedCaller(contributorContract.address);
    await userContract.newAllowedCaller(advisorContract.address);
    await userContract.newAllowedCaller(investorContract.address);

    await deployer.deploy(IsaPool, SacToken.address);
    const isaPool = await IsaPool.deployed();

    await deployer.deploy(CategoryContract, isaPool.address, researcherContract.address);
    const categoryContract = await CategoryContract.deployed();

    await isaPool.newAllowedCaller(categoryContract.address);

    await sacToken.addContractPool(isaPool.address, isaPoolFunds);
    await sacToken.addContractPool(developerPool.address, developerPoolFunds);
  });
};
