const { expect } = require("chai");

describe("RegenerationIndexRules", () => {
  let instance;
  let owner;

  const biomassResultValue = {
    categoryId: 1,
    indicator: 100001,
  };

  const biodiversityResultValue = {
    categoryId: 2,
    indicator: 1001,
  };

  beforeEach(async () => {
    [owner, user1Address] = await ethers.getSigners();

    const instanceContractFactory = await ethers.getContractFactory("RegenerationIndexRules");
    instance = await instanceContractFactory.deploy();
  });

  describe("#categories", () => {
    it("with category 1", async () => {
      const category = await instance.categories(1);

      expect(category.id).to.equal(1);
      expect(category.name).to.equal("Biomass");
      expect(category.description).to.equal(
        "Indicator to measure the total amount of biomass in the regenerating area. How much organic matter is there on the site? Estimate by including living biomass, such as trees, plants and roots, as well as dead biomass, which includes leaves, branches, wood and other types of organic matter covering the soil. The result should be expressed in tons [t]"
      );
    });

    it("with category 2", async () => {
      const category = await instance.categories(2);

      expect(category.id).to.equal(2);
      expect(category.name).to.equal("Biodiversity");
      expect(category.description).to.equal(
        "Indicator to measure the level of plant biodiversity in the regenerating area. How many different species are there in the area? Each different species is equivalent to one point and only trees and plants managed or planted by the regenerator should be counted"
      );
    });
  });

  describe("#getCategoryRegenerationIndexDescription", () => {
    it("with category 1", async () => {
      let categoryRegenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(1);

      categoryRegenerationIndexDescriptions = categoryRegenerationIndexDescriptions.toString();

      expect(categoryRegenerationIndexDescriptions).to.equal(
        "1,Balance > 100.000,2,100.000 > Balance > 10.000,3,10.000 > Balance > 1000,4,1000 > Balance > 100,5,100 > Balance > 10,6,10 > Balance > 0,7,Not applicable"
      );
    });

    it("with category 2", async () => {
      let categoryRegenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(2);

      categoryRegenerationIndexDescriptions = categoryRegenerationIndexDescriptions.toString();

      expect(categoryRegenerationIndexDescriptions).to.equal(
        "1,Biodiversity > 1000,2,1000 > Biodiversity > 500,3,500 > Biodiversity > 200,4,200 > Biodiversity > 100,5,100 > Biodiversity > 50,6,50 > Biodiversity > 25,7,Biodiversity < 25"
      );
    });
  });

  describe("#calculateScore", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when category and regeneration index exists", () => {
        it("calculate regenerationScore", async () => {
          const score = await instance.calculateScore(biomassResultValue, biodiversityResultValue);

          expect(score).to.equal(50);
        });
      });
    });
  });
});
