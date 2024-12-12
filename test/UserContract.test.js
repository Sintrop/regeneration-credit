const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("UserContract", function () {
  let instance;
  let owner, user1Address, user2Address, user3Address, user4Address;

  const userContractParams = {
    inspectorProportionality: 2,
    activistProportionality: 1,
    researcherProportionality: 1,
    developerProportionality: 1,
    validatorProportionality: 1,
    contributorProportionality: 1,
  };

  const definedTypes = [
    "UNDEFINED",
    "PRODUCER",
    "INSPECTOR",
    "RESEARCHER",
    "DEVELOPER",
    "CONTRIBUTOR",
    "ACTIVIST",
    "SUPPORTER",
    "VALIDATOR",
    "DENIED",
  ];

  const addUser = async (address, userType, caller) => {
    return await instance.addUser(address, userType, { from: caller });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    return await instance.connect(from).addInvitation(inviter, invited, userType);
  };

  const addDelation = async (denouncedAddress, from) => {
    return await instance.connect(from).addDelation(denouncedAddress, "title", "testimony");
  };

  beforeEach(async function () {
    [owner, user1Address, user2Address, user3Address, user4Address] = await ethers.getSigners();

    instance = await userContractDeployed(userContractParams);

    await instance.newAllowedCaller(owner);
  });

  describe("#addUser", () => {
    context("with allowed caller", () => {
      context("when the user don't exist", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
          receipt = await addUser(user1Address, userTypes.Producer, owner);
        });

        it("should add a user", async () => {
          const user = await instance.getUser(user1Address);

          expect(user).to.equal(userTypes.Producer);
        });

        it("should increment usersCount", async () => {
          const usersCount = await instance.usersCount();

          expect(usersCount).to.equal(1);
        });

        it("should increment userTypesCount to producer", async () => {
          const usersCount = await instance.userTypesCount(userTypes.Producer);

          expect(usersCount).to.equal(1);
        });

        it("must emit AddUserEvent", async () => {
          await expect(receipt).to.emit(instance, "AddUserEvent").withArgs(user1Address, userTypes.Producer);
        });
      });

      context("when the user exists", () => {
        it("should return error message", async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
          await addUser(user1Address, userTypes.Producer, owner);

          expect(addUser(user1Address, userTypes.Producer, owner)).to.be.revertedWith("User already exists");
        });
      });

      context("with UNDEFINED user type", () => {
        it("should return error message", async () => {
          expect(addUser(user1Address, userTypes.Undefined, owner)).to.be.revertedWith("Invalid user type");
        });
      });

      context("when enum correctly", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Producer, owner);

          await addUser(user2Address, userTypes.Producer, owner);
        });

        context("to Producer", () => {
          it("should add correct enum to producer", async () => {
            await addInvitation(owner, user1Address, userTypes.Producer, owner);
            await addUser(user1Address, userTypes.Producer, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Producer);
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

        context("to validator", () => {
          it("should add correct enum to validator", async () => {
            await addInvitation(owner, user1Address, userTypes.Validator, owner);
            await addUser(user1Address, userTypes.Validator, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Validator);
          });
        });

        context("to denied", () => {
          it("should add correct enum to denied", async () => {
            await addUser(user1Address, userTypes.Denied, owner);

            const user = await instance.getUser(user1Address);

            expect(user).to.equal(userTypes.Denied);
          });
        });
      });

      context("with proportionality invalid", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
          await addUser(user1Address, userTypes.Producer, owner);
        });

        context("to inspector with proportionality 2", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Inspector, owner);
            await addInvitation(owner, user3Address, userTypes.Inspector, owner);
            await addInvitation(owner, user4Address, userTypes.Inspector, owner);

            await addUser(user2Address, userTypes.Inspector, owner);
            await addUser(user3Address, userTypes.Inspector, owner);
          });

          it("should return error message", async () => {
            expect(addUser(user4Address, userTypes.Inspector, owner)).to.be.revertedWith("Proportionality invalid");
          });
        });

        context("to activist with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Activist, owner);
            await addInvitation(owner, user3Address, userTypes.Activist, owner);

            await addUser(user2Address, userTypes.Activist, owner);
          });

          it("should return error message", async () => {
            expect(addUser(user3Address, userTypes.Activist, owner)).to.be.revertedWith("Proportionality invalid");
          });
        });

        context("to researcher with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Researcher, owner);
            await addInvitation(owner, user3Address, userTypes.Researcher, owner);

            await addUser(user2Address, userTypes.Researcher, owner);
          });

          it("should return error message", async () => {
            expect(addUser(user3Address, userTypes.Researcher, owner)).to.be.revertedWith("Proportionality invalid");
          });
        });

        context("to developer with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Developer, owner);
            await addInvitation(owner, user3Address, userTypes.Developer, owner);

            await addUser(user2Address, userTypes.Developer, owner);
          });

          it("should return error message", async () => {
            expect(addUser(user3Address, userTypes.Developer, owner)).to.be.revertedWith("Proportionality invalid");
          });
        });

        context("to contributor with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Contributor, owner);
            await addInvitation(owner, user3Address, userTypes.Contributor, owner);

            await addUser(user2Address, userTypes.Contributor, owner);
          });

          it("should return error message", async () => {
            expect(addUser(user3Address, userTypes.Contributor, owner)).to.be.revertedWith("Proportionality invalid");
          });
        });

        context("to validator with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Validator, owner);
            await addInvitation(owner, user3Address, userTypes.Validator, owner);

            await addUser(user2Address, userTypes.Validator, owner);
          });

          it("should return error message", async () => {
            expect(addUser(user3Address, userTypes.Validator, owner)).to.be.revertedWith("Proportionality invalid");
          });
        });
      });

      context("when user was invited", () => {
        beforeEach(async () => {
          await addInvitation(owner, user2Address, userTypes.Producer, owner);
          await addUser(user2Address, userTypes.Producer, owner);
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
            expect(addUser(user1Address, userTypes.Developer, owner)).to.be.revertedWith("Invalid invitation");
          });
        });
      });

      context("when user was not invited", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
          await addUser(user1Address, userTypes.Producer, owner);
        });

        it("should return error message", async () => {
          expect(addUser(user2Address, userTypes.Inspector, owner)).to.be.revertedWith("Invalid invitation");
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        expect(addUser(user1Address, userTypes.Producer, user1Address)).to.be.revertedWith("Not allowed caller");
      });
    });
  });

  describe("#addInvitation", () => {
    context("with allowed caller", () => {
      context("when already invited", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
        });

        it("should return error message", async () => {
          await expect(addInvitation(owner, user1Address, userTypes.Producer, owner)).to.be.revertedWith(
            "Already invited"
          );
        });
      });

      context("when dont invited yet", () => {
        beforeEach(async () => {
          receipt = await addInvitation(owner, user1Address, userTypes.Producer, owner);
        });

        it("should invite", async () => {
          const invitation = await instance.invitations(user1Address);

          expect(invitation.inviter).to.equal(owner.address);
          expect(invitation.userType).to.equal(userTypes.Producer);
          expect(invitation.invited).to.equal(user1Address.address);
        });

        it("must emit AddInvitationEvent", async () => {
          await expect(receipt)
            .to.emit(instance, "AddInvitationEvent")
            .withArgs(owner, user1Address, userTypes.Producer);
        });
      });
    });

    context("without allowed caller", () => {});
  });

  describe("#getInvitation", () => {
    beforeEach(async () => {
      await addInvitation(owner, user1Address, userTypes.Producer, owner);
    });

    it("returns invitation", async () => {
      const invitation = await instance.getInvitation(user1Address);

      expect(invitation.inviter).to.equal(owner.address);
      expect(invitation.userType).to.equal(userTypes.Producer);
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
        await addInvitation(owner, user1Address, userTypes.Producer, owner);
        await addUser(user1Address, userTypes.Producer, owner);

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
        await expect(instance.connect(user1Address).newAllowedCaller(user1Address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });
    });
  });

  describe("#addDelation", () => {
    context("when user1 and user2 is registed on system", () => {
      context("when user1 receive delation", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
          await addInvitation(owner, user2Address, userTypes.Producer, owner);

          await addUser(user1Address, userTypes.Producer, owner);
          await addUser(user2Address, userTypes.Producer, owner);

          receipt = await addDelation(user1Address, user2Address);
        });

        it("should add delation to user1", async () => {
          const delations = await instance.getUserDelations(user1Address);
          const reported = delations[0].reported;

          expect(delations.length).to.equal(1);
          expect(reported).to.equal(user1Address.address);
        });

        it("should refer informer as user2", async () => {
          const delations = await instance.getUserDelations(user1Address);
          const informer = delations[0].informer;

          expect(informer).to.equal(user2Address.address);
        });

        it("should add have fields", async () => {
          const delations = await instance.getUserDelations(user1Address);
          const id = delations[0].id;
          const title = delations[0].title;
          const testimony = delations[0].testimony;

          expect(id).to.equal(1);
          expect(title).to.equal("title");
          expect(testimony).to.equal("testimony");
        });

        it("must emit AddDelelationEvent", async () => {
          await expect(receipt).to.emit(instance, "AddDelelationEvent").withArgs(user2Address, user1Address);
        });
      });
    });

    context("when user1 (reported) is not registed on system", () => {
      it("should return error message", async () => {
        await addInvitation(owner, user2Address, userTypes.Producer, owner);
        await addUser(user2Address, userTypes.Producer, owner);

        await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("User must be registered");
      });
    });

    context("when user2 (informer) is not registed on system", () => {
      it("should return error message", async () => {
        await addInvitation(owner, user1Address, userTypes.Producer, owner);
        await addUser(user1Address, userTypes.Producer, owner);

        await expect(addDelation(user1Address, user2Address)).to.be.revertedWith("Caller must be registered");
      });
    });
  });

  describe("#getUserDelations", () => {
    context("when user1 have 2 delations", () => {
      beforeEach(async () => {
        await addInvitation(owner, user1Address, userTypes.Producer, owner);
        await addInvitation(owner, user2Address, userTypes.Producer, owner);

        await addUser(user1Address, userTypes.Producer, owner);
        await addUser(user2Address, userTypes.Producer, owner);

        await addDelation(user1Address, user2Address);
        await addDelation(user1Address, user2Address);
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
    context("when get to producer", () => {
      it("", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Producer);

        expect(settings).deep.to.equal([0n, false, true, 0]);
      });
    });

    context("when get to contributor", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Contributor);

        expect(settings).deep.to.equal([1n, false, true, 100000n]);
      });
    });

    context("when get to inspector", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Inspector);

        expect(settings).deep.to.equal([2n, true, true, 0]);
      });
    });

    context("when get to activist", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Activist);

        expect(settings).deep.to.equal([1n, false, true, 100000n]);
      });
    });

    context("when get to reseacher", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Researcher);

        expect(settings).deep.to.equal([1n, false, true, 200000n]);
      });
    });

    context("when get to developer", () => {
      it("returns settings", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Developer);

        expect(settings).deep.to.equal([1n, false, true, 200000n]);
      });
    });

    context("when get to validator", () => {
      it("", async () => {
        const settings = await instance.getUserTypeSettings(userTypes.Validator);

        expect(settings).deep.to.equal([1n, false, true, 1000000n]);
      });
    });
  });
});
