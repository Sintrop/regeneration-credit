const saveContractAddress = require("../scripts/shared/saveContractAddress");
const getDeployedContract = require("../scripts/shared/getDeployedContract");
const verifyContract = require("../scripts/shared/verifyContract");

async function regenerationCreditImpactDeploy() {
  const regenerationCredit = await getDeployedContract("RegenerationCredit");
  const inspectionRules = await getDeployedContract("InspectionRules");
  const communityRules = await getDeployedContract("CommunityRules");
  const regeneratorRules = await getDeployedContract("RegeneratorRules");

  const args = [regenerationCredit.target, inspectionRules.target, communityRules.target, regeneratorRules.target];

  const RegenerationCreditImpact = await ethers.getContractFactory("RegenerationCreditImpact");
  const regenerationCreditImpact = await RegenerationCreditImpact.deploy(...args);

  saveContractAddress("RegenerationCreditImpact", regenerationCreditImpact.target);

  console.log(`RegenerationCreditImpact address ${regenerationCreditImpact.target}`);

  await verifyContract(regenerationCreditImpact, "RegenerationCreditImpact", args);

  return regenerationCreditImpact;
}

module.exports = regenerationCreditImpactDeploy;
