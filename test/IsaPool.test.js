const IsaPool = artifacts.require("IsaPool");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("IsaPool", (accounts) => {
  let instance;
  let sacToken;
  let [owner, user1Address, user2Address] = accounts;

  const transferTokensTo = async (userAddress, tokens) => {
    await sacToken.transfer(userAddress, tokens);
  };

  beforeEach(async () => {
    sacToken = await SacToken.new("1500000000000000000000000000");

    instance = await IsaPool.new(sacToken.address);

    await sacToken.addContractPool(instance.address, "15000000000000000000000000");
    await transferTokensTo(user1Address, "500000000000000000000000");
  });

  describe("#allowance", () => {
    beforeEach(async () => {
      await instance.newAllowedCaller(user2Address);
      await instance.approveWith(user2Address, "1500000000000000000000", {
        from: user2Address,
      });
    });

    it("should return how much token the user has approved from this pool", async () => {
      const allowance = await instance.allowance({ from: user1Address });
      const allowance2 = await instance.allowance({ from: user2Address });

      assert.equal(allowance, 0);
      assert.equal(allowance2, 1500000000000000000000);
    });
  });

  describe("#balanceOf", () => {
    it("should return how much SAC Tokens the account has", async () => {
      const balanceOf = await instance.balanceOf(owner);
      const balanceOf2 = await instance.balanceOf(instance.address);
      const balanceOf3 = await instance.balanceOf(user1Address);
      const balanceOf4 = await instance.balanceOf(user2Address);

      assert.equal(balanceOf, "1484500000000000000000000000");
      assert.equal(balanceOf2, "15000000000000000000000000");
      assert.equal(balanceOf3, "500000000000000000000000");
      assert.equal(balanceOf4, "0");
    });
  });

  describe("#balance", () => {
    it("should return how much SAC Tokens the pool has", async () => {
      const balance = await instance.balance();

      assert.equal(balance, "15000000000000000000000000");
    });
  });

  describe("#transferWith", () => {
    context("when is a allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when is not a contract pool", () => {
        beforeEach(async () => {
          await sacToken.removeContractPool(instance.address);
        });

        it("should return error message", async () => {
          await expectRevert(
            instance.transferWith(
              user2Address,
              instance.address,
              "1000000000000000000000"
            ),
            "Not a contract pool"
          );
        });
      });

      context("when is a contract pool", () => {
        context("when user try send tokens to contract pool", () => {
          context("when user dont has tokens", () => {
            it("should return error message", async () => {
              await expectRevert(
                instance.transferWith(
                  user2Address,
                  instance.address,
                  "1000000000000000000000"
                ),
                "You don't have SAC Tokens"
              );
            });
          });

          context("when user has tokens", () => {
            it("should transfer tokens to contract pool address", async () => {
              await instance.transferWith(
                user1Address,
                instance.address,
                "1000000000000000000000"
              );

              const balance = await instance.balance();
              const balanceOf = await instance.balanceOf(user1Address);

              assert.equal(balance, "15001000000000000000000000");
              assert.equal(balanceOf, "499000000000000000000000");
            });
          });
        });

        context("when contract pool try send tokens to user", () => {
          it("should transfer tokens to user", async () => {
            await instance.transferWith(
              instance.address,
              user1Address,
              "1000000000000000000000"
            );

            const balance = await instance.balance();
            const balanceOf = await instance.balanceOf(user1Address);

            assert.equal(balance, "14999000000000000000000000");
            assert.equal(balanceOf, "501000000000000000000000");
          });
        });
      });
    });

    context("when is not a allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.transferWith(user2Address, instance.address, "1000000000000000000000"),
          "Not allowed caller"
        );
      });
    });
  });

  describe("#approveWith", () => {
    context("when is a allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when is a contract pool", () => {
        it("should approve tokens when approve", async () => {
          await instance.approveWith(owner, "500000000000000000000");
          const allowance = await instance.allowance();

          assert.equal(allowance, "500000000000000000000");
        });
      });

      context("when is not a contract pool", () => {
        beforeEach(async () => {
          await sacToken.removeContractPool(instance.address);
        });

        it("should return error message", async () => {
          await instance.newAllowedCaller(owner);
          await sacToken.removeContractPool(instance.address);
          await expectRevert(instance.approveWith(owner, 0), "Not a contract pool");
        });
      });
    });

    context("when is not a allowed caller", () => {
      it("when call approve should return error message when is not a allowed caller", async () => {
        await expectRevert(instance.approveWith(owner, 0), "Not allowed caller");
      });
    });
  });

  describe("#newAllowedCaller", () => {
    context("when is owner", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      it("should add a new allowed caller", async () => {
        await instance.newAllowedCaller(owner);

        const allowedCaller = await instance.allowedCallers(owner);

        assert.equal(allowedCaller, true);
      });
    });

    context("when is not owner", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.newAllowedCaller(user1Address, { from: user1Address }),
          "Ownable: caller is not the owner"
        );
      });
    });
  });
});
