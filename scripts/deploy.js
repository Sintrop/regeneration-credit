// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
var fs = require("fs");
const rcTokenDeploy = require("../migrations/1_rcToken.deploy.js");
const userContractDeploy = require("../migrations/2_userContract.deploy.js");
const developerPoolDeploy = require("../migrations/3_developerPool.deploy.js");
const developerContractDeploy = require("../migrations/4_developerContract.deploy.js");
const inspectorPoolDeploy = require("../migrations/5_inspectorPool.deploy.js");
const inspectorContractDeploy = require("../migrations/6_inspectorContract.deploy.js");
const producerPoolDeploy = require("../migrations/7_producerPool.deploy.js");
const producerContractDeploy = require("../migrations/8_producerContract.deploy.js");
const researcherPoolDeploy = require("../migrations/9_researcherPool.deploy.js");
const researcherContractDeploy = require("../migrations/10_researcherContract.deploy.js");

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function startDeployAlert() {
  const deployStartSeconds = process.env["DEPLOY_START_SECONDS"] || 1;

  console.log(`-------------------  REDE ${hre.network.name} (CTRL + C para cancelar) -------------------`);

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
  await startDeployAlert();

  await rcTokenDeploy();
  await userContractDeploy();
  await developerPoolDeploy();
  await developerContractDeploy();
  await inspectorPoolDeploy();
  await inspectorContractDeploy();
  await producerPoolDeploy();
  await producerContractDeploy();
  await researcherPoolDeploy();
  await researcherContractDeploy();

  showDeployedAddress();
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
