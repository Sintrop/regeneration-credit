const InvitationContract = artifacts.require("InvitationContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("InvitationContract", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address, user3Address, user4Address] = accounts;

  const inviteDelayBlocks = 25;

  const addUser = async (address, userType, caller) => {
    await userContract.addUser(address, userType, { from: caller });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.addInvitation(inviter, invited, userType, {
      from: from,
    });
  };

  beforeEach(async () => {
    userContract = await userContractDeployed();
    instance = await InvitationContract.new(userContract.address, inviteDelayBlocks);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(owner);
  });

  describe("#invite", () => {
    beforeEach(async () => {
      await addUser(user1Address, userTypes.Producer, owner);
    });

    context("when user already invited", () => {
      beforeEach(async () => {
        await addInvitation(owner, user2Address, userTypes.Activist, owner);
        await addInvitation(owner, user4Address, userTypes.Activist, owner);

        await addUser(user2Address, userTypes.Activist, owner);
        await addUser(user4Address, userTypes.Activist, owner);
        await instance.invite(user3Address, userTypes.Activist, { from: user2Address });
      });

      it("revert", async () => {
        await expectRevert(
          instance.invite(user3Address, userTypes.Activist, { from: user4Address }),
          "Already invited"
        );
      });
    });

    context("when have recent invitation", () => {
      beforeEach(async () => {
        await addInvitation(owner, user2Address, userTypes.Activist, owner);
        await addUser(user2Address, userTypes.Activist, owner);
        await instance.invite(user3Address, userTypes.Activist, { from: user2Address });
      });

      it("revert", async () => {
        await expectRevert(
          instance.invite(user4Address, userTypes.Activist, { from: user2Address }),
          "Invite delay not reached"
        );
      });
    });

    context("when user not registered and not invited", () => {
      context("when activist invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Activist, owner);
          await addUser(user2Address, userTypes.Activist, owner);
        });

        context("activist", () => {
          it("invite with success", async () => {
            await instance.invite(user3Address, userTypes.Activist, { from: user2Address });

            const invitation = await userContract.invitations(user3Address);

            assert.equal(invitation.invited, user3Address);
          });
        });

        context("inspector", () => {
          it("invite with success", async () => {
            await instance.invite(user3Address, userTypes.Inspector, { from: user2Address });

            const invitation = await userContract.invitations(user3Address);

            assert.equal(invitation.invited, user3Address);
          });
        });

        context("producer", () => {
          it("invite with success", async () => {
            await instance.invite(user3Address, userTypes.Producer, { from: user2Address });

            const invitation = await userContract.invitations(user3Address);

            assert.equal(invitation.invited, user3Address);
          });
        });
      });

      context("when developer invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Developer, owner);
          await addUser(user2Address, userTypes.Developer, owner);
        });

        context("developer", () => {
          it("invite with success", async () => {
            await instance.invite(user3Address, userTypes.Developer, { from: user2Address });

            const invitation = await userContract.invitations(user3Address);

            assert.equal(invitation.invited, user3Address);
          });
        });
      });

      context("when researcher invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Researcher, owner);
          await addUser(user2Address, userTypes.Researcher, owner);
        });

        context("researcher", () => {
          it("invite with success", async () => {
            await instance.invite(user3Address, userTypes.Researcher, { from: user2Address });

            const invitation = await userContract.invitations(user3Address);

            assert.equal(invitation.invited, user3Address);
          });
        });
      });

      context("when supporter invite", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Supporter, owner);
          await addUser(user2Address, userTypes.Supporter, owner);
        });

        context("supporter", () => {
          it("invite with success", async () => {
            await instance.invite(user3Address, userTypes.Supporter, { from: user2Address });

            const invitation = await userContract.invitations(user3Address);

            assert.equal(invitation.invited, user3Address);
          });
        });
      });
    });
  });

  describe("#onlyOwnerInvite", () => {
    beforeEach(async () => {
      await addUser(user1Address, userTypes.Producer, owner);
    });

    context("when invite", () => {
      context("with owner", () => {
        it("invite with success", async () => {
          await instance.onlyOwnerInvite(user3Address, userTypes.Developer, { from: owner });

          const invitation = await userContract.invitations(user3Address);

          assert.equal(invitation.invited, user3Address);
        });
      });

      context("with not owner", () => {
        it("revert", async () => {
          await expectRevert(
            instance.onlyOwnerInvite(user2Address, userTypes.Activist, { from: user1Address }),
            "Ownable: caller is not the owner"
          );
        });
      });
    });
  });
});
