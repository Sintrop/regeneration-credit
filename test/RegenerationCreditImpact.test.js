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
  let biomassIndicatorValue = 10;
  let biodiversityIndicatorValue = 10;

  const addRegenerator = async (name, from, _coordinates = []) => {
    const coordinatesParams = _coordinates.length > 0 ? _coordinates : coordinates();
    await regeneratorRules.connect(from).addRegenerator(1000, name, "photoURL", coordinatesParams);
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

  const biomassResultValue = () => {
    return {
      categoryId: 1,
      indicator: biomassIndicatorValue,
    };
  };

  const biodiversityResultValue = () => {
    return {
      categoryId: 2,
      indicator: biodiversityIndicatorValue,
    };
  };

  const realizeInspection = async (id, report, biomassResult, biodiversityResult, from) => {
    const proofPhoto = "proofPhoto";

    await inspectionRules.connect(from).realizeInspection(id, proofPhoto, report, biomassResult, biodiversityResult);
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

    const invitationRulesFactory = await ethers.getContractFactory("InvitationRules");
    invitationRules = await invitationRulesFactory.deploy(
      communityRules.target,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS
    );

    const instanceFactory = await ethers.getContractFactory("RegenerationCreditImpact");

    instance = await instanceFactory.deploy(
      regenerationCredit.target,
      inspectionRules.target,
      communityRules.target,
      regeneratorRules.target
    );

    await communityRules.newAllowedCaller(invitationRules.target);
    await regeneratorRules.newAllowedCaller(owner);
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
      context("when inspectionsBiomassImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          biomassIndicatorValue = 0;

          await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
        });

        it("totalCarbonImpact must be 0", async () => {
          const totalCarbonImpact = await instance.totalCarbonImpact();

          expect(totalCarbonImpact).to.equal(0);
        });
      });

      context("when inspectionsBiomassImpact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection biomass impact is 10", () => {
            beforeEach(async () => {
              biomassIndicatorValue = 10;

              await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
            });

            it("must returnstotalCarbonImpact equal 5", async () => {
              const totalCarbonImpact = await instance.totalCarbonImpact();

              expect(totalCarbonImpact).to.equal(5);
            });
          });

          context("when inspection biomass impact is 25", () => {
            beforeEach(async () => {
              biomassIndicatorValue = 32;

              await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
            });

            it("must returnstotalCarbonImpact equal 16", async () => {
              const totalCarbonImpact = await instance.totalCarbonImpact();

              expect(totalCarbonImpact).to.equal(16);
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

            biomassIndicatorValue = 32;
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            biomassIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biomassIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);

            biomassIndicatorValue = 10;
            await realizeInspection(4, "report", biomassResultValue(), biodiversityResultValue(), inspector4Address);

            biomassIndicatorValue = 32;
            await realizeInspection(5, "report", biomassResultValue(), biodiversityResultValue(), inspector5Address);
          });

          it("must returnstotalCarbonImpact equal 85", async () => {
            const totalCarbonImpact = await instance.totalCarbonImpact();

            expect(totalCarbonImpact).to.equal(85);
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

            biomassIndicatorValue = 32;
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            biomassIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biomassIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
          });

          it("must returnstotalCarbonImpact equal 44", async () => {
            const totalCarbonImpact = await instance.totalCarbonImpact();

            expect(totalCarbonImpact).to.equal(44);
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

        //     biomassIndicatorValue = 32;
        //     await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     biomassIndicatorValue = 0;
        //     await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

        //     biomassIndicatorValue = 100;
        //     await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
        //   });

        //   it("must returnstotalCarbonImpact equal 44", async () => {
        //     const totalCarbonImpact = await instance.totalCarbonImpact();

        //     expect(totalCarbonImpact).to.equal(44);
        //   });
        // });
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

          await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
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

              await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
            });

            it("must returns totalBiodiversityImpact equal 10", async () => {
              const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

              expect(totalBiodiversityImpact).to.equal(10);
            });
          });

          context("when inspection biodiversity impact is 25", () => {
            beforeEach(async () => {
              biodiversityIndicatorValue = 32;

              await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
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
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);

            biodiversityIndicatorValue = 10;
            await realizeInspection(4, "report", biomassResultValue(), biodiversityResultValue(), inspector4Address);

            biodiversityIndicatorValue = 32;
            await realizeInspection(5, "report", biomassResultValue(), biodiversityResultValue(), inspector5Address);
          });

          it("must returns totalBiodiversityImpact equal 170", async () => {
            const totalBiodiversityImpact = await instance.totalBiodiversityImpact();

            expect(totalBiodiversityImpact).to.equal(170);
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
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
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
        //     await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     biodiversityIndicatorValue = 0;
        //     await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

        //     biodiversityIndicatorValue = 100;
        //     await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
        //   });

        //   it("must returnstotalCarbonImpact equal 44", async () => {
        //     const totalCarbonImpact = await instance.totalCarbonImpact();

        //     expect(totalCarbonImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("totalSoilImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addRegenerator("Regenerator B", regenerator2Address);
    });

    context("when have two regenerators", () => {
      context("when all regenerators are valids", async () => {
        it("totalSoilImpact must be 2000", async () => {
          const totalSoilImpact = await instance.totalSoilImpact();

          expect(totalSoilImpact).to.equal(2000);
        });
      });

      context("when only one regenerator is valid", async () => {
        beforeEach(async () => {
          await regeneratorRules.removePoolLevels(regenerator2Address, 0);
        });

        it("totalSoilImpact must be 1000", async () => {
          const totalSoilImpact = await instance.totalSoilImpact();

          expect(totalSoilImpact).to.equal(1000);
        });
      });
    });
  });

  describe("tokenCarbonImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("tokenCarbonImpact must be 0", async () => {
        const tokenCarbonImpact = await instance.tokenCarbonImpact();

        expect(tokenCarbonImpact).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsBiomassImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          biomassIndicatorValue = 0;

          await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
        });

        it("tokenCarbonImpact must be 0", async () => {
          const tokenCarbonImpact = await instance.tokenCarbonImpact();

          expect(tokenCarbonImpact).to.equal(0);
        });
      });

      context("when inspectionsBiomassImpact is not 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);
        });

        context("when have 1 inspection", () => {
          context("when inspection biomass impact is 10", () => {
            beforeEach(async () => {
              biomassIndicatorValue = 10;
            });

            context("when do not have tokens totalLocked_", () => {
              beforeEach(async () => {
                biomassIndicatorValue = 10;

                await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
              });

              it("must returns tokenCarbonImpact equal 333333", async () => {
                const tokenCarbonImpact = await instance.tokenCarbonImpact();

                expect(tokenCarbonImpact).to.equal(333333);
              });
            });

            context("when have token totalLocked_", () => {
              beforeEach(async () => {
                await regenerationCredit.addContractPool(ZERO_ADDRESS, 300000000000000000000000000n);
                await regenerationCredit.addContractPool(ZERO_ADDRESS, 300000000000000000000000000n);

                biomassIndicatorValue = 10;

                await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
              });

              it("must returns tokenCarbonImpact equal 555555", async () => {
                const tokenCarbonImpact = await instance.tokenCarbonImpact();

                expect(tokenCarbonImpact).to.equal(555555);
              });
            });
          });

          context("when inspection biomass impact is 25", () => {
            beforeEach(async () => {
              biomassIndicatorValue = 32;

              await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
            });

            it("must returnstotalCarbonImpact equal 1066666", async () => {
              const tokenCarbonImpact = await instance.tokenCarbonImpact();

              expect(tokenCarbonImpact).to.equal(1066666);
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

            biomassIndicatorValue = 32;
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            biomassIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biomassIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);

            biomassIndicatorValue = 10;
            await realizeInspection(4, "report", biomassResultValue(), biodiversityResultValue(), inspector4Address);

            biomassIndicatorValue = 32;
            await realizeInspection(5, "report", biomassResultValue(), biodiversityResultValue(), inspector5Address);
          });

          it("must returns tokenCarbonImpact equal 5666666", async () => {
            const tokenCarbonImpact = await instance.tokenCarbonImpact();

            expect(tokenCarbonImpact).to.equal(5666666);
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

            biomassIndicatorValue = 32;
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            biomassIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biomassIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
          });

          it("must returns tokenCarbonImpact equal 2933333", async () => {
            const tokenCarbonImpact = await instance.tokenCarbonImpact();

            expect(tokenCarbonImpact).to.equal(2933333);
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

        //     biomassIndicatorValue = 32;
        //     await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     biomassIndicatorValue = 0;
        //     await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

        //     biomassIndicatorValue = 100;
        //     await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
        //   });

        //   it("must returnstotalCarbonImpact equal 44", async () => {
        //     const totalCarbonImpact = await instance.totalCarbonImpact();

        //     expect(totalCarbonImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("tokenBiodiversityImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(inspectorAddress, userTypes.Inspector);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when do not have inspections", async () => {
      it("tokenBiodiversityImpact must be 0", async () => {
        const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

        expect(tokenBiodiversityImpact).to.equal(0);
      });
    });

    context("when have inspections", () => {
      context("when inspectionsBiodiversityImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();

          await advanceBlock(5);

          await inspectionRules.connect(inspectorAddress).acceptInspection(1);

          biodiversityIndicatorValue = 0;

          await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
        });

        it("tokenBiodiversityImpact must be 0", async () => {
          const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

          expect(tokenBiodiversityImpact).to.equal(0);
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

                await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
              });

              it("must returns tokenBiodiversityImpact equal 666666", async () => {
                const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

                expect(tokenBiodiversityImpact).to.equal(666666);
              });
            });

            context("when have tokens totalLocked_", () => {
              beforeEach(async () => {
                await regenerationCredit.addContractPool(ZERO_ADDRESS, 300000000000000000000000000n);
                await regenerationCredit.addContractPool(ZERO_ADDRESS, 300000000000000000000000000n);

                biodiversityIndicatorValue = 10;

                await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
              });

              it("must returns tokenBiodiversityImpact equal 1111111", async () => {
                const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

                expect(tokenBiodiversityImpact).to.equal(1111111);
              });
            });
          });

          context("when inspection biodiversity impact is 25", () => {
            beforeEach(async () => {
              biodiversityIndicatorValue = 32;

              await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);
            });

            it("must returns tokenBiodiversityImpact equal 2133333", async () => {
              const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

              expect(tokenBiodiversityImpact).to.equal(2133333);
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
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);

            biodiversityIndicatorValue = 10;
            await realizeInspection(4, "report", biomassResultValue(), biodiversityResultValue(), inspector4Address);

            biodiversityIndicatorValue = 32;
            await realizeInspection(5, "report", biomassResultValue(), biodiversityResultValue(), inspector5Address);
          });

          it("must returns tokenBiodiversityImpact equal 11333333", async () => {
            const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

            expect(tokenBiodiversityImpact).to.equal(11333333);
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
            await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

            await inspectionRules.connect(regeneratorAddress).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();

            await advanceBlock(5);

            await inspectionRules.connect(inspector2Address).acceptInspection(2);
            await inspectionRules.connect(inspector3Address).acceptInspection(3);

            biodiversityIndicatorValue = 0;
            await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

            biodiversityIndicatorValue = 100;
            await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
          });

          it("must returns tokenBiodiversityImpact equal 5866666", async () => {
            const tokenBiodiversityImpact = await instance.tokenBiodiversityImpact();

            expect(tokenBiodiversityImpact).to.equal(5866666);
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
        //     await realizeInspection(1, "report", biomassResultValue(), biodiversityResultValue(), inspectorAddress);

        //     await inspectionRules.connect(regeneratorAddress).requestInspection();
        //     await inspectionRules.connect(regenerator2Address).requestInspection();

        //     await advanceBlock(5);

        //     await inspectionRules.connect(inspector2Address).acceptInspection(2);
        //     await inspectionRules.connect(inspector3Address).acceptInspection(3);

        //     biodiversityIndicatorValue = 0;
        //     await realizeInspection(2, "report", biomassResultValue(), biodiversityResultValue(), inspector2Address);

        //     biodiversityIndicatorValue = 100;
        //     await realizeInspection(3, "report", biomassResultValue(), biodiversityResultValue(), inspector3Address);
        //   });

        //   it("must returnstotalCarbonImpact equal 44", async () => {
        //     const totalCarbonImpact = await instance.totalCarbonImpact();

        //     expect(totalCarbonImpact).to.equal(44);
        //   });
        // });
      });
    });
  });

  describe("tokenSoilImpact", () => {
    beforeEach(async () => {
      await invitationRules.onlyOwnerInvite(regeneratorAddress, userTypes.Regenerator);
      await invitationRules.onlyOwnerInvite(regenerator2Address, userTypes.Regenerator);

      await addRegenerator("Regenerator A", regeneratorAddress);
      await addRegenerator("Regenerator B", regenerator2Address);
    });

    context("when have two regenerators", () => {
      context("when all regenerators are valids", async () => {
        context("when do not have tokens totalLocked_", () => {
          it("tokenSoilImpact must be 133333333", async () => {
            const tokenSoilImpact = await instance.tokenSoilImpact();

            expect(tokenSoilImpact).to.equal(133333333);
          });
        });

        context("when have tokens totalLocked_", () => {
          beforeEach(async () => {
            await regenerationCredit.addContractPool(ZERO_ADDRESS, 300000000000000000000000000n);
            await regenerationCredit.addContractPool(ZERO_ADDRESS, 300000000000000000000000000n);
          });

          it("tokenSoilImpact must be 222222222", async () => {
            const tokenSoilImpact = await instance.tokenSoilImpact();

            expect(tokenSoilImpact).to.equal(222222222);
          });
        });
      });

      context("when only one regenerator is valid", async () => {
        beforeEach(async () => {
          await regeneratorRules.removePoolLevels(regenerator2Address, 0);
        });

        it("tokenSoilImpact must be 66666666", async () => {
          const tokenSoilImpact = await instance.tokenSoilImpact();

          expect(tokenSoilImpact).to.equal(66666666);
        });
      });
    });
  });
});
