const { expect } = require("chai");
const { userRulesDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");

describe("RegenerationCreditImpact", () => {
  let instance, userRules, regenerationCredit;
  let owner;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const inspectionRulesDeployed = await inspectionRulesDeployed();
    const instanceFactory = await ethers.getContractFactory("RegenerationCreditImpact");

    instance = await instanceFactory.deploy(
      inspectionRulesDeployed.regenerationCredit.target,
      inspectionRulesDeployed.instance.target,
      inspectionRulesDeployed.regeneratorRules.target,
      inspectionRulesDeployed.userRules.taregt
  );
  });

  describe("totalCarbonImpact", () => {
    context("when do not have inspections", async () => {
      const totalCarbonImpact = await instance.totalCarbonImpact();

      expect(totalCarbonImpact).to.equal(0);
    })

    context("when have inspections", () => {
      context("when inspectionsBiomassImpact is 0", () => {
        beforeEach(async () => {
          await inspectionRules.connect(regeneratorAddress).requestInspection();
        });

        expect(totalCarbonImpact).to.equal(0);
      })

      context("when inspectionsBiomassImpact is not 0", () => {
        context("when have 1 inspection", () => {
          beforeEach(async () => {
            await inspectionRules.connect(regeneratorAddress).requestInspection();
          });

          context("when inspection biomass impact is 10", () => {
            // Realizar inspeção para o impactor por biomassa ser 10

            it("must returnstotalCarbonImpact equal 5 ", () => {
              expect(totalCarbonImpact).to.equal(5);
            })
          })

          context("when inspection biomass impact is 25", () => {
            it("must returnstotalCarbonImpact equal 12 ", () => {
              expect(totalCarbonImpact).to.equal(12);
            })
          })
        })

        context("when have 5 inspections", () => {
          beforeEach(async () => {
            await inspectionRules.connect(regenerator1Address).requestInspection();
            await inspectionRules.connect(regenerator2Address).requestInspection();
            await inspectionRules.connect(regenerator3Address).requestInspection();
            await inspectionRules.connect(regenerator4Address).requestInspection();
            await inspectionRules.connect(regenerator5Address).requestInspection();

            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 50
            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 50


            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 0

            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 25

            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 125
            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 13

            await inspectionRules.connect(inspectorAddress).realizeInspection(); // 50 Invalidada
          })

          it("must returnstotalCarbonImpact equal 105", () => {
            expect(totalCarbonImpact).to.equal(105);
          })
        })
      })
    })
  })

  describe("totalBiodiversityImpact", () => {

  })

  describe("totalSoilImpact", () => {

  })

  describe("tokenCarbonImpact", () => {

  })

  describe("tokenBiodiversityImpact", () => {

  })

  describe("tokenSoilImpact", () => {

  })
});
