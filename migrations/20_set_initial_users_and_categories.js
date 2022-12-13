const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    let accounts = await web3.eth.getAccounts();
    let [producer1, producer2, activist1, activist2, researcher1] = accounts;

    const categoryContract = await CategoryContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();

    await researcherContract.newAllowedUser(researcher1);

    await producerContract.addProducer(
      "Beans Farm",
      "photoURL",
      "123456789123456",
      "CNPJ",
      "Brazil",
      "São Paulo",
      "São Carlos",
      "Rua XV",
      "Informação adicional",
      "123456789123456",
      {from: producer1}
    );

    await producerContract.addProducer(
      "Soy Plantation",
      "photoURL",
      "11111111111111",
      "CNPJ",
      "Brazil",
      "São Paulo",
      "Piracicaba",
      "Rua XV",
      "Como chegar",
      "1111111111111",
      {from: producer2}
    );

    await activistContract.addActivist(
      "John Johnson",
      "22222222222222",
      "photoURL",
      "CPF",
      "Brazil",
      "SP",
      "Ribeirão Preto",
      "2222222222222222",
      {from: activist1}
    );

    await activistContract.addActivist(
      "Peter Parker",
      "photoURL",
      "3333333333333",
      "CPF",
      "Brazil",
      "SP",
      "Marília",
      "333333333333333",
      {from: activist2}
    );

    await researcherContract.addResearcher(
      "Researcher Tom",
      "photoURL",
      "444444444444444",
      "CPF",
      "Brazil",
      "SP",
      "Bauru",
      "44444444444444",
      {from: researcher1}
    );

    await categoryContract.addCategory(
      "Pesticides use",
      `the description of category1`,
      `how activists should evaluate category1`,
      `category1 totallySustainable`,
      `category1 partiallySustainable`,
      `category1 neutro`,
      `category1 partiallyNotSustainable`,
      `category1 totallyNotSustainable`,
      {from: researcher1}
    );
  });
};
