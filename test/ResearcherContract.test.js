const ResearcherContract = artifacts.require("ResearcherContract");
const ResearcherPool = artifacts.require("ResearcherPool");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;
require('./shared/setup.js');

contract("ResearcherContract", (accounts) => {
  let instance;
  let sacToken;
  let researcherPool;
  let userContract;
  let [ownerAddress, resea1Address, resea2Address] = accounts;

  const args = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const addResearcher = async (name, address) => {
    await instance.addResearcher(name, "photoURL", { from: address });
  };

  const addWork = async (from) => {
    await instance.addWork("title", "thesis", "fileURL", {
      from: from,
    });
  };

  before(async () => {
    sacToken = await SacToken.new("1500000000000000000000000000");
    userContract = await UserContract.new();

    researcherPool = await ResearcherPool.new(sacToken.address, args.halving, args.totalEras, args.blocksPerEra);

    instance = await ResearcherContract.new(userContract.address, researcherPool.address);

    await researcherPool.newAllowedCaller(instance.address);
    await sacToken.addContractPool(researcherPool.address, args.totalTokens);
    await userContract.newAllowedCaller(instance.address);
    await instance.newAllowedUser(resea1Address);
  });

  describe("#addResearcher", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addResearcher("Reseacher B", resea2Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
      context("when researcher already exists", () => {
        it("should return error", async () => {
          await addResearcher("Researcher A", resea1Address);
          await expectRevert(addResearcher("Researcher A", resea1Address), "This researcher already exist");
        });
      });

      context("when researcher don't exist", () => {
        beforeEach(async () => {
          await addResearcher("Researcher A", resea1Address);
        });

        it("create researcher", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          assert.equal(researcher.researcherWallet, resea1Address);
        });

        it("increment researcherCount after create researcher", async () => {
          const researchersCount = await instance.researchersCount();

          assert.equal(researchersCount, 1);
        });

        it("add created researcher in researcherList (array)", async () => {
          const researchers = await instance.getResearchers();

          assert.equal(researchers[0].researcherWallet, resea1Address);
        });

        it("add created researcher in userType contract as a RESEARCHER", async () => {
          const userType = await userContract.getUser(resea1Address);
          const RESEARCHER = 3;

          assert.equal(userType, RESEARCHER);
        });

        it("add created researcher with 0 published works", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          assert.equal(researcher.publishedWorks, 0);
        });
      });
    });
  });

  describe("#getResearchers", () => {
    context("when has researchers", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      it("return researchers", async () => {
        const researchers = await instance.getResearchers();

        assert.equal(researchers.length, 1);
      });
    });

    context("when has not researchers", () => {
      it("return zero researchers", async () => {
        const researchers = await instance.getResearchers();

        assert.equal(researchers.length, 0);
      });
    });
  });

  describe("#getResearcher", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
    });

    it("return a researcher", async () => {
      const researcher = await instance.getResearcher(resea1Address);

      assert.equal(researcher.researcherWallet, resea1Address);
    });
  });

  describe("#getResearcher", () => {
    context("when researcher exists", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      it("return true", async () => {
        const researcherExists = await instance.researcherExists(resea1Address);

        assert.equal(researcherExists, true);
      });
    });

    context("when researcher don't exist", () => {
      it("return false", async () => {
        const researcherExists = await instance.researcherExists(resea1Address);

        assert.equal(researcherExists, false);
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      context("when researcher is in era 1 and current era is 1", () => {
        it("should return error", async () => {
          await expectRevert(instance.withdraw({ from: resea1Address }), "Can't approve withdraw");
        });
      });

      context("when researcher is in era 1 and current era is 2", () => {
        context("with one researches", () => {
          beforeEach(async () => {
            await addWork(resea1Address);

            await advanceBlock(args.blocksPerEra);

            await instance.withdraw({ from: resea1Address });
          });

          it("withdraw 1200000000000000000000000 tokens", async () => {
            const balanceOf = await researcherPool.balanceOf(resea1Address);
            const expectedBalance = 1200000000000000000000000n;

            assert.equal(balanceOf, expectedBalance);
          });
        });

        context("with one researches", () => {
          beforeEach(async () => {
            await instance.newAllowedUser(resea2Address);
            await addResearcher("Researcher B", resea2Address);
            await addWork(resea1Address);
            await addWork(resea2Address);

            await advanceBlock(args.blocksPerEra);

            await instance.withdraw({ from: resea1Address });
          });

          it("withdraw 600000000000000000000000n tokens", async () => {
            const balanceOf = await researcherPool.balanceOf(resea1Address);
            const expectedBalance = 600000000000000000000000n;

            assert.equal(balanceOf, expectedBalance);
          });
        });
      });
    });

    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expectRevert(instance.withdraw({ from: resea1Address }), "Pool only to researchers");
      });
    });
  });

  describe("#addWork", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expectRevert(addWork(), "Only allowed to researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
        await addWork(resea1Address);
      });

      it("add a work", async () => {
        const firstWork = await instance.worksCount();

        assert.equal(firstWork, 1);
      });

      it("add 1 to researcher publishedWorks", async () => {
        const researcher = await instance.getResearcher(resea1Address);

        assert.equal(researcher.publishedWorks, 1);
      });

      it("add 1 to researcher pool level", async () => {
        const researcher = await instance.getResearcher(resea1Address);

        assert.equal(researcher.pool.level, 1);
      });

      it("add 1 to researcher pool eraLeves", async () => {
        const eraLevel = await researcherPool.eraLevels(1, resea1Address);

        assert.equal(eraLevel, 1);
      });

      it("dont add to researcher pool eraLeves of other era", async () => {
        const eraLevel = await researcherPool.eraLevels(2, resea1Address);

        assert.equal(eraLevel, 0);
      });

      context("when is next era", () => {
        beforeEach(async () => {
          await advanceBlock(args.blocksPerEra);

          await addWork(resea1Address);
        });

        it("add +1 to researcher pool eraLeves of era 2", async () => {
          const eraLevel = await researcherPool.eraLevels(2, resea1Address);

          assert.equal(eraLevel, 2);
        });

        it("add +1 to researcher pool level", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          assert.equal(researcher.pool.level, 2);
        });

        it("dont add to researcher pool eraLeves of other era", async () => {
          const eraLevel = await researcherPool.eraLevels(3, resea1Address);

          assert.equal(eraLevel, 0);
        });
      });
    });
  });

  describe("#getWorks", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
      await addWork(resea1Address);
    });

    it("should return published works list", async () => {
      const works = await instance.getWorks();

      assert.equal(works.length, 1);
    });
  });
});
