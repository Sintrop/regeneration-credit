const { run } = require("hardhat");

const verifyContract = async function verify(contractAdress, args) {
  if (hre.network.name == "localhost") return;

  console.log("verifying contract !!!!!!!");

  const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log(`Esperando 10 segundos para verificar ${contractAdress}`);
  await sleep(1000 * 10);

  try {
    await run("verify:verify", {
      address: contractAdress,
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
