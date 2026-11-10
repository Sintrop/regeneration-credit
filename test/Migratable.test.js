const { expect } = require("chai");

describe("Migratable", () => {
  let owner, user;

  const MIGRATABLE = [
    ["RegenerationCredit", (a) => [1000]],
    ["CommunityRules", () => [2, 10, 10, 10, 10]],
    ["InvitationRules", (a) => [a, a, a, a, a]],
    ["RegeneratorRules", (a) => [a, a]],
    ["InspectorRules", (a) => [a, a, 3]],
    ["InspectionRules", () => [10, 10, 3, 10, 10]],
    ["ActivistRules", (a) => [a, a]],
    ["ResearcherRules", () => [10, 3, 10]],
    ["DeveloperRules", () => [10, 3, 10]],
    ["ContributorRules", () => [10, 3, 10]],
    ["SupporterRules", (a) => [a, a, a]],
  ];

  const deploy = async (name, args) => {
    const factory = await ethers.getContractFactory(name);
    return factory.deploy(...args(owner.address));
  };

  // Zero value for any ABI parameter.
  const zero = (param) => {
    if (param.baseType === "array")
      return param.arrayLength > 0 ? Array(param.arrayLength).fill(zero(param.arrayChildren)) : [];
    if (param.baseType === "tuple") return param.components.map(zero);
    if (param.baseType === "address") return ethers.ZeroAddress;
    if (param.baseType === "bool") return false;
    if (param.baseType === "string") return "";
    if (param.baseType.startsWith("bytes")) return param.baseType === "bytes" ? "0x" : ethers.ZeroHash;
    return 0;
  };

  const migrationFunctions = (contract) =>
    contract.interface.fragments.filter((f) => f.type === "function" && /^(migrate|closeMigration)/.test(f.name));

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
  });

  for (const [name, args] of MIGRATABLE) {
    describe(name, () => {
      let instance;

      beforeEach(async () => {
        instance = await deploy(name, args);
      });

      it("should set the deployer as migrator", async () => {
        expect(await instance.migrator()).to.equal(owner.address);
      });

      it("should only allow the migrator to call migration functions", async () => {
        for (const fragment of migrationFunctions(instance)) {
          const values = fragment.inputs.map(zero);
          await expect(instance.connect(user)[fragment.format()](...values)).to.be.revertedWith("Migration closed");
        }
      });

      it("should disable migration functions after closeMigration", async () => {
        await expect(instance.closeMigration()).to.emit(instance, "MigrationClosed");
        expect(await instance.migrator()).to.equal(ethers.ZeroAddress);

        for (const fragment of migrationFunctions(instance)) {
          const values = fragment.inputs.map(zero);
          await expect(instance[fragment.format()](...values)).to.be.revertedWith("Migration closed");
        }
      });
    });
  }

  describe("#migrateLogs", () => {
    let instance, source;

    beforeEach(async () => {
      source = await deploy("RegenerationCredit", () => [1000]);
      instance = await deploy("RegenerationCredit", () => [1000]);
    });

    it("should emit the original topics and data", async () => {
      const tx = await source.burnTokens(10);
      const receipt = await tx.wait();
      const original = receipt.logs.map((log) => ({ topics: log.topics, data: log.data }));

      const replay = await (await instance.migrateLogs(original)).wait();
      const replayed = replay.logs.map((log) => ({ topics: [...log.topics], data: log.data }));

      expect(replayed).to.deep.equal(original.map((log) => ({ topics: [...log.topics], data: log.data })));
      expect(replay.logs.every((log) => log.address === instance.target)).to.equal(true);
    });

    it("should return error message with more than 4 topics", async () => {
      const topics = Array(5).fill(ethers.ZeroHash);

      await expect(instance.migrateLogs([{ topics, data: "0x" }])).to.be.revertedWith("Invalid log");
    });
  });
});
