const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("UserContract", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address] = accounts;

  let userTypes = {
    Undefined: 0,
    Producer: 1,
    Inspector: 2,
    Researcher: 3,
    Developer: 4,
    Advisor: 5,
    Activist: 6,
    Investor: 7,
  };

  const definedTypes = {
    0: "UNDEFINED",
    1: "PRODUCER",
    2: "INSPECTOR",
    3: "RESEARCHER",
    4: "DEVELOPER",
    5: "ADVISOR",
    6: "ACTIVIST",
    7: "INVESTOR",
    8: "VALIDATOR",
    9: "DENIED",
  };

  const addUser = async (address, userType, caller) => {
    await instance.addUser(address, userType, { from: caller });
  };

  const addDelation = async (denouncedAddress, from) => {
    await instance.addDelation(denouncedAddress, "title", "testimony", "proofPhoto", {
      from: from,
    });
  };

  beforeEach(async () => {
    instance = await UserContract.new();

    await instance.newAllowedCaller(owner);
  });

  context("when adding a user", () => {
    context("with allowed caller", () => {
      context("when the user don't exist", () => {
        it("should add a user", async () => {
          await addUser(user1Address, userTypes.Producer, owner);
          const user = await instance.getUser(user1Address);

          assert.equal(user, userTypes.Producer);
        });

        it("should increment usersCount when add new user", async () => {
          await addUser(user1Address, userTypes.Producer, owner);

          const usersCount = await instance.usersCount();

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
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(addUser(user1Address, userTypes.Producer, user1Address), "Not allowed caller");
      });
    });
  });

  context("when don't have users", () => {
    it("should usersCount be zero", async () => {
      const usersCount = await instance.usersCount();

      assert.equal(usersCount, 0);
    });
  });

  context("when enum correctly to users", () => {
    context("to Producer", () => {
      it("should add correct enum to producer", async () => {
        await addUser(user1Address, userTypes.Producer, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Producer);
      });
    });

    context("to Inspector", () => {
      it("should add correct enum to inspector", async () => {
        await addUser(user1Address, userTypes.Inspector, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Inspector);
      });
    });

    context("to researcher", () => {
      it("should add correct enum to researcher", async () => {
        await addUser(user1Address, userTypes.Researcher, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Researcher);
      });
    });

    context("to developer", () => {
      it("should add correct enum to developer", async () => {
        await addUser(user1Address, userTypes.Developer, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Developer);
      });
    });

    context("to advisor", () => {
      it("should add correct enum to advisor", async () => {
        await addUser(user1Address, userTypes.Advisor, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Advisor);
      });
    });

    context("to activist", () => {
      it("should add correct enum to activist", async () => {
        await addUser(user1Address, userTypes.Activist, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Activist);
      });
    });

    context("to investor", () => {
      it("should add correct enum to investor", async () => {
        await addUser(user1Address, userTypes.Investor, owner);

        const user = await instance.getUser(user1Address);

        assert.equal(user, userTypes.Investor);
      });
    });
  });

  context("when there's enums", () => {
    it("should have enums", async () => {
      const types = await instance.userTypes();

      assert.equal(JSON.stringify(types), JSON.stringify(definedTypes));
    });
  });

  context("when adding new allowed caller", () => {
    context("with owner", () => {
      it("should add new allowed caller with sucess when is owner", async () => {
        await instance.newAllowedCaller(user1Address, { from: owner });
      });
    });

    context("without owner", () => {
      it("should return error message when try add new allowed caller and is not owner", async () => {
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
