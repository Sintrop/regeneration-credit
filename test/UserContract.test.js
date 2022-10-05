const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("UserContract", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address] = accounts;

  let userTypes = {
    Undefined: 0,
    Producer: 1,
    Activist: 2,
    Researcher: 3,
    Developer: 4,
    Advisor: 5,
    Contributor: 6,
    Investor: 7,
  };

  const definedTypes = {
    0: "UNDEFINED",
    1: "PRODUCER",
    2: "ACTIVIST",
    3: "RESEARCHER",
    4: "DEVELOPER",
    5: "ADVISOR",
    6: "CONTRIBUTOR",
    7: "INVESTOR",
  };

  const addUser = async (address, userType, caller) => {
    await instance.addUser(address, userType, {from: caller});
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

          await expectRevert(
            addUser(user1Address, userTypes.Producer, owner),
            "User already exists"
          );
        });
      });

      context("with UNDEFINED user type", () => {
        it("should return error message", async () => {
          await expectRevert(
            addUser(user1Address, userTypes.Undefined, owner),
            "Invalid user type"
          );
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error message", async () => {
        await expectRevert(
          addUser(user1Address, userTypes.Producer, user1Address),
          "Not allowed caller"
        );
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
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Producer);
      })
    });

    context("to Activist", () => {
      it("should add correct enum to activist", async () => {
        await addUser(user1Address, userTypes.Activist, owner);
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Activist);
      })
    });

    context("to researcher", () => {
      it("should add correct enum to researcher", async () => {
        await addUser(user1Address, userTypes.Researcher, owner);
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Researcher);
      })
    });

    context("to developer", () => {
      it("should add correct enum to developer", async () => {
        await addUser(user1Address, userTypes.Developer, owner);
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Developer);
      })
    });

    context("to advisor", () => {
      it("should add correct enum to advisor", async () => {
        await addUser(user1Address, userTypes.Advisor, owner);
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Advisor);
      })
    });

    context("to contributor", () => {
      it("should add correct enum to contributor", async () => {
        await addUser(user1Address, userTypes.Contributor, owner);
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Contributor);
      })
    });

    context("to investor", () => {
      it("should add correct enum to investor", async () => {
        await addUser(user1Address, userTypes.Investor, owner);
    
        const user = await instance.getUser(user1Address)
    
        assert.equal(user, userTypes.Investor);
      })
    });
  });

  context("when there's enums", () => {
    it("should have enums", async () => {
      const types = await instance.userTypes()
  
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
      })
    });
  });
});
