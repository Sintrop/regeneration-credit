const SacToken = artifacts.require("SacToken");
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
    const sacToken = await SacToken.deployed();
    const isaPool = await IsaPool.deployed();
    const developerPool = await DeveloperPool.deployed();
    const producerPool = await ProducerPool.deployed();
    const researcherPool = await ResearcherPool.deployed();

    await sacToken.addContractPool(isaPool.address, isaPoolFunds);
    await sacToken.addContractPool(developerPool.address, developerPoolFunds);
    await sacToken.addContractPool(producerPool.address, producerPoolFunds);
    await sacToken.addContractPool(researcherPool.address, researcherPoolFunds);
  });
};
