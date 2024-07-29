const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("DeveloperContract", (accounts) => {
  let instance;
  let userContract;
  let developerPool;
  let rcToken;
  let validatorContract;
  let owner,
    dev1Address,
    dev2Address,
    dev3Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address;

  let developerPoolParams = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 30,
  };

  const validatorPoolargs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const addDeveloper = async (name, from) => {
    await instance.connect(from).addDeveloper(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const addValidator = async (from) => {
    await validatorContract.connect(from).addValidator();
  };

  const maxPenalties = 3;
  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  beforeEach(async () => {
    [
      owner,
      dev1Address,
      dev2Address,
      dev3Address,
      validator1Address,
      validator2Address,
      validator3Address,
      validator4Address,
    ] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();

    developerPoolFactory = await ethers.getContractFactory("DeveloperPool");
    developerPool = await developerPoolFactory.deploy(
      rcToken.target,
      developerPoolParams.halving,
      developerPoolParams.totalEras,
      developerPoolParams.blocksPerEra
    );

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    validatorPool = await validatorPoolFactory.deploy(
      rcToken.target,
      validatorPoolargs.halving,
      validatorPoolargs.totalEras,
      validatorPoolargs.blocksPerEra
    );

    const validatorContractFactory = await ethers.getContractFactory("ValidatorContract");
    validatorContract = await validatorContractFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    developerContractFactory = await ethers.getContractFactory("DeveloperContract");
    instance = await developerContractFactory.deploy(
      userContract.target,
      developerPool.target,
      validatorContract.target,
      maxPenalties
    );

    const validatorContractDependencies = {
      userContractAddress: userContract.target,
      producerContractAddress: ZERO_ADDRESS,
      validatorPoolAddress: validatorPool.target,
      inspectorContractAddress: userContract.target,
      developerContractAddress: instance.target,
      researcherContractAddress: ZERO_ADDRESS,
      contributorContractAddress: ZERO_ADDRESS,
    };

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);
    await userContract.newAllowedCaller(validatorContract.target);
    await developerPool.newAllowedCaller(instance.target);
    await validatorContract.newAllowedCaller(instance.target);
    await instance.newAllowedCaller(validatorContract.target);
    await rcToken.addContractPool(developerPool.target, "30000000000000000000000000");
    await validatorContract.setContractAddressDependencies(validatorContractDependencies);
    await addInvitation(owner, dev1Address, userTypes.Developer, owner);
  });

  describe(".fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developer = await instance.getDeveloper(dev1Address);

      expect(developer.id).to.equal("1");
      expect(developer.developerWallet).to.equal(dev1Address.address);
      expect(developer.userType).to.equal(4);
      expect(developer.name).to.equal("Developer A");
      expect(developer.proofPhoto).to.equal("photoURL");
      expect(developer.totalContributions).to.equal(0);
      expect(developer.pool.level).to.equal(0);
      expect(developer.pool.currentEra).to.equal(1);
    });
  });

  describe("#addDeveloper", () => {
    context("when is not invited", () => {
      it("should return error message", async () => {
        await expect(addDeveloper("Developer C", dev3Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is invited", () => {
      context("when developer exists", () => {
        it("should return error message", async () => {
          await addDeveloper("Developer A", dev1Address);

          await expect(addDeveloper("Developer A", dev1Address)).to.be.revertedWith("This developer already exist");
        });
      });

      context("when developer does not exist", () => {
        it("should add developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.developerWallet).to.equal(dev1Address.address);
        });

        it("should increment developersCount after create developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developersCount = await instance.developersCount();

          expect(developersCount).to.equal(1);
        });

        it("should add created developer in developerList (array)", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developers = await instance.getDevelopers();

          expect(developers[0].developerWallet).to.equal(dev1Address.address);
        });

        it("should add created developer in userType contract as a DEVELOPER", async () => {
          await addDeveloper("Developer A", dev1Address);

          const userType = await userContract.getUser(dev1Address);
          const DEVELOPER = 4;

          expect(userType).to.equal(DEVELOPER);
        });

        it("should add created developer with initial level equal 0", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.level).to.equal(0);
        });

        it("should add created developer with initial currentEra equal currentContractEra", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.currentEra).to.equal(1);
        });
      });
    });
  });

  describe("addContribution", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
    });

    context("with developer", () => {
      context("when already has contribution", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addContribution("report");
        });

        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).addContribution("report")).to.be.revertedWith(
            "Already has contribution"
          );
        });
      });

      context("when don't have contribution", () => {
        beforeEach(async () => {
          await instance.connect(dev1Address).addContribution("report");
        });

        it("add contribution", async () => {
          const construbution = await instance.contributions(1);

          expect(construbution.id).to.equal(1);
          expect(construbution.era).to.equal(1);
          expect(construbution.developer).to.equal(dev1Address.address);
          expect(construbution.report).to.equal("report");
          expect(construbution.validationsCount).to.equal(0);
          expect(construbution.contributed).to.equal(true);
          expect(construbution.valid).to.equal(true);
        });

        it("increment contributionsCount", async () => {
          const contributionsCount = await instance.contributionsCount();

          expect(contributionsCount).to.equal(1);
        });

        it("add level to developer", async () => {
          const developer = await instance.getDeveloper(dev1Address);

          expect(developer.pool.level).to.equal(1);
        });

        it("add level to era", async () => {
          const eraLevels = await developerPool.eraLevels(1, dev1Address);

          expect(eraLevels).to.equal(1);
        });
      });
    });

    context("without developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addContribution("report")).to.be.revertedWith("Only Developer");
      });
    });
  });

  describe("#getContribution", () => {
    beforeEach(async () => {
      await addDeveloper("Developer A", dev1Address);
      await instance.connect(dev1Address).addContribution("report");
    });

    it("should have fields", async () => {
      const contribution = await instance.getContribution(1);

      expect(contribution.id).to.equal("1");
      expect(contribution.era).to.equal("1");
      expect(contribution.developer).to.equal(dev1Address.address);
      expect(contribution.level).to.equal("0"); // TODO: Remover esse campo pois não vai ser mais utilizado
      expect(contribution.report).to.equal("report");
      expect(contribution.validationsCount).to.equal("0");
      expect(contribution.contributed).to.equal(true);
      expect(contribution.valid).to.equal(true);
      expect(contribution.invalidatedAt).to.equal("0");
    });
  });

  describe("addContributionValidation", () => {
    context("with validator", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator1Address, userTypes.Validator, owner);
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addDeveloper("Developer A", dev1Address);
      });

      context("with valid contribution", () => {
        context("when contribution must be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addContribution("report");

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addContributionValidation(1, "justification");
            await instance.connect(validator2Address).addContributionValidation(1, "justification");
          });

          it("set valid field to false", async () => {
            const construbution = await instance.contributions(1);

            expect(construbution.valid).to.eq(false);
          });

          it("populate invalidatedAt field", async () => {
            const construbution = await instance.contributions(1);

            expect(construbution.invalidatedAt).to.above(0);
          });

          it("set maxPenalties to developer", async () => {
            const totalPenalties = await instance.totalPenalties(dev1Address);

            expect(totalPenalties).to.eq(1);
          });

          it("user type must be DEVELOPER yet", async () => {
            const userType = await userContract.getUser(dev1Address);

            expect(userType).to.eq(userTypes.Developer);
          });

          it("must remove one pool level from current era", async () => {
            const construbution = await instance.contributions(1);
            const eraLevels = await developerPool.eraLevels(construbution.era, dev1Address);

            expect(eraLevels).to.eq(0);
          });
        });

        context("when contribution must not be invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addContribution("report");

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addContributionValidation(1, "justification");
          });

          it("valid field is true", async () => {
            const construbution = await instance.contributions(1);

            expect(construbution.valid).to.eq(true);
          });

          it("invalidatedAt is equal 0", async () => {
            const construbution = await instance.contributions(1);

            expect(construbution.invalidatedAt).to.eq(0);
          });

          it("developer totalPenalties is 0", async () => {
            const totalPenalties = await instance.totalPenalties(dev1Address);

            expect(totalPenalties).to.eq(0);
          });

          it("developer pool level is 1", async () => {
            const construbution = await instance.contributions(1);
            const eraLevels = await developerPool.eraLevels(construbution.era, dev1Address);

            expect(eraLevels).to.eq(1);
          });
        });
      });

      context("when developer reach max maxPenalties", () => {
        beforeEach(async () => {
          await addValidator(validator2Address);

          await instance.connect(dev1Address).addContribution("report");
          await instance.connect(validator1Address).addContributionValidation(1, "justification");

          await advanceBlock(developerPoolParams.blocksPerEra);

          await instance.connect(dev1Address).addContribution("report");
          await instance.connect(validator1Address).addContributionValidation(2, "justification");

          await advanceBlock(developerPoolParams.blocksPerEra);

          await instance.connect(dev1Address).addContribution("report");
          await instance.connect(validator1Address).addContributionValidation(3, "justification");
        });

        it("user type must be DENIED", async () => {
          const userType = await userContract.getUser(dev1Address);

          expect(userType).to.eq(userTypes.Denied);
        });
      });

      context("with invalid contribution", () => {
        context("when current era is different from contribution created era", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addContribution("report");

            await advanceBlock(developerPoolParams.blocksPerEra + 1);
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(validator1Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution is invalidated", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addContribution("report");

            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addContributionValidation(1, "justification");
            await instance.connect(validator2Address).addContributionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(validator3Address).addContributionValidation(1, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });

        context("when contribution do not exists", () => {
          it("should return error message", async () => {
            await expect(
              instance.connect(validator1Address).addContributionValidation(0, "justification")
            ).to.be.revertedWith("This contribution is not VALID");
          });
        });
      });
    });

    context("without validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(owner).addContributionValidation(1, "justification")).to.be.revertedWith(
          "Please register as validator"
        );
      });
    });
  });

  describe("#getDevelopers", () => {
    beforeEach(async () => {
      await addInvitation(owner, dev2Address, userTypes.Developer, owner);
    });
    it("should return developers when has developers", async () => {
      await addDeveloper("Developer A", dev1Address);
      await addDeveloper("Developer B", dev2Address);

      const developers = await instance.getDevelopers();

      expect(developers.length).to.equal(2);
    });

    it("should return developers equal zero when dont has it", async () => {
      const developers = await instance.getDevelopers();

      expect(developers.length).to.equal(0);
    });
  });

  describe("#getDeveloper", () => {
    it("should return a developer", async () => {
      await addDeveloper("Developer A", dev1Address);

      const developer = await instance.getDeveloper(dev1Address);

      expect(developer.developerWallet).to.equal(dev1Address.address);
    });
  });

  describe("#developerExists", () => {
    it("should return true when exists", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developerExists = await instance.developerExists(dev1Address);

      expect(developerExists).to.equal(true);
    });

    it("it should return false when don't exists", async () => {
      const developerExists = await instance.developerExists(dev1Address);

      expect(developerExists).to.equal(false);
    });
  });

  describe("#withdraw", () => {
    context("when is developer", () => {
      beforeEach(async () => {
        await addDeveloper("Developer A", dev1Address);
      });

      context("when can withdraw tokens", () => {
        context("when is unique developer in era with 1 level", () => {
          context("when Developer is in era 1 and contract is in era 2", () => {
            beforeEach(async () => {
              await instance.connect(dev1Address).addContribution("report");

              await advanceBlock(developerPoolParams.blocksPerEra + 2);
              await instance.connect(dev1Address).withdraw();
            });

            it("should add developer to era 2", async () => {
              const developer = await instance.getDeveloper(dev1Address);

              expect(developer.pool.currentEra).to.equal(2);
            });

            it("should withdraw all tokens from era", async () => {
              let balanceOf = await rcToken.balanceOf(dev1Address);

              let tokensBalance = 1200000000000000000000000n;

              expect(balanceOf).to.equal(tokensBalance);
            });
          });
        });

        context("when has two devs in the era", () => {
          beforeEach(async () => {
            await addInvitation(owner, dev2Address, userTypes.Developer, owner);
            await addDeveloper("Developer B", dev2Address);
          });

          context("with same levels", () => {
            context("when Developers is in era 1 and contract is in era 2", () => {
              beforeEach(async () => {
                await instance.connect(dev1Address).addContribution("report");
                await instance.connect(dev2Address).addContribution("report");

                await advanceBlock(developerPoolParams.blocksPerEra + 2);
                await instance.connect(dev1Address).withdraw();
                await instance.connect(dev2Address).withdraw();
              });

              it("should add developer1 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("should add developer2 to era 2", async () => {
                const developer = await instance.getDeveloper(dev1Address);

                expect(developer.pool.currentEra).to.equal(2);
              });

              it("developer1 balance must be 600000000000000000000000", async () => {
                let balanceOf = await rcToken.balanceOf(dev1Address);

                let tokensPerEra = 600000000000000000000000n;

                expect(balanceOf).to.equal(tokensPerEra);
              });

              it("developer2 balance must be 600000000000000000000000", async () => {
                let balanceOf = await rcToken.balanceOf(dev2Address);

                let tokensPerEra = 600000000000000000000000n;

                expect(balanceOf).to.equal(tokensPerEra);
              });
            });
          });
        });

        context("when can withdraw only to one era and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addContribution("report");
            await advanceBlock(developerPoolParams.blocksPerEra + 2);
            await instance.connect(dev1Address).withdraw();
          });

          it("should return error message", async () => {
            await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
          });
        });

        context("when can withdraw to two eras and try withdraw again", () => {
          beforeEach(async () => {
            await instance.connect(dev1Address).addContribution("report");
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).addContribution("report");
            await advanceBlock(developerPoolParams.blocksPerEra + 2);

            await instance.connect(dev1Address).withdraw();
            await instance.connect(dev1Address).withdraw();
          });

          it("should can withdraw in two eras", async () => {
            let balanceOf = await rcToken.balanceOf(dev1Address);
            let tokensPerEra = 2400000000000000000000000n;

            expect(balanceOf).to.equal(tokensPerEra);
          });
        });
      });

      context("when can't withdraw tokens", () => {
        it("should return error message", async () => {
          await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });
    });

    context("when is not developer", () => {
      it("should return error message", async () => {
        await expect(instance.connect(dev1Address).withdraw()).to.be.revertedWith("Pool only to developer");
      });
    });
  });
});
