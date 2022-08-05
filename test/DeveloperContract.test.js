const DeveloperContract = artifacts.require("DeveloperContract");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("DeveloperContract", (accounts) => {
  let instance;
  let [owner, dev1Address, dev2Address] = accounts;

  const addDeveloper = async (name, from) => {
    await instance.addDeveloper(
      name,
      "111.111.111-00",
      "CPF",
      "Brazil",
      "SP",
      "Jundiai",
      "135465-005",
      {from: from}
    );
  };

  beforeEach(async () => {
    userContract = await UserContract.new();

    instance = await DeveloperContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await instance.newAllowedUser(dev1Address);
  });

  context("when access developer fields", () => {
    it("should have fields", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developer = await instance.getDeveloper(dev1Address);

      assert.equal(developer.id, "1");
      assert.equal(developer.developerWallet, dev1Address);
      assert.equal(developer.userType, 4);
      assert.equal(developer.name, "Developer A");
      assert.equal(developer.document, "111.111.111-00");
      assert.equal(developer.documentType, "CPF");

      assert.equal(developer.level.level, 1);
      assert.equal(developer.level.currentEra, 1);

      assert.equal(developer.userAddress.country, "Brazil");
      assert.equal(developer.userAddress.state, "SP");
      assert.equal(developer.userAddress.city, "Jundiai");
      assert.equal(developer.userAddress.cep, "135465-005");
    });
  });

  context("when will add developer", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addDeveloper("Developer B", dev2Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
      context("when developer exists", () => {
        it("should return error message", async () => {
          await addDeveloper("Developer A", dev1Address);

          await expectRevert(
            addDeveloper("Developer A", dev1Address),
            "This developer already exist"
          );
        });
      });

      context("when developer does not exists", () => {
        it("should add developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.developerWallet, dev1Address);
        });

        it("should increment developersCount after create developer", async () => {
          await addDeveloper("Developer A", dev1Address);
          const developersCount = await instance.developersCount();

          assert.equal(developersCount, 1);
        });

        it("should add created developer in developerList (array)", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developers = await instance.getDevelopers();

          assert.equal(developers[0].developerWallet, dev1Address);
        });

        it("should add created developer in userType contract as a DEVELOPER", async () => {
          await addDeveloper("Developer A", dev1Address);

          const userType = await userContract.getUser(dev1Address);
          const DEVELOPER = 4;

          assert.equal(userType, DEVELOPER);
        });

        it("should add created developer with initial level equal 1", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.level.level, 1);
        });

        it("should add created developer with initial currentEra equal 1", async () => {
          await addDeveloper("Developer A", dev1Address);

          const developer = await instance.getDeveloper(dev1Address);

          assert.equal(developer.level.currentEra, 1);
        });
      });
    });
  });

  context("when will get developers", () => {
    beforeEach(async () => {
      await instance.newAllowedUser(dev2Address);
    });

    it("should return developers when has developers", async () => {
      await addDeveloper("Developer A", dev1Address);
      await addDeveloper("Developer B", dev2Address);

      const developers = await instance.getDevelopers();

      assert.equal(developers.length, 2);
    });

    it("should return developers equal zero when dont has it", async () => {
      const developers = await instance.getDevelopers();

      assert.equal(developers.length, 0);
    });
  });

  context("when will get developer", () => {
    it("should return a developer", async () => {
      await addDeveloper("Developer A", dev1Address);

      const developer = await instance.getDeveloper(dev1Address);

      assert.equal(developer.developerWallet, dev1Address);
    });
  });

  context("when will check if developer exists", () => {
    it("should return true when exists", async () => {
      await addDeveloper("Developer A", dev1Address);
      const developerExists = await instance.developerExists(dev1Address);

      assert.equal(developerExists, true);
    });

    it("it should return false when don't excists", async () => {
      const developerExists = await instance.developerExists(dev1Address);

      assert.equal(developerExists, false);
    });
  });
});
