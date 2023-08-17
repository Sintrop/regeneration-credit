const ResearcherContract = artifacts.require("ResearcherContract");
const ResearcherPool = artifacts.require("ResearcherPool");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ResearcherContract", (accounts) => {
  let instance;
  let sacToken;
  let researcherPool;
  let userContract;
  let [ownerAddress, resea1Address, resea2Address] = accounts;

  const addResearcher = async (name, address) => {
    await instance.addResearcher(name, "photoURL", { from: address });
  };

  const addWork = async (from) => {
    await instance.addWork("title", "thesis", "fileURL", {
      from: from,
    });
  };

  let args = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
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

      it("should add a work", async () => {
        const firstWork = await instance.worksCount();

        assert.equal(firstWork, 1);
      });

      it("should add 1 to researcher publishedWorks", async () => {
        const researcher = await instance.getResearcher(resea1Address);

        assert.equal(researcher.publishedWorks, 1);
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
