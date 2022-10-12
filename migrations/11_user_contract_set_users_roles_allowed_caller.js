const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const ContributorContract = artifacts.require("ContributorContract");
const AdvisorContract = artifacts.require("AdvisorContract");
const InvestorContract = artifacts.require("InvestorContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const producerContract = await ProducerContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const developerContract = await DeveloperContract.deployed();
    const contributorContract = await ContributorContract.deployed();
    const advisorContract = await AdvisorContract.deployed();
    const investorContract = await InvestorContract.deployed();
    const userContract = await UserContract.deployed();

    await userContract.newAllowedCaller(activistContract.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(researcherContract.address);
    await userContract.newAllowedCaller(developerContract.address);
    await userContract.newAllowedCaller(contributorContract.address);
    await userContract.newAllowedCaller(advisorContract.address);
    await userContract.newAllowedCaller(investorContract.address);
  });
};
