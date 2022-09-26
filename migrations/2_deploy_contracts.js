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

module.exports = function (deployer) {
  const args = {
    totalTokens: "1500000000000000000000000000",
    tokensPerEra: "833333333333333333333333",
    blocksPerEra: 10,
    eraMax: 18,
  };

  deployer.then(async () => {
    await deployer.deploy(UserContract);
    const userContract = await UserContract.deployed();

    const sacToken = await deployer.deploy(SacToken, args.totalTokens);

    await deployer.deploy(
      DeveloperPool,
      SacToken.address,
      args.blocksPerEra,
      args.eraMax
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

    await deployer.deploy(Sintrop,
      activistContract.address,
      producerContract.address,
      1000
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

    await sacToken.addContractPool(isaPool.address, 0)
    await sacToken.addContractPool(developerPool.address, "15000000000000000000000000");

    let accounts = await web3.eth.getAccounts()
    let [owner, producer1, producer2, activist1, activist2, researcher1] = accounts;

    await producerContract.addProducer(
    "producer1",
    "00000000000000",
    "CNPJ",
    "Brazil",
    "São Paulo",
    "São Carlos", 
    "0000000000000",
    {from: producer1});

    await producerContract.addProducer(
    "producer2",
    "11111111111111",
    "CNPJ",
    "Brazil",
    "São Paulo",
    "São Carlos", 
    "1111111111111",
    {from: producer2});

    await activistContract.addActivist(
    "activist2",
    "22222222222222",
    "CPF",
    "Brazil",
    "SP",
    "São Carlos",
    "2222222222222222",
    {from:activist1});

    await activistContract.addActivist(
    "activist2",
    "3333333333333",
    "CPF",
    "Brazil",
    "SP",
    "São Carlos",
    "333333333333333",
    {from:activist2});
  
  await researcherContract.newAllowedUser(researcher1);

  await researcherContract.addResearcher(
    "researcher1",
    "444444444444444",
    "CPF",
    "Brazil",
    "SP",
    "São Carlos",
    "44444444444444",
    {from: researcher1});

    await categoryContract.addCategory(
    "category1",
    `the description of category1`,
    `how activists should evaluate category1`,
    `category1 totallySustainable`,
    `category1 partiallySustainable`,
    `category1 neutro`,
    `category1 partiallyNotSustainable`,
    `category1 totallyNotSustainable`,
    {from: researcher1});
  });
};
