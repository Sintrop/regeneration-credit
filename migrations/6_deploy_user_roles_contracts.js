const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const ContributorContract = artifacts.require("ContributorContract");
const AdvisorContract = artifacts.require("AdvisorContract");
const InvestorContract = artifacts.require("InvestorContract");
const DeveloperPool = artifacts.require("DeveloperPool");


module.exports = function (deployer) {
  deployer.then(async () => {
    const userContract = await UserContract.deployed();
    const developerPool = await DeveloperPool.deployed();

    await deployer.deploy(ActivistContract, UserContract.address);
    await deployer.deploy(ProducerContract, UserContract.address);
    await deployer.deploy(ResearcherContract, UserContract.address);
    await deployer.deploy(DeveloperContract, userContract.address, developerPool.address);
    await deployer.deploy(ContributorContract, UserContract.address);
    await deployer.deploy(AdvisorContract, UserContract.address);
    await deployer.deploy(InvestorContract, UserContract.address);
  });
};
