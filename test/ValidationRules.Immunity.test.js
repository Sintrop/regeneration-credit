// test/ValidationRules.Immunity.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");

const userTypes = {
  REGENERATOR: 1,
  DENIED: 8,
  UNDEFINED: 0,
};

describe("ValidationRules - Regenerator Immunity Logic", () => {
  let validationRules; // The contract we are testing
  let mockCommunityRules, mockRegeneratorRules, mockVoteRules;
  let owner, voter, targetRegenerator;

  const REGENERATOR_IMMUNITY_THRESHOLD = 5;

  beforeEach(async () => {
    [owner, voter, targetRegenerator] = await ethers.getSigners();

    const communityRulesArtifact = await artifacts.readArtifact("ICommunityRules");
    const regeneratorRulesArtifact = await artifacts.readArtifact("IRegeneratorRules");
    const voteRulesArtifact = await artifacts.readArtifact("IVoteRules");

    mockCommunityRules = await deployMockContract(owner, communityRulesArtifact.abi);
    mockRegeneratorRules = await deployMockContract(owner, regeneratorRulesArtifact.abi);
    mockVoteRules = await deployMockContract(owner, voteRulesArtifact.abi);

    const validationRulesFactory = await ethers.getContractFactory("ValidationRules");
    validationRules = await validationRulesFactory.deploy(10); // Assuming 10 for timeBetweenVotes
    await validationRules.waitForDeployment();

    const mockDependencies = {
      communityRulesAddress: await mockCommunityRules.getAddress(),
      regeneratorRulesAddress: await mockRegeneratorRules.getAddress(),
      voteRulesAddress: await mockVoteRules.getAddress(),
      inspectorRulesAddress: ethers.ZeroAddress,
      developerRulesAddress: ethers.ZeroAddress,
      researcherRulesAddress: ethers.ZeroAddress,
      contributorRulesAddress: ethers.ZeroAddress,
      activistRulesAddress: ethers.ZeroAddress,
    };
    await validationRules.setContractAddressDependencies(mockDependencies);

    await mockVoteRules.mock.canVote.returns(true);
    await mockCommunityRules.mock.userTypeIs.withArgs(userTypes.UNDEFINED, targetRegenerator.address).returns(false);
    await mockCommunityRules.mock.userTypeIs.withArgs(userTypes.DENIED, targetRegenerator.address).returns(false);
    await mockCommunityRules.mock.userTypeIs.withArgs(userTypes.REGENERATOR, targetRegenerator.address).returns(true);
    await mockRegeneratorRules.mock.poolCurrentEra.returns(1);
  });

  it("should REVERT when trying to validate an IMMUNE Regenerator (>= 5 inspections)", async () => {
    const mockRegeneratorData = [
      1, // id
      targetRegenerator.address, // regeneratorWallet
      "Immune Regenerator", // name
      "photo_hash", // proofPhoto
      1000, // totalArea
      false, // pendingInspection
      REGENERATOR_IMMUNITY_THRESHOLD, // totalInspections <--- THE TEST VALUE
      0, // lastRequestAt
      [0], // regenerationScore
      [false, 0], // pool
      0, // createdAt
      0, // coordinatesCount
    ];

    await mockRegeneratorRules.mock.getRegenerator.withArgs(targetRegenerator.address).returns(mockRegeneratorData);

    await expect(
      validationRules.connect(voter).addUserValidation(targetRegenerator.address, "justification")
    ).to.be.revertedWith("Regenerator has reached validation immunity");
  });

  it("should PASS when trying to validate a NON-IMMUNE Regenerator (< 5 inspections)", async function () {
    const mockRegeneratorDataAsArray = [
      1,
      targetRegenerator.address,
      "Vulnerable Regenerator",
      "photo_hash",
      1000,
      false,
      REGENERATOR_IMMUNITY_THRESHOLD - 1,
      0,
      [0],
      [false, 0],
      0,
      0,
    ];
    await mockRegeneratorRules.mock.getRegenerator
      .withArgs(targetRegenerator.address)
      .returns(mockRegeneratorDataAsArray);

    await mockCommunityRules.mock.getUser.withArgs(targetRegenerator.address).returns(userTypes.REGENERATOR);
    await mockCommunityRules.mock.votersCount.returns(100);

    await expect(validationRules.connect(voter).addUserValidation(targetRegenerator.address, "justification")).to.not.be
      .reverted;
  });
});
