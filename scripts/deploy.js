// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
var fs = require("fs");
const regenerationCreditDeploy = require("../migrations/1_regenerationCredit.deploy.js");
const communityRulesDeploy = require("../migrations/2_communityRules.deploy.js");
const developerPoolDeploy = require("../migrations/3_developerPool.deploy.js");
const developerRulesDeploy = require("../migrations/4_developerRules.deploy.js");
const inspectorPoolDeploy = require("../migrations/5_inspectorPool.deploy.js");
const inspectorRulesDeploy = require("../migrations/6_inspectorRules.deploy.js");
const regeneratorPoolDeploy = require("../migrations/7_regeneratorPool.deploy.js");
const regeneratorRulesDeploy = require("../migrations/8_regeneratorRules.deploy.js");
const researcherPoolDeploy = require("../migrations/9_researcherPool.deploy.js");
const researcherRulesDeploy = require("../migrations/10_researcherRules.deploy.js");
const validationRulesDeploy = require("../migrations/14_validationRules.deploy.js");
const activistPoolDeploy = require("../migrations/15_activistPool.deploy.js");
const activistRulesDeploy = require("../migrations/16_activistRules.deploy.js");
const supporterRulesDeploy = require("../migrations/18_supporterRules.deploy.js");
const invitationRulesDeploy = require("../migrations/19_invitationRules.deploy.js");
const regenerationIndexRulesDeploy = require("../migrations/20_regenerationIndexRules.deploy.js");
const inspectionRulesDeploy = require("../migrations/21_inspectionRules.deploy.js");
const contributorPoolDeploy = require("../migrations/11_contributorPool.deploy.js");
const contributorRulesDeploy = require("../migrations/12_contributorRules.deploy.js");
const afterDeploy = require("../migrations/after_deploy.js");
const regenerationCreditImpactDeploy = require("../migrations/22_regenerationCredImpact.deploy.js");
const voteRulesDeploy = require("../migrations/23_voteRules.deploy.js");

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const deployContracts = process.env.DEPLOY_CONTRACTS;
const runAfterDeploy = process.env.RUN_AFTER_DEPLOY;

async function startDeployAlert() {
  const etherscanVerificationEnabled = process.env["ETHERSCAN_VERIFICATION_ENABLED"];
  const etherscanVerifyEnabledText = etherscanVerificationEnabled == "true" ? "HABILITADA" : "DESABILITADA";
  const deployStartSeconds = process.env["DEPLOY_START_SECONDS"] || 1;

  console.log(`-------------------  REDE ${hre.network.name} (CTRL + C para cancelar) -------------------`);

  console.log(`VERIFICAÇÃO DOS CONTRATOS ESTÁ ${etherscanVerifyEnabledText}`);

  for (let i = deployStartSeconds; i > 0; i--) {
    await sleep(1000);
    console.log(`-------------------  DEPLOY INICIANDO EM ${i} SEGUNDOS -------------------`);
  }

  console.log("------------------- DEPLOY INICIADO -------------------");
}

function showDeployedAddress() {
  const filepath = `deployed_contracts/${hre.network.name}`;
  var files = fs.readdirSync(filepath);

  files.forEach((filename) => {
    const data = fs.readFileSync(`${filepath}/${filename}`, "utf8");
    object = JSON.parse(data);

    console.log();
    console.log(object["name"]);
    console.log(object["address"]);
    console.log();
  });
}

async function main() {
  if (deployContracts == "true") {
      await startDeployAlert();

      await regenerationCreditDeploy();
      await communityRulesDeploy();
      await developerPoolDeploy();
      await developerRulesDeploy();
      await inspectorPoolDeploy();
      await inspectorRulesDeploy();
      await regeneratorPoolDeploy();
      await regeneratorRulesDeploy();
      await researcherPoolDeploy();
      await researcherRulesDeploy();
      await contributorPoolDeploy();
      await contributorRulesDeploy();
      await activistPoolDeploy();
      await activistRulesDeploy();
      await supporterRulesDeploy();
      await regenerationIndexRulesDeploy();
      await inspectionRulesDeploy();
      await regenerationCreditImpactDeploy();
      await validationRulesDeploy();
      await voteRulesDeploy();
      await invitationRulesDeploy();
  }

  if (runAfterDeploy == "true") {
    await afterDeploy();
  }


  // showDeployedAddress();
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
