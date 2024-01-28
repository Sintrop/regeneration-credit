const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResearcherContract", () => {
  let instance;
  let rcToken;
  let researcherPool;
  let userContract;
  let owner, resea1Address, resea2Address;

  const timeBetweenWorks = 10;

  const args = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const addResearcher = async (name, from) => {
    await instance.connect(from).addResearcher(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const addWork = async (from) => {
    await instance.connect(from).addWork("title", "thesis", "fileURL");
  };

  beforeEach(async () => {
    [owner, resea1Address, resea2Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();

    const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    researcherPool = await researcherPoolFactory.deploy(
      rcToken.target,
      args.halving,
      args.totalEras,
      args.blocksPerEra
    );

    const instanceFactory = await ethers.getContractFactory("ResearcherContract");
    instance = await instanceFactory.deploy(userContract.target, researcherPool.target, timeBetweenWorks);

    await researcherPool.newAllowedCaller(instance.target);
    await rcToken.addContractPool(researcherPool.target, args.totalTokens);
    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);

    await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
  });

  describe("#addResearcher", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expect(addResearcher("Reseacher B", resea2Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when researcher already exists", () => {
        it("should return error", async () => {
          await addResearcher("Researcher A", resea1Address);
          await expect(addResearcher("Researcher A", resea1Address)).to.be.revertedWith(
            "This researcher already exist"
          );
        });
      });

      context("when researcher don't exist", () => {
        beforeEach(async () => {
          await addResearcher("Researcher A", resea1Address);
        });

        it("create researcher", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          expect(researcher.researcherWallet).to.equal(resea1Address.address);
        });

        it("increment researcherCount after create researcher", async () => {
          const researchersCount = await instance.researchersCount();

          expect(researchersCount).to.equal(1);
        });

        it("add created researcher in researcherList (array)", async () => {
          const researchers = await instance.getResearchers();

          expect(researchers[0].researcherWallet).to.equal(resea1Address.address);
        });

        it("add created researcher in userType contract as a RESEARCHER", async () => {
          const userType = await userContract.getUser(resea1Address);
          const RESEARCHER = 3;

          expect(userType).to.equal(RESEARCHER);
        });

        it("add created researcher with 0 published works", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          expect(researcher.publishedWorks).to.equal(0);
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

        expect(researchers.length).to.equal(1);
      });
    });

    context("when has not researchers", () => {
      it("return zero researchers", async () => {
        const researchers = await instance.getResearchers();

        expect(researchers.length).to.equal(0);
      });
    });
  });

  describe("#getResearcher", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
    });

    it("return a researcher", async () => {
      const researcher = await instance.getResearcher(resea1Address);

      expect(researcher.researcherWallet).to.equal(resea1Address.address);
    });
  });

  describe("#getResearcher", () => {
    context("when researcher exists", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      it("return true", async () => {
        const researcherExists = await instance.researcherExists(resea1Address);

        expect(researcherExists).to.equal(true);
      });
    });

    context("when researcher don't exist", () => {
      it("return false", async () => {
        const researcherExists = await instance.researcherExists(resea1Address);

        expect(researcherExists).to.equal(false);
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
          await expect(instance.connect(resea1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });

      context("when researcher is in era 1 and current era is 2", () => {
        context("with one researches", () => {
          beforeEach(async () => {
            await addWork(resea1Address);

            await advanceBlock(args.blocksPerEra);

            await instance.connect(resea1Address).withdraw();
          });

          it("withdraw 1200000000000000000000000 tokens", async () => {
            const balanceOf = await researcherPool.balanceOf(resea1Address);
            const expectedBalance = 1200000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });

        context("with one researches", () => {
          beforeEach(async () => {
            await addInvitation(owner, resea2Address, userTypes.Researcher, owner);
            await addResearcher("Researcher B", resea2Address);
            await addWork(resea1Address);
            await addWork(resea2Address);

            await advanceBlock(args.blocksPerEra);

            await instance.connect(resea1Address).withdraw();
          });

          it("withdraw 600000000000000000000000n tokens", async () => {
            const balanceOf = await researcherPool.balanceOf(resea1Address);
            const expectedBalance = 600000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });
      });
    });

    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(instance.connect(resea1Address).withdraw()).to.be.revertedWith("Pool only to researchers");
      });
    });
  });

  describe("#addWork", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(addWork(owner)).to.be.revertedWith("Only allowed to researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
        await addWork(resea1Address);
      });

      context("when have waited time between works", () => {
        it("add a work", async () => {
          const firstWork = await instance.worksCount();

          expect(firstWork).to.equal(1);
        });

        it("add 1 to researcher publishedWorks", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          expect(researcher.publishedWorks).to.equal(1);
        });

        it("add 1 to researcher pool level", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          expect(researcher.pool.level).to.equal(1);
        });

        it("add 1 to researcher pool eraLeves", async () => {
          const eraLevel = await researcherPool.eraLevels(1, resea1Address);

          expect(eraLevel).to.equal(1);
        });

        it("dont add to researcher pool eraLeves of other era", async () => {
          const eraLevel = await researcherPool.eraLevels(2, resea1Address);

          expect(eraLevel).to.equal(0);
        });

        context("when is next era", () => {
          beforeEach(async () => {
            await advanceBlock(args.blocksPerEra);

            await addWork(resea1Address);
          });

          it("add +1 to researcher pool eraLeves of era 2", async () => {
            const eraLevel = await researcherPool.eraLevels(2, resea1Address);

            expect(eraLevel).to.equal(1);
          });

          it("add +1 to researcher pool level", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.pool.level).to.equal(2);
          });

          it("dont add to researcher pool eraLeves of other era", async () => {
            const eraLevel = await researcherPool.eraLevels(3, resea1Address);

            expect(eraLevel).to.equal(0);
          });
        });
      });

      context("when have not waited time between works", () => {
        it("should return error message", async () => {
          await expect(addWork(resea1Address)).to.be.revertedWith("Can't publish yet");
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

      expect(works.length).to.equal(1);
    });
  });
});
