const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");
const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
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

        await deployer.deploy(SacToken, args.totalTokens);
        const sacToken = await SacToken.deployed();

        const activistContract = await ActivistContract.deployed();
        const producerContract = await ProducerContract.deployed();
        const researcherContract = await ResearcherContract.deployed();
   
        await deployer.deploy(IsaPool, SacToken.address);
        const isaPool = await IsaPool.deployed();

        await deployer.deploy(CategoryContract, isaPool.address, researcherContract.address);
        const categoryContract = await CategoryContract.deployed();
    
        await userContract.newAllowedCaller(activistContract.address);
        await userContract.newAllowedCaller(producerContract.address);

    let accounts = await web3.eth.getAccounts()
    let [producer1, producer2, activist1, activist2, researcher1] = accounts;

    await producerContract.addProducer(
    "Beans Farm",
    "123456789123456",
    "CNPJ",
    "Brazil",
    "São Paulo",
    "São Carlos", 
    "123456789123456",
    {from: producer1});

    await producerContract.addProducer(
    "Soy Plantation",
    "11111111111111",
    "CNPJ",
    "Brazil",
    "São Paulo",
    "Piracicaba", 
    "1111111111111",
    {from: producer2});

    await activistContract.addActivist(
    "John Johnson",
    "22222222222222",
    "CPF",
    "Brazil",
    "SP",
    "Ribeirão Preto",
    "2222222222222222",
    {from:activist1});

    await activistContract.addActivist(
    "Peter Parker",
    "3333333333333",
    "CPF",
    "Brazil",
    "SP",
    "Marília",
    "333333333333333",
    {from:activist2});
  
  await researcherContract.newAllowedUser(researcher1);

  await researcherContract.addResearcher(
    "Researcher Tom",
    "444444444444444",
    "CPF",
    "Brazil",
    "SP",
    "Bauru",
    "44444444444444",
    {from: researcher1});

    await categoryContract.addCategory(
    "Pesticides use",
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
  