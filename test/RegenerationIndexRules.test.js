const { expect } = require("chai");

describe("RegenerationIndexRules", () => {
  let instance;
  let owner;

  const treesResultValue = {
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
      expect(category.name).to.equal("Trees");
      expect(category.description).to.equal(
        "Indicator to measure the total amount of trees, palm trees and other plants over 5cm in diameter in the regenerating area. How many trees, palm trees and other plants with more than 5cm of diameters there is in the regenerating area? Justify your answer in the report."
      );
    });

    it("with category 2", async () => {
      const category = await instance.categories(2);

      expect(category.id).to.equal(2);
      expect(category.name).to.equal("Biodiversity");
      expect(category.description).to.equal(
        "Indicator to measure the level of biodiversity of trees, palm trees and other plants over 5cm of diamater in the regenerating area. How many different species are there in the area? Each different species is equivalent to one point and only trees and plants managed or planted by the regenerator should be counted."
      );
    });
  });

  describe("#getCategoryRegenerationIndexDescription", () => {
    it("with category 1", async () => {
      let categoryRegenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(1);

      categoryRegenerationIndexDescriptions = categoryRegenerationIndexDescriptions.toString();

      expect(categoryRegenerationIndexDescriptions).to.equal(
        "1,Trees > 10000,2,10000 > Trees > 4000,3,4000 > Trees > 2000,4,2000 > Trees > 500,5,500 > Trees > 100,6,100 > Trees > 10,7,Trees < 10"
      );
    });

    it("with category 2", async () => {
      let categoryRegenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(2);

      categoryRegenerationIndexDescriptions = categoryRegenerationIndexDescriptions.toString();

      expect(categoryRegenerationIndexDescriptions).to.equal(
        "1,Biodiversity > 240,2,240 > Biodiversity > 120,3,120 > Biodiversity > 60,4,60 > Biodiversity > 30,5,30 > Biodiversity > 15,6,15 > Biodiversity > 5,7,Biodiversity < 5"
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
          const score = await instance.calculateScore(treesResultValue, biodiversityResultValue);

          expect(score).to.equal(64);
        });
      });
    });
  });
});
