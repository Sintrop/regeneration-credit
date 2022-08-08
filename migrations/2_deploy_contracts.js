const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");
const CategoryContract = artifacts.require("CategoryContract");
const DeveloperPool = artifacts.require("DeveloperPool");
const Sintrop = artifacts.require("Sintrop");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const UserContract = artifacts.require("UserContract");

module.exports = function (deployer) {
  const args = {
    totalTokens: "1500000000000000000000000000",
    tokensPerEra: "833333333333333333333333",
    blocksPerEra: 10,
    eraMax: 18,
  };

  deployer.then(async () => {
    await deployer.deploy(UserContract);
    const userContract = await UserContract.deployed();

    await deployer.deploy(ActivistContract, UserContract.address);
    await deployer.deploy(ProducerContract, UserContract.address);
    await deployer.deploy(ResearcherContract, UserContract.address);
    await deployer.deploy(DeveloperContract, UserContract.address);

    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const developerContract = await DeveloperContract.deployed();

    await deployer.deploy(Sintrop,
      activistContract.address,
      producerContract.address,
      1000
    );

    const sintrop = await Sintrop.deployed();

    await activistContract.newAllowedCaller(sintrop.address);
    await producerContract.newAllowedCaller(sintrop.address);

    await userContract.newAllowedCaller(activistContract.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(researcherContract.address);
    await userContract.newAllowedCaller(developerContract.address);

    const sacToken = await deployer.deploy(SacToken, args.totalTokens);
    
    await deployer.deploy(IsaPool, SacToken.address);
    const isaPool = await IsaPool.deployed();

    await deployer.deploy(CategoryContract, isaPool.address, researcherContract.address);
    const categoryContract = await CategoryContract.deployed();

    await isaPool.newAllowedCaller(categoryContract.address);

    await deployer.deploy(
      DeveloperPool,
      SacToken.address,
      args.tokensPerEra,
      args.blocksPerEra,
      args.eraMax
    );

    await sacToken.addContractPool(isaPool.address, 0)
  });
};
