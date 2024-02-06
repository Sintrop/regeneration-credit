const { ethers } = require("hardhat");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("InvitationContract", () => {
  let instance, userContract;
  let owner, user1Address, user2Address, user3Address, user4Address;

  const inviteDelayBlocks = 25;

  const addUser = async (address, userType, from) => {
    await userContract.connect(from).addUser(address, userType);
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, user1Address, user2Address, user3Address, user4Address] = await ethers.getSigners();

    userContract = await userContractDeployed();

    const instanceFactory = await ethers.getContractFactory("InvitationContract");
    instance = await instanceFactory.deploy(userContract.target, inviteDelayBlocks);

    await userContract.newAllowedCaller(instance.target);
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
        await instance.connect(user2Address).invite(user3Address, userTypes.Activist);
      });

      it("revert", async () => {
        await expect(instance.connect(user4Address).invite(user3Address, userTypes.Activist)).to.be.revertedWith(
          "Already invited"
        );
      });
    });

    context("when have recent invitation", () => {
      beforeEach(async () => {
        await addInvitation(owner, user2Address, userTypes.Activist, owner);
        await addUser(user2Address, userTypes.Activist, owner);

        await instance.connect(user2Address).invite(user3Address, userTypes.Activist);
      });

      it("revert", async () => {
        await expect(instance.connect(user2Address).invite(user4Address, userTypes.Activist)).to.be.revertedWith(
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
            await instance.connect(user2Address).invite(user3Address, userTypes.Activist);

            const invitation = await userContract.invitations(user3Address);

            expect(invitation.invited).to.equal(user3Address.address);
          });
        });

        context("inspector", () => {
          it("invite with success", async () => {
            await instance.connect(user2Address).invite(user3Address, userTypes.Inspector);

            const invitation = await userContract.invitations(user3Address);

            expect(invitation.invited).to.equal(user3Address.address);
          });
        });

        context("producer", () => {
          it("invite with success", async () => {
            await instance.connect(user2Address).invite(user3Address, userTypes.Producer);

            const invitation = await userContract.invitations(user3Address.address);

            expect(invitation.invited).to.equal(user3Address.address);
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
            await instance.connect(user2Address).invite(user3Address, userTypes.Developer);

            const invitation = await userContract.invitations(user3Address);

            expect(invitation.invited).to.equal(user3Address.address);
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
            await instance.connect(user2Address).invite(user3Address, userTypes.Researcher);

            const invitation = await userContract.invitations(user3Address);

            expect(invitation.invited).to.equal(user3Address.address);
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
            await instance.connect(user2Address).invite(user3Address, userTypes.Supporter);

            const invitation = await userContract.invitations(user3Address);

            expect(invitation.invited).to.equal(user3Address.address);
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
          await instance.onlyOwnerInvite(user3Address, userTypes.Developer);

          const invitation = await userContract.invitations(user3Address);

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
