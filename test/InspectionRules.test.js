const { userTypes } = require("./shared/user_types");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed.js");

describe("InspectionRules", () => {
  let instance;
  let communityRules;
  let inspectorRules;
  let regeneratorRules;
  let researcherRules;
  let activistRules;
  let regeneratorPool;
  let activistPool;
  let regenerationIndexRules;

  let owner,
    regeneratorAddress,
    regenerator2Address,
    regenerator3Address,
    regenerator4Address,
    regenerator5Address,
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
    user1Address,
    user2Address,
    user3Address,
    user4Address,
    activist1Address;

  const STATUS = {
    open: 0,
    accepted: 1,
    inspected: 2,
    invalidated: 3,
  };

  const USER_TYPES = {
    denied: 8,
  };

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    blocksPerEra: 750,
  };

  const sintropArgs = {
    timeBetweenInspections: 20,
    blocksToExpireAcceptedInspection: 50,
    allowedInitialRequests: 1,
    acceptInspectionDelayBlocks: 5,
    securityBlocksToValidation_: 100,
    BLOCKS_TO_ACCEPT: 6000,
  };

  // const addRegenerator = async (name, from) => {
  //   await regeneratorRules.connect(from).addRegenerator(1000, name, "projectDescription", "photoURL", coordinates());
  // };

  // This helper function now accepts a totalArea parameter for flexible test setup.
  const addRegenerator = async (name, totalArea, from) => {
    await regeneratorRules
      .connect(from)
      .addRegenerator(totalArea, name, "projectDescription", "photoURL", coordinates());
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

  const addDeveloper = async (name, from) => {
    await developerRules.connect(from).addDeveloper(name, "photoURL");
  };

  const addContributor = async (name, from) => {
    await contributorRules.connect(from).addContributor(name, "photoURL");
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

  const denyUser = async (userAddress) => {
    await communityRules.setToDenied(userAddress);
  };

  beforeEach(async () => {
    [
      owner,
      regeneratorAddress,
      regenerator2Address,
      regenerator3Address,
      regenerator4Address,
      regenerator5Address,
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
      user1Address,
      user2Address,
      user3Address,
      user4Address,
      activist1Address,
    ] = await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    regeneratorRules = validatorRulesDeployed.regeneratorRules;
    developerRules = validatorRulesDeployed.developerRules;
    developerPool = validatorRulesDeployed.developerPool;
    researcherRules = validatorRulesDeployed.researcherRules;
    activistRules = validatorRulesDeployed.activistRules;
    activistPool = validatorRulesDeployed.activistPool;
    contributorRules = validatorRulesDeployed.contributorRules;
    contributorPool = validatorRulesDeployed.contributorPool;
    regeneratorPool = validatorRulesDeployed.regeneratorPool;
    regeneratorRules = validatorRulesDeployed.regeneratorRules;
    researcherPool = validatorRulesDeployed.researcherPool;
    inspectorRules = validatorRulesDeployed.inspectorRules;
    inspectorPool = validatorRulesDeployed.inspectorPool;
    validationRules = validatorRulesDeployed.validationRules;
    voteRules = validatorRulesDeployed.voteRules;
    regenerationIndexRules = validatorRulesDeployed.regenerationIndexRules;

    const instanceFactory = await ethers.getContractFactory("InspectionRules");
    instance = await instanceFactory.deploy(
      sintropArgs.timeBetweenInspections,
      sintropArgs.blocksToExpireAcceptedInspection,
      sintropArgs.allowedInitialRequests,
      sintropArgs.acceptInspectionDelayBlocks,
      sintropArgs.securityBlocksToValidation_
    );

    await communityRules.setContractCall(owner, validationRules.target);
    await activistRules.setContractCall(instance.target, validationRules.target);
    await regeneratorRules.setContractCall(instance.target, validationRules.target);
    await inspectorRules.setContractCall(instance.target);
    await activistPool.setContractCall(activistRules.target);
    await inspectorPool.setContractCall(inspectorRules.target);
    await regeneratorPool.setContractCall(regeneratorRules.target);

    const inspectionRulesDependencies = {
      communityRulesAddress: communityRules.target,
      regeneratorRulesAddress: regeneratorRules.target,
      validationRulesAddress: validationRules.target,
      inspectorRulesAddress: inspectorRules.target,
      activistRulesAddress: activistRules.target,
      regenerationIndexRulesAddress: regenerationIndexRules.target,
      voteRulesAddress: voteRules.target,
    };

    await instance.setContractInterfaces(inspectionRulesDependencies);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(regeneratorRules.target);
    await communityRules.newAllowedCaller(inspectorRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await communityRules.newAllowedCaller(validationRules.target);
    await communityRules.newAllowedCaller(owner);
    await validationRules.newAllowedCaller(instance.target);
    await regeneratorRules.newAllowedCaller(instance.target);
    await regeneratorRules.newAllowedCaller(validationRules.target);
    await regeneratorRules.newAllowedCaller(owner);
    await developerRules.newAllowedCaller(owner);
    await developerRules.newAllowedCaller(instance.target);
    await researcherRules.newAllowedCaller(instance.target);
    await researcherRules.newAllowedCaller(owner);
    await activistRules.newAllowedCaller(instance.target);
    await activistRules.newAllowedCaller(owner);
    await contributorRules.newAllowedCaller(instance.target);
    await regeneratorPool.newAllowedCaller(regeneratorRules.target);
    await regeneratorPool.newAllowedCaller(owner);
    await developerPool.newAllowedCaller(developerRules.target);
    await researcherPool.newAllowedCaller(researcherRules.target);
    await contributorPool.newAllowedCaller(contributorRules.target);
    await activistPool.newAllowedCaller(activistRules.target);
    await inspectorPool.newAllowedCaller(inspectorRules.target);
    await inspectorRules.newAllowedCaller(instance.target);
    await inspectorRules.newAllowedCaller(validationRules.target);
    await inspectorRules.newAllowedCaller(owner);

    await addInvitation(owner, resea1Address, userTypes.Researcher, owner);
    await addResearcher("Researcher 1", resea1Address);
  });

  describe("#getInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", 25000, regeneratorAddress);
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

      await addRegenerator("Regenerator A", 25000, regeneratorAddress);
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
            await expect(requestInspection(regeneratorAddress)).to.be.revertedWith("Request OPEN");
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
          await advanceBlock(180);
          await acceptInspection(12, inspector12Address);
          await realizeInspection(12, report, treesResultValue, biodiversityResultValue, inspector12Address);
        });

        it("should return error", async () => {
          await advanceBlock(20);
          await expect(requestInspection(regeneratorAddress)).to.be.revertedWith("You have completed your mission");
        });
      });

      describe("#_afterRequestInspection", () => {
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
          await expect(instance.requestInspection()).to.be.revertedWith("Only regenerators");
        });
      });
    });
  });

  describe("#acceptInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", 25000, regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await requestInspection(regeneratorAddress);
        });

        context("when have not waited inspection delay time", () => {
          it("should return error message", async () => {
            await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Wait delay blocks");
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
              await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Wait until next era");
            });
          });

          context("when nextEraIn is bigger than blocksToExpireAcceptedInspection", () => {
            beforeEach(async () => {
              const nextEraIn = await regeneratorRules.nextEraIn();

              const blocks = parseInt(nextEraIn) - sintropArgs.blocksToExpireAcceptedInspection - 20;
              await advanceBlock(blocks);
            });

            it("should return error message", async () => {
              await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Wait until next era");
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
            await addInvitation(owner, regenerator5Address, userTypes.Regenerator, owner);

            await addRegenerator("Regenerator B", 25000, regenerator2Address);
            await addRegenerator("Regenerator C", 25000, regenerator3Address);
            await addRegenerator("Regenerator D", 25000, regenerator4Address);
            await addRegenerator("Regenerator E", 25000, regenerator5Address);

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
            await acceptInspection(4, inspectorAddress);
            await advanceBlock(sintropArgs.blocksToExpireAcceptedInspection);

            await requestInspection(regenerator5Address);
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          });

          it("should return error message", async () => {
            await expect(acceptInspection(5, inspectorAddress)).to.be.revertedWith("Only 3 giveUps allowed");
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
              await expect(acceptInspection(1, inspector2Address)).to.be.revertedWith(
                "Inspection must be OPEN or EXPIRED"
              );
            });
          });

          context("when have accepted other inspection", () => {
            beforeEach(async () => {
              await addInvitation(owner, regenerator2Address, userTypes.Regenerator, owner);
              await addRegenerator("Regenerator B", 25000, regenerator2Address);
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await acceptInspection(1, inspectorAddress);
              await requestInspection(regenerator2Address);
            });

            context("when last inspection is not expired", () => {
              it("should return error message", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Already accepted");
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
              });

              it("should return error when try to accept another inspection before wait blocks", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Wait to accept");
              });

              it("should accept inspection with success after finishing previous one", async () => {
                await advanceBlock(sintropArgs.BLOCKS_TO_ACCEPT);
                await acceptInspection(2, inspectorAddress);

                const inspection = await instance.getInspection(2);

                expect(inspection.status).to.equal(STATUS.accepted);
              });
            });

            context("when dont finished last inspection", () => {
              it("should return error message", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Already accepted");
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
            await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Already inspected");
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Inspection do not exist");
        });
      });

      context("when regenerator is not valid", () => {
        it("should return error message", async () => {
          await requestInspection(regeneratorAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);

          await communityRules.setContractCall(owner, owner);

          await denyUser(regeneratorAddress);
          await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Regenerator invalid");
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await requestInspection(regeneratorAddress);
        await expect(acceptInspection(1, regeneratorAddress)).to.be.revertedWith("Only inspectors");
      });
    });
  });

  describe("#realizeInspection", () => {
    beforeEach(async () => {
      await communityRules.newAllowedCaller(activist1Address);

      await addInvitation(owner, activist1Address, userTypes.Activist, owner);
      await addActivist("Activist 1", activist1Address);

      await communityRules.setContractCall(activist1Address, validationRules.target);
      await addInvitation(activist1Address, regeneratorAddress, userTypes.Regenerator, activist1Address);
      await addInvitation(activist1Address, regenerator2Address, userTypes.Regenerator, activist1Address);
      await addInvitation(activist1Address, inspectorAddress, userTypes.Inspector, activist1Address);
      await addInvitation(activist1Address, inspector3Address, userTypes.Inspector, activist1Address);

      // We now provide a specific area when creating the regenerator.
      await addRegenerator("Regenerator A", 25000, regeneratorAddress); // e.g., 25,000 sqm
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
                await expect(realizeInspection(1, report, 10, 10, inspectorAddress)).to.be.revertedWith(
                  "Inspection Expired"
                );
              });
            });

            context("when inspection is not expired", () => {
              context("when pass regenerationInspection equal 4 regenerationIndex size", () => {
                describe("._setActivistLevel", () => {
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
                      await regeneratorRules.setContractCall(owner, owner);

                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0, 2);
                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0, 3);

                      await regeneratorRules.setContractCall(instance.target, validationRules.target);

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
                      await inspectorRules.setContractCall(owner, owner);

                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 1);
                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 1);

                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress, 1);
                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress, 1);

                      await inspectorRules.setContractCall(instance.target);

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
                      await regeneratorRules.setContractCall(owner, owner);
                      await inspectorRules.setContractCall(owner, owner);

                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0, 5);
                      await regeneratorRules.connect(owner).afterRealizeInspection(regeneratorAddress, 0, 2);

                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 3);
                      await inspectorRules.connect(owner).afterAcceptInspection(inspectorAddress, 4);

                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress, 3);
                      await inspectorRules.connect(owner).afterRealizeInspection(inspectorAddress, 4);

                      await regeneratorRules.setContractCall(instance.target, validationRules.target);
                      await inspectorRules.setContractCall(instance.target);

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

                  it("should increment realizedInspectionsCount", async () => {
                    const realizedInspectionsCount = await instance.realizedInspectionsCount();

                    expect(realizedInspectionsCount).to.equal(1);
                  });
                });

                context("when check inspection regenerationIndex", () => {
                  context("when tree result exceeds the dynamic density limit", () => {
                    it("should return error message", async () => {
                      // The regenerator was created with an area of 25,000 sqm.
                      // With a density of 4 trees/sqm, the max is 100,000 trees.
                      const treesResultValue = 100001; // This value now exceeds the dynamic limit.
                      const biodiversityResultValue = 10;

                      await expect(
                        realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
                      ).to.be.revertedWith("Tree count exceeds density limit for this area");
                    });
                  });

                  context("when biodiversity result exceeds the max limit", () => {
                    it("should return error message", async () => {
                      const treesResultValue = 10;
                      // Max biodiversity is a fixed constant, so this test remains valid.
                      const biodiversityResultValue = 301;

                      await expect(
                        realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
                      ).to.be.revertedWith("Max result limit");
                    });
                  });

                  context("when select REGENERATIVE_6", () => {
                    beforeEach(async () => {
                      // This test requires a large number of trees, so we need a larger area.
                      // Let's create a new regenerator specifically for this test.
                      await addRegenerator("Regenerator for L6", 25000, regenerator2Address);
                      await addInspector("Inspector C", inspector3Address);

                      await requestInspection(regenerator2Address);
                      await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
                      await acceptInspection(2, inspector3Address);

                      const treesResultValue = 50001; // e.g., >= 50000
                      const biodiversityResultValue = 161; // e.g., >= 160

                      await realizeInspection(2, report, treesResultValue, biodiversityResultValue, inspector3Address);
                    });

                    it("should add 64 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(2);
                      expect(inspection.regenerationScore).to.equal(64);
                    });
                  });

                  context("when select REGENERATIVE_5", () => {
                    beforeEach(async () => {
                      const treesResultValue = 25001; // e.g., >= 25000
                      const biodiversityResultValue = 81; // e.g., >= 80
                      await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);
                    });

                    it("should add 32 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);
                      expect(inspection.regenerationScore).to.equal(32);
                    });
                  });

                  // The pattern repeats for other REGENERATIVE levels... ensure the treesResult
                  // is plausible for the area size set in the top-level beforeEach (25,000 sqm).
                  // All values below are valid for an area of this size.

                  context("when select REGENERATIVE_4", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, 12501, 41, inspectorAddress);
                    });
                    it("should add 16 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);
                      expect(inspection.regenerationScore).to.equal(16);
                    });
                  });

                  context("when select REGENERATIVE_3", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, 6251, 21, inspectorAddress);
                    });
                    it("should add 8 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);
                      expect(inspection.regenerationScore).to.equal(8);
                    });
                  });

                  context("when select REGENERATIVE_2", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, 3126, 11, inspectorAddress);
                    });
                    it("should add 4 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);
                      expect(inspection.regenerationScore).to.equal(4);
                    });
                  });

                  context("when select REGENERATIVE_1", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, 21, 6, inspectorAddress);
                    });
                    it("should add 2 regenerationScore to inspection", async () => {
                      const inspection = await instance.getInspection(1);
                      expect(inspection.regenerationScore).to.equal(2);
                    });
                  });

                  context("when select NEUTRO", () => {
                    beforeEach(async () => {
                      await realizeInspection(1, report, 19, 4, inspectorAddress);
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
              await communityRules.setContractCall(owner, validationRules.target);

              await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expect(
                realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspector2Address)
              ).to.be.revertedWith("Not your inspection");
            });
          });
        });

        context("when inspection is not accepted", () => {
          it("should return error message", async () => {
            await expect(
              realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
            ).to.be.revertedWith("Accept before");
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expect(
            realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress)
          ).to.be.revertedWith("Accept before");
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
        ).to.be.revertedWith("Only inspectors");
      });
    });
  });

  describe("#addInspectionValidation", () => {
    beforeEach(async () => {
      await addInvitation(owner, regeneratorAddress, userTypes.Regenerator, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addRegenerator("Regenerator A", 25000, regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when trying to vote on an already invalidated inspection", () => {
      beforeEach(async () => {
        await requestInspection(regeneratorAddress);
        await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
        await acceptInspection(1, inspectorAddress);
        await realizeInspection(1, report, treesResultValue, biodiversityResultValue, inspectorAddress);

        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);
        await addDeveloper("User 1", user1Address);
        await addDeveloper("User 2", user2Address);
        await addDeveloper("User 3", user3Address);

        await instance.connect(user1Address).addInspectionValidation(1, "justification");
        await instance.connect(user2Address).addInspectionValidation(1, "justification");
      });

      it("should revert because the inspection status is no longer INSPECTED", async () => {
        await expect(instance.connect(user3Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
          "Penalties already applied"
        );
      });
    });

    context("with developer", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Developer, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addInvitation(owner, user3Address, userTypes.Developer, owner);
        await addInvitation(owner, user4Address, userTypes.Developer, owner);

        await addDeveloper("User 1", user1Address);
        await addDeveloper("User 2", user2Address);
        await addDeveloper("User 3", user3Address);
        await addDeveloper("User 4", user4Address);
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
            await instance.connect(user1Address).addInspectionValidation(1, "justification");
          });

          it("add validation", async () => {
            const inspection = await instance.getInspection(1);

            expect(inspection.validationsCount).to.equal(1);
          });

          it("should keep inspectionPenalized to false", async () => {
            expect(await instance.inspectionPenalized(1)).to.be.false;
          });
        });

        context("when have 2 validations (half of the validators)", () => {
          context("when inspection score is positive", () => {
            beforeEach(async () => {
              await instance.connect(user1Address).addInspectionValidation(1, "justification");
              await instance.connect(user2Address).addInspectionValidation(1, "justification");
            });

            it("add validations", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.validationsCount).to.equal(2);
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

            it("should set inspectionPenalized to true to prevent double penalties", async () => {
              // Verifies that the new flag is set correctly after the first invalidation.
              expect(await instance.inspectionPenalized(1)).to.be.true;
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

            it("should decrement realizedInspectionsCount", async () => {
              const realizedInspectionsCount = await instance.realizedInspectionsCount();

              expect(realizedInspectionsCount).to.equal(0);
            });
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorRules.setContractCall(owner, owner);
            await inspectorRules.addPenalty(inspectorAddress, 1);

            await communityRules.setContractCall(user1Address, validationRules.target);
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await communityRules.setContractCall(user2Address, validationRules.target);
            await inspectorRules.setContractCall(instance.target);
            await instance.connect(user2Address).addInspectionValidation(1, "justification");
          });

          it("inspector type to DENIED", async () => {
            const isDenied = await communityRules.isDenied(inspectorAddress);

            expect(isDenied).to.equal(true);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await advanceBlock(10);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
              "Already voted"
            );
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
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });

      context("when inspection is not inspected", () => {
        it("should return error message", async () => {
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });
    });

    context("with contributor", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Contributor, owner);
        await addInvitation(owner, user2Address, userTypes.Contributor, owner);
        await addInvitation(owner, user3Address, userTypes.Contributor, owner);
        await addInvitation(owner, user4Address, userTypes.Contributor, owner);

        await addContributor("User 1", user1Address);
        await addContributor("User 2", user2Address);
        await addContributor("User 3", user3Address);
        await addContributor("User 4", user4Address);
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
            await instance.connect(user1Address).addInspectionValidation(1, "justification");
          });

          it("add validation", async () => {
            const inspection = await instance.getInspection(1);

            expect(inspection.validationsCount).to.equal(1);
          });
        });

        context("when have 2 validations (half of the validators)", () => {
          context("when inspection score is positive", () => {
            beforeEach(async () => {
              await instance.connect(user1Address).addInspectionValidation(1, "justification");
              await instance.connect(user2Address).addInspectionValidation(1, "justification");
            });

            it("add validations", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.validationsCount).to.equal(2);
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

            it("should decrement realizedInspectionsCount", async () => {
              const realizedInspectionsCount = await instance.realizedInspectionsCount();

              expect(realizedInspectionsCount).to.equal(0);
            });
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorRules.setContractCall(owner, owner);
            await inspectorRules.addPenalty(inspectorAddress, 1);

            await communityRules.setContractCall(user1Address, validationRules.target);
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await communityRules.setContractCall(user2Address, validationRules.target);
            await inspectorRules.setContractCall(instance.target);
            await instance.connect(user2Address).addInspectionValidation(1, "justification");
          });

          it("inspector type to DENIED", async () => {
            const isDenied = await communityRules.isDenied(inspectorAddress);

            expect(isDenied).to.equal(true);
          });

          it("should apply a penalty to the inspector's inviter", async () => {
            // Checks if the inviter who brought the denied inspector is penalized.
            const inviterPenalties = await communityRules.inviterPenalties(owner);
            expect(inviterPenalties).to.equal(1);
          });

          it("should remove all pool levels for the denied inspector", async () => {
            // Checks if the `removePoolLevels` function was successful.
            // We need to know the era of the inspection to check the correct mapping slot.
            const inspection = await instance.getInspection(1);
            const inspectedAtEra = inspection.inspectedAtEra;

            const poolLevels = await inspectorPool.eraLevels(inspectedAtEra, inspectorAddress);
            expect(poolLevels).to.equal(0);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await advanceBlock(10);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
              "Already voted"
            );
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
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });

      context("when inspection is not inspected", () => {
        it("should return error message", async () => {
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });
    });

    context("with activist", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Activist, owner);
        await addInvitation(owner, user2Address, userTypes.Activist, owner);
        await addInvitation(owner, user3Address, userTypes.Activist, owner);
        await addInvitation(owner, user4Address, userTypes.Activist, owner);

        await addActivist("User 1", user1Address);
        await addActivist("User 2", user2Address);
        await addActivist("User 3", user3Address);
        await addActivist("User 4", user4Address);
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
            await instance.connect(user1Address).addInspectionValidation(1, "justification");
          });

          it("add validation", async () => {
            const inspection = await instance.getInspection(1);

            expect(inspection.validationsCount).to.equal(1);
          });
        });

        context("when have 2 validations (half of the validators)", () => {
          context("when inspection score is positive", () => {
            beforeEach(async () => {
              await instance.connect(user1Address).addInspectionValidation(1, "justification");
              await instance.connect(user2Address).addInspectionValidation(1, "justification");
            });

            it("add validations", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.validationsCount).to.equal(2);
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

            it("should decrement realizedInspectionsCount", async () => {
              const realizedInspectionsCount = await instance.realizedInspectionsCount();

              expect(realizedInspectionsCount).to.equal(0);
            });
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorRules.setContractCall(owner, owner);
            await inspectorRules.addPenalty(inspectorAddress, 1);

            await communityRules.setContractCall(user1Address, validationRules.target);
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await communityRules.setContractCall(user2Address, validationRules.target);
            await inspectorRules.setContractCall(instance.target);
            await instance.connect(user2Address).addInspectionValidation(1, "justification");
          });

          it("inspector type to DENIED", async () => {
            const isDenied = await communityRules.isDenied(inspectorAddress);

            expect(isDenied).to.equal(true);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await advanceBlock(10);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
              "Already voted"
            );
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
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });

      context("when inspection is not inspected", () => {
        it("should return error message", async () => {
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });
    });

    context("with researcher", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Researcher, owner);
        await addInvitation(owner, user2Address, userTypes.Researcher, owner);
        await addInvitation(owner, user3Address, userTypes.Researcher, owner);
        await addInvitation(owner, user4Address, userTypes.Researcher, owner);

        await addResearcher("User 1", user1Address);
        await addResearcher("User 2", user2Address);
        await addResearcher("User 3", user3Address);
        await addResearcher("User 4", user4Address);
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
            await instance.connect(user1Address).addInspectionValidation(1, "justification");
          });

          it("add validation", async () => {
            const inspection = await instance.getInspection(1);

            expect(inspection.validationsCount).to.equal(1);
          });
        });

        context("when have 2 validations (votesToInvalidate)", () => {
          context("when inspection score is positive", () => {
            beforeEach(async () => {
              await instance.connect(user1Address).addInspectionValidation(1, "justification");
              await instance.connect(user2Address).addInspectionValidation(1, "justification");
            });

            it("add validations", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.validationsCount).to.equal(2);
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

            it("should decrement realizedInspectionsCount", async () => {
              const realizedInspectionsCount = await instance.realizedInspectionsCount();

              expect(realizedInspectionsCount).to.equal(0);
            });
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorRules.setContractCall(owner, owner);
            await inspectorRules.addPenalty(inspectorAddress, 1);

            await communityRules.setContractCall(user1Address, validationRules.target);
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await communityRules.setContractCall(user2Address, validationRules.target);
            await inspectorRules.setContractCall(instance.target);
            await instance.connect(user2Address).addInspectionValidation(1, "justification");
          });

          it("inspector type to DENIED", async () => {
            const isDenied = await communityRules.isDenied(inspectorAddress);

            expect(isDenied).to.equal(true);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.connect(user1Address).addInspectionValidation(1, "justification");

            await advanceBlock(10);
          });

          it("should return error message", async () => {
            await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
              "Already voted"
            );
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
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });

      context("when inspection is not inspected", () => {
        it("should return error message", async () => {
          await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
            "Can't validade anymore"
          );
        });
      });
    });

    context("with non validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(user1Address).addInspectionValidation(1, "justification")).to.be.revertedWith(
          "Not a voter user"
        );
      });
    });
  });
});
