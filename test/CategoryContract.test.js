const CategoryContract = artifacts.require("CategoryContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("CategoryContract", (accounts) => {
  let instance;
  let [owner, user1Address] = accounts;

  const addCategory = async (name, from) => {
    await instance.addCategory(
      name,
      `The description of ${name}`,
      `How inspectors should evaluate ${name}`,
      `${name} regenerative 3`,
      `${name} regenerative 2`,
      `${name} regenerative 1`,
      `${name} neutro`,
      `${name} notRegenerative 1`,
      `${name} notRegenerative 2`,
      `${name} notRegenerative 3`,
      { from: from }
    );
  };

  beforeEach(async () => {
    instance = await CategoryContract.new();
  });

  describe("#addCategory", () => {
    context("When is not the owner", () => {
      it("should return error message", async () => {
        const name = "Soil";
        await expectRevert(addCategory(name, user1Address), "Ownable: caller is not the owner");
      });
    });

    context("When is the owner", () => {
      it("should create category", async () => {
        const name = "Soil";
        await addCategory(name, owner);
        const categories = await instance.getCategories();

        assert.equal(categories[0].name, "Soil");
      });

      it("should add owner in createdBy", async () => {
        await addCategory("Soil", owner);

        const category = await instance.categories(1);

        assert.equal(category.createdBy, owner);
      });

      it("should increment id of category when created", async () => {
        await addCategory("Soil", owner);
        await addCategory("Soil 2", owner);

        const categories = await instance.getCategories();

        assert.equal(categories[1].id, 2);
      });

      it("should increment total of categories", async () => {
        await addCategory("Soil", owner);
        await addCategory("Soil 2", owner);
        const categoryCounts = await instance.categoryCounts();

        assert.equal(categoryCounts, 2);
      });

      it("should create category with votes equal 0", async () => {
        await addCategory("Soil", owner);
        const categories = await instance.getCategories();

        assert.equal(parseInt(categories[0].votesCount), 0);
      });
    });
  });

  context("When access category fields", () => {
    it("should have fields", async () => {
      const name = "Soil";
      await addCategory(name, owner);
      const category = await instance.categories(1);

      assert.equal(category.id, 1);
      assert.equal(category.createdBy, owner);
      assert.equal(category.name, "Soil");
      assert.equal(category.description, `The description of ${name}`);
      assert.equal(category.tutorial, `How inspectors should evaluate ${name}`);
      assert.equal(category.regenerative3, `${name} regenerative 3`);
      assert.equal(category.regenerative2, `${name} regenerative 2`);
      assert.equal(category.regenerative1, `${name} regenerative 1`);
      assert.equal(category.neutro, `${name} neutro`);
      assert.equal(category.notRegenerative1, `${name} notRegenerative 1`);
      assert.equal(category.notRegenerative2, `${name} notRegenerative 2`);
      assert.equal(category.notRegenerative3, `${name} notRegenerative 3`);
      assert.equal(category.votesCount, 0);
    });
  });

  describe("#getCategories", () => {
    it("should return category list", async () => {
      await addCategory("Soil", owner);
      await addCategory("Soil2", owner);
      const categories = await instance.getCategories();

      assert.equal(categories.length, 2);
    });
  });
});
