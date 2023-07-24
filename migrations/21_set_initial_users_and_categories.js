const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
const ValidatorContract = artifacts.require("ValidatorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    let accounts = await web3.eth.getAccounts();
    let [
      _,
      producer1,
      producer2,
      activist1,
      activist2,
      activist3,
      activist4,
      researcher1,
      validator1,
      validator2,
      validator3,
      validator4,
    ] = accounts;

    const categoryContract = await CategoryContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const validatorContract = await ValidatorContract.deployed();

    await researcherContract.newAllowedUser(researcher1);
    await validatorContract.newAllowedUser(validator1);
    await validatorContract.newAllowedUser(validator2);
    await validatorContract.newAllowedUser(validator3);
    await validatorContract.newAllowedUser(validator4);

    await producerContract.addProducer(10, "Sítio Refloresta", "photoURL", "123456789123456", { from: producer1 });

    await producerContract.addProducer(50, "Fazenda Restaura", "photoURL", "1111111111111", { from: producer2 });

    await activistContract.addActivist("Julia Flores", "photoURL", "2222222222222222", { from: activist1 });

    await activistContract.addActivist("Pedro Nascimento", "photoURL", "333333333333333", { from: activist2 });

    await activistContract.addActivist("Roberta Floresta", "photoURL", "333333333333333", { from: activist3 });

    await activistContract.addActivist("João Alberto", "photoURL", "333333333333333", { from: activist4 });

    await researcherContract.addResearcher("CEPEAS", "photoURL", {
      from: researcher1,
    });

    await validatorContract.addValidator("Validator 1", "photoURL", {
      from: validator1,
    });

    await validatorContract.addValidator("Validator 2", "photoURL", {
      from: validator2,
    });

    await validatorContract.addValidator("Validator 3", "photoURL", {
      from: validator3,
    });

    await validatorContract.addValidator("Validator 4", "photoURL", {
      from: validator4,
    });

    await categoryContract.addCategory(
      "Carbon footprint",
      `Indicator to evaluate the carbon balance`,
      `We must evaluate everything that the producer emit carbon, and all the carbon sequestration`,
      `More then -100 tCO2 / era`,
      `Until -100 tCO2 / era`,
      `Until -1 tCO2 / era`,
      `0`,
      `Until 1 tCO2 / era`,
      `Until 2 tCO2 / era`,
      `More then 2 tCO2 / era`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Biodiversity indicator",
      `Indicator to evaluate the biodiversity level`,
      `Must evaluate everything related to the biodiversity level and count how many life units were found and estimated at the property`,
      `More then 1000 lifeUnits`,
      `Until 1000 lifeUnits`,
      `Until 100 lifeUnits`,
      `0`,
      `Until -100 lifeUnits`,
      `Until -1000 lifeUnits`,
      `Less then -1000 lifeUnits`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Water indicator",
      `Indicator to evaluate the water resources level`,
      `Must evaluate the property water level. Positive means water from vegetation and negative water brought from outside the property. `,
      `More then 100 m3`,
      `Until 100 m3`,
      `Until 10 m3`,
      `0`,
      `Until -10 m3`,
      `Until -100 m3`,
      `Less then -100 m3`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Soil indicator",
      `Indicator to evaluate the soil regeneration level`,
      `Must evaluate the property soil regeneration level. `,
      `More then 70% of soil biomass cover`,
      `More then 50% of soil biomass cover`,
      `More then 30% of soil biomass cover`,
      `0`,
      `Less then 30% of soil biomass cover`,
      `Less then 20% of soil biomass cover`,
      `Less then 10% of soil biomass cover`,
      { from: researcher1 }
    );
  });
};
