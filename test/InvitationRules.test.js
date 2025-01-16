const { ethers } = require("hardhat");
const { userRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");

describe("InvitationRules", () => {
  let instance, userRules;
  let owner, user1Address, user2Address, user3Address, user4Address;

  const addUser = async (address, userType, from) => {
    await userRules.connect(from).addUser(address, userType);
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const userTypeDelayBlocks = async (userType) => {
    const settings = await userRules.getUserTypeSettings(userType);

    return settings.invitationDelayBlocks;
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address, user3Address, user4Address] = await ethers.getSigners();

    userRules = await userRulesDeployed();

    const instanceFactory = await ethers.getContractFactory("InvitationRules");
    instance = await instanceFactory.deploy(userRules.target);

    await userRules.newAllowedCaller(instance.target);
    await userRules.newAllowedCaller(owner);
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
        await instance.connect(user2Address).invite(user3Address, userTypes.Activist);
      });

      it("revert", async () => {
        await expect(instance.connect(user4Address).invite(user3Address, userTypes.Activist)).to.be.revertedWith(
          "Already invited"
        );
      });
    });

    context("when user not registered and not invited", () => {
      context("when activist send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Activist, owner);
          await addUser(user2Address, userTypes.Activist, owner);
        });

        context("when send to activist", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Activist);
                const blocks = await userTypeDelayBlocks(userTypes.Activist);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Activist);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Activist);
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
              await instance.connect(user2Address).invite(user3Address, userTypes.Activist);

              const invitation = await userRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
          });
        });

        context("when send to inspector", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Inspector);
                const blocks = await userTypeDelayBlocks(userTypes.Activist);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Inspector);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Inspector);
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
              await instance.connect(user2Address).invite(user3Address, userTypes.Inspector);

              const invitation = await userRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
          });
        });

        context("when send to regenerator", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Regenerator);
                const blocks = await userTypeDelayBlocks(userTypes.Activist);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Regenerator);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Regenerator);
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
              await instance.connect(user2Address).invite(user3Address, userTypes.Regenerator);

              const invitation = await userRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
          });
        });
      });

      context("when developer send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Developer, owner);
          await addUser(user2Address, userTypes.Developer, owner);
        });

        context("when send to developer", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Developer);
                const blocks = await userTypeDelayBlocks(userTypes.Developer);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Developer);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Developer);
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
              await instance.connect(user2Address).invite(user3Address, userTypes.Developer);

              const invitation = await userRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
          });
        });
      });

      context("when researcher send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Researcher, owner);
          await addUser(user2Address, userTypes.Researcher, owner);
        });

        context("when send to researcher", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Researcher);
                const blocks = await userTypeDelayBlocks(userTypes.Researcher);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Researcher);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Researcher);
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
              await instance.connect(user2Address).invite(user3Address, userTypes.Researcher);

              const invitation = await userRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
          });
        });
      });

      context("when validator send invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Validator, owner);
          await addUser(user2Address, userTypes.Validator, owner);
        });

        context("when send to validator", () => {
          context("when have a previous invitation", () => {
            context("when is not recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Validator);
                const blocks = await userTypeDelayBlocks(userTypes.Validator);

                await advanceBlock(blocks);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Validator);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Validator);
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
              await instance.connect(user2Address).invite(user3Address, userTypes.Validator);

              const invitation = await userRules.invitations(user3Address);

              expect(invitation.invited).to.equal(user3Address.address);
            });
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

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });

            context("when is recent", () => {
              beforeEach(async () => {
                await instance.connect(user2Address).invite(user3Address, userTypes.Supporter);
              });

              it("invite with success", async () => {
                await instance.connect(user2Address).invite(user4Address, userTypes.Supporter);

                const invitation = await userRules.invitations(user4Address);

                expect(invitation.invited).to.equal(user4Address.address);
              });
            });
          });

          context("when do not have a previous invitation", () => {
            it("invite with success", async () => {
              await instance.connect(user2Address).invite(user3Address, userTypes.Supporter);

              const invitation = await userRules.invitations(user3Address);

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

          const invitation = await userRules.invitations(user3Address);

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
