const { expect } = require("chai");

describe("CategoryContract", () => {
  let instance;
  let owner, user1Address;

  const addCategory = async (name, from) => {
    const description = `The description of ${name}`;

    const isaDescriptions = [
      {
        isaId: 1,
        description: "Description for isaId 1 to category",
      },
      {
        isaId: 2,
        description: "Description for isaId 2 to category",
      },
    ];

    await instance.connect(from).addCategory(name, description, isaDescriptions);
  };

  beforeEach(async () => {
    [owner, user1Address] = await ethers.getSigners();

    const instanceContractFactory = await ethers.getContractFactory("CategoryContract");
    instance = await instanceContractFactory.deploy();
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
        const name = "Soil";
        await addCategory(name, owner);
        const categories = await instance.getCategories();

        expect(categories[0].name).to.equal("Soil");
      });

      it("should increment id of category when created", async () => {
        await addCategory("Soil", owner);
        await addCategory("Soil 2", owner);

        const categories = await instance.getCategories();

        expect(categories[1].id).to.equal(2);
      });

      it("should increment total of categories", async () => {
        await addCategory("Soil", owner);
        await addCategory("Soil 2", owner);
        const categoryCounts = await instance.categoryCounts();

        expect(categoryCounts).to.equal(2);
      });

      it("should insert isa descriptions", async () => {
        await addCategory("Soil", owner);
        const isaDescriptions = await instance.getCategoryIsaDescription(1);

        const expected = [
          [1n, "Description for isaId 1 to category"],
          [2n, "Description for isaId 2 to category"],
        ];

        expect(isaDescriptions).deep.to.equal(expected);
      });
    });
  });

  describe("#categories", () => {
    it("should have fields", async () => {
      const name = "Soil";
      await addCategory(name, owner);
      const category = await instance.categories(1);

      expect(category.id).to.equal(1);
      expect(category.name).to.equal("Soil");
      expect(category.description).to.equal(`The description of ${name}`);
    });
  });

  describe("#getCategories", () => {
    it("should return category list", async () => {
      await addCategory("Soil", owner);
      await addCategory("Soil2", owner);
      const categories = await instance.getCategories();

      expect(categories.length).to.equal(2);
    });
  });

  describe("#getIsa", () => {
    it("returns isas to inspection of id 1", async () => {
      const isas = await instance.getIsa(1);

      expect(isas.length).to.equal([].length);
    });
  });

  describe("#calculateIsa", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await instance.newAllowedCaller(owner);
      });

      context("when category and isa exists", () => {
        beforeEach(async () => {
          await addCategory("Soil", owner);
        });

        const isasPayload = [
          {
            categoryId: 1,
            isaId: 1,
            indicator: 1,
          },
        ];

        it("calculate isaScore", async () => {
          await instance.calculateIsa(1, isasPayload);
          const isas = await instance.getIsa(1);

          const expectedIsas = [[1n, 1n, 1n]];

          expect(isas.join("")).to.equal(expectedIsas.join(""));
        });
      });

      context("when category do not exists", () => {
        const isasPayload = [
          {
            categoryId: 1,
            isaId: 1,
            indicator: 1,
          },
        ];

        it("returns error message", async () => {
          await expect(instance.calculateIsa(1, isasPayload)).to.be.revertedWith("Category or Isa do not exists");
        });
      });

      context("when isa do not exists", () => {
        beforeEach(async () => {
          await addCategory("Soil", owner);
        });

        const isasPayload = [
          {
            categoryId: 1,
            isaId: 100,
            indicator: 1,
          },
        ];

        it("returns error message", async () => {
          await expect(instance.calculateIsa(1, isasPayload)).to.be.revertedWith("Category or Isa do not exists");
        });
      });
    });

    context("without allowed caller", () => {
      it("returns error message", async () => {
        await expect(instance.calculateIsa(1, [])).to.be.revertedWith("Not allowed caller");
      });
    });
  });
});
