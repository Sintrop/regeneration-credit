const InvitationContract = artifacts.require("InvitationContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("InvitationContract", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address, user3Address, user4Address] = accounts;

  const inviteDelayBlocks = 25;

  let userTypes = {
    Undefined: 0,
    Producer: 1,
    Inspector: 2,
    Researcher: 3,
    Developer: 4,
    Advisor: 5,
    Activist: 6,
    Supporter: 7,
    Validator: 8,
    Denied: 9,
  };

  const addUser = async (address, userType, caller) => {
    await userContract.addUser(address, userType, { from: caller });
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

    context("when user already registed", () => {
      beforeEach(async () => {
        await addUser(user2Address, userTypes.Producer, owner);
        await addUser(user3Address, userTypes.Activist, owner);
        await addUser(user4Address, userTypes.Inspector, owner);
      });

      it("revert", async () => {
        await expectRevert(
          instance.invite(user4Address, userTypes.Inspector, { from: user3Address }),
          "Already registered"
        );
      });
    });

    context("when user already invited", () => {
      beforeEach(async () => {
        await addUser(user2Address, userTypes.Activist, owner);
        await instance.invite(user3Address, userTypes.Activist, { from: user2Address });
      });

      it("revert", async () => {
        await expectRevert(
          instance.invite(user3Address, userTypes.Activist, { from: user2Address }),
          "Already invited"
        );
      });
    });

    context.only("when have recent invitation", () => {
      beforeEach(async () => {
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
