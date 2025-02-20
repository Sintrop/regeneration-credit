const { ethers } = require("hardhat");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("InvitationRules", () => {
  let instance, communityRules, researcherRules, validatorRules, activistRules, developerRules, contributorRules;
  let owner, user1Address, user2Address, user3Address, user4Address;

  const addUser = async (address, userType, from) => {
    await communityRules.connect(from).addUser(address, userType);
  };

  const addResearcher = async (name, from) => {
    await researcherRules.connect(from).addResearcher(name, "photoURL");
  };

  const addValidator = async (from) => {
    await validatorRules.connect(from).addValidator();
  };

  const addActivist = async (name, from) => {
    await activistRules.connect(from).addActivist(name, "photoURL");
  };

  const addDeveloper = async (name, from) => {
    await developerRules.connect(from).addDeveloper(name, "photoURL");
  };

  const addResearch = async (from) => {
    await researcherRules.connect(from).addResearch("title", "thesis", "fileURL");
  };

  const addContributor = async (name, from) => {
    await contributorRules.connect(from).addContributor(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const userTypeDelayBlocks = async (userType) => {
    const settings = await communityRules.getUserTypeSettings(userType);

    return settings.invitationDelayBlocks;
  };

  const timeBetweenResearches = 10;
  const maxPenalties = 3;
  const securityBlocksToValidatorAnalysis = 10;
  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  const validatorPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 60,
  };

  const researcherPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 60,
  };

  const developerPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 50,
  };

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    blocksPerEra: 20,
  };

  const contributorPoolArgs = {
    totalTokens: "7500000000000000000000000",
    halving: 12,
    blocksPerEra: 40,
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address, user3Address, user4Address] = await ethers.getSigners();

    communityRules = await communityRulesDeployed();

    const regenerationCredit = await regenerationCreditDeployed();

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    const validatorPool = await validatorPoolFactory.deploy(
      regenerationCredit.target,
      validatorPoolArgs.halving,
      validatorPoolArgs.blocksPerEra
    );

    const validatorRulesFactory = await ethers.getContractFactory("ValidatorRules");
    validatorRules = await validatorRulesFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    const researcherPool = await researcherPoolFactory.deploy(
      regenerationCredit.target,
      researcherPoolArgs.halving,
      researcherPoolArgs.blocksPerEra
    );

    const researcherRulesFactory = await ethers.getContractFactory("ResearcherRules");
    researcherRules = await researcherRulesFactory.deploy(
      communityRules.target,
      researcherPool.target,
      validatorRules.target,
      timeBetweenResearches,
      maxPenalties,
      securityBlocksToValidatorAnalysis
    );

    const developerPoolFactory = await ethers.getContractFactory("DeveloperPool");
    const developerPool = await developerPoolFactory.deploy(
      regenerationCredit.target,
      developerPoolArgs.halving,
      developerPoolArgs.blocksPerEra
    );

    const developerRulesFactory = await ethers.getContractFactory("DeveloperRules");
    developerRules = await developerRulesFactory.deploy(
      communityRules.target,
      developerPool.target,
      validatorRules.target,
      maxPenalties,
      securityBlocksToValidatorAnalysis
    );

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    const activistPool = await activistPoolFactory.deploy(
      regenerationCredit.target,
      activistPoolArgs.halving,
      activistPoolArgs.blocksPerEra
    );

    const activistRulesFactory = await ethers.getContractFactory("ActivistRules");
    activistRules = await activistRulesFactory.deploy(communityRules.target, activistPool.target);

    const contributorPoolFactory = await ethers.getContractFactory("ContributorPool");
    const contributorPool = await contributorPoolFactory.deploy(
      regenerationCredit.target,
      contributorPoolArgs.halving,
      contributorPoolArgs.blocksPerEra
    );

    const contributorRulesFactory = await ethers.getContractFactory("ContributorRules");
    contributorRules = await contributorRulesFactory.deploy(
      communityRules.target,
      contributorPool.target,
      securityBlocksToValidatorAnalysis
    );

    const validatorRulesDependencies = {
      communityRulesAddress: communityRules.target,
      regeneratorRulesAddress: ZERO_ADDRESS,
      validatorPoolAddress: validatorPool.target,
      inspectorRulesAddress: ZERO_ADDRESS,
      developerRulesAddress: developerRules.target,
      researcherRulesAddress: researcherRules.target,
      contributorRulesAddress: contributorRules.target,
      activistRulesAddress: activistRules.target,
    };

    const instanceFactory = await ethers.getContractFactory("InvitationRules");
    instance = await instanceFactory.deploy(
      communityRules.target,
      researcherRules.target,
      developerRules.target,
      activistRules.target,
      contributorRules.target,
      validatorRules.target
    );

    await validatorRules.setContractAddressDependencies(validatorRulesDependencies);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(validatorRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(owner);
    await activistRules.newAllowedCaller(owner);
    await researcherPool.newAllowedCaller(researcherRules.target);
    await validatorPool.newAllowedCaller(validatorRules.target);
    await activistPool.newAllowedCaller(activistRules.target);
    await developerPool.newAllowedCaller(developerRules.target);
    await contributorPool.newAllowedCaller(contributorRules.target);
  });

  describe("#invite", () => {
    beforeEach(async () => {
      await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
      await addUser(user1Address, userTypes.Regenerator, owner);
    });

    context("when user already invited", () => {
      beforeEach(async () => {
        await addInvitation(owner, user2Address, userTypes.Activist, owner);
        await addInvitation(owner, user4Address, userTypes.Activist, owner);

        await addUser(user2Address, userTypes.Activist, owner);
        await addUser(user4Address, userTypes.Activist, owner);

        await addInvitation(owner, user3Address, userTypes.Activist, owner);
      });

      it("revert", async () => {
        await expect(addInvitation(owner, user3Address, userTypes.Activist, owner)).to.be.revertedWith(
          "Already invited"
        );
      });
    });

    context("when user not registered and not invited", () => {
      context("when activist send invite", () => {
        beforeEach(async () => {
          await addInvitation(user2Address, owner, userTypes.Activist, owner);
          await addInvitation(owner, user2Address, userTypes.Activist, owner);
          await addInvitation(owner, user3Address, userTypes.Activist, owner);

          await addActivist("Activist A", user2Address);
          await addActivist("Activist B", user3Address);
        });

        context("when can invite", () => {
          beforeEach(async () => {
            await activistRules.addLevel(owner, 3, owner, 1);
          });

          context("when send to activist", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Activist);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Activist);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Activist);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Activist)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                const invitation = await communityRules.invitations(user3Address);

                expect(invitation.invited).to.equal(user3Address.address);
              });
            });
          });

          context("when send to inspector", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Activist);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Inspector);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Inspector);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Inspector)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                const invitation = await communityRules.invitations(user3Address);

                expect(invitation.invited).to.equal(user3Address.address);
              });
            });
          });

          context("when send to regenerator", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Activist);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Regenerator);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Regenerator);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Regenerator)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                const invitation = await communityRules.invitations(user3Address);

                expect(invitation.invited).to.equal(user3Address.address);
              });
            });
          });
        });

        context("can not send invite", () => {
          it("returns message error", async () => {
            await expect(instance.connect(user2Address).invite(user4Address, userTypes.Regenerator)).to.be.revertedWith(
              "Only most active users allowed to invite"
            );
          });
        });
      });

      context("when developer send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Developer, owner);
          await addInvitation(owner, user3Address, userTypes.Developer, owner);

          await addDeveloper("Developer A", user2Address);
          await addDeveloper("Developer B", user3Address);
        });

        context("when can invite", () => {
          beforeEach(async () => {
            await developerRules.connect(user2Address).addReport("description", "report");
          });

          context("when send to developer", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Developer);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Developer);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Developer);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Developer)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Developer);

                const invitation = await communityRules.invitations(user3Address);

                expect(invitation.invited).to.equal(user3Address.address);
              });
            });
          });
        });

        context("can not send invite", () => {
          it("returns message error", async () => {
            await expect(instance.connect(user2Address).invite(user4Address, userTypes.Developer)).to.be.revertedWith(
              "Only most active users allowed to invite"
            );
          });
        });
      });

      context("when contributor send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Contributor, owner);
          await addInvitation(owner, user3Address, userTypes.Contributor, owner);

          await addContributor("Contributor A", user2Address);
          await addContributor("Contributor B", user3Address);
        });

        context("when can invite", () => {
          beforeEach(async () => {
            await contributorRules.connect(user2Address).addContribution("report");
          });

          context("when send to contributor", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Contributor);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Contributor);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Contributor);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Contributor)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Contributor);

                const invitation = await communityRules.invitations(user3Address);

                expect(invitation.invited).to.equal(user3Address.address);
              });
            });
          });
        });

        context("can not send invite", () => {
          it("returns message error", async () => {
            await expect(instance.connect(user2Address).invite(user4Address, userTypes.Contributor)).to.be.revertedWith(
              "Only most active users allowed to invite"
            );
          });
        });
      });

      context("when researcher send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Researcher, owner);
          await addInvitation(owner, user3Address, userTypes.Researcher, owner);

          await addResearcher("Researcher A", user2Address);
          await addResearcher("Researcher B", user3Address);
        });

        context("when can invite", () => {
          beforeEach(async () => {
            await addResearch(user2Address);
          });

          context("when send to researcher", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Researcher);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Researcher);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Researcher);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Researcher)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Researcher);

                const invitation = await communityRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });
          });
        });

        context("can not send invite", () => {
          it("returns message error", async () => {
            await expect(instance.connect(user2Address).invite(user4Address, userTypes.Researcher)).to.be.revertedWith(
              "Only most active users allowed to invite"
            );
          });
        });
      });

      context("when validator send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Validator, owner);
          await addInvitation(owner, user3Address, userTypes.Validator, owner);

          await addValidator(user2Address);
          await addValidator(user3Address);
        });

        context("when can send invite", () => {
          beforeEach(async () => {
            await validatorRules.connect(user2Address).declareAlive();
          });

          context("when send to validator", () => {
            context("when have a previous invitation", () => {
              context("when is not recent", () => {
                beforeEach(async () => {
                  const blocks = await userTypeDelayBlocks(userTypes.Validator);

                  await advanceBlock(blocks);
                });

                it("invite with success", async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Validator);

                  const invitation = await communityRules.invitations(user4Address);

                  expect(invitation.invited).to.equal(user4Address.address);
                });
              });

              context("when is recent", () => {
                beforeEach(async () => {
                  await instance.connect(user2Address).invite(user4Address, userTypes.Validator);
                });

                it("revert", async () => {
                  await expect(
                    instance.connect(user2Address).invite(user4Address, userTypes.Validator)
                  ).to.be.revertedWith("Invite delay not reached");
                });
              });
            });

            context("when do not have a previous invitation", () => {
              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Validator);

                const invitation = await communityRules.invitations(user3Address);

                expect(invitation.invited).to.equal(user3Address.address);
              });
            });
          });
        });

        context("can not send invite", () => {
          it("returns message error", async () => {
            await expect(instance.connect(user2Address).invite(user4Address, userTypes.Validator)).to.be.revertedWith(
              "Only most active users allowed to invite"
            );
          });
        });
      });

      context("when supporter send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Supporter, owner);
          await addUser(user2Address, userTypes.Supporter, owner);
        });

        context("when send to supporter", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Supporter);
                const blocks = await userTypeDelayBlocks(userTypes.Supporter);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Supporter);

                const invitation = await communityRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Supporter);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Supporter);

                const invitation = await communityRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });
          });

          context("when do not have a previous invitation", () => {
            it("invite with success", async () => {
              await instance.connect(user2Address).invite(user3Address, userTypes.Supporter);

              const invitation = await communityRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
          });
        });
      });
    });
  });

  describe("#onlyOwnerInvite", () => {
    context("when invite", () => {
      context("with owner", () => {
        it("invite with success", async () => {
          await instance.onlyOwnerInvite(user3Address, userTypes.Developer);

          const invitation = await communityRules.invitations(user3Address);

          expect(invitation.invited).to.equal(user3Address.address);
        });
      });

      context("with not owner", () => {
        it("revert", async () => {
          await expect(
            instance.connect(user1Address).onlyOwnerInvite(user2Address, userTypes.Activist)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
      });
    });
  });
});
