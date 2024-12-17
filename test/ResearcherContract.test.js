const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("ResearcherContract", () => {
  let instance;
  let regenerationCredit;
  let researcherPool;
  let userContract;
  let validatorContract;
  let owner, resea1Address, resea2Address, validator1Address, validator2Address, validator3Address, validator4Address;

  const timeBetweenWorks = 10;
  const maxPenalties = 3;
  const securityBlocksToValidatorAnalysis = 10;
  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  const args = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 40,
  };

  const validatorPoolargs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  const addResearcher = async (name, from) => {
    await instance.connect(from).addResearcher(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const addValidator = async (from) => {
    await validatorContract.connect(from).addValidator();
  };

  const addWork = async (from) => {
    await instance.connect(from).addWork("title", "thesis", "fileURL");
  };

  beforeEach(async () => {
    [owner, resea1Address, resea2Address, validator1Address, validator2Address, validator3Address, validator4Address] =
      await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    userContract = await userContractDeployed();

    const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    researcherPool = await researcherPoolFactory.deploy(regenerationCredit.target, args.halving, args.blocksPerEra);

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    const validatorPool = await validatorPoolFactory.deploy(
      regenerationCredit.target,
      validatorPoolargs.halving,
      validatorPoolargs.blocksPerEra
    );

    const validatorContractFactory = await ethers.getContractFactory("ValidatorContract");
    validatorContract = await validatorContractFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    const instanceFactory = await ethers.getContractFactory("ResearcherContract");
    instance = await instanceFactory.deploy(
      userContract.target,
      researcherPool.target,
      validatorContract.target,
      timeBetweenWorks,
      maxPenalties,
      securityBlocksToValidatorAnalysis
    );

    const validatorContractDependencies = {
      userContractAddress: userContract.target,
      regeneratorContractAddress: ZERO_ADDRESS,
      validatorPoolAddress: validatorPool.target,
      inspectorContractAddress: ZERO_ADDRESS,
      developerContractAddress: ZERO_ADDRESS,
      researcherContractAddress: instance.target,
      contributorContractAddress: ZERO_ADDRESS,
      activistContractAddress: ZERO_ADDRESS,
    };

    await validatorContract.setContractAddressDependencies(validatorContractDependencies);

    await userContract.newAllowedCaller(validatorContract.target);
    await researcherPool.newAllowedCaller(instance.target);
    await validatorContract.newAllowedCaller(instance.target);
    await instance.newAllowedCaller(validatorContract.target);
    await instance.newAllowedCaller(owner);
    await regenerationCredit.addContractPool(researcherPool.target, args.totalTokens);
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
          await expect(addResearcher("Researcher A", resea1Address)).to.be.revertedWith("User already exists");
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
          const researchersCount = await userContract.userTypesCount(userTypes.Researcher);

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

          it("withdraw 1250000000000000000000000 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(resea1Address);
            const expectedBalance = 1250000000000000000000000n;

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

          it("withdraw 625000000000000000000000 tokens", async () => {
            const balanceOf = await regenerationCredit.balanceOf(resea1Address);
            const expectedBalance = 625000000000000000000000n;

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
      });

      context("when have time to validator analysis", () => {
        beforeEach(async () => {
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

      context("when do not have time to validator analysis", () => {
        beforeEach(async () => {
          await advanceBlock(20);
        });

        it("should return error message", async () => {
          await expect(addWork(resea1Address)).to.be.revertedWith("Wait until next era to add work");
        });
      });
    });
  });

  describe("addWorkValidation", () => {
    context("with validator", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator1Address, userTypes.Validator, owner);
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addResearcher("Researcher A", resea1Address);
      });

      context("with valid contribution", () => {
        context("when work must be invalidated", () => {
          beforeEach(async () => {
            await addWork(resea1Address);

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);
            await instance.connect(validator1Address).addWorkValidation(1, "justification");
            await instance.connect(validator2Address).addWorkValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const work = await instance.works(1);

            expect(work.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const work = await instance.works(1);

            expect(work.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await userContract.getUser(resea1Address);

            expect(userType).to.eq(userTypes.Researcher);
          });

          it("must remove one pool level from current era", async () => {
            const work = await instance.works(1);

            const eraLevels = await researcherPool.eraLevels(work.era, resea1Address);

            expect(eraLevels).to.eq(0);
          });
        });

        context("when work must not be invalidated", () => {
          beforeEach(async () => {
            await addWork(resea1Address);

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addWorkValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const work = await instance.works(1);

            expect(work.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const work = await instance.works(1);

            expect(work.invalidatedAt).to.eq(0);
          });

          it("researcher totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const work = await instance.works(1);

            const eraLevels = await researcherPool.eraLevels(work.era, resea1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when researcher reach max maxPenalties", () => {
        beforeEach(async () => {
          await addValidator(validator2Address);

          await addWork(resea1Address);
          await instance.connect(validator1Address).addWorkValidation(1, "justification");

          await advanceBlock(args.blocksPerEra);

          await addWork(resea1Address);
          await instance.connect(validator1Address).addWorkValidation(2, "justification");

          await advanceBlock(args.blocksPerEra);

          await addWork(resea1Address);
          await instance.connect(validator1Address).addWorkValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await userContract.getUser(resea1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid work", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addWork(resea1Address);

            await advanceBlock(args.blocksPerEra + 1);
          });

          it("should return error message", async () => {
            await expect(instance.connect(validator1Address).addWorkValidation(1, "justification")).to.be.revertedWith(
              "This work is not VALID"
            );
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addWork(resea1Address);

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addWorkValidation(1, "justification");
            await instance.connect(validator2Address).addWorkValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(instance.connect(validator3Address).addWorkValidation(1, "justification")).to.be.revertedWith(
              "This work is not VALID"
            );
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(instance.connect(validator1Address).addWorkValidation(0, "justification")).to.be.revertedWith(
              "This work is not VALID"
            );
          });
        });
      });
    });

    context("without validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addWorkValidation(1, "justification")).to.be.revertedWith(
          "Please register as validator"
        );
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

  describe("#removePoolLevels", () => {
    beforeEach(async () => {
      await addResearcher("Researcher  A", resea1Address);

      await addWork(resea1Address);

      await advanceBlock(timeBetweenWorks);

      await addWork(resea1Address);

      await instance.removePoolLevels(resea1Address, 1);
    });

    it("remove user levels from pool", async () => {
      const levelsEra1 = await researcherPool.eraLevels(1, resea1Address);

      expect(levelsEra1).to.equal(1);
    });

    it("remove user levels from researcher", async () => {
      const reseacher = await instance.getResearcher(resea1Address);

      expect(reseacher.pool.level).to.equal(1);
    });
  });
});
