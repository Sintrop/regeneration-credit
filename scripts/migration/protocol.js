/**
 * Deployment and configuration of the protocol for a migration, shared by the rehearsal and the production script.
 */
const hre = require("hardhat");
const { send } = require("./import");

const { ethers } = hre;

const POOL_HALVING = Number(process.env.POOL_HALVING || 12);

const POOLS = [
  "DeveloperPool",
  "InspectorPool",
  "RegeneratorPool",
  "ResearcherPool",
  "ContributorPool",
  "ActivistPool",
  "ValidationPool",
];

async function deploy(name, args) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  console.log(`  ${name} ${contract.target}`);
  return contract;
}

/**
 * Deploys the protocol with the v1 parameters read from the snapshot.
 * @param options.keepEraClock Use the v1 `deployedAt` of each pool (snapshot `meta.clocks`) instead of the deploy block.
 * @returns Contract name => ethers contract, connected to the deployer (migrator).
 */
async function deployProtocol(snapshot, options) {
  const s = (name) => snapshot.state[name].scalars;
  const settings = snapshot.state.CommunityRules.mappings.getUserTypeSettings;
  const proportionality = (type) => settings[type]?.proportionalityOnRegister ?? 0;
  const clocks = snapshot.meta.clocks;
  const deployedAt = (pool) => (options.keepEraClock ? clocks[pool].deployedAt : 0);
  const blocksPerEra = clocks.RegeneratorPool.blocksPerEra;

  const c = {};
  c.RegenerationCredit = await deploy("RegenerationCredit", [s("RegenerationCredit").totalSupply]);
  const token = c.RegenerationCredit.target;
  c.CommunityRules = await deploy("CommunityRules", [2, 6, 3, 4, 5].map(proportionality));
  const community = c.CommunityRules.target;
  for (const pool of POOLS) c[pool] = await deploy(pool, [token, POOL_HALVING, blocksPerEra, deployedAt(pool)]);
  const works = (name) => [s(name).timeBetweenWorks, s(name).maxPenalties, s(name).securityBlocksToValidation];
  c.DeveloperRules = await deploy("DeveloperRules", works("DeveloperRules"));
  c.InspectorRules = await deploy("InspectorRules", [
    community,
    c.InspectorPool.target,
    s("InspectorRules").maxPenalties,
  ]);
  c.RegeneratorRules = await deploy("RegeneratorRules", [community, c.RegeneratorPool.target]);
  c.ResearcherRules = await deploy("ResearcherRules", works("ResearcherRules"));
  c.ContributorRules = await deploy("ContributorRules", works("ContributorRules"));
  c.ValidationRules = await deploy("ValidationRules", [s("ValidationRules").timeBetweenVotes]);
  c.ActivistRules = await deploy("ActivistRules", [community, c.ActivistPool.target]);
  c.SupporterRules = await deploy("SupporterRules", [community, c.ResearcherRules.target, token]);
  c.InvitationRules = await deploy("InvitationRules", [
    community,
    c.ResearcherRules.target,
    c.DeveloperRules.target,
    c.ActivistRules.target,
    c.ContributorRules.target,
  ]);
  c.RegenerationIndexRules = await deploy("RegenerationIndexRules", []);
  const i = s("InspectionRules");
  c.InspectionRules = await deploy("InspectionRules", [
    i.timeBetweenInspections,
    i.blocksToExpireAcceptedInspection,
    i.allowedInitialRequests,
    i.acceptInspectionDelayBlocks,
    i.securityBlocksToValidation,
  ]);
  c.RegenerationCreditImpact = await deploy("RegenerationCreditImpact", [
    token,
    c.InspectionRules.target,
    c.RegeneratorRules.target,
  ]);
  c.VoteRules = await deploy("VoteRules", [
    community,
    c.ContributorRules.target,
    c.DeveloperRules.target,
    c.ResearcherRules.target,
  ]);
  // The market starts empty (v1 offers are not migrated). Deployed only when the contract exists in this checkout.
  if (await hre.artifacts.artifactExists("RegenerationCreditMarket")) {
    c.RegenerationCreditMarket = await deploy("RegenerationCreditMarket", [token, community]);
  }
  return c;
}

/**
 * Same configuration as migrations/after_deploy.js, without the initial invitations, transfers and ownership
 * renounce. The pools receive the v1 pool balances.
 */
