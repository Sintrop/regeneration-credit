const { expect } = require("chai");

describe("CategoryContract", () => {
  let instance;
  let owner, user1Address;

  const addCategory = async (name, from) => {
    const description = `The description of ${name}`;

    const regenerationIndexDescriptions = [
      {
        regenerationIndexId: 1,
        description: "Description for regenerationIndexId 1 to category",
      },
      {
        regenerationIndexId: 2,
        description: "Description for regenerationIndexId 2 to category",
      },
    ];

    await instance.connect(from).addCategory(name, description, regenerationIndexDescriptions);
  };

  beforeEach(async () => {
    [owner, user1Address] = await ethers.getSigners();

    const instanceContractFactory = await ethers.getContractFactory("CategoryContract");
    instance = await instanceContractFactory.deploy();

    await addCategory("Soil A", owner);
    await addCategory("Soil B", owner);
    await addCategory("Soil C", owner);
    await addCategory("Soil D", owner);
  });

  describe("#addCategory", () => {
    context("When is not the owner", () => {
      it("should return error message", async () => {
        const name = "Soil";
        await expect(addCategory(name, user1Address)).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    context("When is the owner", () => {
      it("should create category", async () => {
        const categories = await instance.getCategories();

        expect(categories[0].name).to.equal("Soil A");
      });

      it("should increment id of category when created", async () => {
        await addCategory("Soil", owner);
        await addCategory("Soil 2", owner);

        const categories = await instance.getCategories();

        expect(categories[1].id).to.equal(2);
      });

      it("should increment total of categories", async () => {
        const categoryCounts = await instance.categoryCounts();

        expect(categoryCounts).to.equal(4);
      });

      it("should insert regeneration index descriptions", async () => {
        await addCategory("Soil", owner);
        const regenerationIndexDescriptions = await instance.getCategoryRegenerationIndexDescription(1);

        const expected = [
          [1n, "Description for regenerationIndexId 1 to category"],
          [2n, "Description for regenerationIndexId 2 to category"],
        ];

        expect(regenerationIndexDescriptions).deep.to.equal(expected);
      });
    });
  });

  describe("#categories", () => {
    it("should have fields", async () => {
      const category = await instance.categories(1);

      expect(category.id).to.equal(1);
      expect(category.name).to.equal("Soil A");
      expect(category.description).to.equal(`The description of Soil A`);
    });
  });

  describe("#getCategories", () => {
    it("should return category list", async () => {
      const categories = await instance.getCategories();

      expect(categories.length).to.equal(4);
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
