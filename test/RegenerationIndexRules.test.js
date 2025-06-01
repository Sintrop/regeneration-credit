const { expect } = require("chai");

describe("RegenerationIndexRules", () => {
  let instance;
  let owner;

  const treesResultValue = 100001;

  const biodiversityResultValue = 1001;

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
        "Indicator to measure the total amount of trees, palm trees and other plants over 1m high and 3cm in diameter in the regenerating area. How many trees, palm trees and other plants over 1m high and 3cm in diameter there is in the regenerating area? Justify your answer in the report."
      );
    });

    it("with category 2", async () => {
      const category = await instance.categories(2);

      expect(category.id).to.equal(2);
      expect(category.name).to.equal("Biodiversity");
      expect(category.description).to.equal(
        "Indicator to measure the level of biodiversity of trees, palm trees and other plants over 1m high and 3cm in diameter in the regenerating area. How many different species are there in the area? Each different species is equivalent to one point and only trees and plants managed or planted by the regenerator should be counted."
      );
    });
  });

  describe("#getCategoryRegenerationIndexDescription", () => {
    it("with category 1", async () => {
      let categoryRegenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(1);

      categoryRegenerationIndexDescriptions = categoryRegenerationIndexDescriptions.toString();

      expect(categoryRegenerationIndexDescriptions).to.equal(
        "1,trees >= 50000,2,trees >= 25000 && trees < 50000,3,trees >= 12500 && trees < 25000,4,trees >= 6250 && trees < 12500,5,trees >= 3125 && trees < 6250,6,trees >= 20 && trees < 3125,7,trees < 20"
      );
    });

    it("with category 2", async () => {
      let categoryRegenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(2);

      categoryRegenerationIndexDescriptions = categoryRegenerationIndexDescriptions.toString();

      expect(categoryRegenerationIndexDescriptions).to.equal(
        "1,Biodiversity >= 240,2,240 >= Biodiversity > 120,3,120 >= Biodiversity > 60,4,60 >= Biodiversity > 30,5,30 >= Biodiversity > 15,6,15 >= Biodiversity > 5,7,Biodiversity < 5"
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
