const RcToken = artifacts.require("RcToken");
const DeveloperPool = artifacts.require("DeveloperPool");
const ProducerPool = artifacts.require("ProducerPool");
const ResearcherPool = artifacts.require("ResearcherPool");
const InspectorPool = artifacts.require("InspectorPool");

const developerPoolFunds = process.env["DEVELOPER_POOL_FUNDS"];
const producerPoolFunds = process.env["PRODUCER_POOL_FUNDS"];
const researcherPoolFunds = process.env["RESEARCHER_POOL_FUNDS"];
const inspectorPoolFunds = process.env["INSPECTOR_POOL_FUNDS"];

module.exports = function (deployer) {
  deployer.then(async () => {
    const rcToken = await RcToken.deployed();
    const developerPool = await DeveloperPool.deployed();
    const producerPool = await ProducerPool.deployed();
    const researcherPool = await ResearcherPool.deployed();
    const inspectorPool = await InspectorPool.deployed();

    await rcToken.addContractPool(developerPool.address, developerPoolFunds);
    await rcToken.addContractPool(producerPool.address, producerPoolFunds);
    await rcToken.addContractPool(researcherPool.address, researcherPoolFunds);
    await rcToken.addContractPool(inspectorPool.address, inspectorPoolFunds);
  });
};
