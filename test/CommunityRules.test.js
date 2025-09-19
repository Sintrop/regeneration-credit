const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { advanceBlock } = require("./shared/advance_block");

describe("CommunityRules", function () {
  let instance;
  let owner, user1Address, user2Address, user3Address, user4Address, user5Address, user6Address, user7Address;

  const communityRulesParams = {
    inspectorProportionality: 2,
    activistProportionality: 1,
    researcherProportionality: 1,
    developerProportionality: 1,
    contributorProportionality: 1,
  };

  const addUser = async (address, userType, from) => {
    return await instance.connect(from).addUser(address, userType);
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    return await instance.connect(from).addInvitation(inviter, invited, userType);
  };

  const addDelation = async (denouncedAddress, from) => {
    return await instance.connect(from).addDelation(denouncedAddress, "title", "testimony");
  };

  const setToDenied = async (address, from) => {
    return await instance.connect(from).setToDenied(address);
  };

  beforeEach(async function () {
    [owner, user1Address, user2Address, user3Address, user4Address, user5Address, user6Address, user7Address] =
      await ethers.getSigners();

    instance = await communityRulesDeployed(communityRulesParams);

    await instance.newAllowedCaller(owner);
    await communityRules.setContractCall(owner, owner);
  });

  describe("#addUser", () => {
    context("with allowed caller", () => {
      context("when the user don't exist", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
          receipt = await addUser(user1Address, userTypes.Regenerator, owner);
        });

        it("should add a user", async () => {
          const user = await instance.getUser(user1Address);

          expect(user).to.equal(userTypes.Regenerator);
        });

        it("should increment usersCount", async () => {
          const usersCount = await instance.usersCount();

          expect(usersCount).to.equal(1);
        });

        it("should increment userTypesCount to regenerator", async () => {
          const usersCount = await instance.userTypesCount(userTypes.Regenerator);

          expect(usersCount).to.equal(1);
        });

        it("should increment userTypesTotalCount to regenerator", async () => {
          const usersCount = await instance.userTypesTotalCount(userTypes.Regenerator);

          expect(usersCount).to.equal(1);
        });

        it("must emit UserRegistered", async () => {
          await expect(receipt).to.emit(instance, "UserRegistered").withArgs(user1Address, userTypes.Regenerator);
        });
      });

      context("when the user exists", () => {
        it("should return error message", async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
          await addUser(user1Address, userTypes.Regenerator, owner);

          await expect(addUser(user1Address, userTypes.Regenerator, owner)).to.be.revertedWith("User already exists");
        });
      });

      context("when the inviter has been denied", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Activist, owner);
          await addUser(user2Address, userTypes.Activist, owner);

          await addInvitation(user2Address, user1Address, userTypes.Regenerator, owner);
          await setToDenied(user2Address, owner);
        });

        it("should revert the addUser transaction for the invitee", async () => {
          await expect(addUser(user1Address, userTypes.Regenerator, owner)).to.be.revertedWith("Inviter denied");
        });
      });

      context("with UNDEFINED user type", () => {
        it("should return error message", async () => {
          await expect(addUser(user1Address, userTypes.Undefined, owner)).to.be.revertedWith("Invalid user type");
        });
      });

      context("when enum correctly", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Regenerator, owner);

          await addUser(user2Address, userTypes.Regenerator, owner);
        });

        context("to Regenerator", () => {
          it("should add correct enum to regenerator", async () => {
            await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
            await addUser(user1Address, userTypes.Regenerator, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Regenerator);
          });
        });

        context("to Inspector", () => {
          it("should add correct enum to inspector", async () => {
            await addInvitation(owner, user1Address, userTypes.Inspector, owner);
            await addUser(user1Address, userTypes.Inspector, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Inspector);
          });
        });

        context("to researcher", () => {
          it("should add correct enum to researcher", async () => {
            await addInvitation(owner, user1Address, userTypes.Researcher, owner);
            await addUser(user1Address, userTypes.Researcher, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Researcher);
          });
        });

        context("to developer", () => {
          it("should add correct enum to developer", async () => {
            await addInvitation(owner, user1Address, userTypes.Developer, owner);
            await addUser(user1Address, userTypes.Developer, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Developer);
          });
        });

        context("to contributor", () => {
          it("should add correct enum to contributor", async () => {
            await addInvitation(owner, user1Address, userTypes.Contributor, owner);
            await addUser(user1Address, userTypes.Contributor, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Contributor);
          });
        });

        context("to activist", () => {
          it("should add correct enum to activist", async () => {
            await addInvitation(owner, user1Address, userTypes.Activist, owner);
            await addUser(user1Address, userTypes.Activist, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Activist);
          });
        });

        context("to supporter", () => {
          it("should add correct enum to supporter", async () => {
            await addUser(user1Address, userTypes.Supporter, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Supporter);
          });
        });
      });

      context("with proportionality invalid", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
          await addUser(user1Address, userTypes.Regenerator, owner);
        });

        context("to inspector with proportionality 2", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Inspector, owner);
            await addInvitation(owner, user3Address, userTypes.Inspector, owner);
            await addInvitation(owner, user4Address, userTypes.Inspector, owner);
            await addInvitation(owner, user5Address, userTypes.Inspector, owner);
            await addInvitation(owner, user6Address, userTypes.Inspector, owner);

            await addUser(user2Address, userTypes.Inspector, owner);
            await addUser(user3Address, userTypes.Inspector, owner);
            await addUser(user4Address, userTypes.Inspector, owner);
            await addUser(user5Address, userTypes.Inspector, owner);
            await addUser(user6Address, userTypes.Inspector, owner);
          });

          it("should return error message", async () => {
            await expect(addUser(user7Address, userTypes.Inspector, owner)).to.be.revertedWith(
              "Proportionality invalid"
            );
          });
        });

        context("to activist with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Activist, owner);
            await addInvitation(owner, user3Address, userTypes.Activist, owner);
            await addInvitation(owner, user4Address, userTypes.Activist, owner);
            await addInvitation(owner, user5Address, userTypes.Activist, owner);
            await addInvitation(owner, user6Address, userTypes.Activist, owner);

            await addUser(user2Address, userTypes.Activist, owner);
            await addUser(user3Address, userTypes.Activist, owner);
            await addUser(user4Address, userTypes.Activist, owner);
            await addUser(user5Address, userTypes.Activist, owner);
            await addUser(user6Address, userTypes.Activist, owner);
          });

          it("should return error message", async () => {
            await expect(addUser(user7Address, userTypes.Activist, owner)).to.be.revertedWith(
              "Proportionality invalid"
            );
          });
        });

        context("to researcher with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Researcher, owner);
            await addInvitation(owner, user3Address, userTypes.Researcher, owner);
            await addInvitation(owner, user4Address, userTypes.Researcher, owner);
            await addInvitation(owner, user5Address, userTypes.Researcher, owner);
            await addInvitation(owner, user6Address, userTypes.Researcher, owner);

            await addUser(user2Address, userTypes.Researcher, owner);
            await addUser(user3Address, userTypes.Researcher, owner);
            await addUser(user4Address, userTypes.Researcher, owner);
            await addUser(user5Address, userTypes.Researcher, owner);
            await addUser(user6Address, userTypes.Researcher, owner);
          });

          it("should return error message", async () => {
            await expect(addUser(user7Address, userTypes.Researcher, owner)).to.be.revertedWith(
              "Proportionality invalid"
            );
          });
        });

        context("to developer with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Developer, owner);
            await addInvitation(owner, user3Address, userTypes.Developer, owner);
            await addInvitation(owner, user4Address, userTypes.Developer, owner);
            await addInvitation(owner, user5Address, userTypes.Developer, owner);
            await addInvitation(owner, user6Address, userTypes.Developer, owner);

            await addUser(user2Address, userTypes.Developer, owner);
            await addUser(user3Address, userTypes.Developer, owner);
            await addUser(user4Address, userTypes.Developer, owner);
            await addUser(user5Address, userTypes.Developer, owner);
            await addUser(user6Address, userTypes.Developer, owner);
          });

          it("should return error message", async () => {
            await expect(addUser(user7Address, userTypes.Developer, owner)).to.be.revertedWith(
              "Proportionality invalid"
            );
          });
        });

        context("to contributor with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Contributor, owner);
            await addInvitation(owner, user3Address, userTypes.Contributor, owner);
            await addInvitation(owner, user4Address, userTypes.Contributor, owner);
            await addInvitation(owner, user5Address, userTypes.Contributor, owner);
            await addInvitation(owner, user6Address, userTypes.Contributor, owner);

            await addUser(user2Address, userTypes.Contributor, owner);
            await addUser(user3Address, userTypes.Contributor, owner);
            await addUser(user4Address, userTypes.Contributor, owner);
            await addUser(user5Address, userTypes.Contributor, owner);
            await addUser(user6Address, userTypes.Contributor, owner);
          });

          it("should return error message", async () => {
            await expect(addUser(user7Address, userTypes.Contributor, owner)).to.be.revertedWith(
              "Proportionality invalid"
            );
          });
        });
      });

      context("when user was invited", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Regenerator, owner);
          await addUser(user2Address, userTypes.Regenerator, owner);
          await addInvitation(owner, user1Address, userTypes.Inspector, owner);
        });

        context("when try register as same user type of invitation", () => {
          it("should add a user", async () => {
            await addUser(user1Address, userTypes.Inspector, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Inspector);
          });
        });

        context("when try register as another user type of invitation", () => {
          it("should return error message", async () => {
            await expect(addUser(user1Address, userTypes.Developer, owner)).to.be.revertedWith("Invalid invitation");
          });
        });
      });

      context("when user was not invited", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
          await addUser(user1Address, userTypes.Regenerator, owner);
        });

        it("should return error message", async () => {
          expect(addUser(user2Address, userTypes.Inspector, owner)).to.be.revertedWith("Invalid invitation");
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expect(addUser(user1Address, userTypes.Regenerator, user1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#addInvitation", () => {
    context("with allowed caller", () => {
      context("when already invited", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        });

        it("should return error message", async () => {
          await expect(addInvitation(owner, user1Address, userTypes.Regenerator, owner)).to.be.revertedWith(
            "Already invited"
          );
        });
      });

      context("when dont invited yet", () => {
        beforeEach(async () => {
          receipt = await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        });

        it("should invite", async () => {
          const invitation = await instance.invitations(user1Address);

          expect(invitation.inviter).to.equal(owner.address);
          expect(invitation.userType).to.equal(userTypes.Regenerator);
          expect(invitation.invited).to.equal(user1Address.address);
        });

        it("must emit InvitationAdded", async () => {
          await expect(receipt)
            .to.emit(instance, "InvitationAdded")
            .withArgs(owner, user1Address, userTypes.Regenerator);
        });
      });
    });

    context("without allowed caller", () => {});
  });

  describe("#getInvitation", () => {
    beforeEach(async () => {
      await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
    });

    it("returns invitation", async () => {
      const invitation = await instance.getInvitation(user1Address);

      expect(invitation.inviter).to.equal(owner.address);
      expect(invitation.userType).to.equal(userTypes.Regenerator);
      expect(invitation.invited).to.equal(user1Address.address);
    });
  });

  describe("#usersCount", () => {
    context("without users", () => {
      it("should usersCount be zero", async () => {
        const usersCount = await instance.usersCount();

        expect(usersCount).to.equal(0);
      });
    });

    context("with 1 user", () => {
      it("should usersCount be one", async () => {
        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addUser(user1Address, userTypes.Regenerator, owner);

        const usersCount = await instance.usersCount();

        expect(usersCount).to.equal(1);
      });
    });
  });

  describe("#newAllowedCaller", () => {
    context("with owner", () => {
      it("should add new allowed caller with success", async () => {
        await instance.connect(owner).newAllowedCaller(user1Address);
      });
    });

    context("without owner", () => {
      it("should return error message", async () => {
        await expect(instance.connect(user1Address).newAllowedCaller(user1Address)).to.be.revertedWithCustomError(
          instance,
          "OwnableUnauthorizedAccount"
        );
      });
    });
  });

  describe("#addDelation", () => {
    context("when user1 and user2 is registed on system", () => {
      context("when user1 receive delation", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
          await addInvitation(owner, user2Address, userTypes.Regenerator, owner);

          await addUser(user1Address, userTypes.Regenerator, owner);
          await addUser(user2Address, userTypes.Regenerator, owner);

          receipt = await addDelation(user1Address, user2Address);
        });

        it("should add the delation ID to the user's list", async () => {
          const delationIds = await instance.getUserDelations(user1Address); // Renamed for clarity

          expect(delationIds.length).to.equal(1);
          expect(delationIds[0]).to.equal(1);
        });

        it("should store the correct delation data by its ID", async () => {
          const delationId = 1;
          const delation = await instance.delationsById(delationId);

          expect(delation.id).to.equal(delationId);
          expect(delation.reported).to.equal(user1Address.address);
          expect(delation.informer).to.equal(user2Address.address);
          expect(delation.title).to.equal("title");
          expect(delation.testimony).to.equal("testimony");
        });

        it("must emit DelationAdded", async () => {
          await expect(receipt)
            .to.emit(instance, "DelationAdded")
            .withArgs(user2Address.address, user1Address.address, 1);
        });
      });
    });

    context("when user1 (reported) is not registed on system", () => {
      it("should return error message", async () => {
        await addInvitation(owner, user2Address, userTypes.Regenerator, owner);
        await addUser(user2Address, userTypes.Regenerator, owner);

        await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("User must be registered");
      });
    });

    context("when user2 (informer) is not registed on system", () => {
      it("should return error message", async () => {
        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addUser(user1Address, userTypes.Regenerator, owner);

        await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("Caller must be registered");
      });
    });

    context("when user2 (informer) is a supporter", () => {
      it("should return error message", async () => {
        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addUser(user1Address, userTypes.Regenerator, owner);
        await addUser(user2Address, userTypes.Supporter, owner);

        await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("Not allowed to supporters");
      });
    });

    context("when a user tries to make multiple delations in a short period", () => {
      context("when a user tries to make multiple delations in a short period", () => {
        const BLOCKS_BETWEEN_DELATIONS = 500;

        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
          await addInvitation(owner, user2Address, userTypes.Developer, owner);
          await addInvitation(owner, user3Address, userTypes.Developer, owner);
          await addUser(user1Address, userTypes.Regenerator, owner);
          await addUser(user2Address, userTypes.Developer, owner);
          await addUser(user3Address, userTypes.Developer, owner);

          await addDelation(user1Address, user2Address);
        });

        it("should revert if the cooldown period has not passed", async () => {
          await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("Wait delay blocks");
        });

        it("should succeed if the cooldown period has passed", async () => {
          await advanceBlock(BLOCKS_BETWEEN_DELATIONS);

          await addDelation(user1Address, user3Address);

          const delations = await instance.getUserDelations(user1Address);
          expect(delations.length).to.equal(2);
        });
      });
    });

    context("when a user tries to delate the same target twice", () => {
      beforeEach(async () => {
        const BLOCKS_BETWEEN_DELATIONS = 500;

        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addInvitation(owner, user2Address, userTypes.Developer, owner);
        await addUser(user1Address, userTypes.Regenerator, owner);
        await addUser(user2Address, userTypes.Developer, owner);

        await addDelation(user1Address, user2Address);
        await advanceBlock(BLOCKS_BETWEEN_DELATIONS);
      });

      it("should revert the second delation attempt", async () => {
        await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("Already submitted");
      });

      it("should still allow the user to delate a different target", async () => {
        await addInvitation(owner, user3Address, userTypes.Inspector, owner);
        await addUser(user3Address, userTypes.Inspector, owner);

        await expect(addDelation(user3Address, user2Address)).to.not.be.reverted;
      });
    });
  });

  describe("#voteOnDelation", () => {
    let informer, reported, voter, deniedVoter;
    const delationId = 1;

    beforeEach(async () => {
      informer = user1Address;
      reported = user2Address;
      voter = user3Address;
      deniedVoter = user4Address;

      await addInvitation(owner, informer, userTypes.Developer, owner);
      await addInvitation(owner, reported, userTypes.Developer, owner);
      await addInvitation(owner, voter, userTypes.Developer, owner);
      await addInvitation(owner, deniedVoter, userTypes.Developer, owner);

      await addUser(informer, userTypes.Developer, owner);
      await addUser(reported, userTypes.Developer, owner);
      await addUser(voter, userTypes.Developer, owner);
      await addUser(deniedVoter, userTypes.Developer, owner);

      await addDelation(reported, informer);
    });

    context("when the vote is valid", () => {
      it("should increment thumbsUp for a positive vote", async () => {
        await instance.connect(voter).voteOnDelation(delationId, true);
        
        const delation = await instance.delationsById(delationId);

        expect(delation.thumbsUp).to.equal(1);
        expect(delation.thumbsDown).to.equal(0);
      });

      it("should increment thumbsDown for a negative vote", async () => {
        await instance.connect(voter).voteOnDelation(delationId, false);

        const delation = await instance.delationsById(delationId);

        expect(delation.thumbsUp).to.equal(0);
        expect(delation.thumbsDown).to.equal(1);
      });

      it("should emit a DelationVoted event", async () => {
        const supportsDelation = true;
        await expect(instance.connect(voter).voteOnDelation(delationId, supportsDelation))
          .to.emit(instance, "DelationVoted")
          .withArgs(delationId, voter.address, supportsDelation, 1, 0);
      });
    });

    context("when the vote is invalid due to permissions or state", () => {
      it("should revert if the delation does not exist", async () => {
        const nonExistentId = 999;
        await expect(
          instance.connect(voter).voteOnDelation(nonExistentId, true)
        ).to.be.revertedWith("Delation does not exist");
      });

      it("should revert if the voter is a Supporter", async () => {
        const supporterVoter = user5Address;
        await addUser(supporterVoter, userTypes.Supporter, owner);

        await expect(
          instance.connect(supporterVoter).voteOnDelation(delationId, true)
        ).to.be.revertedWith("Not allowed to supporters");
      });

      it("should revert if the voter has been denied", async () => {
        await setToDenied(deniedVoter, owner);

        await expect(
          instance.connect(deniedVoter).voteOnDelation(delationId, true)
        ).to.be.revertedWith("User denied");
      });

      it("should revert if the voter is the original informer", async () => {
        await expect(
          instance.connect(informer).voteOnDelation(delationId, true)
        ).to.be.revertedWith("Informer cannot vote");
      });

      it("should revert if the voter is the reported user", async () => {
        await expect(
          instance.connect(reported).voteOnDelation(delationId, true)
        ).to.be.revertedWith("Reported user cannot vote");
      });

      it("should revert if the user tries to vote twice", async () => {
        await instance.connect(voter).voteOnDelation(delationId, true);

        await expect(
          instance.connect(voter).voteOnDelation(delationId, false)
        ).to.be.revertedWith("Already voted");
      });
    });
  });

  describe("#getUserDelations", () => {
    context("when user1 have 2 delations", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addInvitation(owner, user2Address, userTypes.Regenerator, owner);
        await addInvitation(owner, user3Address, userTypes.Regenerator, owner);

        await addUser(user1Address, userTypes.Regenerator, owner);
        await addUser(user2Address, userTypes.Regenerator, owner);
        await addUser(user3Address, userTypes.Regenerator, owner);

        await addDelation(user1Address, user2Address);
        await advanceBlock(5000);
        await addDelation(user1Address, user3Address);
      });

      it("should return 2 delations", async () => {
        const delations = await instance.getUserDelations(user1Address);

        expect(delations.length).to.equal(2);
      });
    });

    context("when user1 have 0 delations", () => {
      it("should return 0 delations", async () => {
        const delations = await instance.getUserDelations(user1Address);

        expect(delations.length).to.equal(0);
      });
    });
  });

  describe("#getUserTypeSettings", () => {
    context("when get to regenerator", () => {
      it("", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Regenerator);

        expect(settings).deep.to.equal([0n, false, true, 0, false]);
      });
    });

    context("when get to contributor", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Contributor);

        expect(settings).deep.to.equal([1n, false, true, 100000n, true]);
      });
    });

    context("when get to inspector", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Inspector);

        expect(settings).deep.to.equal([2n, true, true, 0, false]);
      });
    });

    context("when get to activist", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Activist);

        expect(settings).deep.to.equal([1n, false, true, 100000n, true]);
      });
    });

    context("when get to reseacher", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Researcher);

        expect(settings).deep.to.equal([1n, false, true, 100000n, true]);
      });
    });

    context("when get to developer", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Developer);

        expect(settings).deep.to.equal([1n, false, true, 100000n, true]);
      });
    });
  });

  describe("#votersCount", () => {
    beforeEach(async () => {
      await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user2Address, userTypes.Activist, owner);
      await addInvitation(owner, user3Address, userTypes.Developer, owner);
      await addInvitation(owner, user4Address, userTypes.Contributor, owner);
      await addInvitation(owner, user5Address, userTypes.Researcher, owner);

      await addUser(user1Address, userTypes.Regenerator, owner);
      await addUser(user2Address, userTypes.Activist, owner);
      await addUser(user3Address, userTypes.Developer, owner);
      await addUser(user4Address, userTypes.Contributor, owner);
      await addUser(user5Address, userTypes.Researcher, owner);
    });

    context("when have 4 voters", () => {
      context("when all voters is not denied", () => {
        it("must returns 4 voters", async () => {
          const votersCount = await instance.votersCount();

          expect(votersCount).to.equal(4);
        });
      });

      context("when some voters is  denied", () => {
        beforeEach(async () => {
          await instance.setToDenied(user2Address);
        });

        it("must return only valid voters", async () => {
          const votersCount = await instance.votersCount();

          expect(votersCount).to.equal(3);
        });
      });
    });
  });

  describe("#isVoter", () => {
    beforeEach(async () => {
      await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
      await addInvitation(owner, user2Address, userTypes.Activist, owner);
      await addInvitation(owner, user3Address, userTypes.Developer, owner);
      await addInvitation(owner, user4Address, userTypes.Contributor, owner);
      await addInvitation(owner, user5Address, userTypes.Researcher, owner);

      await addUser(user1Address, userTypes.Regenerator, owner);
      await addUser(user2Address, userTypes.Activist, owner);
      await addUser(user3Address, userTypes.Developer, owner);
      await addUser(user4Address, userTypes.Contributor, owner);
      await addUser(user5Address, userTypes.Researcher, owner);
    });

    context("when is regenerator", () => {
      it("must returns false", async () => {
        const isVoter = await instance.isVoter(user1Address);

        expect(isVoter).to.equal(false);
      });
    });

    context("when is activist", () => {
      it("must returns true", async () => {
        const isVoter = await instance.isVoter(user2Address);

        expect(isVoter).to.equal(true);
      });
    });

    context("when is developer", () => {
      it("must returns true", async () => {
        const isVoter = await instance.isVoter(user3Address);

        expect(isVoter).to.equal(true);
      });
    });

    context("when is contributor", () => {
      it("must returns true", async () => {
        const isVoter = await instance.isVoter(user4Address);

        expect(isVoter).to.equal(true);
      });
    });

    context("when is researcher", () => {
      it("must returns true", async () => {
        const isVoter = await instance.isVoter(user5Address);

        expect(isVoter).to.equal(true);
      });
    });

    context("when is denied", () => {
      it("must returns false", async () => {
        await communityRules.setToDenied(user5Address);

        const isVoter = await instance.isVoter(user5Address);

        expect(isVoter).to.equal(false);
      });
    });
  });

  describe("#setToDenied", () => {
    context("with allowed user", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addUser(user1Address, userTypes.Regenerator, owner);
      });

      beforeEach(async () => {
        await communityRules.setToDenied(user1Address);
      });

      it("set denied to true", async () => {
        const isDenied = await communityRules.isDenied(user1Address);

        await expect(isDenied).to.eq(true);
      });

      it("user type must be the same", async () => {
        const userType = await communityRules.getUser(user1Address);

        await expect(userType).to.eq(userTypes.Regenerator);
      });
    });

    context("with not allowed user", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Regenerator, owner);
        await addUser(user1Address, userTypes.Regenerator, owner);
      });

      it("should return error", async () => {
        await expect(communityRules.connect(user1Address).setToDenied(user1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });
});
