// test/ValidationRules.Immunity.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockContract } = require("@clrfund/waffle-mock-contract");

// We need the UserType enum for our tests
const userTypes = {
  REGENERATOR: 1, // Assuming Regenerator is enum value 1. Adjust if necessary.
  DENIED: 8,
  UNDEFINED: 0,
};

describe("ValidationRules - Regenerator Immunity Logic", () => {
  let validationRules; // The contract we are testing
  let mockCommunityRules, mockRegeneratorRules, mockVoteRules;
  let owner, voter, targetRegenerator;

  const REGENERATOR_IMMUNITY_THRESHOLD = 5;

  // This setup is clean and only contains what's needed for THIS test.
  beforeEach(async () => {
    [owner, voter, targetRegenerator] = await ethers.getSigners();

    // 1. We get the ABIs of the contracts we need to mock
    const communityRulesArtifact = await artifacts.readArtifact("ICommunityRules");
    const regeneratorRulesArtifact = await artifacts.readArtifact("IRegeneratorRules");
    const voteRulesArtifact = await artifacts.readArtifact("IVoteRules");

    // 2. We deploy our mocks
    mockCommunityRules = await deployMockContract(owner, communityRulesArtifact.abi);
    mockRegeneratorRules = await deployMockContract(owner, regeneratorRulesArtifact.abi);
    mockVoteRules = await deployMockContract(owner, voteRulesArtifact.abi);

    // 3. We deploy the real contract under test
    const validationRulesFactory = await ethers.getContractFactory("ValidationRules");
    validationRules = await validationRulesFactory.deploy(10); // Assuming 10 for timeBetweenVotes
    await validationRules.waitForDeployment();

    // 4. We set its dependencies using the MOCK addresses
    // Assuming a simplified dependency setter for this test
    // You might need to create the full ContractsDependency struct here
    const mockDependencies = {
      communityRulesAddress: await mockCommunityRules.getAddress(),
      regeneratorRulesAddress: await mockRegeneratorRules.getAddress(),
      voteRulesAddress: await mockVoteRules.getAddress(),
      // Set other addresses to ZeroAddress as they are not used in this flow
      inspectorRulesAddress: ethers.ZeroAddress,
      developerRulesAddress: ethers.ZeroAddress,
      researcherRulesAddress: ethers.ZeroAddress,
      contributorRulesAddress: ethers.ZeroAddress,
      activistRulesAddress: ethers.ZeroAddress,
    };
    await validationRules.setContractAddressDependencies(mockDependencies);

    // 5. We set up the default behavior for the mocks to allow the transaction to proceed
    await mockVoteRules.mock.canVote.returns(true);
    await mockCommunityRules.mock.userTypeIs.withArgs(userTypes.UNDEFINED, targetRegenerator.address).returns(false);
    await mockCommunityRules.mock.userTypeIs.withArgs(userTypes.DENIED, targetRegenerator.address).returns(false);
    await mockCommunityRules.mock.userTypeIs.withArgs(userTypes.REGENERATOR, targetRegenerator.address).returns(true);
    // Let's also mock the _userCurrentEra dependency
    await mockRegeneratorRules.mock.poolCurrentEra.returns(1);
  });

  it("should REVERT when trying to validate an IMMUNE Regenerator (>= 4 inspections)", async () => {
    // --- SETUP ---
    // Create the mock data as an ARRAY that perfectly matches the Regenerator struct
    // The only important value here is `totalInspections`.
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

    // Tell the mock to return this data when `getRegenerator` is called
    await mockRegeneratorRules.mock.getRegenerator.withArgs(targetRegenerator.address).returns(mockRegeneratorData);

    // --- ACTION & ASSERTION ---
    await expect(
      validationRules.connect(voter).addUserValidation(targetRegenerator.address, "justification")
    ).to.be.revertedWith("Regenerator has reached validation immunity");
  });

  // Find this specific `it` block in your test file and add the new line.
  it("should PASS when trying to validate a NON-IMMUNE Regenerator (< 4 inspections)", async function () {
    // --- SETUP ---
    // This part is correct
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

    // This part is also correct
    await mockCommunityRules.mock.getUser.withArgs(targetRegenerator.address).returns(userTypes.REGENERATOR);

    // --- THIS IS THE FIX ---
    // We must also tell the mock how to handle the `votersCount` call,
    // which happens later in the function's execution path.
    // We can make it return any reasonable number.
    await mockCommunityRules.mock.votersCount.returns(100);

    // --- ACTION & ASSERTION ---
    // Now that all external calls within the "happy path" are mocked,
    // the transaction should succeed.
    await expect(validationRules.connect(voter).addUserValidation(targetRegenerator.address, "justification")).to.not.be
      .reverted;
  });
});
