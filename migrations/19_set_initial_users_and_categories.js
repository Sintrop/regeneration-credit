const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const InspectorContract = artifacts.require("InspectorContract");
const ValidatorContract = artifacts.require("ValidatorContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const InvitationContract = artifacts.require("InvitationContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    let accounts = await web3.eth.getAccounts();
    let [
      _,
      producer1,
      producer2,
      producer3,
      producer4,
      inspector1,
      inspector2,
      inspector3,
      inspector4,
      researcher1,
      validator1,
      validator2,
      validator3,
      validator4,
      developer1,
      developer2,
    ] = accounts;

    const userTypes = {
      Undefined: 0,
      Producer: 1,
      Inspector: 2,
      Researcher: 3,
      Developer: 4,
      Advisor: 5,
      Activist: 6,
      Supporter: 7,
      Validator: 8,
      Denied: 9,
    };

    const categoryContract = await CategoryContract.deployed();
    const inspectorContract = await InspectorContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const validatorContract = await ValidatorContract.deployed();
    const developerContract = await DeveloperContract.deployed();
    const invitationContract = await InvitationContract.deployed();

    await invitationContract.onlyOwnerInvite(researcher1, userTypes.Researcher);
    await invitationContract.onlyOwnerInvite(developer1, userTypes.Developer);
    await invitationContract.onlyOwnerInvite(developer2, userTypes.Developer);
    await invitationContract.onlyOwnerInvite(validator1, userTypes.Validator);
    await invitationContract.onlyOwnerInvite(validator2, userTypes.Validator);
    await invitationContract.onlyOwnerInvite(validator3, userTypes.Validator);
    await invitationContract.onlyOwnerInvite(validator4, userTypes.Validator);
    await invitationContract.onlyOwnerInvite(inspector1, userTypes.Inspector);
    await invitationContract.onlyOwnerInvite(inspector2, userTypes.Inspector);
    await invitationContract.onlyOwnerInvite(inspector3, userTypes.Inspector);
    await invitationContract.onlyOwnerInvite(inspector4, userTypes.Inspector);

    await producerContract.addProducer(10, "Sítio Refloresta", "photoURL", "123456789123456", { from: producer1 });

    await producerContract.addProducer(50, "Fazenda Restaura", "photoURL", "1111111111111", { from: producer2 });

    await producerContract.addProducer(50, "Fazenda Agro", "photoURL", "7736612731222", { from: producer3 });

    await producerContract.addProducer(50, "Fazenda Natal", "photoURL", "09463621322", { from: producer4 });

    await inspectorContract.addInspector("Julia Flores", "photoURL", "2222222222222222", { from: inspector1 });

    await inspectorContract.addInspector("Pedro Nascimento", "photoURL", "333333333333333", { from: inspector2 });

    await inspectorContract.addInspector("Roberta Floresta", "photoURL", "333333333333333", { from: inspector3 });

    await inspectorContract.addInspector("João Alberto", "photoURL", "333333333333333", { from: inspector4 });

    await researcherContract.addResearcher("Instituto de Pesquisa", "photoURL", {
      from: researcher1,
    });

    await validatorContract.addValidator({
      from: validator1,
    });

    await validatorContract.addValidator({
      from: validator2,
    });

    await validatorContract.addValidator({
      from: validator3,
    });

    await validatorContract.addValidator({
      from: validator4,
    });

    await developerContract.addDeveloper("Developer 1", "photoURL", { from: developer1 });
    await developerContract.addDeveloper("Developer 2", "photoURL", { from: developer2 });

    await categoryContract.addCategory(
      "Carbon footprint",
      `Indicator to evaluate the carbon balance`,
      `We must evaluate everything that the producer emit carbon, and all the carbon sequestration. Carbon balance = sequestration - emissions`,
      `More then -100 tCO2 / era`,
      `Until -100 tCO2 / era`,
      `Until -1 tCO2 / era`,
      `0`,
      `Until 1 tCO2 / era`,
      `Until 2 tCO2 / era`,
      `More then 2 tCO2 / era`
    );

    await categoryContract.addCategory(
      "Biodiversity indicator",
      `Indicator to evaluate the biodiversity level`,
      `Must evaluate everything related to the biodiversity level and count how many life units were found and estimated at the property. Biodiversity level = regeneration - degradation`,
      `More then 1000 lifeUnits`,
      `Until 1000 lifeUnits`,
      `Until 100 lifeUnits`,
      `0`,
      `Until -100 lifeUnits`,
      `Until -1000 lifeUnits`,
      `Less then -1000 lifeUnits`
    );

    await categoryContract.addCategory(
      "Water indicator",
      `Indicator to evaluate the water resources level`,
      `Must evaluate the property water level. Positive means water from vegetation and negative water brought from outside the property. Water balance = localWater - outsideWater`,
      `More then 100 m3`,
      `Until 100 m3`,
      `Until 10 m3`,
      `0`,
      `Until -10 m3`,
      `Until -100 m3`,
      `Less then -100 m3`
    );

    await categoryContract.addCategory(
      "Soil indicator",
      `Indicator to evaluate the soil regeneration level`,
      `Must evaluate the property soil regeneration balance. SoilBalance = Regeneration - Degeneration `,
      `More then 100 hectares of soil under regeneration`,
      `More then 5 hectare of soil under regeneration`,
      `More then 1 hectare of soil under regeneration`,
      `0`,
      `Until 1 hectare of soil degradation`,
      `Until 2 hectares of soil degradation`,
      `More than 2 hectares of soil degradation`
    );
  });
};
