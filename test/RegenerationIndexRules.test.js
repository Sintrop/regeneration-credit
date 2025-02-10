const { expect } = require("chai");

describe("RegenerationIndexRules", () => {
  let instance;
  let owner;

  beforeEach(async () => {
    [owner, user1Address] = await ethers.getSigners();

    const instanceContractFactory = await ethers.getContractFactory("RegenerationIndexRules");
    instance = await instanceContractFactory.deploy();
  });

  describe("#categories", () => {
    it("with category 1", async () => {
      const category = await instance.categories(1);

      expect(category.id).to.equal(1);
      expect(category.name).to.equal("Carbon");
      expect(category.description).to.equal(
        "Indicator to measure CO2 balance. Must evaluate carbon emissions and sequestration. Carbon balance = sequestration - emissions [tCO2]"
      );
    });

    it("with category 2", async () => {
      const category = await instance.categories(2);

      expect(category.id).to.equal(2);
      expect(category.name).to.equal("Biodiversity");
      expect(category.description).to.equal(
        "Indicator to measure CO2 balance. Must evaluate carbon emissions and sequestration. Carbon balance = sequestration - emissions [tCO2]"
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
        "1,Balance > 100.000,2,100.000 > Balance > 10.000,3,10.000 > Balance > 1000,4,1000 > Balance > 100,5,100 > Balance > 10,6,10 > Balance > 0,7,Not applicable"
      );
    });
  });

  describe("#calculateScore", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when category and regeneration index exists", () => {
        const regenerationIndexPayload = [
          {
            categoryId: 1,
            regenerationIndexId: 1,
            indicator: 1,
          },
        ];

        it("calculate regenerationScore", async () => {
          const score = await instance.calculateScore(regenerationIndexPayload);

          expect(score).to.equal(25);
        });
      });

      context("when category do not exists", () => {
        const regenerationIndexPayload = [
          {
            categoryId: 100,
            regenerationIndexId: 1,
            indicator: 1,
          },
        ];

        it("returns error message", async () => {
          await expect(instance.calculateScore(regenerationIndexPayload)).to.be.revertedWith(
            "Category or Regeneration Index do not exists"
          );
        });
      });

      context("when Regeneration Index do not exists", () => {
        const regenerationIndexPayload = [
          {
            categoryId: 1,
            regenerationIndexId: 100,
            indicator: 1,
          },
        ];

        it("returns error message", async () => {
          await expect(instance.calculateScore(regenerationIndexPayload)).to.be.revertedWith(
            "Category or Regeneration Index do not exists"
          );
        });
      });
    });
  });
});
