const { expect } = require("chai");

describe("CategoryContract", () => {
  let instance;
  let owner, user1Address;

  const addCategory = async (name, from) => {
    const params = {
      name: name,
      description: `The description of ${name}`,
      regenerative3: `${name} regenerative 3`,
      regenerative2: `${name} regenerative 2`,
      regenerative1: `${name} regenerative 1`,
      neutro: `${name} neutro`,
      notRegenerative1: `${name} notRegenerative 1`,
      notRegenerative2: `${name} notRegenerative 2`,
      notRegenerative3: `${name} notRegenerative 3`,
    };

    await instance.connect(from).addCategory(params);
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

        expect(categories[0].isasDescription.name).to.equal("Soil");
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
    });
  });

  describe("#categories", () => {
    it("should have fields", async () => {
      const name = "Soil";
      await addCategory(name, owner);
      const category = await instance.categories(1);

      expect(category.id).to.equal(1);
      expect(category.isasDescription.name).to.equal("Soil");
      expect(category.isasDescription.description).to.equal(`The description of ${name}`);
      expect(category.isasDescription.regenerative3).to.equal(`${name} regenerative 3`);
      expect(category.isasDescription.regenerative2).to.equal(`${name} regenerative 2`);
      expect(category.isasDescription.regenerative1).to.equal(`${name} regenerative 1`);
      expect(category.isasDescription.neutro).to.equal(`${name} neutro`);
      expect(category.isasDescription.notRegenerative1).to.equal(`${name} notRegenerative 1`);
      expect(category.isasDescription.notRegenerative2).to.equal(`${name} notRegenerative 2`);
      expect(category.isasDescription.notRegenerative3).to.equal(`${name} notRegenerative 3`);
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

      const isasPayload = [
        {
          categoryId: 1,
          isaIndex: 0,
          indicator: 1,
        },
      ];

      it("calculate isaScore to isaIndex 0", async () => {
        await instance.calculateIsa(1, isasPayload);
        const isas = await instance.getIsa(1);

        const expectedIsas = [[1n, 0n, 1n]];

        expect(isas.join("")).to.equal(expectedIsas.join(""));
      });
    });

    context("without allowed caller", () => {
      it("returns error message", async () => {
        await expect(instance.calculateIsa(1, [])).to.be.revertedWith("Not allowed caller");
      });
    });
  });
});
