const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regenerationCreditMarketDeploy() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");
  const communityRules = await getDeployedContract("CommunityRules");

  const RegenerationCreditMarket = await ethers.getContractFactory("RegenerationCreditMarket");

  const args = [regenerationCredit.target, communityRules.target];

  const regenerationCreditMarket = await RegenerationCreditMarket.deploy(...args);

  saveContractAddress("RegenerationCreditMarket", regenerationCreditMarket.target);

  console.log(`RegenerationCreditMarket address ${regenerationCreditMarket.target}`);

  await verifyContract(regenerationCreditMarket, "RegenerationCreditMarket", args);

  return regenerationCreditMarket;
}

module.exports = regenerationCreditMarketDeploy;
