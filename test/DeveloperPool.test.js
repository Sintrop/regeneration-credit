const SacToken = artifacts.require("SacToken");
const DeveloperPool = artifacts.require("DeveloperPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

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

contract("DeveloperPool", (accounts) => {
  let instance;
  let [owner, dev1Address, dev2Address] = accounts;
  let args = {
    totalSacTokens: "1500000000000000000000000000",
    totalDeveloperPoolTokens: "15000000000000000000000000",
    blocksPerEra: 10,
    eraMax: 5,
  };

  beforeEach(async () => {
    const sacToken = await SacToken.new(args.totalSacTokens);
    instance = await DeveloperPool.new(sacToken.address, args.blocksPerEra, args.eraMax);

    await instance.newAllowedCaller(owner);

    await sacToken.addContractPool(instance.address, args.totalDeveloperPoolTokens);
  });

  context("when deploy contract", () => {
    it("should blocksPerEra be equal the deployed value", async () => {
      const blocksPerEra = await instance.blocksPerEra();

      assert.equal(blocksPerEra, args.blocksPerEra);
    });

    it("should eraMax be equal the deployed value", async () => {
      const eraMax = await instance.eraMax();

      assert.equal(eraMax, args.eraMax);
    });

    it("should initial be era equal one", async () => {
      const currentContractEra = await instance.currentContractEra();
      assert.equal(currentContractEra, 1);
    });
  });

  context("#getEra", () => {
    context("when access fields", () => {
      it("should have fields", async () => {
        const era = await instance.getEra(1);

        assert.equal(era.levels, 0);
        assert.equal(era.tokens, 0);
        assert.equal(era.developers, 0);
        assert.equal(era.developerTokens.length, 0);
      });
    });
  });

  context("when check time to next approve", () => {
    context("when cant approve", () => {
      it("should return integer > zero", async () => {
        let currentEra = 1;
        const nextApproveIn = await instance.nextApproveIn(currentEra);

        assert.isAbove(parseInt(nextApproveIn), 0);
      });
    });

    context("when can approve", () => {
      it("should return integer < zero", async () => {
        let currentEra = 1;

        await advanceBlock(args.blocksPerEra);
        const nextApproveIn = await instance.nextApproveIn(currentEra);

        assert.isBelow(parseInt(nextApproveIn), 1);
      });
    });
  });

  context("#allowance", () => {
    context("when can allowance", () => {
      it("should return zero from DeveloperPool", async () => {
        const allowance = await instance.allowance({ from: dev1Address });

        assert.equal(allowance, 0);
      });
    });
  });

  context("#balance", () => {
    it("should return balance of DeveloperPool", async () => {
      const balance = await instance.balance();

      assert.equal(balance, args.totalDeveloperPoolTokens);
    });
  });

  context("#balanceOf", () => {
    it("should return balanceOf address", async () => {
      const balanceOf = await instance.balanceOf(instance.address);

      assert.equal(balanceOf, args.totalDeveloperPoolTokens);
    });
  });

  context("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        beforeEach(async () => {
          await instance.addLevel(1);
        });

        it("should update levels to eras 1..18", async () => {
          const era1 = await instance.getEra(1);
          const era2 = await instance.getEra(2);
          const era3 = await instance.getEra(3);
          const era4 = await instance.getEra(4);
          const era5 = await instance.getEra(5);
          const era6 = await instance.getEra(6);
          const era7 = await instance.getEra(7);
          const era8 = await instance.getEra(8);
          const era9 = await instance.getEra(9);
          const era10 = await instance.getEra(10);
          const era11 = await instance.getEra(11);
          const era12 = await instance.getEra(12);
          const era13 = await instance.getEra(13);
          const era14 = await instance.getEra(14);
          const era15 = await instance.getEra(15);
          const era16 = await instance.getEra(16);
          const era17 = await instance.getEra(17);
          const era18 = await instance.getEra(18);

          assert.equal(era1.levels, 1);
          assert.equal(era2.levels, 1);
          assert.equal(era3.levels, 1);
          assert.equal(era4.levels, 1);
          assert.equal(era5.levels, 1);
          assert.equal(era6.levels, 1);
          assert.equal(era7.levels, 1);
          assert.equal(era8.levels, 1);
          assert.equal(era9.levels, 1);
          assert.equal(era10.levels, 1);
          assert.equal(era11.levels, 1);
          assert.equal(era12.levels, 1);
          assert.equal(era13.levels, 1);
          assert.equal(era14.levels, 1);
          assert.equal(era15.levels, 1);
          assert.equal(era16.levels, 1);
          assert.equal(era17.levels, 1);
          assert.equal(era18.levels, 1);
        });
      });

      context("when add level in era 5", () => {
        beforeEach(async () => {
          await instance.addLevel(5);
        });

        it("should update levels to eras 5..18", async () => {
          const era1 = await instance.getEra(1);
          const era2 = await instance.getEra(2);
          const era3 = await instance.getEra(3);
          const era4 = await instance.getEra(4);
          const era5 = await instance.getEra(5);
          const era6 = await instance.getEra(6);
          const era7 = await instance.getEra(7);
          const era8 = await instance.getEra(8);
          const era9 = await instance.getEra(9);
          const era10 = await instance.getEra(10);
          const era11 = await instance.getEra(11);
          const era12 = await instance.getEra(12);
          const era13 = await instance.getEra(13);
          const era14 = await instance.getEra(14);
          const era15 = await instance.getEra(15);
          const era16 = await instance.getEra(16);
          const era17 = await instance.getEra(17);
          const era18 = await instance.getEra(18);

          assert.equal(era1.levels, 0);
          assert.equal(era2.levels, 0);
          assert.equal(era3.levels, 0);
          assert.equal(era4.levels, 0);
          assert.equal(era5.levels, 1);
          assert.equal(era6.levels, 1);
          assert.equal(era7.levels, 1);
          assert.equal(era8.levels, 1);
          assert.equal(era9.levels, 1);
          assert.equal(era10.levels, 1);
          assert.equal(era11.levels, 1);
          assert.equal(era12.levels, 1);
          assert.equal(era13.levels, 1);
          assert.equal(era14.levels, 1);
          assert.equal(era15.levels, 1);
          assert.equal(era16.levels, 1);
          assert.equal(era17.levels, 1);
          assert.equal(era18.levels, 1);
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.addLevel(1, { from: dev1Address }),
          "Not allowed caller"
        );
      });
    });
  });

  context("#removeLevel", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.addLevel(1);
        await instance.addLevel(1);
      });

      context("when remove level in era 1", () => {
        beforeEach(async () => {
          await instance.removeLevel(1, 1);
        });

        it("should update levels to eras 1..18", async () => {
          const era1 = await instance.getEra(1);
          const era2 = await instance.getEra(2);
          const era3 = await instance.getEra(3);
          const era4 = await instance.getEra(4);
          const era5 = await instance.getEra(5);
          const era6 = await instance.getEra(6);
          const era7 = await instance.getEra(7);
          const era8 = await instance.getEra(8);
          const era9 = await instance.getEra(9);
          const era10 = await instance.getEra(10);
          const era11 = await instance.getEra(11);
          const era12 = await instance.getEra(12);
          const era13 = await instance.getEra(13);
          const era14 = await instance.getEra(14);
          const era15 = await instance.getEra(15);
          const era16 = await instance.getEra(16);
          const era17 = await instance.getEra(17);
          const era18 = await instance.getEra(18);

          assert.equal(era1.levels, 1);
          assert.equal(era2.levels, 1);
          assert.equal(era3.levels, 1);
          assert.equal(era4.levels, 1);
          assert.equal(era5.levels, 1);
          assert.equal(era6.levels, 1);
          assert.equal(era7.levels, 1);
          assert.equal(era8.levels, 1);
          assert.equal(era9.levels, 1);
          assert.equal(era10.levels, 1);
          assert.equal(era11.levels, 1);
          assert.equal(era12.levels, 1);
          assert.equal(era13.levels, 1);
          assert.equal(era14.levels, 1);
          assert.equal(era15.levels, 1);
          assert.equal(era16.levels, 1);
          assert.equal(era17.levels, 1);
          assert.equal(era18.levels, 1);
        });
      });

      context("when remove level in era 5", () => {
        beforeEach(async () => {
          await instance.removeLevel(5, 1);
        });

        it("should update levels to eras 5..18", async () => {
          const era1 = await instance.getEra(1);
          const era2 = await instance.getEra(2);
          const era3 = await instance.getEra(3);
          const era4 = await instance.getEra(4);
          const era5 = await instance.getEra(5);
          const era6 = await instance.getEra(6);
          const era7 = await instance.getEra(7);
          const era8 = await instance.getEra(8);
          const era9 = await instance.getEra(9);
          const era10 = await instance.getEra(10);
          const era11 = await instance.getEra(11);
          const era12 = await instance.getEra(12);
          const era13 = await instance.getEra(13);
          const era14 = await instance.getEra(14);
          const era15 = await instance.getEra(15);
          const era16 = await instance.getEra(16);
          const era17 = await instance.getEra(17);
          const era18 = await instance.getEra(18);

          assert.equal(era1.levels, 2);
          assert.equal(era2.levels, 2);
          assert.equal(era3.levels, 2);
          assert.equal(era4.levels, 2);
          assert.equal(era5.levels, 1);
          assert.equal(era6.levels, 1);
          assert.equal(era7.levels, 1);
          assert.equal(era8.levels, 1);
          assert.equal(era9.levels, 1);
          assert.equal(era10.levels, 1);
          assert.equal(era11.levels, 1);
          assert.equal(era12.levels, 1);
          assert.equal(era13.levels, 1);
          assert.equal(era14.levels, 1);
          assert.equal(era15.levels, 1);
          assert.equal(era16.levels, 1);
          assert.equal(era17.levels, 1);
          assert.equal(era18.levels, 1);
        });
      });

      context("when try remove more levels than era has", () => {
        it("should return error message", async () => {
          await expectRevert(instance.removeLevel(1, 5), "Not enough levels to remove");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.removeLevel(1, 1, { from: dev1Address }),
          "Not allowed caller"
        );
      });
    });
  });

  context("when check how much times can approve", () => {
    context("when cant approve", () => {
      it("should return zero times", async () => {
        let currentEra = 1;
        const canApproveTimes = await instance.canApproveTimes(currentEra);

        assert.equal(canApproveTimes, 0);
      });
    });

    context("when can approve 2 times", () => {
      it(`should return two times`, async () => {
        let currentEra = 1;
        await advanceBlock(args.blocksPerEra * 2 + 2);

        const canApproveTimes = await instance.canApproveTimes(currentEra);

        const blocksPrecision = await instance.BLOCKS_PRECISION();
        const fixedPoint = canApproveTimes / 10 ** blocksPrecision;

        assert.equal(Math.ceil(fixedPoint), 2);
      });
    });
  });

  context("#withdraw", () => {
    context("with allowed caller", () => {
      context("when can withdraw", () => {
        context("when total of levels in era is three", () => {
          beforeEach(async () => {
            await instance.addLevel(1);
            await instance.addLevel(1);
            await instance.addLevel(1);

            await advanceBlock(args.blocksPerEra);
          });

          context("when developer level is one", () => {
            it("shoud withdraw 277777666666666666666666 tokens", async () => {
              await instance.withdraw(dev1Address, 1, 1);
              const balanceOf = await instance.balanceOf(dev1Address);

              assert.equal(balanceOf, "277777666666666666666666");
            });
          });

          context("when developer level is two", () => {
            it("shoud withdraw 555555333333333333333332 tokens", async () => {
              await instance.withdraw(dev1Address, 2, 1);
              const balanceOf = await instance.balanceOf(dev1Address);

              assert.equal(balanceOf, "555555333333333333333332");
            });
          });

          context("when developer level is three", () => {
            it("shoud withdraw 833332999999999999999998 tokens", async () => {
              await instance.withdraw(dev1Address, 3, 1);
              const balanceOf = await instance.balanceOf(dev1Address);

              assert.equal(balanceOf, "833332999999999999999998");
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expectRevert(
            instance.withdraw(dev1Address, 1, 1),
            "You can't withdraw yet"
          );
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.withdraw(dev1Address, 1, 1, { from: dev1Address }),
          "Not allowed caller"
        );
      });
    });
  });
});
