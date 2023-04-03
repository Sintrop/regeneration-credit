const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    let accounts = await web3.eth.getAccounts();
    let [_, producer1, producer2, activist1, activist2, researcher1] = accounts;

    const categoryContract = await CategoryContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();

    await researcherContract.newAllowedUser(researcher1);

    await producerContract.addProducer(
      10,
      "Beans Farm",
      "photoURL",
      "123456789123456",
      { from: producer1 }
    );

    await producerContract.addProducer(
      50,
      "Soy Plantation",
      "photoURL",
      "1111111111111",
      { from: producer2 }
    );

    await activistContract.addActivist(
      "John Johnson",
      "photoURL",
      "2222222222222222",
      { from: activist1 }
    );

    await activistContract.addActivist(
      "Peter Parker",
      "photoURL",
      "333333333333333",
      { from: activist2 }
    );

    await researcherContract.addResearcher("Researcher Tom", "photoURL", {
      from: researcher1,
    });

    await categoryContract.addCategory(
      "Carbon footprint",
      `Indicator to evaluate the carbon balance`,
      `We must evaluate everything that the producer emit carbon, and all the carbon sequestration`,
      `More then -1tCO2e / ha / month`,
      `Until -1 tCO2e / ha / month`,
      `0`,
      `Until 1 tCO2e / ha / month`,
      `More then 1 tCO2e / ha / month`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Biodiversity indicator",
      `Indicator to evaluate the biodiversity level`,
      `Must evaluate everything related to the biodiversity level and count how many life units were found at the property`,
      `More then 100 lifeUnits / ha`,
      `Until 100 lifeUnits / ha`,
      `0`,
      `Until -100 lifeUnits / ha`,
      `Less then -100 lifeUnits / ha`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Water indicator",
      `Indicator to evaluate the water resources level`,
      `Must evaluate the property water level. Positive means water from vegetation and negative water brought from outside the property. `,
      `More then 10 m3 / ha`,
      `Until 10 m3 / ha`,
      `0`,
      `Until -10 m3 / ha`,
      `Less then -10 m3 / ha`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Soil indicator",
      `Indicator to evaluate the soil regeneration level`,
      `Must evaluate the property soil regeneration level. `,
      `More then 50% of soil biomass cover`,
      `More then 30% of soil biomass cover`,
      `0`,
      `Less then 30% of soil biomass cover`,
      `Less then 20% of soil biomass cover`,
      { from: researcher1 }
    );
  });
};
