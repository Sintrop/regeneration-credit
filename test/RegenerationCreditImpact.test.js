const { expect } = require("chai");
const { inspectionRulesDeployed } = require("./shared/inspection_rules_deployed.js");
const { ZERO_ADDRESS } = require("./shared/zeroAddress.js");
const { userTypes } = require("./shared/user_types");
const { advanceBlock } = require("./shared/advance_block");

describe("RegenerationCreditImpact", () => {
  let instance, inspectionRules, invitationRules, regeneratorRules, inspectorRules, regenerationCredit;
  let owner,
    regeneratorAddress,
    regenerator2Address,
    regenerator3Address,
    regenerator4Address,
    regenerator5Address,
    inspectorAddress,
    inspector2Address,
    inspector3Address,
    inspector4Address,
    inspector5Address;
  let treesIndicatorValue = 10;
  let biodiversityIndicatorValue = 10;

  const addRegenerator = async (name, from, _coordinates = []) => {
    const coordinatesParams = _coordinates.length > 0 ? _coordinates : coordinates();
    await regeneratorRules
      .connect(from)
      .addRegenerator(1000, name, "projectDescription", "photoURL", coordinatesParams);
  };

  const addInspector = async (name, from) => {
    await inspectorRules.connect(from).addInspector(name, "photoURL");
  };

  const coordinates = () => {
    return [
      {
        latitude: "-22.912554",
        longitude: "-44.4925355",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912555",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925373",
      },
    ];
  };

  const realizeInspection = async (id, report, treesResult, biodiversityResult, from) => {
    const proofPhoto = "proofPhoto";

    await inspectionRules.connect(from).realizeInspection(id, proofPhoto, report, treesResult, biodiversityResult);
  };

  beforeEach(async () => {
    [
      owner,
      regeneratorAddress,
      regenerator2Address,
      regenerator3Address,
      regenerator4Address,
      regenerator5Address,
      inspectorAddress,
      inspector2Address,
      inspector3Address,
      inspector4Address,
      inspector5Address,
    ] = await ethers.getSigners();

    const deployed = await inspectionRulesDeployed(owner);
    const communityRules = deployed.communityRules;
    regenerationCredit = deployed.regenerationCredit;
    inspectorRules = deployed.inspectorRules;
    inspectionRules = deployed.instance;
    regeneratorRules = deployed.regeneratorRules;
    activistRules = deployed.activistRules;

    const invitationRulesFactory = await ethers.getContractFactory("InvitationRules");
    invitationRules = await invitationRulesFactory.deploy(
      communityRules.target,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS
    );

    const instanceFactory = await ethers.getContractFactory("RegenerationCreditImpact");

    instance = await instanceFactory.deploy(regenerationCredit.target, inspectionRules.target, regeneratorRules.target);

    await communityRules.newAllowedCaller(invitationRules.target);
    await regeneratorRules.newAllowedCaller(owner);

    await communityRules.setContractCall(invitationRules.target);
    await activistRules.setContractAddressDependencies(inspectionRules.target, validationRules.target);
    await regeneratorRules.setContractAddressDependencies(inspectionRules.target, validationRules.target);
    await inspectorRules.setContractAddressDependencies(inspectionRules.target, validationRules.target);
  });

  describe("totalTreesImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("totalTreesImpact must be 0", async () => {
        const totalTreesImpact = await instance.totalTreesImpact();

        expect(totalTreesImpact).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsTreesImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          treesIndicatorValue = 0;

          await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
        });

        it("totalTreesImpact must be 0", async () => {
          const totalTreesImpact = await instance.totalTreesImpact();

          expect(totalTreesImpact).to.equal(0);
        });
      });

      context("when inspectionsTreesImpact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection trees impact is 10", () => {
            beforeEach(async () => {
              treesIndicatorValue = 10;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returnstotalTreesImpact equal 10", async () => {
              const totalTreesImpact = await instance.totalTreesImpact();

              expect(totalTreesImpact).to.equal(10);
            });
          });

          context("when inspection trees impact is 25", () => {
            beforeEach(async () => {
              treesIndicatorValue = 32;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returnstotalTreesImpact equal 32", async () => {
              const totalTreesImpact = await instance.totalTreesImpact();

              expect(totalTreesImpact).to.equal(32);
            });
          });
        });

        context("when have 5 inspections valid", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator4Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator5Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector4Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector5Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);
            await addRegenerator("Regenerator E", regenerator5Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);
            await addInspector("Inspector D", inspector4Address);
            await addInspector("Inspector E", inspector5Address);

            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);
            await inspectionRules.connect(inspector4Address).acceptInspection(4);
            await inspectionRules.connect(inspector5Address).acceptInspection(5);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);

            treesIndicatorValue = 10;
            await realizeInspection(4, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector4Address);

            treesIndicatorValue = 32;
            await realizeInspection(5, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector5Address);
          });

          it("must returnstotalTreesImpact equal 174", async () => {
            const totalTreesImpact = await instance.totalTreesImpact();

            expect(totalTreesImpact).to.equal(174);
          });
        });

        context("when have 3 inspections valids and two are of same regenerator", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
          });

          it("must returnstotalTreesImpact equal 88", async () => {
            const totalTreesImpact = await instance.totalTreesImpact();

            expect(totalTreesImpact).to.equal(88);
          });
        });

        // TODO: Testar após a refatoração ter sido concluída
        // context.except("wwhen have 3 inspections and one is invalid", () => {
        //   beforeEach(async () => {
        //     await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
        //     await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

        //     await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
        //     await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

        //     await addRegenerator("Regenerator B", regenerator2Address);
        //     await addRegenerator("Regenerator C", regenerator3Address);

        //     await addInspector("Inspector B", inspector2Address);
        //     await addInspector("Inspector C", inspector3Address);

        //     treesIndicatorValue = 32;
        //     await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     treesIndicatorValue = 0;
        //     await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

        //     treesIndicatorValue = 100;
        //     await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
        //   });

        //   it("must returnstotalTreesImpact equal 44", async () => {
        //     const totalTreesImpact = await instance.totalTreesImpact();

        //     expect(totalTreesImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("totalCarbonImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("totalCarbonImpact must be 0", async () => {
        const totalCarbonImpact = await instance.totalCarbonImpact();

        expect(totalCarbonImpact).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsTreesImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          treesIndicatorValue = 0;

          await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
        });

        it("totalCarbonImpact must be 0", async () => {
          const totalCarbonImpact = await instance.totalCarbonImpact();

          expect(totalCarbonImpact).to.equal(0);
        });
      });

      context("when inspectionsTreesImpact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection trees impact is 10", () => {
            beforeEach(async () => {
              treesIndicatorValue = 10;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returnstotalCarbonImpact equal 1000000", async () => {
              const totalCarbonImpact = await instance.totalCarbonImpact();

              expect(totalCarbonImpact).to.equal(1000000);
            });
          });

          context("when inspection trees impact is 25", () => {
            beforeEach(async () => {
              treesIndicatorValue = 32;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returnstotalCarbonImpact equal 3200000", async () => {
              const totalCarbonImpact = await instance.totalCarbonImpact();

              expect(totalCarbonImpact).to.equal(3200000);
            });
          });
        });

        context("when have 5 inspections valid", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator4Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator5Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector4Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector5Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);
            await addRegenerator("Regenerator E", regenerator5Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);
            await addInspector("Inspector D", inspector4Address);
            await addInspector("Inspector E", inspector5Address);

            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);
            await inspectionRules.connect(inspector4Address).acceptInspection(4);
            await inspectionRules.connect(inspector5Address).acceptInspection(5);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);

            treesIndicatorValue = 10;
            await realizeInspection(4, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector4Address);

            treesIndicatorValue = 32;
            await realizeInspection(5, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector5Address);
          });

          it("must returnstotalCarbonImpact equal 17400000", async () => {
            const totalCarbonImpact = await instance.totalCarbonImpact();

            expect(totalCarbonImpact).to.equal(17400000);
          });
        });

        context("when have 3 inspections valids and two are of same regenerator", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
          });

          it("must returnstotalCarbonImpact equal 8800000", async () => {
            const totalCarbonImpact = await instance.totalCarbonImpact();

            expect(totalCarbonImpact).to.equal(8800000);
          });
        });
      });
    });
  });

  describe("totalBiodiversityImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("totalBiodiversityImpact must be 0", async () => {
        const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

        expect(totalBiodiversityImpact).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsBiodiversityImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          biodiversityIndicatorValue = 0;

          await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
        });

        it("totalBiodiversityImpact must be 0", async () => {
          const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

          expect(totalBiodiversityImpact).to.equal(0);
        });
      });

      context("when inspectionsBiodiversitympact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection biodiversity impact is 10", () => {
            beforeEach(async () => {
              biodiversityIndicatorValue = 10;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returns totalBiodiversityImpact equal 10", async () => {
              const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

              expect(totalBiodiversityImpact).to.equal(10);
            });
          });

          context("when inspection biodiversity impact is 25", () => {
            beforeEach(async () => {
              biodiversityIndicatorValue = 32;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returns totalBiodiversityImpact equal 32", async () => {
              const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

              expect(totalBiodiversityImpact).to.equal(32);
            });
          });
        });

        context("when have 5 inspections valid", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator4Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator5Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector4Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector5Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);
            await addRegenerator("Regenerator E", regenerator5Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);
            await addInspector("Inspector D", inspector4Address);
            await addInspector("Inspector E", inspector5Address);

            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);
            await inspectionRules.connect(inspector4Address).acceptInspection(4);
            await inspectionRules.connect(inspector5Address).acceptInspection(5);

            biodiversityIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);

            biodiversityIndicatorValue = 10;
            await realizeInspection(4, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector4Address);

            biodiversityIndicatorValue = 32;
            await realizeInspection(5, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector5Address);
          });

          it("must returns totalBiodiversityImpact equal 174", async () => {
            const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

            expect(totalBiodiversityImpact).to.equal(174);
          });
        });

        context("when have 3 inspections valids and two are of same regenerator", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);

            biodiversityIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
          });

          it("must returns totalBiodiversityImpact equal 88", async () => {
            const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

            expect(totalBiodiversityImpact).to.equal(88);
          });
        });

        // TODO: Testar após a refatoração ter sido concluída
        // context.except("wwhen have 3 inspections and one is invalid", () => {
        //   beforeEach(async () => {
        //     await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
        //     await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

        //     await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
        //     await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

        //     await addRegenerator("Regenerator B", regenerator2Address);
        //     await addRegenerator("Regenerator C", regenerator3Address);

        //     await addInspector("Inspector B", inspector2Address);
        //     await addInspector("Inspector C", inspector3Address);

        //     biodiversityIndicatorValue = 32;
        //     await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     biodiversityIndicatorValue = 0;
        //     await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

        //     biodiversityIndicatorValue = 100;
        //     await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
        //   });

        //   it("must returnstotalTreesImpact equal 44", async () => {
        //     const totalTreesImpact = await instance.totalTreesImpact();

        //     expect(totalTreesImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("totalAreaImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addRegenerator("Regenerator B", regenerator2Address);
    });

    context("when have two regenerators", () => {
      context("when all regenerators are valids", async () => {
        it("totalAreaImpact must be 2000", async () => {
          const totalAreaImpact = await instance.totalAreaImpact();

          expect(totalAreaImpact).to.equal(2000);
        });
      });

      context("when only one regenerator is valid", async () => {
        beforeEach(async () => {
          await regeneratorRules.setContractAddressDependencies(inspectionRules.target, owner);
          await regeneratorRules.removePoolLevels(regenerator2Address, 0);
        });

        it("totalAreaImpact must be 1000", async () => {
          const totalAreaImpact = await instance.totalAreaImpact();

          expect(totalAreaImpact).to.equal(1000);
        });
      });
    });
  });

  describe("treesPerToken", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("treesPerToken must be 0", async () => {
        const treesPerToken = await instance.treesPerToken();

        expect(treesPerToken).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsTreesImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          treesIndicatorValue = 0;

          await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
        });

        it("treesPerToken must be 0", async () => {
          const treesPerToken = await instance.treesPerToken();

          expect(treesPerToken).to.equal(0);
        });
      });

      context("when inspectionsTreesImpact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection trees impact is 10", () => {
            beforeEach(async () => {
              treesIndicatorValue = 10;
            });

            context("when do not have tokens totalLocked_", () => {
              beforeEach(async () => {
                treesIndicatorValue = 10;

                await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
              });

              it("must returns treesPerToken equal 6666666666", async () => {
                const treesPerToken = await instance.treesPerToken();

                expect(treesPerToken).to.equal(6666666666);
              });
            });

            context("when have token totalLocked_", () => {
              beforeEach(async () => {
                await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);
                await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);

                treesIndicatorValue = 10;

                await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
              });

              it("must returns treesPerToken equal 11111111111", async () => {
                const treesPerToken = await instance.treesPerToken();

                expect(treesPerToken).to.equal(11111111111);
              });
            });
          });

          context("when inspection trees impact is 25", () => {
            beforeEach(async () => {
              treesIndicatorValue = 32;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returnstotalTreesImpact equal 21333333333", async () => {
              const treesPerToken = await instance.treesPerToken();

              expect(treesPerToken).to.equal(21333333333);
            });
          });
        });

        context("when have 5 inspections valid", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator4Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator5Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector4Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector5Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);
            await addRegenerator("Regenerator E", regenerator5Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);
            await addInspector("Inspector D", inspector4Address);
            await addInspector("Inspector E", inspector5Address);

            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);
            await inspectionRules.connect(inspector4Address).acceptInspection(4);
            await inspectionRules.connect(inspector5Address).acceptInspection(5);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);

            treesIndicatorValue = 10;
            await realizeInspection(4, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector4Address);

            treesIndicatorValue = 32;
            await realizeInspection(5, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector5Address);
          });

          it("must returns treesPerToken equal 116000000000", async () => {
            const treesPerToken = await instance.treesPerToken();

            expect(treesPerToken).to.equal(116000000000);
          });
        });

        context("when have 3 inspections valids and two are of same regenerator", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
          });

          it("must returns treesPerToken equal 58666666666", async () => {
            const treesPerToken = await instance.treesPerToken();

            expect(treesPerToken).to.equal(58666666666);
          });
        });

        // TODO: Testar após a refatoração ter sido concluída
        // context.except("wwhen have 3 inspections and one is invalid", () => {
        //   beforeEach(async () => {
        //     await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
        //     await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

        //     await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
        //     await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

        //     await addRegenerator("Regenerator B", regenerator2Address);
        //     await addRegenerator("Regenerator C", regenerator3Address);

        //     await addInspector("Inspector B", inspector2Address);
        //     await addInspector("Inspector C", inspector3Address);

        //     treesIndicatorValue = 32;
        //     await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     treesIndicatorValue = 0;
        //     await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

        //     treesIndicatorValue = 100;
        //     await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
        //   });

        //   it("must returnstotalTreesImpact equal 44", async () => {
        //     const totalTreesImpact = await instance.totalTreesImpact();

        //     expect(totalTreesImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("carbonPerToken", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("carbonPerToken must be 0", async () => {
        const carbonPerToken = await instance.carbonPerToken();

        expect(carbonPerToken).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsTreesImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          treesIndicatorValue = 0;

          await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
        });

        it("carbonPerToken must be 0", async () => {
          const carbonPerToken = await instance.carbonPerToken();

          expect(carbonPerToken).to.equal(0);
        });
      });

      context("when inspectionsTreesImpact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection trees impact is 10", () => {
            beforeEach(async () => {
              treesIndicatorValue = 10;
            });

            context("when do not have tokens totalLocked_", () => {
              beforeEach(async () => {
                treesIndicatorValue = 10;

                await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
              });

              it("must returns carbonPerToken equal 666666666666666", async () => {
                const carbonPerToken = await instance.carbonPerToken();

                expect(carbonPerToken).to.equal(666666666666666);
              });
            });

            context("when have token totalLocked_", () => {
              beforeEach(async () => {
                await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);
                await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);

                treesIndicatorValue = 10;

                await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
              });

              it("must returns carbonPerToken equal 1111111111111111", async () => {
                const carbonPerToken = await instance.carbonPerToken();

                expect(carbonPerToken).to.equal(1111111111111111);
              });
            });
          });

          context("when inspection trees impact is 25", () => {
            beforeEach(async () => {
              treesIndicatorValue = 32;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returnstotalTreesImpact equal 2133333333333333", async () => {
              const carbonPerToken = await instance.carbonPerToken();

              expect(carbonPerToken).to.equal(2133333333333333);
            });
          });
        });

        context("when have 5 inspections valid", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator4Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator5Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector4Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector5Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);
            await addRegenerator("Regenerator E", regenerator5Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);
            await addInspector("Inspector D", inspector4Address);
            await addInspector("Inspector E", inspector5Address);

            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);
            await inspectionRules.connect(inspector4Address).acceptInspection(4);
            await inspectionRules.connect(inspector5Address).acceptInspection(5);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);

            treesIndicatorValue = 10;
            await realizeInspection(4, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector4Address);

            treesIndicatorValue = 32;
            await realizeInspection(5, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector5Address);
          });

          it("must returns carbonPerToken equal 11600000000000000", async () => {
            const carbonPerToken = await instance.carbonPerToken();

            expect(carbonPerToken).to.equal(11600000000000000n);
          });
        });

        context("when have 3 inspections valids and two are of same regenerator", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);

            treesIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            treesIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            treesIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
          });

          it("must returns carbonPerToken equal 5866666666666666", async () => {
            const carbonPerToken = await instance.carbonPerToken();

            expect(carbonPerToken).to.equal(5866666666666666);
          });
        });
      });
    });
  });

  describe("biodiversityPerToken", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("biodiversityPerToken must be 0", async () => {
        const biodiversityPerToken = await instance.biodiversityPerToken();

        expect(biodiversityPerToken).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsBiodiversityImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          biodiversityIndicatorValue = 0;

          await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
        });

        it("biodiversityPerToken must be 0", async () => {
          const biodiversityPerToken = await instance.biodiversityPerToken();

          expect(biodiversityPerToken).to.equal(0);
        });
      });

      context("when inspectionsBiodiversitympact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection biodiversity impact is 10", () => {
            context("when do not have tokens totalLocked_", () => {
              beforeEach(async () => {
                biodiversityIndicatorValue = 10;

                await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
              });

              it("must returns biodiversityPerToken equal 6666666666", async () => {
                const biodiversityPerToken = await instance.biodiversityPerToken();

                expect(biodiversityPerToken).to.equal(6666666666);
              });
            });

            context("when have tokens totalLocked_", () => {
              beforeEach(async () => {
                await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);
                await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);

                biodiversityIndicatorValue = 10;

                await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
              });

              it("must returns biodiversityPerToken equal 11111111111", async () => {
                const biodiversityPerToken = await instance.biodiversityPerToken();

                expect(biodiversityPerToken).to.equal(11111111111);
              });
            });
          });

          context("when inspection biodiversity impact is 25", () => {
            beforeEach(async () => {
              biodiversityIndicatorValue = 32;

              await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);
            });

            it("must returns biodiversityPerToken equal 21333333333", async () => {
              const biodiversityPerToken = await instance.biodiversityPerToken();

              expect(biodiversityPerToken).to.equal(21333333333);
            });
          });
        });

        context("when have 5 inspections valid", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator4Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator5Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector4Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector5Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);
            await addRegenerator("Regenerator D", regenerator4Address);
            await addRegenerator("Regenerator E", regenerator5Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);
            await addInspector("Inspector D", inspector4Address);
            await addInspector("Inspector E", inspector5Address);

            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);
            await inspectionRules.connect(inspector4Address).acceptInspection(4);
            await inspectionRules.connect(inspector5Address).acceptInspection(5);

            biodiversityIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);

            biodiversityIndicatorValue = 10;
            await realizeInspection(4, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector4Address);

            biodiversityIndicatorValue = 32;
            await realizeInspection(5, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector5Address);
          });

          it("must returns biodiversityPerToken equal 116000000000", async () => {
            const biodiversityPerToken = await instance.biodiversityPerToken();

            expect(biodiversityPerToken).to.equal(116000000000);
          });
        });

        context("when have 3 inspections valids and two are of same regenerator", () => {
          beforeEach(async () => {
            await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
            await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

            await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
            await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

            await addRegenerator("Regenerator B", regenerator2Address);
            await addRegenerator("Regenerator C", regenerator3Address);

            await addInspector("Inspector B", inspector2Address);
            await addInspector("Inspector C", inspector3Address);

            biodiversityIndicatorValue = 32;
            await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
          });

          it("must returns biodiversityPerToken equal 58666666666", async () => {
            const biodiversityPerToken = await instance.biodiversityPerToken();

            expect(biodiversityPerToken).to.equal(58666666666);
          });
        });

        // TODO: Testar após a refatoração ter sido concluída
        // context.except("wwhen have 3 inspections and one is invalid", () => {
        //   beforeEach(async () => {
        //     await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);
        //     await invitationRules.onlyOwnerInvite(regenerator3Address, userTypes.Regenerator);

        //     await invitationRules.onlyOwnerInvite(inspector2Address, userTypes.Inspector);
        //     await invitationRules.onlyOwnerInvite(inspector3Address, userTypes.Inspector);

        //     await addRegenerator("Regenerator B", regenerator2Address);
        //     await addRegenerator("Regenerator C", regenerator3Address);

        //     await addInspector("Inspector B", inspector2Address);
        //     await addInspector("Inspector C", inspector3Address);

        //     biodiversityIndicatorValue = 32;
        //     await realizeInspection(1, "report", treesIndicatorValue, biodiversityIndicatorValue, inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     biodiversityIndicatorValue = 0;
        //     await realizeInspection(2, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector2Address);

        //     biodiversityIndicatorValue = 100;
        //     await realizeInspection(3, "report", treesIndicatorValue, biodiversityIndicatorValue, inspector3Address);
        //   });

        //   it("must returnstotalTreesImpact equal 44", async () => {
        //     const totalTreesImpact = await instance.totalTreesImpact();

        //     expect(totalTreesImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("areaPerToken", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addRegenerator("Regenerator B", regenerator2Address);
    });

    context("when have two regenerators", () => {
      context("when all regenerators are valids", async () => {
        context("when do not have tokens totalLocked_", () => {
          it("areaPerToken must be 1333333333333", async () => {
            const areaPerToken = await instance.areaPerToken();

            expect(areaPerToken).to.equal(1333333333333);
          });
        });

        context("when have tokens totalLocked_", () => {
          beforeEach(async () => {
            await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);
            await regenerationCredit.addContractPool(owner, 300000000000000000000000000n);
          });

          it("areaPerToken must be 2222222222222", async () => {
            const areaPerToken = await instance.areaPerToken();

            expect(areaPerToken).to.equal(2222222222222);
          });
        });
      });

      context("when only one regenerator is valid", async () => {
        beforeEach(async () => {
          await regeneratorRules.setContractAddressDependencies(inspectionRules.target, owner);
          await regeneratorRules.removePoolLevels(regenerator2Address, 0);
        });

        it("areaPerToken must be 666666666666", async () => {
          const areaPerToken = await instance.areaPerToken();

          expect(areaPerToken).to.equal(666666666666);
        });
      });
    });
  });
});
