const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("ResearcherRules", () => {
  let instance;
  let regenerationCredit;
  let researcherPool;
  let communityRules;
  let validatorRules;
  let validatorPool;
  let owner, resea1Address, resea2Address, validator1Address, validator2Address, validator3Address, validator4Address;

  const timeBetweenWorks = 10;
  const maxPenalties = 3;
  const securityBlocksToValidatorAnalysis = 10;
  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  const args = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 60,
  };

  const validatorPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 60,
  };

  const addResearcher = async (name, from) => {
    await instance.connect(from).addResearcher(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const addValidator = async (from) => {
    await validatorRules.connect(from).addValidator();
  };

  const addResearch = async (from) => {
    await instance.connect(from).addResearch("title", "thesis", "fileURL");
  };

  const addCalculatorItem = async (from) => {
    await instance.connect(from).addCalculatorItem("title", "kg", "justification", 1);
  };

  beforeEach(async () => {
    [owner, resea1Address, resea2Address, validator1Address, validator2Address, validator3Address, validator4Address] =
      await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    communityRules = await communityRulesDeployed();

    const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    researcherPool = await researcherPoolFactory.deploy(regenerationCredit.target, args.halving, args.blocksPerEra);

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    validatorPool = await validatorPoolFactory.deploy(
      regenerationCredit.target,
      validatorPoolArgs.halving,
      validatorPoolArgs.blocksPerEra
    );

    const validatorRulesFactory = await ethers.getContractFactory("ValidatorRules");
    validatorRules = await validatorRulesFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    const instanceFactory = await ethers.getContractFactory("ResearcherRules");
    instance = await instanceFactory.deploy(
      communityRules.target,
      researcherPool.target,
      validatorRules.target,
      timeBetweenWorks,
      maxPenalties,
      securityBlocksToValidatorAnalysis
    );

    const validatorRulesDependencies = {
      communityRulesAddress: communityRules.target,
      regeneratorRulesAddress: ZERO_ADDRESS,
      validatorPoolAddress: validatorPool.target,
      inspectorRulesAddress: ZERO_ADDRESS,
      developerRulesAddress: ZERO_ADDRESS,
      researcherRulesAddress: instance.target,
      contributorRulesAddress: ZERO_ADDRESS,
      activistRulesAddress: ZERO_ADDRESS,
    };

    await validatorRules.setContractAddressDependencies(validatorRulesDependencies);

    await communityRules.newAllowedCaller(validatorRules.target);
    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(owner);
    await researcherPool.newAllowedCaller(instance.target);
    await validatorPool.newAllowedCaller(validatorRules.target);
    await validatorRules.newAllowedCaller(instance.target);
    await validatorRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(validatorRules.target);
    await instance.newAllowedCaller(owner);
    await regenerationCredit.addContractPool(researcherPool.target, args.totalTokens);

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
          const researchersCount = await communityRules.userTypesCount(userTypes.Researcher);

          expect(researchersCount).to.equal(1);
        });

        it("add created researcher in userType contract as a RESEARCHER", async () => {
          const userType = await communityRules.getUser(resea1Address);
          const RESEARCHER = 3;

          expect(userType).to.equal(RESEARCHER);
        });

        it("add created researcher with 0 published researches", async () => {
          const researcher = await instance.getResearcher(resea1Address);

          expect(researcher.publishedResearches).to.equal(0);
        });
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
            await addResearch(resea1Address);

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
            await addResearch(resea1Address);
            await addResearch(resea2Address);

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

  describe("#addResearch", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(addResearch(owner)).to.be.revertedWith("Only allowed to researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
      });

      context("when have time to validator analysis", () => {
        beforeEach(async () => {
          await addResearch(resea1Address);
        });

        context("when have waited time between researches", () => {
          it("add a research", async () => {
            const firstResearch = await instance.researchesCount();

            expect(firstResearch).to.equal(1);
          });

          it("add 1 to researcher publishedResearches", async () => {
            const researcher = await instance.getResearcher(resea1Address);

            expect(researcher.publishedResearches).to.equal(1);
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

              await addResearch(resea1Address);
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
            await expect(addResearch(resea1Address)).to.be.revertedWith("Can't publish yet");
          });
        });
      });

      context("when do not have time to validator analysis", () => {
        beforeEach(async () => {
          await advanceBlock(40);
        });

        it("should return error message", async () => {
          await expect(addResearch(resea1Address)).to.be.revertedWith("Wait until next era to add research");
        });
      });
    });
  });

  describe("#getResearch", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
      await addResearch(resea1Address);
    });

    it("should have fields", async () => {
      const research = await instance.getResearch(1);

      expect(research.id).to.equal("1");
      expect(research.era).to.equal("1");
      expect(research.createdBy).to.equal(resea1Address.address);
      expect(research.title).to.equal("title");
      expect(research.thesis).to.equal("thesis");
      expect(research.file).to.equal("fileURL");
      expect(research.validationsCount).to.equal("0");
      expect(research.valid).to.equal(true);
      expect(research.invalidatedAt).to.equal("0");
    });
  });

  describe("#getResearchesIds", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
      await addResearch(resea1Address);
    });

    it("should have id associated", async () => {
      const userIds = await instance.connect(resea2Address).getResearchesIds(resea1Address);

      expect(userIds.length).to.equal(1);
    });
  });

  describe("addResearchValidation", () => {
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
        context("when research must be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);
            await instance.connect(validator1Address).addResearchValidation(1, "justification");
            await instance.connect(validator2Address).addResearchValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to reseacher", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be RESEARCHER yet", async () => {
            const userType = await communityRules.getUser(resea1Address);

            expect(userType).to.eq(userTypes.Researcher);
          });

          it("must remove one pool level from current era", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(0);
          });

          it("must decrement researchesCount in one", async () => {
            const researchesTotalCount = await instance.researchesTotalCount();

            expect(researchesTotalCount).to.eq(0);
          });
        });

        context("when research must not be invalidated", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addResearchValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const research = await instance.researches(1);

            expect(research.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const research = await instance.researches(1);

            expect(research.invalidatedAt).to.eq(0);
          });

          it("researcher totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(resea1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("reseacher pool level is 1", async () => {
            const research = await instance.researches(1);

            const eraLevels = await researcherPool.eraLevels(research.era, resea1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when researcher reach max maxPenalties", () => {
        beforeEach(async () => {
          await addValidator(validator2Address);

          await validatorRules.connect(validator1Address).declareAlive();
          await validatorRules.connect(validator2Address).declareAlive();

          await addResearch(resea1Address);
          await instance.connect(validator1Address).addResearchValidation(1, "justification");

          await advanceBlock(args.blocksPerEra);

          await validatorRules.connect(validator1Address).declareAlive();

          await addResearch(resea1Address);
          await instance.connect(validator1Address).addResearchValidation(2, "justification");

          await advanceBlock(args.blocksPerEra);

          await validatorRules.connect(validator1Address).declareAlive();

          await addResearch(resea1Address);

          await instance.connect(validator1Address).addResearchValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await communityRules.getUser(resea1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid research", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await addResearch(resea1Address);

            await advanceBlock(args.blocksPerEra + 1);
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(validator1Address).addResearchValidation(1, "justification")
            ).to.be.revertedWith("This research is not VALID");
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await validatorRules.connect(validator1Address).declareAlive();
            await validatorRules.connect(validator2Address).declareAlive();
            await validatorRules.connect(validator4Address).declareAlive();

            await advanceBlock(validatorPoolArgs.blocksPerEra);

            await addResearch(resea1Address);

            await instance.connect(validator1Address).addResearchValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(validator3Address).addResearchValidation(1, "justification")
            ).to.be.revertedWith("This research is not VALID");
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(
              instance.connect(validator1Address).addResearchValidation(0, "justification")
            ).to.be.revertedWith("This research is not VALID");
          });
        });
      });
    });

    context("without validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addResearchValidation(1, "justification")).to.be.revertedWith(
          "Please register as validator"
        );
      });
    });
  });

  describe("#getResearches", () => {
    beforeEach(async () => {
      await addResearcher("Researcher A", resea1Address);
      await addResearch(resea1Address);
    });
  });

  describe("#removePoolLevels", () => {
    beforeEach(async () => {
      await addResearcher("Researcher  A", resea1Address);

      await addResearch(resea1Address);

      await advanceBlock(timeBetweenWorks);

      await addResearch(resea1Address);

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

  describe("#addCalculatorItem", () => {
    context("when is not a researcher", () => {
      it("should return error", async () => {
        await expect(addCalculatorItem(owner)).to.be.revertedWith("Only allowed to researchers");
      });
    });

    context("when is a researcher", () => {
      beforeEach(async () => {
        await addResearcher("Researcher A", resea1Address);
        await addCalculatorItem(resea1Address);
      });

      context("when have waited time between calculatorItems", () => {
        it("add an calculatorItem", async () => {
          const firstCalculatorItem = await instance.calculatorItemsCount();

          expect(firstCalculatorItem).to.equal(1);
        });
      });

      context("when have not waited time between calculatorItems", () => {
        it("should return error message", async () => {
          await expect(addCalculatorItem(resea1Address)).to.be.revertedWith("Can't publish yet");
        });
      });
    });
  });
});
