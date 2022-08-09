const CategoryContract = artifacts.require("CategoryContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const UserContract = artifacts.require("UserContract");
const SacToken = artifacts.require("SacToken");
const IsaPool = artifacts.require("IsaPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("CategoryContract", (accounts) => {
  let instance;
  let userContract;
  let researcherContract;
  let [msgSender, user1Address, resea1Address] = accounts;    

  const addCategory = async (name) => {
    await instance.addCategory(
      name,
      `Está categoria visa avaliar as qualidades do ${name}`,
      `${name} totalmente sustentável`,
      `${name} parcialmente sustentável`,
      `${name} neutro`,
      `${name} parcialmente não sustentável`,
      `${name} totalmente não sustentável`
    );
  };

  const addResearcher = async (name, address) => {
    await researcherContract.addResearcher(
      name,
      "111.111.111-00",
      "CPF",
      "Brazil",
      "SP",
      "Jundiai",
      "135465-005",
      {from: address}
    );
  };
  
  const transferTokensTo = async (userAddress, tokens) => {
    await sacToken.transfer(userAddress, tokens);
  };

  const balanceOf = async (userAddress) => {
    return await sacToken.balanceOf(userAddress);
  };

  beforeEach(async () => {
    sacToken = await SacToken.new("1500000000000000000000000000");
    isaPool = await IsaPool.new(sacToken.address);

    await sacToken.addContractPool(isaPool.address, "0");

    userContract = await UserContract.new();
    researcherContract = await ResearcherContract.new(userContract.address);

    instance = await CategoryContract.new(isaPool.address, researcherContract.address);
    await isaPool.newAllowedCaller(instance.address);

    await userContract.newAllowedCaller(researcherContract.address);
    await researcherContract.newAllowedUser(resea1Address);
    await addResearcher("Researcher A", resea1Address);

  });

  context("When will add a new category", () => {
    context("When is not a researcher", () => {
      it("should return error message", async () => {
        const name = "Solo"  
        await expectRevert(
          addCategory(name, user1Address),
          "Only allowed to researchers"
        );
      })       
    });
    
    context("When is a researcher", () => {
      it("should create category", async () => {
        const name = "Solo"  
        await addCategory(name, resea1Address);
        const categories = await instance.getCategories();
    
        assert.equal(categories[0].name, "Solo");
      })  
    });
  });

  context("When is a researcher", () => {
    context("When access category fields", () => {
      it("should have fields", async () => {
        const name = "Solo"
        await addCategory(name, resea1Address);
        const category = await instance.categories(1);
          
        assert.equal(category.id, 1);
        assert.equal(category.createdBy, msgSender);
        assert.equal(category.name, "Solo");
        assert.equal(category.description, `Está categoria visa avaliar as qualidades do ${name}`);
        assert.equal(category.totallySustainable, `${name} totalmente sustentável`);
        assert.equal(category.partiallySustainable, `${name} parcialmente sustentável`);
        assert.equal(category.neutro, `${name} neutro`);
        assert.equal(category.partiallyNotSustainable, `${name} parcialmente não sustentável`);
        assert.equal(category.totallyNotSustainable, `${name} totalmente não sustentável`);
        assert.equal(category.votesCount, 0);
      });
    });
  });
});
