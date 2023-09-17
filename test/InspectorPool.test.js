const RcToken = artifacts.require("RcToken");
const InspectorPool = artifacts.require("InspectorPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("InspectorPool", (accounts) => {
  let instance;
  let [owner, inspector1Address, inspector2Address] = accounts;

  const args = {
    totalRcTokens: "1500000000000000000000000000",
    totalInspectorPoolTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
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
    const rcToken = await RcToken.new(args.totalRcTokens);
    instance = await InspectorPool.new(rcToken.address, args.halving, args.totalEras, args.blocksPerEra);

    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(instance.address, args.totalInspectorPoolTokens);
  });

  describe("after deploy", () => {
    it("must blocksPerEra be equal the deployed value", async () => {
      const blocksPerEra = await instance.blocksPerEra();

      assert.equal(blocksPerEra, args.blocksPerEra);
    });

    it("must initial era equal one", async () => {
      const currentContractEra = await instance.currentContractEra();
      assert.equal(currentContractEra, 1);
    });
  });

  describe("#getEra", () => {
    context("when access fields", () => {
      it("should have fields", async () => {
        const era = await instance.getEra(1);

        assert.equal(era.levels, 0);
        assert.equal(era.tokens, 0);
        assert.equal(era.users, 0);
      });
    });
  });

  describe("#nextApproveIn", () => {
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

  describe("#balance", () => {
    it("must return balance of InspectorPool", async () => {
      const balance = await instance.balance();

      assert.equal(balance, args.totalInspectorPoolTokens);
    });
  });

  describe("#balanceOf", () => {
    it("should return balanceOf address", async () => {
      const balanceOf = await instance.balanceOf(instance.address);

      assert.equal(balanceOf, args.totalInspectorPoolTokens);
    });
  });

  describe("#addLevel", () => {
    context("with allowed caller", () => {
      context("when add level in era 1", () => {
        context("when inspector have 0 levels in era 1", () => {
          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
            });

            it("era 1 must have 2 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 2);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 1 level to inspector1", async () => {
              const eraLevels = await instance.eraLevels(1, inspector1Address);

              assert.equal(eraLevels, 1);
            });

            it("eraLevels must have 1 level to inspector2", async () => {
              const eraLevels = await instance.eraLevels(1, inspector2Address);

              assert.equal(eraLevels, 1);
            });
          });
        });

        context("when inspectors have levels in era 1", () => {
          beforeEach(async () => {
            await instance.addLevel(inspector1Address, 1, 1);
            await instance.addLevel(inspector1Address, 1, 5);

            await instance.addLevel(inspector2Address, 1, 1);
            await instance.addLevel(inspector2Address, 1, 1);
            await instance.addLevel(inspector2Address, 1, 1);
          });

          context("when add level", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
            });

            it("era 1 must have 11 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 11);
            });

            it("era 2 must have 0 level", async () => {
              const era2 = await instance.getEra(2);

              assert.equal(era2.levels, 0);
            });

            it("eraLevels must have 7 level to inspector1", async () => {
              const eraLevels = await instance.eraLevels(1, inspector1Address);

              assert.equal(eraLevels, 7);
            });

            it("eraLevels must have 4 level to inspector2", async () => {
              const eraLevels = await instance.eraLevels(1, inspector2Address);

              assert.equal(eraLevels, 4);
            });
          });
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.addLevel(inspector1Address, 1, 1, { from: inspector1Address }),
          "Not allowed caller"
        );
      });
    });
  });

  describe("#removeLevel", () => {
    context("with allowed caller", () => {
      context("when inspector1 have 2 levels in era 1", () => {
        beforeEach(async () => {
          await instance.addLevel(inspector1Address, 1, 1);
          await instance.addLevel(inspector1Address, 1, 1);
        });

        context("when is era 1", () => {
          context("when remove level", () => {
            beforeEach(async () => {
              await instance.removeLevel(inspector1Address);
            });

            it("era 1 must have 1 level", async () => {
              const era1 = await instance.getEra(1);

              assert.equal(era1.levels, 1);
            });

            it("inspector1 levels in era 1 must be 1", async () => {
              const level = await instance.eraLevels(1, inspector1Address);

              assert.equal(level, 1);
            });
          });
        });

        context("when is era 2", () => {
          context("when have 2 levels in era 2", () => {
            beforeEach(async () => {
              await advanceBlock(args.blocksPerEra);
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);
            });

            context("when remove level", () => {
              beforeEach(async () => {
                await instance.removeLevel(inspector1Address);
              });

              it("era 1 must have 2 level", async () => {
                const era = await instance.getEra(1);

                assert.equal(era.levels, 2);
              });

              it("inspector1 levels in era 1 must be 2", async () => {
                const level = await instance.eraLevels(1, inspector1Address);

                assert.equal(level, 2);
              });

              it("era 2 must have 1 level", async () => {
                const era = await instance.getEra(2);

                assert.equal(era.levels, 1);
              });

              it("inspector1 levels in era 2 must be 1", async () => {
                const level = await instance.eraLevels(2, inspector1Address);

                assert.equal(level, 1);
              });
            });
          });
        });
      });

      context("when inspector1 dont have levels in era", () => {
        it("should return error message", async () => {
          await expectRevert(instance.removeLevel(inspector1Address), "Not enough levels to remove");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.removeLevel(inspector1Address, { from: inspector1Address }),
          "Not allowed caller"
        );
      });
    });
  });

  describe("#canApproveTimes", () => {
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

  describe("#withdraw", () => {
    context("with allowed caller", () => {
      context("when can withdraw", () => {
        context("when is era 1", () => {
          context("when total of levels in era is 6", () => {
            context("when inspector1 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);

                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("must withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(inspector1Address, 1);
                const balanceOf = await instance.balanceOf(inspector1Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });
            });

            context("when inspector1 have 6 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 1200000000000000000000000 tokens", async () => {
                await instance.withdraw(inspector1Address, 1);
                const balanceOf = await instance.balanceOf(inspector1Address);

                assert.equal(balanceOf, 7200000000000000000000000n);
              });

              it("shoud withdraw 0 tokens to inspector2", async () => {
                await instance.withdraw(inspector2Address, 1);
                const balanceOf = await instance.balanceOf(inspector2Address);

                assert.equal(balanceOf, "0");
              });
            });

            context("when inspector2 have 3 levels in era 1", () => {
              beforeEach(async () => {
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);
                await instance.addLevel(inspector1Address, 1, 1);

                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);
                await instance.addLevel(inspector2Address, 1, 1);

                await advanceBlock(args.blocksPerEra);
              });

              it("shoud withdraw 600000000000000000000000 tokens", async () => {
                await instance.withdraw(inspector2Address, 1);
                const balanceOf = await instance.balanceOf(inspector2Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });
            });
          });
        });

        context("when is era 2", () => {
          context("when dont have withdraw from era 1", () => {
            beforeEach(async () => {
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);

              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);

              await advanceBlock(8);

              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);
              await instance.addLevel(inspector1Address, 1, 1);

              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
              await instance.addLevel(inspector2Address, 1, 1);
            });

            context("when inspector1 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(inspector1Address, 1);
                await instance.withdraw(inspector1Address, 2);

                await instance.withdraw(inspector2Address, 1);
                await instance.withdraw(inspector2Address, 2);
              });

              it("inspector pool balance must be 27600000000000000000000000", async () => {
                const balance = await instance.balance();

                assert.equal(balance, 165600000000000000000000000n);
              });

              it("inspector1 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await instance.balanceOf(inspector1Address);

                assert.equal(balanceOf, 7200000000000000000000000n);
              });

              it("inspector1 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, inspector1Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });

              it("inspector1 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, inspector1Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });
            });

            context("when inspector2 withdraw from era 1 and era 2", () => {
              beforeEach(async () => {
                await instance.withdraw(inspector1Address, 1);
                await instance.withdraw(inspector1Address, 2);

                await instance.withdraw(inspector2Address, 1);
                await instance.withdraw(inspector2Address, 2);
              });

              it("inspector2 balance must be 1200000000000000000000000", async () => {
                const balanceOf = await instance.balanceOf(inspector2Address);

                assert.equal(balanceOf, 7200000000000000000000000n);
              });

              it("inspector2 balance in era 1 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(1, inspector2Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });

              it("inspector2 balance in era 2 must be 600000000000000000000000", async () => {
                const balanceOf = await instance.eraTokens(2, inspector2Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });
            });
          });
        });
      });

      context("when cant withdraw", () => {
        it("should return error message", async () => {
          await expectRevert(instance.withdraw(inspector1Address, 1), "You can't approve yet");
        });
      });
    });

    context("with don't allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.withdraw(inspector1Address, 1, { from: inspector1Address }),
          "Not allowed caller"
        );
      });
    });
  });
});
