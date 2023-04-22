const ResearcherContract = artifacts.require("ResearcherContract");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ResearcherContract", (accounts) => {
  let instance;
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

  beforeEach(async () => {
    userContract = await UserContract.new();

    instance = await ResearcherContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await instance.newAllowedUser(resea1Address);
  });

  context("when will create new researcher (.addResearcher)", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addResearcher("Reseacher B", resea2Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
      context("when researcher exists", () => {
        it("should return error", async () => {
          await addResearcher("Researcher A", resea1Address);
          await expectRevert(addResearcher("Researcher A", resea1Address), "This researcher already exist");
        });
      });

      context("when researcher don't exist", () => {
        it("should create researcher", async () => {
          await addResearcher("Researcher A", resea1Address);
          const researcher = await instance.getResearcher(resea1Address);

          assert.equal(researcher.researcherWallet, resea1Address);
        });

        it("should increment researcherCount after create researcher", async () => {
          await addResearcher("Researcher A", resea1Address);
          const researchersCount = await instance.researchersCount();

          assert.equal(researchersCount, 1);
        });

        it("should add created researcher in researcherList (array)", async () => {
          await addResearcher("Researcher A", resea1Address);

          const researchers = await instance.getResearchers();

          assert.equal(researchers[0].researcherWallet, resea1Address);
        });

        it("should add created researcher in userType contract as a RESEARCHER", async () => {
          await addResearcher("Researcher A", resea1Address);

          const userType = await userContract.getUser(resea1Address);
          const RESEARCHER = 3;

          assert.equal(userType, RESEARCHER);
        });

        it("should add created researcher with 0 published works", async () => {
          await addResearcher("Researcher A", resea1Address);
          const researcher = await instance.getResearcher(resea1Address);

          assert.equal(researcher.publishedWorks, 0);
        });
      });
    });
  });

  context("when will get researchers (.getResearchers)", () => {
    it("should return researchers when has researchers", async () => {
      await addResearcher("Researcher A", resea1Address);

      const researchers = await instance.getResearchers();

      assert.equal(researchers.length, 1);
    });

    it("should return researchers equal zero when dont has it", async () => {
      const researchers = await instance.getResearchers();

      assert.equal(researchers.length, 0);
    });
  });

  context("when will get researcher (.getResearcher)", () => {
    it("should return a researcher", async () => {
      await addResearcher("Researcher A", resea1Address);

      const researcher = await instance.getResearcher(resea1Address);

      assert.equal(researcher.researcherWallet, resea1Address);
    });
  });

  context("when will check if researcher exists", () => {
    it("should return true when exists", async () => {
      await addResearcher("Researcher A", resea1Address);
      const researcherExists = await instance.researcherExists(resea1Address);

      assert.equal(researcherExists, true);
    });

    it("it should return false when don't exist", async () => {
      const researcherExists = await instance.researcherExists(resea1Address);

      assert.equal(researcherExists, false);
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
