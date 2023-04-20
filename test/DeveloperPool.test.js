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
    blocksPerEra: 30,
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
        context("when developer have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev2Address, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 1 level to developer1", async () => {
              const eraLevels = await instance.eraLevels(1, dev1Address);

              assert.equal(eraLevels, 1);
            });

            it("eraLevels must have 1 level to developer2", async () => {
              const eraLevels = await instance.eraLevels(1, dev1Address);

              assert.equal(eraLevels, 1);
            });
          });
        });

        context("when developers have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(dev1Address, 1);
            await instance.addLevel(dev1Address, 1);

            await instance.addLevel(dev2Address, 1);
            await instance.addLevel(dev2Address, 1);
            await instance.addLevel(dev2Address, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev2Address, 1);
            });

            it("era 1 must have 7 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 7);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 3 level to developer", async () => {
              const eraLevels = await instance.eraLevels(1, dev1Address);

              assert.equal(eraLevels, 3);
            });

            it("eraLevels must have 4 level to developer", async () => {
              const eraLevels = await instance.eraLevels(1, dev2Address);

              assert.equal(eraLevels, 4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.addLevel(dev1Address, 1, { from: dev1Address }),
          "Not allowed caller"
        );
      });
    });
  });

  context("#removeLevel", () => {
    context("with allowed caller", () => {
      context("when developer1 have 2 levels in era 1", () => {
        beforeEach(async () => {
          await instance.addLevel(dev1Address, 1);
          await instance.addLevel(dev1Address, 1);
        });

        context("when is era 1", () => {
          context("when remove level", () => {
            beforeEach(async () => {
              await instance.removeLevel(dev1Address);
            });

            it("era 1 must have 1 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 1);
            });

            it("developer1 levels in era 1 must be 1", async () => {
              const level = await instance.eraLevels(1, dev1Address);

              assert.equal(level, 1);
            });
          });
        });

        context("when is era 2", () => {
          context("when have 2 levels in era 2", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev1Address, 1);
            });

            context("when remove level", () => {
              beforeEach(async () => {
                await instance.removeLevel(dev1Address);
              });

              it("era 1 must have 2 level", async () => {
                const era = await instance.getEra(1);

                assert.equal(era.levels, 2);
              });

              it("developer1 levels in era 1 must be 2", async () => {
                const level = await instance.eraLevels(1, dev1Address);

                assert.equal(level, 2);
              });

              it("era 2 must have 1 level", async () => {
                const era = await instance.getEra(2);

                assert.equal(era.levels, 1);
              });

              it("developer1 levels in era 2 must be 1", async () => {
                const level = await instance.eraLevels(2, dev1Address);

                assert.equal(level, 1);
              });
            });
          });
        });
      });

      context("when developer dont have levels in era", () => {
        it("should return error message", async () => {
          await expectRevert(
            instance.removeLevel(dev1Address),
            "Not enough levels to remove"
          );
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.removeLevel(dev1Address, { from: dev1Address }),
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
        context("when is era 1", () => {
          context("when total of levels in era is 6", () => {
            context("when developer1 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 416666499999999999999999 tokens", async () => {
                await instance.withdraw(dev1Address, 1);
                const balanceOf = await instance.balanceOf(dev1Address);

                assert.equal(balanceOf, "416666499999999999999999");
              });
            });

            context("when developer1 have 6 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 833332999999999999999998 tokens", async () => {
                await instance.withdraw(dev1Address, 1);
                const balanceOf = await instance.balanceOf(dev1Address);

                assert.equal(balanceOf, "833332999999999999999998");
              });

              it("shoud withdraw 0 tokens to developer2", async () => {
                await instance.withdraw(dev2Address, 1);
                const balanceOf = await instance.balanceOf(dev2Address);

                assert.equal(balanceOf, "0");
              });
            });

            context("when developer2 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);
                await instance.addLevel(dev1Address, 1);

                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);
                await instance.addLevel(dev2Address, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 416666499999999999999999 tokens", async () => {
                await instance.withdraw(dev2Address, 1);
                const balanceOf = await instance.balanceOf(dev2Address);

                assert.equal(balanceOf, "416666499999999999999999");
              });
            });
          });
        });

        context("when is era 2", () => {
          context("when dont have withdraw from era 1", () => {
            beforeEach(async () => {
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev1Address, 1);

              await instance.addLevel(dev2Address, 1);
              await instance.addLevel(dev2Address, 1);
              await instance.addLevel(dev2Address, 1);

              await advanceBlock(args.blocksPerEra);

              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev1Address, 1);
              await instance.addLevel(dev1Address, 1);

              await instance.addLevel(dev2Address, 1);
              await instance.addLevel(dev2Address, 1);
              await instance.addLevel(dev2Address, 1);

              await advanceBlock(args.blocksPerEra);
            });

            context("when developer 1 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(dev1Address, 1);
                await instance.withdraw(dev1Address, 2);

                await instance.withdraw(dev2Address, 1);
                await instance.withdraw(dev2Address, 2);
              });

              it("developer1 balance must be 833332999999999999999998", async () => {
                const balanceOf = await instance.balanceOf(dev1Address);

                assert.equal(balanceOf, "833332999999999999999998");
              });

              it("developer1 balance in era 1 must be 416666499999999999999999", async () => {
                const balanceOf = await instance.eraTokens(1, dev1Address);

                assert.equal(balanceOf, "416666499999999999999999");
              });

              it("developer1 balance in era 2 must be 416666499999999999999999", async () => {
                const balanceOf = await instance.eraTokens(2, dev1Address);

                assert.equal(balanceOf, "416666499999999999999999");
              });
            });

            context("when developer 2 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(dev1Address, 1);
                await instance.withdraw(dev1Address, 2);

                await instance.withdraw(dev2Address, 1);
                await instance.withdraw(dev2Address, 2);
              });

              it("developer2 balance must be 833332999999999999999998", async () => {
                const balanceOf = await instance.balanceOf(dev2Address);

                assert.equal(balanceOf, "833332999999999999999998");
              });

              it("developer2 balance in era 1 must be 416666499999999999999999", async () => {
                const balanceOf = await instance.eraTokens(1, dev2Address);

                assert.equal(balanceOf, "416666499999999999999999");
              });

              it("developer2 balance in era 2 must be 416666499999999999999999", async () => {
                const balanceOf = await instance.eraTokens(2, dev2Address);

                assert.equal(balanceOf, "416666499999999999999999");
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expectRevert(instance.withdraw(dev1Address, 1), "You can't withdraw yet");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.withdraw(dev1Address, 1, { from: dev1Address }),
          "Not allowed caller"
        );
      });
    });
  });
});
