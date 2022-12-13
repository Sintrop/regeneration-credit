const DeveloperContract = artifacts.require("DeveloperContract");
const DeveloperPool = artifacts.require("DeveloperPool");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("DeveloperContract", (accounts) => {
  let instance;
  let userContract;
  let developerPool;
  let [owner, dev1Address, dev2Address, dev3Address] = accounts;

  let developerPoolParams = {
    blocksPerEra: 20,
    eraMax: 5,
  };

  const addDeveloper = async (name, from) => {
    await instance.addDeveloper(
      name,
      "photoURL",
      "111.111.111-00",
      "CPF",
      "Brazil",
      "SP",
      "Jundiai",
      "135465-005",
      { from: from }
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
      developerPoolParams.blocksPerEra,
      developerPoolParams.eraMax
    );

    userContract = await UserContract.new();

    instance = await DeveloperContract.new(userContract.address, developerPool.address);

    await userContract.newAllowedCaller(instance.address);
    await developerPool.newAllowedCaller(instance.address);
    await instance.newAllowedUser(dev1Address);
    await instance.newAllowedUser(dev2Address);
    await instance.newAllowedUser(owner);
    await sacToken.addContractPool(developerPool.address, "15000000000000000000000000");
  });

  context("when access developer fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developer = await instance.getDeveloper(dev1Address);

      assert.equal(developer.id, "1");
      assert.equal(developer.developerWallet, dev1Address);
      assert.equal(developer.userType, 4);
      assert.equal(developer.name, "Developer A");
      assert.equal(developer.proofPhoto, "photoURL");
      assert.equal(developer.document, "111.111.111-00");
      assert.equal(developer.documentType, "CPF");

      assert.equal(developer.level.level, 1);
      assert.equal(developer.level.currentEra, 1);

      assert.equal(developer.userAddress.country, "Brazil");
      assert.equal(developer.userAddress.state, "SP");
      assert.equal(developer.userAddress.city, "Jundiai");
      assert.equal(developer.userAddress.cep, "135465-005");
    });
  });

  context("when will add developer", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addDeveloper("Developer C", dev3Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
      context("when developer exists", () => {
        it("should return error message", async () => {
          await addDeveloper("Developer A", dev1Address);

          await expectRevert(
            addDeveloper("Developer A", dev1Address),
            "This developer already exist"
          );
        });
      });

      context("when developer does not exist", () => {
        it("should add developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.developerWallet, dev1Address);
        });

        it("should increment levels of the eras that the developer pool is ahead", async () => {
          await addDeveloper("Developer A", dev1Address);

          let era1 = await developerPool.getEra(1);
          let era2 = await developerPool.getEra(2);
          let era3 = await developerPool.getEra(3);
          let era4 = await developerPool.getEra(4);
          let era5 = await developerPool.getEra(5);
          let era6 = await developerPool.getEra(6);

          const LEVELS = 1;

          assert.equal(era1.levels, LEVELS);
          assert.equal(era2.levels, LEVELS);
          assert.equal(era3.levels, LEVELS);
          assert.equal(era4.levels, LEVELS);
          assert.equal(era5.levels, LEVELS);
          assert.equal(era6.levels, LEVELS);
        });

        it("should increment developersCount after create developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developersCount = await instance.developersCount();

          assert.equal(developersCount, 1);
        });

        it("should add created developer in developerList (array)", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developers = await instance.getDevelopers();

          assert.equal(developers[0].developerWallet, dev1Address);
        });

        it("should add created developer in userType contract as a DEVELOPER", async () => {
          await addDeveloper("Developer A", dev1Address);

          const userType = await userContract.getUser(dev1Address);
          const DEVELOPER = 4;

          assert.equal(userType, DEVELOPER);
        });

        it("should add created developer with initial level equal 1", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.level.level, 1);
        });

        it("should add created developer with initial currentEra equal currentContractEra", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.level.currentEra, 1);
        });
      });
    });
  });

  context("when will get developers", () => {
    beforeEach(async () => {
      await instance.newAllowedUser(dev2Address);
    });

    it("should return developers when has developers", async () => {
      await addDeveloper("Developer A", dev1Address);
      await addDeveloper("Developer B", dev2Address);

      const developers = await instance.getDevelopers();

      assert.equal(developers.length, 2);
    });

    it("should return developers equal zero when dont has it", async () => {
      const developers = await instance.getDevelopers();

      assert.equal(developers.length, 0);
    });
  });

  context("when will get developer", () => {
    it("should return a developer", async () => {
      await addDeveloper("Developer A", dev1Address);

      const developer = await instance.getDeveloper(dev1Address);

      assert.equal(developer.developerWallet, dev1Address);
    });
  });

  context("when will check if developer exists", () => {
    it("should return true when exists", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developerExists = await instance.developerExists(dev1Address);

      assert.equal(developerExists, true);
    });

    it("it should return false when don't exists", async () => {
      const developerExists = await instance.developerExists(dev1Address);

      assert.equal(developerExists, false);
    });
  });

  context("when developer approve tokens", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
    });

    context("when is unique developer in era", () => {
      context("when Developer is in era 1 and contract is in era 2", () => {
        beforeEach(async () => {
          await advanceBlock(developerPoolParams.blocksPerEra + 2);
          await instance.approve({ from: dev1Address });
        });

        it("should add developer to era 2", async () => {
          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.level.currentEra, 2);
        });

        it("should can allowance all tokens from era", async () => {
          let allowance = await developerPool.allowance({ from: dev1Address });

          let tokensPerEra = 833333000000000000000000;

          assert.equal(allowance, tokensPerEra);
        });
      });
    });

    context("when has two devs in the era", () => {
      beforeEach(async () => {
        await addDeveloper("Developer B", dev2Address);
      });

      context("with same levels", () => {
        context("when Developers is in era 1 and contract is in era 2", () => {
          beforeEach(async () => {
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
            await instance.approve({ from: dev1Address });
            await instance.approve({ from: dev2Address });
          });

          it("should add developer1 to era 2", async () => {
            const developer = await instance.getDeveloper(dev1Address);

            assert.equal(developer.level.currentEra, 2);
          });

          it("should add developer2 to era 2", async () => {
            const developer = await instance.getDeveloper(dev1Address);

            assert.equal(developer.level.currentEra, 2);
          });

          it("should can allowance 1/2 of tokens from era", async () => {
            let allowance = await developerPool.allowance({ from: dev1Address });

            let tokensPerEra = 416666500000000000000000;

            assert.equal(allowance, tokensPerEra);
          });

          it("should can allowance 1/2 of tokens from era", async () => {
            let allowance = await developerPool.allowance({ from: dev2Address });

            let tokensPerEra = 416666500000000000000000;

            assert.equal(allowance, tokensPerEra);
          });
        });
      });

      context("with different levels", () => {
        beforeEach(async () => {
          await instance.addLevel(dev1Address, { from: owner });
        });

        context("when Developers is in era 1 and contract is in era 2", () => {
          beforeEach(async () => {
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
            await instance.approve({ from: dev1Address });
            await instance.approve({ from: dev2Address });
          });

          it("should add developer1 to era 2", async () => {
            const developer = await instance.getDeveloper(dev1Address);

            assert.equal(developer.level.currentEra, 2);
          });

          it("should add developer2 to era 2", async () => {
            const developer = await instance.getDeveloper(dev1Address);

            assert.equal(developer.level.currentEra, 2);
          });

          it("should developer1 can allowance more tokens from era", async () => {
            let allowance = await developerPool.allowance({ from: dev1Address });

            let tokensPerEra = 555555333333333333333332;

            assert.equal(allowance, tokensPerEra);
          });

          it("should developer2 can allowance less tokens from era", async () => {
            let allowance = await developerPool.allowance({ from: dev2Address });

            let tokensPerEra = 277777666666666666666666;

            assert.equal(allowance, tokensPerEra);
          });
        });
      });
    });
  });

  context("when developer can't approve tokens", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
    });

    it("should return error message", async () => {
      await expectRevert(
        instance.approve({ from: dev1Address }),
        "You can't approve yet"
      );
    });
  });

  context("when non developer try approve tokens", () => {
    it("should return error message", async () => {
      await expectRevert(
        instance.approve({ from: dev1Address }),
        "Pool only to developer"
      );
    });
  });

  context("when developer can approve tokens", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
    });

    context("when can approve only to one era and try approve again", () => {
      beforeEach(async () => {
        await advanceBlock(developerPoolParams.blocksPerEra + 2);
        await instance.approve({ from: dev1Address });
      });

      it("should return error message", async () => {
        await expectRevert(
          instance.approve({ from: dev1Address }),
          "You can't approve yet"
        );
      });
    });

    context("when can approve to two eras and try approve again", () => {
      beforeEach(async () => {
        await advanceBlock(developerPoolParams.blocksPerEra * 2 + 2);
        await instance.approve({ from: dev1Address });
      });

      it("should can approve in two eras", async () => {
        await instance.approve({ from: dev1Address });
        let allowance = await developerPool.allowance({ from: dev1Address });
        let tokensPerEra = 1666666000000000000000000;

        assert.equal(allowance, tokensPerEra);
      });
    });
  });

  context("when adding level to developer", () => {
    context("with owner", () => {
      context("when the developer is in era 6", () => {
        beforeEach(async () => {
          await advanceBlock(developerPoolParams.blocksPerEra * 5);
          await addDeveloper("Developer A", dev1Address);
          await advanceBlock(developerPoolParams.blocksPerEra * 7 + 2);

          await instance.addLevel(dev1Address, { from: owner });
        });

        it("should increment levels of the eras from current contract era ahead", async () => {
          let era1 = await developerPool.getEra(1);
          let era2 = await developerPool.getEra(2);
          let era3 = await developerPool.getEra(3);
          let era4 = await developerPool.getEra(4);
          let era5 = await developerPool.getEra(5);
          let era6 = await developerPool.getEra(6);
          let era7 = await developerPool.getEra(7);
          let era8 = await developerPool.getEra(8);
          let era9 = await developerPool.getEra(9);
          let era10 = await developerPool.getEra(10);
          let era11 = await developerPool.getEra(11);
          let era12 = await developerPool.getEra(12);
          let era13 = await developerPool.getEra(13);
          let era14 = await developerPool.getEra(14);
          let era15 = await developerPool.getEra(15);
          let era16 = await developerPool.getEra(16);
          let era17 = await developerPool.getEra(17);
          let era18 = await developerPool.getEra(18);

          const ZERO_LEVELS = 0;
          const SAME_LEVELS = 1;
          const NEW_LEVELS = 2;

          assert.equal(era1.levels, ZERO_LEVELS);
          assert.equal(era2.levels, ZERO_LEVELS);
          assert.equal(era3.levels, ZERO_LEVELS);
          assert.equal(era4.levels, ZERO_LEVELS);
          assert.equal(era5.levels, ZERO_LEVELS);

          assert.equal(era6.levels, SAME_LEVELS);
          assert.equal(era7.levels, SAME_LEVELS);
          assert.equal(era8.levels, SAME_LEVELS);
          assert.equal(era9.levels, SAME_LEVELS);
          assert.equal(era10.levels, SAME_LEVELS);
          assert.equal(era11.levels, SAME_LEVELS);
          assert.equal(era12.levels, SAME_LEVELS);

          assert.equal(era13.levels, NEW_LEVELS);
          assert.equal(era14.levels, NEW_LEVELS);
          assert.equal(era15.levels, NEW_LEVELS);
          assert.equal(era16.levels, NEW_LEVELS);
          assert.equal(era17.levels, NEW_LEVELS);
          assert.equal(era18.levels, NEW_LEVELS);
        });
      });
    });

    context("with non owner", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expectRevert(
          instance.addLevel(dev1Address, { from: dev1Address }),
          "Ownable: caller is not the owner"
        );
      });
    });
  });

  context("when removing level of the developer", () => {
    context("with owner", () => {
      beforeEach(async () => {
        await advanceBlock(developerPoolParams.blocksPerEra * 5);
        await addDeveloper("Developer A", dev1Address);
        await advanceBlock(developerPoolParams.blocksPerEra * 7 + 2);

        await instance.addLevel(dev1Address, { from: owner });
        await instance.addLevel(dev1Address, { from: owner });

        await instance.removeLevel(dev1Address, 1, { from: owner });
      });

      context("when the developer is in era 6", () => {
        it("should remove level to developer", async () => {
          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.level.level, 2);
        });

        it("should decrement levels of the eras from current contract era ahead", async () => {
          let era1 = await developerPool.getEra(1);
          let era2 = await developerPool.getEra(2);
          let era3 = await developerPool.getEra(3);
          let era4 = await developerPool.getEra(4);
          let era5 = await developerPool.getEra(5);
          let era6 = await developerPool.getEra(6);
          let era7 = await developerPool.getEra(7);
          let era8 = await developerPool.getEra(8);
          let era9 = await developerPool.getEra(9);
          let era10 = await developerPool.getEra(10);
          let era11 = await developerPool.getEra(11);
          let era12 = await developerPool.getEra(12);
          let era13 = await developerPool.getEra(13);
          let era14 = await developerPool.getEra(14);
          let era15 = await developerPool.getEra(15);
          let era16 = await developerPool.getEra(16);
          let era17 = await developerPool.getEra(17);
          let era18 = await developerPool.getEra(18);

          const ZERO_LEVELS = 0;
          const SAME_LEVELS = 1;
          const NEW_LEVELS = 2;

          assert.equal(era1.levels, ZERO_LEVELS);
          assert.equal(era2.levels, ZERO_LEVELS);
          assert.equal(era3.levels, ZERO_LEVELS);
          assert.equal(era4.levels, ZERO_LEVELS);
          assert.equal(era5.levels, ZERO_LEVELS);

          assert.equal(era6.levels, SAME_LEVELS);
          assert.equal(era7.levels, SAME_LEVELS);
          assert.equal(era8.levels, SAME_LEVELS);
          assert.equal(era9.levels, SAME_LEVELS);
          assert.equal(era10.levels, SAME_LEVELS);
          assert.equal(era11.levels, SAME_LEVELS);
          assert.equal(era12.levels, SAME_LEVELS);

          assert.equal(era13.levels, NEW_LEVELS);
          assert.equal(era14.levels, NEW_LEVELS);
          assert.equal(era15.levels, NEW_LEVELS);
          assert.equal(era16.levels, NEW_LEVELS);
          assert.equal(era17.levels, NEW_LEVELS);
          assert.equal(era18.levels, NEW_LEVELS);
        });
      });
    });

    context("with non owner", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expectRevert(
          instance.removeLevel(dev1Address, 1, { from: dev1Address }),
          "Ownable: caller is not the owner"
        );
      });
    });

    context("when try remove more levels than the developer levels", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      it("should return error message", async () => {
        await expectRevert(
          instance.removeLevel(dev1Address, 5, { from: owner }),
          "Invalid level to remove"
        );
      });
    });
  });
});
