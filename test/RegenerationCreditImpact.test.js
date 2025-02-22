const { expect } = require("chai");
const { userRulesDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");

describe("RegenerationCreditImpact", () => {
  let instance, userRules, regenerationCredit;
  let owner;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    userRules = await userRulesDeployed();
    regenerationCredit = await regenerationCreditDeployed();

    const instanceFactory = await ethers.getContractFactory("RegenerationCreditImpact");

    instance = await instanceFactory.deploy();
  });

  describe("totalCarbonImpact", () => {
    context("when do not have inspections", () => {

    })

    context("when have inspections", () => {
      context("when inspectionsCarbonImpact is 0", () => {

      })

      context("when inspectionsCarbonImpact is not 0", () => {
        context("when have 1 inspection", () => {
          context("when inspection carbom impact is 10", () => {

          })

          context("when inspection carbom impact is 25", () => {
            
          })
        })

        context("when have 5 inspections", () => {
          
        })
      })
    })
  })

  describe("totalBiodiversityImpact", () => {

  })

  describe("tokenCarbonImpact", () => {

  })

  describe("tokenBiodiversityImpact", () => {

  })
});
