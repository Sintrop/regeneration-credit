const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const InspectorContract = artifacts.require("InspectorContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const ActivistContract = artifacts.require("ActivistContract");
const AdvisorContract = artifacts.require("AdvisorContract");
const SupporterContract = artifacts.require("SupporterContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const producerContract = await ProducerContract.deployed();
    const inspectorContract = await InspectorContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const developerContract = await DeveloperContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const advisorContract = await AdvisorContract.deployed();
    const supporterContract = await SupporterContract.deployed();
    const userContract = await UserContract.deployed();

    await userContract.newAllowedCaller(inspectorContract.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(researcherContract.address);
    await userContract.newAllowedCaller(developerContract.address);
    await userContract.newAllowedCaller(activistContract.address);
    await userContract.newAllowedCaller(advisorContract.address);
    await userContract.newAllowedCaller(supporterContract.address);
  });
};
