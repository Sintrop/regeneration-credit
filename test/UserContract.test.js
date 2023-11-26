const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("UserContract", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address, user3Address, user4Address] = accounts;

  const definedTypes = {
    0: "UNDEFINED",
    1: "PRODUCER",
    2: "INSPECTOR",
    3: "RESEARCHER",
    4: "DEVELOPER",
    5: "ADVISOR",
    6: "ACTIVIST",
    7: "SUPPORTER",
    8: "VALIDATOR",
    9: "DENIED",
  };

  const userContractParams = {
    inspectorProportionality: 2,
    activistProportionality: 1,
    researcherProportionality: 1,
    developerProportionality: 1,
    validatorProportionality: 1,
  };

  const addUser = async (address, userType, caller) => {
    await instance.addUser(address, userType, { from: caller });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await instance.addInvitation(inviter, invited, userType, {
      from: from,
    });
  };

  const addDelation = async (denouncedAddress, from) => {
    await instance.addDelation(denouncedAddress, "title", "testimony", "proofPhoto", {
      from: from,
    });
  };

  beforeEach(async () => {
    instance = await userContractDeployed(userContractParams);

    await instance.newAllowedCaller(owner);
  });

  describe("#addUser", () => {
    context("with allowed caller", () => {
      context("when the user don't exist", () => {
        beforeEach(async () => {
          await addUser(user1Address, userTypes.Producer, owner);
        });

        it("should add a user", async () => {
          const user = await instance.getUser(user1Address);

          assert.equal(user, userTypes.Producer);
        });

        it("should increment usersCount", async () => {
          const usersCount = await instance.usersCount();

          assert.equal(usersCount, 1);
        });

        it("should increment userTypesCount to producer", async () => {
          const usersCount = await instance.userTypesCount(userTypes.Producer);

          assert.equal(usersCount, 1);
        });
      });

      context("when the user exists", () => {
        it("should return error message", async () => {
          await addUser(user1Address, userTypes.Producer, owner);

          await expectRevert(addUser(user1Address, userTypes.Producer, owner), "User already exists");
        });
      });

      context("with UNDEFINED user type", () => {
        it("should return error message", async () => {
          await expectRevert(addUser(user1Address, userTypes.Undefined, owner), "Invalid user type");
        });
      });

      context("when enum correctly", () => {
        beforeEach(async () => {
          await addUser(owner, userTypes.Producer, owner);
        });

        context("to Producer", () => {
          it("should add correct enum to producer", async () => {
            await addUser(user1Address, userTypes.Producer, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Producer);
          });
        });

        context("to Inspector", () => {
          it("should add correct enum to inspector", async () => {
            await addInvitation(owner, user1Address, userTypes.Inspector, owner);
            await addUser(user1Address, userTypes.Inspector, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Inspector);
          });
        });

        context("to researcher", () => {
          it("should add correct enum to researcher", async () => {
            await addInvitation(owner, user1Address, userTypes.Researcher, owner);
            await addUser(user1Address, userTypes.Researcher, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Researcher);
          });
        });

        context("to developer", () => {
          it("should add correct enum to developer", async () => {
            await addInvitation(owner, user1Address, userTypes.Developer, owner);
            await addUser(user1Address, userTypes.Developer, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Developer);
          });
        });

        context("to advisor", () => {
          it("should add correct enum to advisor", async () => {
            await addInvitation(owner, user1Address, userTypes.Advisor, owner);
            await addUser(user1Address, userTypes.Advisor, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Advisor);
          });
        });

        context("to activist", () => {
          it("should add correct enum to activist", async () => {
            await addInvitation(owner, user1Address, userTypes.Activist, owner);
            await addUser(user1Address, userTypes.Activist, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Activist);
          });
        });

        context("to supporter", () => {
          it("should add correct enum to supporter", async () => {
            await addUser(user1Address, userTypes.Supporter, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Supporter);
          });
        });

        context("to validator", () => {
          it("should add correct enum to validator", async () => {
            await addInvitation(owner, user1Address, userTypes.Validator, owner);
            await addUser(user1Address, userTypes.Validator, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Validator);
          });
        });

        context("to denied", () => {
          it("should add correct enum to denied", async () => {
            await addUser(user1Address, userTypes.Denied, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Denied);
          });
        });
      });

      context("with proportionality invalid", () => {
        beforeEach(async () => {
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
            await expectRevert(addUser(user4Address, userTypes.Inspector, owner), "Proportionality invalid");
          });
        });

        context("to activist with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Activist, owner);
            await addInvitation(owner, user3Address, userTypes.Activist, owner);

            await addUser(user2Address, userTypes.Activist, owner);
          });

          it("should return error message", async () => {
            await expectRevert(addUser(user3Address, userTypes.Activist, owner), "Proportionality invalid");
          });
        });

        context("to researcher with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Researcher, owner);
            await addInvitation(owner, user3Address, userTypes.Researcher, owner);

            await addUser(user2Address, userTypes.Researcher, owner);
          });

          it("should return error message", async () => {
            await expectRevert(addUser(user3Address, userTypes.Researcher, owner), "Proportionality invalid");
          });
        });

        context("to developer with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Developer, owner);
            await addInvitation(owner, user3Address, userTypes.Developer, owner);

            await addUser(user2Address, userTypes.Developer, owner);
          });

          it("should return error message", async () => {
            await expectRevert(addUser(user3Address, userTypes.Developer, owner), "Proportionality invalid");
          });
        });

        context("to validator with proportionality 1", () => {
          beforeEach(async () => {
            await addInvitation(owner, user2Address, userTypes.Validator, owner);
            await addInvitation(owner, user3Address, userTypes.Validator, owner);

            await addUser(user2Address, userTypes.Validator, owner);
          });

          it("should return error message", async () => {
            await expectRevert(addUser(user3Address, userTypes.Validator, owner), "Proportionality invalid");
          });
        });
      });

      context("when user was invited", () => {
        beforeEach(async () => {
          await addUser(user2Address, userTypes.Producer, owner);
          await addInvitation(owner, user1Address, userTypes.Inspector, owner);
        });

        context("when try register as same user type of invitation", () => {
          it("should add a user", async () => {
            await addUser(user1Address, userTypes.Inspector, owner);

            const user = await instance.getUser(user1Address);

            assert.equal(user, userTypes.Inspector);
          });
        });

        context("when try register as another user type of invitation", () => {
          it("should return error message", async () => {
            await expectRevert(addUser(user1Address, userTypes.Developer, owner), "Invalid invitation");
          });
        });
      });

      context("when user was not invited", () => {
        beforeEach(async () => {
          await addUser(user1Address, userTypes.Producer, owner);
        });

        it("should return error message", async () => {
          await expectRevert(addUser(user2Address, userTypes.Inspector, owner), "Invalid invitation");
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(addUser(user1Address, userTypes.Producer, user1Address), "Not allowed caller");
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
          await expectRevert(addInvitation(owner, user1Address, userTypes.Producer, owner), "Already invited");
        });
      });

      context("when dont invited yet", () => {
        beforeEach(async () => {
          await addInvitation(owner, user1Address, userTypes.Producer, owner);
        });

        it("should invite", async () => {
          const invitation = await instance.invitations(user1Address);

          assert.equal(invitation.inviter, owner);
          assert.equal(invitation.userType, userTypes.Producer);
          assert.equal(invitation.invited, user1Address);
        });
      });
    });

    context("without allowed caller", () => {});
  });

  describe("#usersCount", () => {
    context("without users", () => {
      it("should usersCount be zero", async () => {
        const usersCount = await instance.usersCount();

        assert.equal(usersCount, 0);
      });
    });

    context("with 1 user", () => {
      it("should usersCount be one", async () => {
        await addUser(user1Address, userTypes.Producer, owner);

        const usersCount = await instance.usersCount();

        assert.equal(usersCount, 1);
      });
    });
  });

  describe("#userTypes", () => {
    it("should have enums", async () => {
      const types = await instance.userTypes();

      assert.equal(JSON.stringify(types), JSON.stringify(definedTypes));
    });
  });

  describe("#newAllowedCaller", () => {
    context("with owner", () => {
      it("should add new allowed caller with success", async () => {
        await instance.newAllowedCaller(user1Address, { from: owner });
      });
    });

    context("without owner", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.newAllowedCaller(user1Address, { from: user1Address }),
          "Ownable: caller is not the owner"
        );
      });
    });
  });

  describe("#addDelation", () => {
    context("when user1 and user2 is registed on system", () => {
      context("when user1 receive delation", () => {
        beforeEach(async () => {
          await addUser(user1Address, userTypes.Producer, owner);
          await addUser(user2Address, userTypes.Producer, owner);

          await addDelation(user1Address, user2Address);
        });

        it("should add delation to user1", async () => {
          const delations = await instance.getUserDelations(user1Address);
          const reported = delations[0].reported;

          assert.equal(delations.length, 1);
          assert.equal(reported, user1Address);
        });

        it("should refer informer as user2", async () => {
          const delations = await instance.getUserDelations(user1Address);
          const informer = delations[0].informer;

          assert.equal(informer, user2Address);
        });

        it("should add have fields", async () => {
          const delations = await instance.getUserDelations(user1Address);
          const id = delations[0].id;
          const title = delations[0].title;
          const testimony = delations[0].testimony;
          const proofPhoto = delations[0].proofPhoto;

          assert.equal(id, 1);
          assert.equal(title, "title");
          assert.equal(testimony, "testimony");
          assert.equal(proofPhoto, "proofPhoto");
        });
      });
    });

    context("when user1 (reported) is not registed on system", () => {
      it("should return error message", async () => {
        await addUser(user2Address, userTypes.Producer, owner);

        await expectRevert(addDelation(user1Address, user2Address), "User must be registered");
      });
    });

    context("when user2 (informer) is not registed on system", () => {
      it("should return error message", async () => {
        await addUser(user1Address, userTypes.Producer, owner);

        await expectRevert(addDelation(user1Address, user2Address), "Caller must be registered");
      });
    });
  });

  describe("#getUserDelations", () => {
    context("when user1 have 2 delations", () => {
      beforeEach(async () => {
        await addUser(user1Address, userTypes.Producer, owner);
        await addUser(user2Address, userTypes.Producer, owner);

        await addDelation(user1Address, user2Address);
        await addDelation(user1Address, user2Address);
      });

      it("should return 2 delations", async () => {
        const delations = await instance.getUserDelations(user1Address);

        assert.equal(delations.length, 2);
      });
    });

    context("when user1 have 0 delations", () => {
      it("should return 0 delations", async () => {
        const delations = await instance.getUserDelations(user1Address);

        assert.equal(delations.length, 0);
      });
    });
  });
});
