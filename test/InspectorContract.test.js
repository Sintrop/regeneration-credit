const InspectorContract = artifacts.require("InspectorContract");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("InspectorContract", (accounts) => {
  let instance;
  let userContract;
  let [ownerAddress, inspe1Address, inspe2Address] = accounts;

  const addInspector = async (name, address) => {
    await instance.addInspector(name, "photoURL", "135465-005", { from: address });
  };

  beforeEach(async () => {
    userContract = await UserContract.new();

    instance = await InspectorContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await instance.newAllowedCaller(ownerAddress);
  });
  context("when access inspector fields", () => {
    it("should have fields", async () => {
      await addInspector("Inspector A", inspe1Address);
      const inspector = await instance.getInspector(inspe1Address);

      assert.equal(inspector.id, "1");
      assert.equal(inspector.inspectorWallet, inspe1Address);
      assert.equal(inspector.userType, "2");
      assert.equal(inspector.name, "Inspector A");
      assert.equal(inspector.proofPhoto, "photoURL");
      assert.equal(inspector.totalInspections, "0");
      assert.equal(inspector.giveUps, "0");
      assert.equal(inspector.lastAcceptedAt, "0");
      assert.equal(inspector.inspectorAddress.coordinate, "135465-005");
    });
  });

  context("when will create new inspector (.addInspector)", () => {
    context("when is allowed", () => {
      context("when inspector exists", () => {
        it("should return error", async () => {
          await addInspector("Inspector A", inspe1Address);
          await expectRevert(addInspector("Inspector A", inspe1Address), "This inspector already exist");
        });
      });

      context("when inspector don't exist", () => {
        it("should create inspector", async () => {
          await addInspector("Inspector A", inspe1Address);
          await addInspector("Inspector B", inspe2Address);
          const inspector = await instance.getInspector(inspe1Address);

          assert.equal(inspector.inspectorWallet, inspe1Address);
        });

        it("should be created with totalInspections equal zero", async () => {
          await addInspector("Inspector A", inspe1Address);

          const inspector = await instance.getInspector(inspe1Address);

          assert.equal(inspector.totalInspections, 0);
        });

        it("should be created with giveUps equal zero", async () => {
          await addInspector("Inspector A", inspe1Address);

          const inspector = await instance.getInspector(inspe1Address);

          assert.equal(inspector.giveUps, 0);
        });

        it("should increment inspectorsCount after create inspector", async () => {
          await addInspector("Inspector A", inspe1Address);
          await addInspector("Inspector B", inspe2Address);
          const inspectorsCount = await instance.inspectorsCount();

          assert.equal(inspectorsCount, 2);
        });

        it("should add created inspector in inspectorList (array)", async () => {
          await addInspector("Inspector A", inspe1Address);
          await addInspector("Inspector B", inspe2Address);

          const inspectors = await instance.getInspectors();

          assert.equal(inspectors[0].inspectorWallet, inspe1Address);
        });

        it("should add created inspector in userType contract as a INSPECTOR", async () => {
          await addInspector("Inspector A", inspe1Address);

          const userType = await userContract.getUser(inspe1Address);
          const INSPECTOR = 2;

          assert.equal(userType, INSPECTOR);
        });
      });
    });
  });

  context("when will get inspectors (.getInspectors)", () => {
    it("should return inspectors when has inspectors", async () => {
      await addInspector("Inspector A", inspe1Address);
      await addInspector("Inspector B", inspe2Address);

      const inspectors = await instance.getInspectors();

      assert.equal(inspectors.length, 2);
    });

    it("should return inspectors equal zero when dont has it", async () => {
      const inspectors = await instance.getInspectors();

      assert.equal(inspectors.length, 0);
    });
  });

  context("when will get inspector (.getInspector)", () => {
    it("should return a inspector", async () => {
      await addInspector("Inspector A", inspe1Address);

      const inspector = await instance.getInspector(inspe1Address);

      assert.equal(inspector.inspectorWallet, inspe1Address);
    });
  });

  context("when will check if inspector exists", () => {
    it("should return true when exists", async () => {
      await addInspector("Inspector A", inspe1Address);
      const inspectorExists = await instance.inspectorExists(inspe1Address);

      assert.equal(inspectorExists, true);
    });

    // Todo Add when not exists
  });

  context("when will update incrementRequests (.incrementRequests)", () => {
    context("with allowed caller", () => {
      it("should success when is allowed caller", async () => {
        await addInspector("Inspector A", inspe1Address);
        await instance.incrementRequests(inspe1Address);

        const inspector = await instance.getInspector(inspe1Address);

        assert.equal(inspector.totalInspections, 1);
      });
    });
  });

  context("without allowed caller", async () => {
    it("should return error when is not allowed caller", async () => {
      await addInspector("Inspector A", inspe1Address);
      await expectRevert(instance.incrementRequests(inspe1Address, { from: inspe1Address }), "Not allowed caller");
    });
  });
});
