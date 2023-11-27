const InspectorContract = artifacts.require("InspectorContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const InspectorPool = artifacts.require("InspectorPool");
const { userTypes } = require("./shared/user_types");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");

contract("InspectorContract", (accounts) => {
  let instance;
  let userContract;
  let [owner, inspe1Address, inspe2Address] = accounts;

  const addInspector = async (name, address) => {
    await instance.addInspector(name, "photoURL", "135465-005", { from: address });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.addInvitation(inviter, invited, userType, {
      from: from,
    });
  };

  const args = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  beforeEach(async () => {
    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();
    const maxPenalties = 2;

    inspectorPool = await InspectorPool.new(rcToken.address, args.halving, args.totalEras, args.blocksPerEra);
    instance = await InspectorContract.new(userContract.address, inspectorPool.address, maxPenalties);

    await inspectorPool.newAllowedCaller(instance.address);
    await rcToken.addContractPool(inspectorPool.address, args.totalTokens);
    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);

    await addInvitation(owner, inspe1Address, userTypes.Inspector, owner);
    await addInvitation(owner, inspe2Address, userTypes.Inspector, owner);
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

  context("when will update incrementInspections (.incrementInspections)", () => {
    context("with allowed caller", () => {
      it("should success when is allowed caller", async () => {
        await addInspector("Inspector A", inspe1Address);
        await instance.incrementInspections(inspe1Address);

        const inspector = await instance.getInspector(inspe1Address);

        assert.equal(inspector.totalInspections, 1);
      });
    });
  });

  context("without allowed caller", async () => {
    it("should return error when is not allowed caller", async () => {
      await addInspector("Inspector A", inspe1Address);
      await expectRevert(instance.incrementInspections(inspe1Address, { from: inspe1Address }), "Not allowed caller");
    });
  });

  describe("#withdraw", () => {
    context("when is a inspector", () => {
      beforeEach(async () => {
        await addInspector("Inspector A", inspe1Address);

        await instance.incrementInspections(inspe1Address);
        await instance.incrementInspections(inspe1Address);
      });

      context("when have less then 3 inspections", () => {
        it("should return error", async () => {
          await expectRevert(instance.withdraw({ from: inspe1Address }), "Minimum inspections");
        });
      });

      context("when inspector is in era 1 and current era is 1", () => {
        it("should return error", async () => {
          await instance.incrementInspections(inspe1Address);
          await expectRevert(instance.withdraw({ from: inspe1Address }), "Can't approve withdraw");
        });
      });

      context("when inspector is in era 1 and current era is 2", () => {
        context("with one inspection", () => {
          beforeEach(async () => {
            await instance.incrementInspections(inspe1Address);

            await advanceBlock(args.blocksPerEra);

            await instance.withdraw({ from: inspe1Address });
          });

          it("withdraw 7200000000000000000000000 tokens", async () => {
            const balanceOf = await inspectorPool.balanceOf(inspe1Address);
            const expectedBalance = 7200000000000000000000000n;

            assert.equal(balanceOf, expectedBalance);
          });
        });

        context("with two inspection", () => {
          beforeEach(async () => {
            await addInspector("Inspector B", inspe2Address);
            await instance.incrementInspections(inspe1Address);

            await instance.incrementInspections(inspe2Address);
            await instance.incrementInspections(inspe2Address);
            await instance.incrementInspections(inspe2Address);

            await advanceBlock(args.blocksPerEra);

            await instance.withdraw({ from: inspe1Address });
          });

          it("withdraw 3600000000000000000000000n tokens", async () => {
            const balanceOf = await inspectorPool.balanceOf(inspe1Address);
            const expectedBalance = 3600000000000000000000000n;

            assert.equal(balanceOf, expectedBalance);
          });
        });
      });
    });

    context("when is not a inspector", () => {
      it("should return error", async () => {
        await expectRevert(instance.withdraw({ from: inspe1Address }), "Pool only to inspectors");
      });
    });
  });

  describe("#addPenalty", () => {
    beforeEach(async () => {
      await addInspector("Inspector A", inspe1Address);
    });

    context("with allowed caller", () => {
      it("add penalty with success", async () => {
        await instance.addPenalty(inspe1Address, 1);

        const totalPenalties = await instance.totalPenalties(inspe1Address);

        assert.equal(totalPenalties, 1);
      });
    });

    context("without allowed caller", () => {
      it("return erro message", async () => {
        await expectRevert(instance.addPenalty(inspe1Address, 1, { from: inspe2Address }), "Not allowed caller");
      });
    });
  });

  describe("#totalPenalties", () => {
    beforeEach(async () => {
      await addInspector("Inspector A", inspe1Address);
      await instance.addPenalty(inspe1Address, 1);
    });

    it("return penalties", async () => {
      const totalPenalties = await instance.totalPenalties(inspe1Address);

      assert.equal(totalPenalties, 1);
    });
  });
});
