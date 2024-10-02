const { run } = require("hardhat");

const verifyContract = async function verify(contract, contractName, args) {
  const etherscanVerificationEnabled = process.env["ETHERSCAN_VERIFICATION_ENABLED"];

  if (etherscanVerificationEnabled == "false" || hre.network.name == "localhost") return;

  console.log("====================================================================");
  console.log("verifying contract !!!!!!!");

  const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

  const timeSeconds = 60;
  console.log(`Esperando ${timeSeconds} segundos para verificar ${contract.target}`);
  await sleep(1000 * timeSeconds);

  try {
    await run("verify:verify", {
      address: contract.target,
      contract: `contracts/${contractName}.sol:${contractName}`,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("already verified");
    } else {
      console.log(e);
    }
  }
};

module.exports = verifyContract;
