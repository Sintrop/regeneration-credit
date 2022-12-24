const CategoryContract = artifacts.require("CategoryContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("CategoryContract", (accounts) => {
  let instance;
  let sacToken;
  let isaPool;
  let userContract;
  let researcherContract;
  let [msgSender, user1Address, user2Address, resea1Address] = accounts;

  const addCategory = async (name, from) => {
    await instance.addCategory(
      name,
      `The description of ${name}`,
      `How activists should evaluate ${name}`,
      `${name} totally sustainable`,
      `${name} partially sustainable`,
      `${name} neutro`,
      `${name} partially not sustainable`,
      `${name} totally not sustainable`,
      { from: from }
    );
  };

  const addResearcher = async (name, address) => {
    await researcherContract.addResearcher(name, "photoURL", { from: address });
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await sacToken.transfer(userAddress, tokens);
  };

  const balanceOf = async (userAddress) => {
    return await sacToken.balanceOf(userAddress);
  };

  beforeEach(async () => {
    sacToken = await SacToken.new("1500000000000000000000000000");
    isaPool = await IsaPool.new(sacToken.address);

    await sacToken.addContractPool(isaPool.address, "0");

    userContract = await UserContract.new();
    researcherContract = await ResearcherContract.new(userContract.address);

    await userContract.newAllowedCaller(researcherContract.address);
    await researcherContract.newAllowedUser(resea1Address);
    await researcherContract.newAllowedUser(user1Address);
    await researcherContract.newAllowedUser(user2Address);

    instance = await CategoryContract.new(
      isaPool.address,
      researcherContract.address,
      userContract.address
    );
    await isaPool.newAllowedCaller(instance.address);

    await addResearcher("Researcher A", resea1Address);
  });

  describe("#addCategory", () => {
    context("When is not a researcher", () => {
      it("should return error message", async () => {
        const name = "Soil";
        await expectRevert(
          addCategory(name, user1Address),
          "Only allowed to researchers"
        );
      });
    });

    context("When is a researcher", () => {
      it("should create category", async () => {
        const name = "Soil";
        await addCategory(name, resea1Address);
        const categories = await instance.getCategories();

        assert.equal(categories[0].name, "Soil");
      });

      it("should add msg.sender in createdBy", async () => {
        await addCategory("Soil", resea1Address);

        const category = await instance.categories(1);

        assert.equal(category.createdBy, resea1Address);
      });

      it("should increment id of category when created", async () => {
        await addCategory("Soil", resea1Address);
        await addCategory("Soil 2", resea1Address);

        const categories = await instance.getCategories();

        assert.equal(categories[1].id, 2);
      });

      it("should increment total of categories", async () => {
        await addCategory("Soil", resea1Address);
        await addCategory("Soil 2", resea1Address);
        const categoryCounts = await instance.categoryCounts();

        assert.equal(categoryCounts, 2);
      });

      it("should create category with votes equal 0", async () => {
        await addCategory("Soil", resea1Address);
        const categories = await instance.getCategories();

        assert.equal(parseInt(categories[0].votesCount), 0);
      });
    });
  });

  describe.only("#exists", () => {
    context("When category not exists", () => {
      it("should return false", async () => {
        const exists = await instance.exists(1);

        assert.equal(exists, false);
      });
    });

    context("When category exists", () => {
      beforeEach(async () => {
        await addCategory("Soil", resea1Address);
      });

      it("should return true", async () => {
        const exists = await instance.exists(1);

        assert.equal(exists, true);
      });
    });
  });

  context("When access category fields", () => {
    it("should have fields", async () => {
      const name = "Soil";
      await addCategory(name, resea1Address);
      const category = await instance.categories(1);

      assert.equal(category.id, 1);
      assert.equal(category.createdBy, resea1Address);
      assert.equal(category.name, "Soil");
      assert.equal(category.description, `The description of ${name}`);
      assert.equal(category.tutorial, `How activists should evaluate ${name}`);
      assert.equal(category.totallySustainable, `${name} totally sustainable`);
      assert.equal(category.partiallySustainable, `${name} partially sustainable`);
      assert.equal(category.neutro, `${name} neutro`);
      assert.equal(category.partiallyNotSustainable, `${name} partially not sustainable`);
      assert.equal(category.totallyNotSustainable, `${name} totally not sustainable`);
      assert.equal(category.votesCount, 0);
    });
  });

  describe("#getCategories", () => {
    it("should return category list", async () => {
      await addCategory("Soil", resea1Address);
      await addCategory("Soil2", resea1Address);
      const categories = await instance.getCategories();

      assert.equal(categories.length, 2);
    });
  });

  describe("#voted", () => {
    beforeEach(async () => {
      await addCategory("Soil 1", resea1Address);
      await addCategory("Soil 2", resea1Address);
    });

    it("should start with voted zero categories", async () => {
      const voted1 = await instance.voted(msgSender, 1);
      const voted2 = await instance.voted(msgSender, 0);

      assert.equal(voted1, 0);
      assert.equal(voted2, 0);
    });
  });

  describe("#vote", () => {
    context("when category dont exists", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.vote(1, 0, {
            from: resea1Address,
          }),
          "This category don't exist"
        );
      });
    });

    context("when category exists", () => {
      beforeEach(async () => {
        await addCategory("Soil", resea1Address);
        await addResearcher("Researcher B", user1Address);
        await addResearcher("Researcher C", user2Address);
      });

      context("when user dont has Sac Tokens", () => {
        it("should return error message", async () => {
          await expectRevert(
            instance.vote(1, 0, { from: user1Address }),
            "You don't have tokens to vote"
          );
        });
      });

      context("when is not a registered user", () => {
        it("should return error message", async () => {
          await expectRevert(
            instance.vote(1, "100000000000000000000"),
            "Only registered users"
          );
        });
      });

      context("when user has Sac Tokens", () => {
        context("when send tokens to vote", () => {
          beforeEach(async () => {
            await transferTokensTo(user1Address, "500000000000000000000");
            await transferTokensTo(user2Address, "500000000000000000000");
          });

          context("when vote with 100 tokens", () => {
            beforeEach(async () => {
              await instance.vote(1, "100000000000000000000", {
                from: user1Address,
              });
            });

            it("should have 100 tokens to category votes", async () => {
              const votes = await instance.votes(1);

              assert.equal(votes, "100000000000000000000");
            });

            it("should subtract 100 tokens from user", async () => {
              const balanceOf = await isaPool.balanceOf(user1Address);

              assert.equal(balanceOf, "400000000000000000000");
            });

            it("should transfer 100 tokens to isa pool", async () => {
              const balance = await isaPool.balance();

              assert.equal(balance, "100000000000000000000");
            });
          });

          context("when already have voted with 50 tokens", () => {
            beforeEach(async () => {
              await instance.vote(1, "50000000000000000000", {
                from: user1Address,
              });
            });

            context("when vote with 100 tokens", () => {
              beforeEach(async () => {
                await instance.vote(1, "100000000000000000000", {
                  from: user1Address,
                });
              });

              it("should have 100 tokens to category votes", async () => {
                const votes = await instance.votes(1);

                assert.equal(votes, "150000000000000000000");
              });

              it("should subtract 100 tokens from user", async () => {
                const balanceOf = await isaPool.balanceOf(user1Address);

                assert.equal(balanceOf, "350000000000000000000");
              });

              it("should transfer 100 tokens to isa pool", async () => {
                const balance = await isaPool.balance();

                assert.equal(balance, "150000000000000000000");
              });
            });
          });

          context("when try to vote with more than 100k", () => {
            it("should return error", async () => {
              const limit = "100000000000000000000000";
              await addCategory("Solo", resea1Address);
              await transferTokensTo(user1Address, "500000000000000000000000");
              await instance.vote(1, "1", {
                from: user1Address,
              });
              await expectRevert(
                instance.vote(1, limit, {
                  from: user1Address,
                }),
                "can't vote more than 100k tokens"
              );
            });
          });

          context("when voted to category 1 and 2", () => {
            beforeEach(async () => {
              await addCategory("Soil 2", resea1Address);

              await instance.vote(1, "100000000000000000000", {
                from: user1Address,
              });
              await instance.vote(2, "50000000000000000000", {
                from: user1Address,
              });
            });

            it("should set amount of tokens that the user voted to category id when vote", async () => {
              const voted1 = await instance.voted(user1Address, 1);
              const voted2 = await instance.voted(user1Address, 2);
              const voted3 = await instance.voted(user1Address, 3);

              assert.equal(voted1, "100000000000000000000");
              assert.equal(voted2, "50000000000000000000");
              assert.equal(voted3, 0);
            });

            it("should have 100 tokens to category1 votes", async () => {
              const votes = await instance.votes(1);

              assert.equal(votes, "100000000000000000000");
            });

            it("should have 50 tokens to category2 votes", async () => {
              const votes = await instance.votes(2);

              assert.equal(votes, "50000000000000000000");
            });

            it("should subtract 150 tokens from user", async () => {
              const balanceOf = await isaPool.balanceOf(user1Address);

              assert.equal(balanceOf, "350000000000000000000");
            });

            it("should transfer 150 tokens to isa pool", async () => {
              const balance = await isaPool.balance();

              assert.equal(balance, "150000000000000000000");
            });
          });

          context("when different users vote 100 tokens in same category", () => {
            beforeEach(async () => {
              await instance.vote(1, "100000000000000000000", {
                from: user1Address,
              });
              await instance.vote(1, "100000000000000000000", {
                from: user2Address,
              });
            });

            it("category should 200 tokens votes", async () => {
              const votes = await instance.votes(1);

              assert.equal(votes, "200000000000000000000");
            });

            it("each user must have your part of votes", async () => {
              const votes1 = await instance.voted(user1Address, 1);
              const votes2 = await instance.voted(user2Address, 1);

              assert.equal(votes1, "100000000000000000000");
              assert.equal(votes2, "100000000000000000000");
            });

            it("should subtract 100 tokens from user1", async () => {
              const balanceOf = await isaPool.balanceOf(user1Address);

              assert.equal(balanceOf, "400000000000000000000");
            });

            it("should subtract 100 tokens from user2", async () => {
              const balanceOf = await isaPool.balanceOf(user2Address);

              assert.equal(balanceOf, "400000000000000000000");
            });

            it("should transfer 200 tokens to isa pool", async () => {
              const balance = await isaPool.balance();

              assert.equal(balance, "200000000000000000000");
            });
          });
        });

        context("when dont send tokens to vote", () => {
          it("should return error message", async () => {
            await transferTokensTo(user1Address, "500000000000000000000000");
            await expectRevert(
              instance.vote(1, 0, { from: user1Address }),
              "Send at least 1 SAC Token"
            );
          });
        });
      });
    });
  });

  describe("#unvote", () => {
    context("when category exists", () => {
      beforeEach(async () => {
        await addCategory("Soil 1", resea1Address);
        await addResearcher("Researcher B", user1Address);
      });

      context("when voted to one category", () => {
        beforeEach(async () => {
          await transferTokensTo(user1Address, "500000000000000000000");

          await instance.vote(1, "100000000000000000000", { from: user1Address });
          await instance.unvote(1, { from: user1Address });
        });

        it("should decrement votesCount in 1", async () => {
          const category = await instance.categories(1);

          assert.equal(category.votesCount, 0);
        });

        it("should remove votes/tokens from voted mapping", async () => {
          const voted = await instance.voted(user1Address, 1);

          assert.equal(voted, 0);
        });

        it("should remove votes/tokens from category", async () => {
          const votes = await instance.votes(1);

          assert.equal(votes, 0);
        });

        it("should have your tokens back", async () => {
          const balanceOf = await isaPool.balanceOf(user1Address);

          assert.equal(balanceOf, "500000000000000000000");
        });

        it("should have 0 tokens in isaPool", async () => {
          const balance = await isaPool.balance();

          assert.equal(balance, 0);
        });
      });

      context("when voted to category1 and category2", () => {
        beforeEach(async () => {
          await addCategory("Soil 2", resea1Address);
          await transferTokensTo(user1Address, "500000000000000000000");

          await instance.vote(1, "100000000000000000000", { from: user1Address });
          await instance.vote(2, "50000000000000000000", { from: user1Address });
        });

        context("when unvote category1", () => {
          beforeEach(async () => {
            await instance.unvote(1, { from: user1Address });
          });

          it("should have your tokens back from category1", async () => {
            const balanceOf = await isaPool.balanceOf(user1Address);

            assert.equal(balanceOf, "450000000000000000000");
          });

          it("should have 50 tokens to category2 votes", async () => {
            const votes = await instance.votes(2);

            assert.equal(votes, "50000000000000000000");
          });

          it("should have 50 tokens in isaPool", async () => {
            const balance = await isaPool.balance();

            assert.equal(balance, "50000000000000000000");
          });
        });

        context("when unvote to category1 and category2", () => {
          beforeEach(async () => {
            await instance.unvote(1, { from: user1Address });
            await instance.unvote(2, { from: user1Address });
          });

          it("should have your tokens back", async () => {
            const balanceOf = await isaPool.balanceOf(user1Address);

            assert.equal(balanceOf, "500000000000000000000");
          });

          it("should have 0 tokens in isaPool", async () => {
            const balance = await isaPool.balance();

            assert.equal(balance, 0);
          });
        });
      });

      context("when dont voted to category", () => {
        it("should return error message", async () => {
          await expectRevert(instance.unvote(1), "You don't voted to this category");
        });
      });
    });

    context("when category dont exists", () => {
      it("should return error message", async () => {
        await expectRevert(instance.unvote(1), "This category don't exists");
      });
    });
  });
});
