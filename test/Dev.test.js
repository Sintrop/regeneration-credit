const DeveloperContract = artifacts.require("DeveloperContract");
const DeveloperPool = artifacts.require("DeveloperPool");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("DeveloperContract", (accounts) => {
  let instance;
  let userContract;
  let developerPool;
  let [owner, dev1Address, dev2Address] = accounts;

  let args = {
    tokensPerEra: 5000,
    blocksPerEra: 20,
    eraMax: 5,
  };

  const addDeveloper = async (name, from) => {
    await instance.addDeveloper(
      name,
      "111.111.111-00",
      "CPF",
      "Brazil",
      "SP",
      "Jundiai",
      "135465-005",
      {from: from}
    );
  };

  advanceBlock = async (blocksNumber) => {
    for (let i = 0; i < blocksNumber; i++) {
      let promise = new Promise((resolve, reject) => {
        web3.currentProvider.send(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime(),
          },
          (err, result) => {
            if (err) {
              return reject(err);
            }
            const newBlockHash = web3.eth.getBlock("latest").hash;
  
            return resolve(newBlockHash);
          }
        );
      });
    }
  };

  beforeEach(async () => {
    const sacToken = await SacToken.new("1500000000000000000000000000");
    developerPool = await DeveloperPool.new(
      sacToken.address,
      args.blocksPerEra,
      args.eraMax
    );

    userContract = await UserContract.new();

    instance = await DeveloperContract.new(userContract.address, developerPool.address);

    await userContract.newAllowedCaller(instance.address);
    await developerPool.newAllowedCaller(instance.address);
    await instance.newAllowedUser(dev1Address);
    await instance.newAllowedUser(dev2Address);
    await instance.newAllowedUser(owner);
    sacToken.addContractPool(developerPool.address, "15000000000000000000000000");
  });

  context("when access developer fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      await addDeveloper("Developer B", dev2Address);
      const developer = await instance.getDeveloper(dev1Address);
      const developer2 = await instance.getDeveloper(dev2Address);
      
      // await advanceBlock(args.blocksPerEra + 50);
      await addDeveloper("Developer C", owner);
      const developer3 = await instance.getDeveloper(owner);

      console.log("================================================");

      // const developerPoolBalance = await developerPool.balance();
      // console.log(`Total de tokens developer pool: ${developerPoolBalance.toString()}`);

      // console.log("------");
      // let developerBalance = await developerPool.balanceOf(dev1Address);
      // console.log(`developer balance: ${developerBalance.toString()}`);

      // console.log("------");
      // let developerallowance = await developerPool.allowance({from: dev1Address});
      // console.log(`developer allowance: ${developerallowance.toString()}`);

      console.log("------");
      let currentContractEra = await developerPool.currentContractEra();
      console.log(`Current contract era: ${currentContractEra.toString()}`);
      
      console.log("------");
      console.log(`Current Dev level: ${developer.level.level}`);
      console.log(`Current Dev era: ${developer.level.currentEra}`);

      console.log("------");
      console.log(`Current Dev2 level: ${developer2.level.level}`);
      console.log(`Current Dev2 era: ${developer2.level.currentEra}`);

      console.log("------");
      console.log(`Current Dev3 level: ${developer3.level.level}`);
      console.log(`Current Dev3 era: ${developer3.level.currentEra}`);
      
      // await instance.approve({from: dev1Address});
      // await instance.approve({from: dev1Address});
      // await instance.approve({from: dev1Address});
      // await instance.approve({from: dev1Address});
      // await instance.approve({from: dev1Address});
      // await instance.approve({from: dev1Address});
      
      console.log("------");
      totalLevelsByEra = await instance.totalLevelsByEra(1);
      console.log(`developerPool total levels: ${totalLevelsByEra.toString()}`);

      // console.log("------");
      // eraMax = await instance.eraMax();
      // console.log(`developerPool total levels: ${eraMax.toString()}`);

      console.log("------");
      nextApproveIn = await developerPool.nextApproveIn(1);
      console.log(`developer nextApproveIn: ${nextApproveIn.toString()}`);
      
      console.log("------");
      canApprove = await developerPool.canApprove(1);
      console.log(`developer canApprove: ${canApprove.toString()}`);

      console.log("------");
      canApproveTimes = await developerPool.canApproveTimes(1);
      console.log(`developer canApproveTimes: ${canApproveTimes.toString()}`);

      console.log("------");
      developerallowance = await developerPool.allowance({from: dev1Address});
      console.log(`developer allowance: ${developerallowance.toString()}`);

      console.log("------");
      developerBalance = await developerPool.balanceOf(dev1Address);
      console.log(`developer balance: ${developerBalance.toString()}`);


      console.log("ERAS");
      era1 = await developerPool.eras(1);
      era2 = await developerPool.eras(2);
      era3 = await developerPool.eras(3);
      console.log(JSON.stringify(era1));
      console.log(JSON.stringify(era2));
      console.log(JSON.stringify(era3));


      console.log("After approve");
      const developerr = await instance.getDeveloper(dev1Address);

      console.log("------");
      console.log(`Current Dev level: ${developerr.level.level}`);
      console.log(`Current Dev era: ${developerr.level.currentEra}`);

    });
  });
});
