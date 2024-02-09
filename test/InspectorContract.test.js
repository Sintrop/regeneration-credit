const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");

const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InspectorContract", () => {
  let instance;
  let userContract;
  let owner, inspe1Address, inspe2Address;

  const addInspector = async (name, from) => {
    await instance.connect(from).addInspector(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const args = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
  };

  beforeEach(async () => {
    [owner, inspe1Address, inspe2Address] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();
    const maxPenalties = 2;

    const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
    inspectorPool = await inspectorPoolFactory.deploy(rcToken.target, args.halving, args.totalEras, args.blocksPerEra);

    const instanceFactory = await ethers.getContractFactory("InspectorContract");
    instance = await instanceFactory.deploy(userContract.target, inspectorPool.target, maxPenalties);

    await inspectorPool.newAllowedCaller(instance.target);
    await rcToken.addContractPool(inspectorPool.target, args.totalTokens);
    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);

    await addInvitation(owner, inspe1Address, userTypes.Inspector, owner);
    await addInvitation(owner, inspe2Address, userTypes.Inspector, owner);
  });

  context("when access inspector fields", () => {
    it("should have fields", async () => {
      await addInspector("Inspector A", inspe1Address);
      const inspector = await instance.getInspector(inspe1Address);

      expect(inspector.id).to.equal("1");
      expect(inspector.inspectorWallet).to.equal(inspe1Address.address);
      expect(inspector.userType).to.equal("2");
      expect(inspector.name).to.equal("Inspector A");
      expect(inspector.proofPhoto).to.equal("photoURL");
      expect(inspector.totalInspections).to.equal("0");
      expect(inspector.giveUps).to.equal("0");
      expect(inspector.lastAcceptedAt).to.equal("0");
      expect(inspector.lastInspection).to.equal("0");
    });
  });

  context("when will create new inspector (.addInspector)", () => {
    context("when is allowed", () => {
      context("when inspector exists", () => {
        it("should return error", async () => {
          await addInspector("Inspector A", inspe1Address);
          await expect(addInspector("Inspector A", inspe1Address)).to.be.revertedWith("This inspector already exist");
        });
      });

      context("when inspector don't exist", () => {
        it("should create inspector", async () => {
          await addInspector("Inspector A", inspe1Address);
          await addInspector("Inspector B", inspe2Address);
          const inspector = await instance.getInspector(inspe1Address);

          expect(inspector.inspectorWallet).to.equal(inspe1Address.address);
        });

        it("should be created with totalInspections equal zero", async () => {
          await addInspector("Inspector A", inspe1Address);

          const inspector = await instance.getInspector(inspe1Address);

          expect(inspector.totalInspections).to.equal(0);
        });

        it("should be created with giveUps equal zero", async () => {
          await addInspector("Inspector A", inspe1Address);

          const inspector = await instance.getInspector(inspe1Address);

          expect(inspector.giveUps).to.equal(0);
        });

        it("should increment inspectorsCount after create inspector", async () => {
          await addInspector("Inspector A", inspe1Address);
          await addInspector("Inspector B", inspe2Address);
          const inspectorsCount = await instance.inspectorsCount();

          expect(inspectorsCount).to.equal(2);
        });

        it("should add created inspector in inspectorList (array)", async () => {
          await addInspector("Inspector A", inspe1Address);
          await addInspector("Inspector B", inspe2Address);

          const inspectors = await instance.getInspectors();

          expect(inspectors[0].inspectorWallet).to.equal(inspe1Address.address);
        });

        it("should add created inspector in userType contract as a INSPECTOR", async () => {
          await addInspector("Inspector A", inspe1Address);

          const userType = await userContract.getUser(inspe1Address);
          const INSPECTOR = 2;

          expect(userType).to.equal(INSPECTOR);
        });
      });
    });
  });

  context("when will get inspectors (.getInspectors)", () => {
    it("should return inspectors when has inspectors", async () => {
      await addInspector("Inspector A", inspe1Address);
      await addInspector("Inspector B", inspe2Address);

      const inspectors = await instance.getInspectors();

      expect(inspectors.length).to.equal(2);
    });

    it("should return inspectors equal zero when dont has it", async () => {
      const inspectors = await instance.getInspectors();

      expect(inspectors.length).to.equal(0);
    });
  });

  context("when will get inspector (.getInspector)", () => {
    it("should return a inspector", async () => {
      await addInspector("Inspector A", inspe1Address);

      const inspector = await instance.getInspector(inspe1Address);

      expect(inspector.inspectorWallet).to.equal(inspe1Address.address);
    });
  });

  context("when will check if inspector exists", () => {
    it("should return true when exists", async () => {
      await addInspector("Inspector A", inspe1Address);
      const inspectorExists = await instance.inspectorExists(inspe1Address);

      expect(inspectorExists).to.equal(true);
    });

    // Todo Add when not exists
  });

  describe("#incrementInspections", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInspector("Inspector A", inspe1Address);
        await instance.incrementInspections(inspe1Address);
      });

      context("when do not reached minimum inspections", () => {
        it("should increment", async () => {
          const inspector = await instance.getInspector(inspe1Address);

          expect(inspector.totalInspections).to.equal(1);
        });

        it("should do not add level to pool", async () => {
          const eraLevels = await inspectorPool.eraLevels(1, inspe1Address);

          expect(eraLevels).to.equal(0);
        });

        context("when reached minimum inspections", () => {
          beforeEach(async () => {
            await instance.incrementInspections(inspe1Address);
            await instance.incrementInspections(inspe1Address);
          });

          it("should add 1 level to pool", async () => {
            const eraLevels = await inspectorPool.eraLevels(1, inspe1Address);

            expect(eraLevels).to.equal(1);
          });

          it("should increment", async () => {
            const inspector = await instance.getInspector(inspe1Address);

            expect(inspector.totalInspections).to.equal(3);
          });
        });
      });
    });

    context("without allowed caller", async () => {
      it("should return error when is not allowed caller", async () => {
        await addInspector("Inspector A", inspe1Address);
        await expect(instance.connect(inspe1Address).incrementInspections(inspe1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
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
          await expect(instance.connect(inspe1Address).withdraw()).to.be.revertedWith("Minimum inspections");
        });
      });

      context("when inspector is in era 1 and current era is 1", () => {
        it("should return error", async () => {
          await instance.incrementInspections(inspe1Address);
          await expect(instance.connect(inspe1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });

      context("when inspector is in era 1 and current era is 2", () => {
        context("with one inspection", () => {
          beforeEach(async () => {
            await instance.incrementInspections(inspe1Address);

            await advanceBlock(args.blocksPerEra);

            await instance.connect(inspe1Address).withdraw();
          });

          it("withdraw 7200000000000000000000000 tokens", async () => {
            const balanceOf = await inspectorPool.balanceOf(inspe1Address);
            const expectedBalance = 7200000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
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

            await instance.connect(inspe1Address).withdraw();
          });

          it("withdraw 3600000000000000000000000n tokens", async () => {
            const balanceOf = await inspectorPool.balanceOf(inspe1Address);
            const expectedBalance = 3600000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });
      });
    });

    context("when is not a inspector", () => {
      it("should return error", async () => {
        await expect(instance.connect(inspe1Address).withdraw()).to.be.revertedWith("Pool only to inspectors");
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

        expect(totalPenalties).to.equal(1);
      });
    });

    context("without allowed caller", () => {
      it("return erro message", async () => {
        await expect(instance.connect(inspe2Address).addPenalty(inspe1Address, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
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

      expect(totalPenalties).to.equal(1);
    });
  });
});
