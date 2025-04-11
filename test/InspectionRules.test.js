const { userTypes } = require("./shared/user_types");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");
const { inspectionRulesDeployed } = require("./shared/inspection_rules_deployed.js");

describe("InspectionRules", () => {
  let instance;
  let communityRules;
  let inspectorRules;
  let regeneratorRules;
  let researcherRules;
  let activistRules;
  let regeneratorPool;
  let activistPool;

  let owner,
    regeneratorAddress,
    regenerator2Address,
    regenerator3Address,
    regenerator4Address,
    inspectorAddress,
    inspector2Address,
    inspector3Address,
    inspector4Address,
    inspector5Address,
    inspector6Address,
    inspector7Address,
    inspector8Address,
    inspector9Address,
    inspector10Address,
    inspector11Address,
    inspector12Address,
    resea1Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    activist1Address;

  const STATUS = {
    open: 0,
    accepted: 1,
    inspected: 2,
    expired: 3,
    invalidated: 4,
  };

  const USER_TYPES = {
    denied: 9,
  };

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    blocksPerEra: 500,
  };

  const sintropArgs = {
    timeBetweenInspections: 20,
    blocksToExpireAcceptedInspection: 50,
    allowedInitialRequests: 1,
    acceptInspectionDelayBlocks: 5,
    securityBlocksToValidatorAnalysis: 100,
  };

  const addRegenerator = async (name, from) => {
    await regeneratorRules.connect(from).addRegenerator(1000, name, "photoURL", coordinates());
  };

  const coordinates = () => {
    return [
      {
        latitude: "-22.912554",
        longitude: "-44.4925355",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912555",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925373",
      },
    ];
  };

  const addInspector = async (name, from) => {
    await inspectorRules.connect(from).addInspector(name, "photoURL");
  };

  const addActivist = async (name, from) => {
    await activistRules.connect(from).addActivist(name, "photoURL");
  };

  const addResearcher = async (name, from) => {
    await researcherRules.connect(from).addResearcher(name, "photoURL");
  };

  const addValidator = async (from) => {
    await validatorRules.connect(from).addValidator();
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const treesResultValue = 10;

  const biodiversityResultValue = 10;

  const report = "Hash";

  const requestInspection = async (from) => {
    await instance.connect(from).requestInspection();
  };

  const acceptInspection = async (inspectionId, from) => {
    await instance.connect(from).acceptInspection(inspectionId);
  };

  const realizeInspection = async (id, report, treesResult, biodiversityResult, from) => {
    const proofPhoto = "proofPhoto";

    await instance.connect(from).realizeInspection(id, proofPhoto, report, treesResult, biodiversityResult);
  };

  beforeEach(async () => {
    [
      owner,
      regeneratorAddress,
      regenerator2Address,
      regenerator3Address,
      regenerator4Address,
      inspectorAddress,
      inspector2Address,
      inspector3Address,
      inspector4Address,
      inspector5Address,
      inspector6Address,
      inspector7Address,
      inspector8Address,
      inspector9Address,
      inspector10Address,
      inspector11Address,
      inspector12Address,
      resea1Address,
      validator1Address,
      validator2Address,
      validator3Address,
      validator4Address,
      activist1Address,
    ] = await ethers.getSigners();

    const deployed = await inspectionRulesDeployed(owner, {
      sintropArgs: sintropArgs,
    });

    regenerationCredit = deployed.regenerationCredit;
    communityRules = deployed.communityRules;
    researcherPool = deployed.researcherPool;
    inspectorPool = deployed.inspectorPool;
    regeneratorPool = deployed.regeneratorPool;
    validatorPool = deployed.validatorPool;
    activistPool = deployed.activistPool;
    validatorRules = deployed.validatorRules;
    inspectorRules = deployed.inspectorRules;
    researcherRules = deployed.researcherRules;
    regeneratorRules = deployed.regeneratorRules;
    activistRules = deployed.activistRules;
    regenerationIndexRules = deployed.regenerationIndexRules;
    instance = deployed.instance;

    await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
    await addResearcher("Researcher 1", resea1Address);
  });

  describe("#getInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when inspection exists", () => {
      beforeEach(async () => {
        await instance.connect(regeneratorAddress).requestInspection();
      });

      it("should return inspection", async () => {
        const inspection = await instance.getInspection(1);

        expect(inspection.id).to.equal(1);
      });
    });

    context("when inspection dont exists", () => {
      it("should return inspection", async () => {
        const inspection = await instance.getInspection(1);

        expect(inspection.id).to.equal(0);
      });
    });
  });

  describe("#requestInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);
      await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector3Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector4Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector5Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector6Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector7Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector8Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector9Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector10Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector11Address, userTypes.Inspector, owner);
      await addInvitation(owner, inspector12Address, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
      await addInspector("Inspector B", inspector2Address);
      await addInspector("Inspector C", inspector3Address);
      await addInspector("Inspector D", inspector4Address);
      await addInspector("Inspector E", inspector5Address);
      await addInspector("Inspector F", inspector6Address);
      await addInspector("Inspector G", inspector7Address);
      await addInspector("Inspector H", inspector8Address);
      await addInspector("Inspector I", inspector9Address);
      await addInspector("Inspector J", inspector10Address);
      await addInspector("Inspector K", inspector11Address);
      await addInspector("Inspector L", inspector12Address);
    });

    context("with regenerator", () => {
      beforeEach(async () => {
        await requestInspection(regeneratorAddress);
        await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
      });

      context("when have less than ALLOWED_INITIAL_REQUESTS", () => {
        it("should request inspection", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.regenerator).to.equal(regeneratorAddress.address);
        });
      });

      context("when have more than ALLOWED_INITIAL_REQUESTS", () => {
        context("when has request OPEN or ACCEPTED", () => {
          it("should return error message", async () => {
            await expect(requestInspection(regeneratorAddress)).to.be.revertedWith("Request already OPEN");
          });
        });

        context("when don't has request OPEN or ACCEPTED", () => {
          beforeEach(async () => {
            await acceptInspection(1, inspectorAddress);

            const treesResultValue = 15;
            const biodiversityResultValue = 51;

            await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
          });

          context("when last request is recent", () => {
            it("should return error message", async () => {
              await expect(requestInspection(regeneratorAddress)).to.be.revertedWith("Wait to request");
            });
          });

          context("when last request is not recent", () => {
            it("should request inspection", async () => {
              await advanceBlock(20);

              await requestInspection(regeneratorAddress);
              const inspection = await instance.getInspection(2);

              expect(inspection.regenerator).to.equal(regeneratorAddress.address);
            });
          });
        });
      });

      context("when reached maximum inspections", () => {
        beforeEach(async () => {
          const treesResultValue = 15;
          const biodiversityResultValue = 51;

          await acceptInspection(1, inspectorAddress);
          await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(2, inspector2Address);
          await realizeInspection(2, report, treesResultValue, biodiversityResultValue, inspector2Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(3, inspector3Address);
          await realizeInspection(3, report, treesResultValue, biodiversityResultValue, inspector3Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(4, inspector4Address);
          await realizeInspection(4, report, treesResultValue, biodiversityResultValue, inspector4Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(5, inspector5Address);
          await realizeInspection(5, report, treesResultValue, biodiversityResultValue, inspector5Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(6, inspector6Address);
          await realizeInspection(6, report, treesResultValue, biodiversityResultValue, inspector6Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(7, inspector7Address);
          await realizeInspection(7, report, treesResultValue, biodiversityResultValue, inspector7Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(8, inspector8Address);
          await realizeInspection(8, report, treesResultValue, biodiversityResultValue, inspector8Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(9, inspector9Address);
          await realizeInspection(9, report, treesResultValue, biodiversityResultValue, inspector9Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(10, inspector10Address);
          await realizeInspection(10, report, treesResultValue, biodiversityResultValue, inspector10Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(11, inspector11Address);
          await realizeInspection(11, report, treesResultValue, biodiversityResultValue, inspector11Address);

          await advanceBlock(20);
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await advanceBlock(200);
          await acceptInspection(12, inspector12Address);
          await realizeInspection(12, report, treesResultValue, biodiversityResultValue, inspector12Address);
        });

        it("should return error", async () => {
          await advanceBlock(20);
          await expect(requestInspection(regeneratorAddress)).to.be.revertedWith("You have completed your mission");
        });
      });

      describe("#afterRequestInspection", () => {
        it("initial status should be equal OPEN", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.status).to.equal(STATUS.open);
        });

        it("must set regenerator as regenerator address", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.regenerator).to.equal(regeneratorAddress.address);
        });

        it("must set inspector as zero address", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.inspector).to.equal(ZERO_ADDRESS);
        });

        it("initial regenerationScore should be equal zero", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.regenerationScore).to.equal(0);
        });

        it("should increment total of inspections", async () => {
          const inspectionsCount = await instance.inspectionsCount();

          expect(inspectionsCount).to.equal(1);
        });

        it("should set to true regenerator pendingInspection", async () => {
          const regenerator = await regeneratorRules.getRegenerator(regeneratorAddress);

          expect(regenerator.pendingInspection).to.equal(true);
        });
      });
    });

    context("with non regenerator", () => {
      context("when is not regenerator and try request inspection", () => {
        it("should return message error", async () => {
          await expect(instance.requestInspection()).to.be.revertedWith("Please register as regenerator");
        });
      });
    });
  });

  describe("#acceptInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await requestInspection(regeneratorAddress);
        });

        context("when have not waited inspection delay time", () => {
          it("should return error message", async () => {
            await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Wait inspection delay blocks");
          });
        });

        context("when do not have security blocks to validator analysis", () => {
          context("when nextEraIn is less than blocksToExpireAcceptedInspection", () => {
            beforeEach(async () => {
              const nextEraIn = await regeneratorRules.nextEraIn();
              const blocks = parseInt(nextEraIn) - sintropArgs.blocksToExpireAcceptedInspection;

              await advanceBlock(blocks);
            });

            it("should return error message", async () => {
              await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Wait until next era to accept");
            });
          });

          context("when nextEraIn is bigger than blocksToExpireAcceptedInspection", () => {
            beforeEach(async () => {
              const nextEraIn = await regeneratorRules.nextEraIn();

              const blocks = parseInt(nextEraIn) - sintropArgs.blocksToExpireAcceptedInspection - 20;
              await advanceBlock(blocks);
            });

            it("should return error message", async () => {
              await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Wait until next era to accept");
            });
          });
        });

        context("when have waited inspection delay time", () => {
          it("should accept with success", async () => {
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(1, inspectorAddress);
            const inspection = await instance.getInspection(1);
            expect(inspection.status).to.equal(STATUS.accepted);
          });
        });

        context("when inspector has less than 3 giveups", () => {
          it("should accept with success", async () => {
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(1, inspectorAddress);
            const inspection = await instance.getInspection(1);
            expect(inspection.status).to.equal(STATUS.accepted);
          });
        });

        context("when inspector has more than 3 giveups", () => {
          beforeEach(async () => {
            await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
            await addInvitation(owner, regenerator3Address, userTypes.Regenerator, owner);
            await addInvitation(owner, regenerator4Address, userTypes.Regenerator, owner);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);

            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(1, inspectorAddress);
            await advanceBlock(sintropArgs.blocksToExpireAcceptedInspection);

            await requestInspection(regenerator2Address);
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(2, inspectorAddress);
            await advanceBlock(sintropArgs.blocksToExpireAcceptedInspection);

            await requestInspection(regenerator3Address);
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(3, inspectorAddress);
            await advanceBlock(sintropArgs.blocksToExpireAcceptedInspection);

            await requestInspection(regenerator4Address);
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          });

          it("should return error message", async () => {
            await expect(acceptInspection(4, inspectorAddress)).to.be.revertedWith("No more than 3 giveUps allowed");
          });
        });

        context("when never realized inspection from regenerator", () => {
          context("when inspection is OPEN", () => {
            beforeEach(async () => {
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await acceptInspection(1, inspectorAddress);
            });

            it("accept inspection with success", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.status).to.equal(STATUS.accepted);
            });

            it("inspector must be inspectorAddress", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.inspector).to.equal(inspectorAddress.address);
            });

            it("should increment inspector giveUps by 1", async () => {
              const inspector = await inspectorRules.getInspector(inspectorAddress);

              expect(inspector.giveUps).to.equal("1");
            });

            it("Set last inspectionId to accepted inspection 1", async () => {
              const inspector = await inspectorRules.getInspector(inspectorAddress);

              expect(inspector.lastInspection).to.equal("1");
            });
          });

          context("when inspection is not OPEN", () => {
            beforeEach(async () => {
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
              await acceptInspection(1, inspectorAddress);
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expect(acceptInspection(1, inspector2Address)).to.be.revertedWith("This inspection is not OPEN");
            });
          });

          context("when have accepted other inspection", () => {
            beforeEach(async () => {
              await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
              await addRegenerator("Regenerator B", regenerator2Address);
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await acceptInspection(1, inspectorAddress);
              await requestInspection(regenerator2Address);
            });

            context("when last inspection is not expired", () => {
              it("should return error message", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith(
                  "You already have an inspection Accepted"
                );
              });
            });

            context("when last inspection is expired", () => {
              beforeEach(async () => {
                await advanceBlock(sintropArgs.blocksToExpireAcceptedInspection);
                await acceptInspection(2, inspectorAddress);
              });

              it("should accept inspection with success after blocksToExpireAcceptedInspection", async () => {
                const inspection = await instance.getInspection(2);

                expect(inspection.status).to.equal(STATUS.accepted);
              });
            });

            context("when have finished last inspection", () => {
              beforeEach(async () => {
                await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
                await realizeInspection(1, "", treesResultValue, biodiversityResultValue, inspectorAddress);
                await acceptInspection(2, inspectorAddress);
              });

              it("should accept inspection with success after finishing previous one", async () => {
                const inspection = await instance.getInspection(2);

                expect(inspection.status).to.equal(STATUS.accepted);
              });
            });

            context("when dont finished last inspection", () => {
              it("should return error message", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith(
                  "You already have an inspection Accepted"
                );
              });
            });
          });
        });

        context("when already realized inspection from regenerator", () => {
          beforeEach(async () => {
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(1, inspectorAddress);
            await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);

            await advanceBlock(20);

            await requestInspection(regeneratorAddress);
          });

          it("should return error message", async () => {
            await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith(
              "Already inspected this regenerator"
            );
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("This inspection do not exist");
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await requestInspection(regeneratorAddress);
        await expect(acceptInspection(1, regeneratorAddress)).to.be.revertedWith("Please register as inspector");
      });
    });
  });

  describe("#realizeInspection", () => {
    beforeEach(async () => {
      await communityRules.newAllowedCaller(activist1Address);
      await addInvitation(owner, activist1Address, userTypes.Activist, owner);
      await addActivist("Activist 1", activist1Address);
      await addInvitation(activist1Address, regeneratorAddress, userTypes.Regenerator, activist1Address);
      await addInvitation(activist1Address, inspectorAddress, userTypes.Inspector, activist1Address);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
        });

        context("when inspection is accepted", () => {
          beforeEach(async () => {
            await acceptInspection(1, inspectorAddress);
          });

          context("when is accepted by inspector", () => {
            context("when inspection is expired", () => {
              beforeEach(async () => {
                await advanceBlock(sintropArgs.blocksToExpireAcceptedInspection);
              });

              it("should return error message", async () => {
                await expect(
                  realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
                ).to.be.revertedWith("Inspection Expired");
              });
            });

            context("when inspection is not expired", () => {
              context("when pass regenerationInspection equal 4 regenerationIndex size", () => {
                describe(".setActivistLevel", () => {
                  context("when regenerator do not win minimum inspection", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("Activist must do not win levels", async () => {
                      const activist = await activistRules.getActivist(activistRules);

                      expect(activist.pool.level).to.equal(0);
                    });

                    it("Activist pool win 0 level to activist", async () => {
                      const levels = await activistPool.eraLevels(4, activist1Address);

                      expect(levels).to.equal(0);
                    });
                  });

                  context("when inspector do not win minimum inspection", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("Activist must do not win levels", async () => {
                      const activist = await activistRules.getActivist(activistRules);

                      expect(activist.pool.level).to.equal(0);
                    });

                    it("Activist pool win 0 level to activist", async () => {
                      const levels = await activistPool.eraLevels(4, activist1Address);

                      expect(levels).to.equal(0);
                    });
                  });

                  context("when regenerator win minimum inspection", () => {
                    beforeEach(async () => {
                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0);
                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0);
                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("Activist must win 1 level", async () => {
                      const activist = await activistRules.getActivist(activist1Address);

                      expect(activist.pool.level).to.equal(1);
                    });

                    it("Activist pool win 1 level to activist", async () => {
                      const levels = await activistPool.eraLevels(4, activist1Address);

                      expect(levels).to.equal(1);
                    });
                  });

                  context("when inspector win minimum inspection", () => {
                    beforeEach(async () => {
                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 1);
                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 1);

                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress);
                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress);

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("Activist must win 1 level", async () => {
                      const activist = await activistRules.getActivist(activist1Address);

                      expect(activist.pool.level).to.equal(1);
                    });

                    it("Activist pool win 1 level to activist", async () => {
                      const levels = await activistPool.eraLevels(4, activist1Address);

                      expect(levels).to.equal(1);
                    });
                  });

                  context("when regenerator and inspector win minimum inspection", () => {
                    beforeEach(async () => {
                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0);
                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0);

                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 1);
                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 1);

                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress);
                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress);
                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("Activist must win 1 level", async () => {
                      const activist = await activistRules.getActivist(activist1Address);

                      expect(activist.pool.level).to.equal(2);
                    });

                    it("Activist pool win 1 level to activist", async () => {
                      const levels = await activistPool.eraLevels(4, activist1Address);

                      expect(levels).to.equal(2);
                    });
                  });
                });

                context("when check inspection", () => {
                  beforeEach(async () => {
                    await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                  });

                  it("should change inspection status to INSPECTED", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.status).to.equal(STATUS.inspected);
                  });

                  it("should set inspectionsTreesImpact", async () => {
                    const inspectionsTreesImpact = await instance.inspectionsTreesImpact();

                    expect(inspectionsTreesImpact).to.equal(10);
                  });

                  it("should set inspectionsBiodiversityImpact", async () => {
                    const inspectionsBiodiversityImpact = await instance.inspectionsBiodiversityImpact();

                    expect(inspectionsBiodiversityImpact).to.equal(10);
                  });

                  it("populate inspection inspectedAt", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.inspectedAtEra).to.equal(1);
                  });

                  it("should decrease inspector giveUps by 1", async () => {
                    const inspector = await inspectorRules.getInspector(inspectorAddress);

                    expect(inspector.giveUps).to.equal("0");
                  });

                  it("should add regenerationScore in regenerator", async () => {
                    const inspection = await instance.getInspection(1);
                    const regenerator = await regeneratorRules.getRegenerator(regeneratorAddress);

                    expect(inspection.regenerationScore).to.equal(regenerator.regenerationScore.score);
                  });

                  it("should set regenerator pendingInspection to false", async () => {
                    const regenerator = await regeneratorRules.getRegenerator(regeneratorAddress);

                    expect(regenerator.pendingInspection).to.equal(false);
                  });

                  it("should increment regenerator totalInspections", async () => {
                    const regenerator = await regeneratorRules.getRegenerator(regeneratorAddress);

                    expect(regenerator.totalInspections).to.equal(1);
                  });

                  it("should increment inspector totalInspections", async () => {
                    const inspector = await inspectorRules.getInspector(inspectorAddress);

                    expect(inspector.totalInspections).to.equal(1);
                  });

                  it("should add inspection to inspector in userInspections", async () => {
                    const userInspections = await instance.connect(inspectorAddress).getInspectionsHistory();

                    expect(userInspections.length).to.equal(1);
                  });

                  it("should add inspection to regenerator in userInspections", async () => {
                    const userInspections = await instance.connect(regeneratorAddress).getInspectionsHistory();

                    expect(userInspections.length).to.equal(1);
                  });
                });

                context("when check inspection regenerationIndex", () => {
                  context("when select REGENERATIVE_6", () => {
                    beforeEach(async () => {
                      const treesResultValue = 100001;
                      const biodiversityResultValue = 1001;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 64 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(64);
                    });
                  });

                  context("when select REGENERATIVE_5", () => {
                    beforeEach(async () => {
                      const treesResultValue = 10001;
                      const biodiversityResultValue = 130;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 32 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(32);
                    });
                  });

                  context("when select REGENERATIVE_4", () => {
                    beforeEach(async () => {
                      const treesResultValue = 5801;
                      const biodiversityResultValue = 101;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 16 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(16);
                    });
                  });

                  context("when select REGENERATIVE_3", () => {
                    beforeEach(async () => {
                      const treesResultValue = 1001;
                      const biodiversityResultValue = 51;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 4 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(8);
                    });
                  });

                  context("when select REGENERATIVE_2", () => {
                    beforeEach(async () => {
                      const treesResultValue = 500;
                      const biodiversityResultValue = 21;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 2 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(4);
                    });
                  });

                  context("when select REGENERATIVE_1", () => {
                    beforeEach(async () => {
                      const treesResultValue = 50;
                      const biodiversityResultValue = 10;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 1 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(2);
                    });
                  });

                  context("when select NEUTRO", () => {
                    beforeEach(async () => {
                      const treesResultValue = 0;
                      const biodiversityResultValue = 0;

                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 0 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);

                      expect(inspection.regenerationScore).to.equal(0);
                    });
                  });
                });
              });
            });
          });

          context("when is accepted by other inspector", () => {
            beforeEach(async () => {
              await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expect(
                realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspector2Address)
              ).to.be.revertedWith("You have not accepted this inspection");
            });
          });
        });

        context("when inspection is not accepted", () => {
          it("should return error message", async () => {
            await expect(
              realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
            ).to.be.revertedWith("Accept this inspection before");
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expect(
            realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
          ).to.be.revertedWith("Accept this inspection before");
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await requestInspection(regeneratorAddress);
        await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
        await acceptInspection(1, inspectorAddress);

        await expect(
          realizeInspection(1, report, treesResultValue, biodiversityResultValue, regeneratorAddress)
        ).to.be.revertedWith("Please register as inspector");
      });
    });
  });

  describe("#addInspectionValidation", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with validator", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator1Address, userTypes.Validator, owner);
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
      });

      context("with valid inspection", () => {
        beforeEach(async () => {
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(1, inspectorAddress);
          await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
        });

        context("when receive 1 validation", () => {
          beforeEach(async () => {
            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
          });

          it("add validation", async () => {
            const validation = await validatorRules.inspectionValidations(1, 0);

            expect(validation[0]).to.equal(validator1Address.address);
            expect(validation[1]).to.equal(1);
            expect(validation[2]).to.equal("justification");
            expect(validation[3]).to.equal(2);
          });
        });

        context("when have 2 validations (half of the validators)", () => {
          context("when inspection score is positive", () => {
            beforeEach(async () => {
              await instance.connect(validator1Address).addInspectionValidation(1, "justification");
              await instance.connect(validator2Address).addInspectionValidation(1, "justification");
            });

            it("add validations", async () => {
              const validation1 = await validatorRules.inspectionValidations(1, 0);
              const validation2 = await validatorRules.inspectionValidations(1, 1);

              expect(validation1.validator).to.equal(validator1Address.address);
              expect(validation2.validator).to.equal(validator2Address.address);
            });

            it("decrement inspectionsTreesImpact", async () => {
              const inspectionsTreesImpact = await instance.inspectionsTreesImpact();

              expect(inspectionsTreesImpact).to.equal(0);
            });

            it("decrement inspectionsTreesImpact", async () => {
              const inspectionsBiodiversityImpact = await instance.inspectionsBiodiversityImpact();

              expect(inspectionsBiodiversityImpact).to.equal(0);
            });

            it("inspection status INVALIDATED", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.status).to.equal(STATUS.invalidated);
            });

            it("inspector receive 1 penalty", async () => {
              const totalPenalties = await inspectorRules.totalPenalties(inspectorAddress);

              expect(totalPenalties).to.equal(1);
            });

            it("remove regenerator regenerationScore", async () => {
              const regenerator = await regeneratorRules.getRegenerator(regeneratorAddress);

              expect(regenerator.regenerationScore.score).to.equal(0);
            });

            it("decrement regenerator totalInspections", async () => {
              const regenerator = await regeneratorRules.getRegenerator(regeneratorAddress);

              expect(regenerator.totalInspections).to.equal(0);
            });

            it("decrement inspector totalInspections", async () => {
              const inspector = await inspectorRules.getInspector(inspectorAddress);

              expect(inspector.totalInspections).to.equal(0);
            });

            it("zero regeneratorPool era level score", async () => {
              const levels = await regeneratorPool.eraLevels(1, regeneratorAddress);

              expect(levels).to.equal(0);
            });
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorRules.addPenalty(inspectorAddress, 1);

            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
            await instance.connect(validator2Address).addInspectionValidation(1, "justification");
          });

          it("inspector type to DENIED", async () => {
            const userType = await communityRules.getUser(inspectorAddress);

            expect(userType).to.equal(USER_TYPES.denied);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(validator1Address).addInspectionValidation(1, "justification")
            ).to.be.revertedWith("Already voted");
          });
        });
      });

      context("when inspection inspectedAtEra is passed", () => {
        beforeEach(async () => {
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(1, inspectorAddress);
          await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);

          await advanceBlock(regeneratorPoolArgs.blocksPerEra);
        });

        it("should return error message", async () => {
          await expect(
            instance.connect(validator1Address).addInspectionValidation(1, "justification")
          ).to.be.revertedWith("Can not add validation anymore");
        });
      });

      context("when inspection is not inspected", () => {
        it("should return error message", async () => {
          await expect(
            instance.connect(validator1Address).addInspectionValidation(1, "justification")
          ).to.be.revertedWith("Can not add validation anymore");
        });
      });
    });

    context("with non validator", () => {
      it("should return error message", async () => {
        await expect(
          instance.connect(regeneratorAddress).addInspectionValidation(1, "justification")
        ).to.be.revertedWith("Please register as validator");
      });
    });
  });
});
