const RctToken = artifacts.require("RctToken");
const IsaPool = artifacts.require("IsaPool");
const DeveloperPool = artifacts.require("DeveloperPool");
const ProducerPool = artifacts.require("ProducerPool");
const ResearcherPool = artifacts.require("ResearcherPool");

const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];
const isaPoolFunds = process.env["ISA_POOL_FUNDS"];
const producerPoolFunds = process.env["PRODUCER_POOL_FUNDS"];
const researcherPoolFunds = process.env["RESEARCHER_POOL_FUNDS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const rctToken = await RctToken.deployed();
    const isaPool = await IsaPool.deployed();
    const developerPool = await DeveloperPool.deployed();
    const producerPool = await ProducerPool.deployed();
    const researcherPool = await ResearcherPool.deployed();

    await rctToken.addContractPool(isaPool.address, isaPoolFunds);
    await rctToken.addContractPool(developerPool.address, developerPoolFunds);
    await rctToken.addContractPool(producerPool.address, producerPoolFunds);
    await rctToken.addContractPool(researcherPool.address, researcherPoolFunds);
  });
};
