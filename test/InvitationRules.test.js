const { ethers } = require("hardhat");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");

describe("InvitationRules", () => {
  let instance,
    communityRules,
    researcherRules,
    validationRules,
    activistRules,
    developerRules,
    contributorRules,
    activistPool,
    developerPool,
    contributorPool;

  let owner,
    user1Address,
    user2Address,
    user3Address,
    user4Address,
    user5Address,
    user6Address,
    user7Address,
    user8Address;

  const addUser = async (address, userType, from) => {
    await communityRules.connect(from).addUser(address, userType);
  };

  const addResearcher = async (name, from) => {
    await researcherRules.connect(from).addResearcher(name, "photoURL");
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

  beforeEach(async () => {
    [
      owner,
      user1Address,
      user2Address,
      user3Address,
      user4Address,
      user5Address,
      user6Address,
      user7Address,
      user8Address,
    ] = await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    validationRules = validatorRulesDeployed.validationRules;
    researcherRules = validatorRulesDeployed.researcherRules;
    researcherPool = validatorRulesDeployed.researcherPool;
    developerRules = validatorRulesDeployed.developerRules;
    developerPool = validatorRulesDeployed.developerPool;
    contributorRules = validatorRulesDeployed.contributorRules;
    contributorPool = validatorRulesDeployed.contributorPool;
    activistRules = validatorRulesDeployed.activistRules;
    activistPool = validatorRulesDeployed.activistRules;

    const instanceFactory = await ethers.getContractFactory("InvitationRules");
    instance = await instanceFactory.deploy(
      communityRules.target,
      researcherRules.target,
      developerRules.target,
      activistRules.target,
      contributorRules.target,
      validationRules.target
    );

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(validationRules.target);
    await communityRules.newAllowedCaller(activistRules.target);
    await communityRules.newAllowedCaller(developerRules.target);
    await communityRules.newAllowedCaller(contributorRules.target);
    await communityRules.newAllowedCaller(owner);
    await activistRules.newAllowedCaller(owner);
    await researcherPool.newAllowedCaller(researcherRules.target);
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
            await activistRules.addRegeneratorLevel(owner, 3);
            await activistRules.addInspectorLevel(owner, 1);
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
            await addInvitation(owner, user5Address, userTypes.Activist, owner);
            await addInvitation(owner, user6Address, userTypes.Activist, owner);
            await addInvitation(owner, user7Address, userTypes.Activist, owner);
            await addInvitation(owner, user8Address, userTypes.Activist, owner);

            await addActivist("Activist C", user5Address);
            await addActivist("Activist D", user6Address);
            await addActivist("Activist E", user7Address);
            await addActivist("Activist E", user8Address);

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
          await addInvitation(owner, user5Address, userTypes.Developer, owner);
          await addInvitation(owner, user6Address, userTypes.Developer, owner);
          await addInvitation(owner, user7Address, userTypes.Developer, owner);
          await addInvitation(owner, user8Address, userTypes.Developer, owner);

          await addDeveloper("Developer A", user2Address);
          await addDeveloper("Developer B", user3Address);
          await addDeveloper("Developer C", user5Address);
          await addDeveloper("Developer D", user6Address);
          await addDeveloper("Developer E", user7Address);
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
            await addDeveloper("Developer F", user8Address);

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
          await addInvitation(owner, user5Address, userTypes.Contributor, owner);
          await addInvitation(owner, user6Address, userTypes.Contributor, owner);
          await addInvitation(owner, user7Address, userTypes.Contributor, owner);
          await addInvitation(owner, user8Address, userTypes.Contributor, owner);

          await addContributor("Contributor A", user2Address);
          await addContributor("Contributor B", user3Address);
          await addContributor("Contributor C", user5Address);
          await addContributor("Contributor D", user6Address);
          await addContributor("Contributor E", user7Address);
        });

        context("when can invite", () => {
          beforeEach(async () => {
            await advanceBlock(10);
            await contributorRules.connect(user2Address).addContribution("description", "report");
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
            await addContributor("Contributor F", user8Address);

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
          await addInvitation(owner, user5Address, userTypes.Researcher, owner);
          await addInvitation(owner, user6Address, userTypes.Researcher, owner);
          await addInvitation(owner, user7Address, userTypes.Researcher, owner);
          await addInvitation(owner, user8Address, userTypes.Researcher, owner);

          await addResearcher("Researcher A", user2Address);
          await addResearcher("Researcher B", user3Address);
          await addResearcher("Researcher C", user5Address);
          await addResearcher("Researcher D", user6Address);
          await addResearcher("Researcher E", user7Address);
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
            await addResearcher("Researcher F", user8Address);

            await expect(instance.connect(user2Address).invite(user4Address, userTypes.Researcher)).to.be.revertedWith(
              "Only most active users allowed to invite"
            );
          });
        });
      });
    });
  });

  describe("#inviteRegeneratorInspector", () => {
    beforeEach(async () => {
      await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
      await addUser(user1Address, userTypes.Regenerator, owner);

      await addInvitation(owner, user2Address, userTypes.Activist, owner);
      await addUser(user2Address, userTypes.Activist, owner);
    });

    context("when invite regenerator or inspector", () => {
      context("with activist", () => {
        it("should invite regenerator with success", async () => {
          await instance.connect(user2Address).inviteRegeneratorInspector(user4Address, userTypes.Regenerator);

          const invitation = await communityRules.invitations(user4Address);

          expect(invitation.invited).to.equal(user4Address.address);
        });

        it("should invite inspector with success", async () => {
          await instance.connect(user2Address).inviteRegeneratorInspector(user4Address, userTypes.Inspector);

          const invitation = await communityRules.invitations(user4Address);

          expect(invitation.invited).to.equal(user4Address.address);
        });
      });

      context("without activist", () => {
        it("revert", async () => {
          await expect(
            instance.connect(user1Address).inviteRegeneratorInspector(user4Address, userTypes.Activist)
          ).to.be.revertedWith("Only to activists");
        });
      });
    });

    context("when invite other types", () => {
      it("should revert", async () => {
        await expect(
          instance.connect(user2Address).inviteRegeneratorInspector(user4Address, userTypes.Activist)
        ).to.be.revertedWith("Only regenerators or inspectors");
      });
    });

    context("when is recent", () => {
      beforeEach(async () => {
        await instance.connect(user2Address).inviteRegeneratorInspector(user4Address, userTypes.Regenerator);
      });

      it("should revert", async () => {
        await expect(
          instance.connect(user2Address).inviteRegeneratorInspector(user5Address, userTypes.Regenerator)
        ).to.be.revertedWith("Invite delay not reached");
      });
    });
  });

  describe("#inviteSupporter", () => {
    beforeEach(async () => {
      await addUser(user1Address, userTypes.Supporter, owner);
    });

    context("when invite supporter", () => {
      context("with supporter", () => {
        it("should invite supporter with success", async () => {
          await instance.connect(user1Address).inviteSupporter(user4Address, userTypes.Supporter);

          const invitation = await communityRules.invitations(user4Address);

          expect(invitation.invited).to.equal(user4Address.address);
        });
      });

      context("without supporter", () => {
        it("should revert", async () => {
          await expect(
            instance.connect(user2Address).inviteSupporter(user4Address, userTypes.Activist)
          ).to.be.revertedWith("Only to supporters");
        });
      });
    });

    context("when invite other types", () => {
      it("should revert", async () => {
        await expect(
          instance.connect(user1Address).inviteSupporter(user4Address, userTypes.Activist)
        ).to.be.revertedWith("Only supporters");
      });
    });

    context("when is recent", () => {
      beforeEach(async () => {
        await instance.connect(user1Address).inviteSupporter(user4Address, userTypes.Supporter);
      });

      it("should revert", async () => {
        await expect(
          instance.connect(user1Address).inviteSupporter(user5Address, userTypes.Supporter)
        ).to.be.revertedWith("Invite delay not reached");
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