async function configure(c, snapshot) {
  const t = (name) => c[name].target;
  const balances = snapshot.state.RegenerationCredit.mappings.balanceOf;
  const v1 = snapshot.meta.addresses;
  const tx = (label, promise) => send(label, promise);

  for (const pool of [
    "RegeneratorPool",
    "InspectorPool",
    "DeveloperPool",
    "ResearcherPool",
    "ContributorPool",
    "ActivistPool",
    "ValidationPool",
  ]) {
    await tx(`${pool} funded`, c.RegenerationCredit.addContractPool(t(pool), balances[v1[pool]] || 0));
  }

  await tx(
    "ValidationRules interfaces",
    c.ValidationRules.setContractInterfaces({
      communityRulesAddress: t("CommunityRules"),
      regeneratorRulesAddress: t("RegeneratorRules"),
      inspectorRulesAddress: t("InspectorRules"),
      developerRulesAddress: t("DeveloperRules"),
      researcherRulesAddress: t("ResearcherRules"),
      activistRulesAddress: t("ActivistRules"),
      contributorRulesAddress: t("ContributorRules"),
      voteRulesAddress: t("VoteRules"),
      validationPoolAddress: t("ValidationPool"),
    })
  );
  for (const name of ["ResearcherRules", "DeveloperRules", "ContributorRules", "InspectionRules"]) {
    await tx(`ValidationRules allows ${name}`, c.ValidationRules.newAllowedCaller(t(name)));
  }
  await tx(
    "InspectionRules interfaces",
    c.InspectionRules.setContractInterfaces({
      communityRulesAddress: t("CommunityRules"),
      regeneratorRulesAddress: t("RegeneratorRules"),
      validationRulesAddress: t("ValidationRules"),
      inspectorRulesAddress: t("InspectorRules"),
      activistRulesAddress: t("ActivistRules"),
      regenerationIndexRulesAddress: t("RegenerationIndexRules"),
      voteRulesAddress: t("VoteRules"),
    })
  );
  for (const [rules, pool, key] of [
    ["DeveloperRules", "DeveloperPool", "developerPoolAddress"],
    ["ContributorRules", "ContributorPool", "contributorPoolAddress"],
    ["ResearcherRules", "ResearcherPool", "researcherPoolAddress"],
  ]) {
    await tx(
      `${rules} interfaces`,
      c[rules].setContractInterfaces({
        communityRulesAddress: t("CommunityRules"),
        validationRulesAddress: t("ValidationRules"),
        [key]: t(pool),
        voteRulesAddress: t("VoteRules"),
      })
    );
    await tx(`${rules} allows ValidationRules`, c[rules].newAllowedCaller(t("ValidationRules")));
    await tx(`${rules} contract call`, c[rules].setContractCall(t("ValidationRules")));
  }
  for (const name of ["ActivistRules", "RegeneratorRules"]) {
    await tx(`${name} allows ValidationRules`, c[name].newAllowedCaller(t("ValidationRules")));
    await tx(`${name} allows InspectionRules`, c[name].newAllowedCaller(t("InspectionRules")));
    await tx(`${name} contract call`, c[name].setContractCall(t("InspectionRules"), t("ValidationRules")));
  }
  await tx("InspectorRules allows ValidationRules", c.InspectorRules.newAllowedCaller(t("ValidationRules")));
  await tx("InspectorRules allows InspectionRules", c.InspectorRules.newAllowedCaller(t("InspectionRules")));
  await tx("InspectorRules contract call", c.InspectorRules.setContractCall(t("InspectionRules")));
  for (const name of [
    "ActivistRules",
    "DeveloperRules",
    "InspectorRules",
    "RegeneratorRules",
    "ResearcherRules",
    "ContributorRules",
    "SupporterRules",
    "ValidationRules",
    "InvitationRules",
  ]) {
    await tx(`CommunityRules allows ${name}`, c.CommunityRules.newAllowedCaller(t(name)));
  }
  await tx(
    "CommunityRules contract call",
    c.CommunityRules.setContractCall(t("InvitationRules"), t("ValidationRules"))
  );
  for (const [pool, rules] of [
    ["ActivistPool", "ActivistRules"],
    ["ContributorPool", "ContributorRules"],
    ["DeveloperPool", "DeveloperRules"],
    ["ResearcherPool", "ResearcherRules"],
    ["InspectorPool", "InspectorRules"],
    ["RegeneratorPool", "RegeneratorRules"],
    ["ValidationPool", "ValidationRules"],
  ]) {
    await tx(`${pool} allows ${rules}`, c[pool].newAllowedCaller(t(rules)));
    await tx(`${pool} contract call`, c[pool].setContractCall(t(rules)));
  }
}

/**
 * Attaches the contracts of an existing deployment, connected to the default signer.
 * @param addresses Contract name => address.
 */
async function attachProtocol(addresses) {
  const c = {};
  for (const [name, address] of Object.entries(addresses)) c[name] = await ethers.getContractAt(name, address);
  return c;
}

/**
 * Throws if the migration is still open in any contract.
 */
async function checkMigrationClosed(contracts) {
  const open = [];
  for (const [name, contract] of Object.entries(contracts)) {
    if (!contract.interface.hasFunction("migrator")) continue;
    if ((await contract.migrator()) !== ethers.ZeroAddress) open.push(name);
  }
  if (open.length) throw new Error(`Migration still open in: ${open.join(", ")}`);
  console.log("Migration closed in every contract: migrator() == address(0)");
}

/**
 * Renounces the ownership of every Ownable contract, except the ones in `keep`.
 * @param keep Contract names that keep their owner.
 */
async function renounceOwnership(contracts, keep = new Set()) {
  for (const [name, contract] of Object.entries(contracts)) {
    if (keep.has(name) || !contract.interface.hasFunction("renounceOwnership")) continue;
    if ((await contract.owner()) === ethers.ZeroAddress) continue;
    await send(`${name} ownership renounced`, contract.renounceOwnership());
  }
}

module.exports = { deployProtocol, configure, attachProtocol, checkMigrationClosed, renounceOwnership };
