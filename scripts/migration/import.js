/**
 * Imports a v1 snapshot (see snapshot.js) into a new deployment.
 *
 * The new contracts must be deployed by the migrator account, with the token minted with the v1 `totalSupply`
 * and the pools funded with the v1 pool balances (`addContractPool`). This module writes the remaining state with
 * the migration functions and replays the v1 events, contract by contract, in their original order.
 */
const fs = require("fs");
const path = require("path");

const BATCH = Number(process.env.MIGRATION_BATCH || 25);
const LOGS_BATCH = Number(process.env.MIGRATION_LOGS_BATCH || 60);

// Events not replayed: ownership belongs to each deployment and token transfers are made again for real.
const NOT_REPLAYED = {
  "*": ["OwnershipTransferred"],
  RegenerationCredit: ["Transfer", "Approval"],
};

function loadSnapshot(dir) {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
  const snapshot = { meta: read("meta"), events: read("events"), state: {} };
  for (const name of Object.keys(snapshot.meta.addresses)) snapshot.state[name] = read(name);
  return snapshot;
}

const chunk = (items, size = BATCH) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const values = (mapping) => Object.values(mapping || {});
const byId = (a, b) => Number(a.id) - Number(b.id);
const pairs = (mapping) => Object.keys(mapping || {}).map((key) => key.split(":"));

async function send(label, promise) {
  const tx = await promise;
  await tx.wait();
  console.log(`  ${label}`);
}

async function importToken(token, s, ctx) {
  const pools = new Set(Object.keys(s.mappings.contractPool || {}));
  for (const [v1Holder, balance] of Object.entries(s.mappings.balanceOf || {})) {
    if (pools.has(v1Holder)) continue;
    // Tokens held by a v1 protocol contract go to the same contract of the new deployment.
    const holder = ctx.addressMap[v1Holder.toLowerCase()] ?? v1Holder;
    if (holder.toLowerCase() === ctx.migrator.toLowerCase()) continue;
    await send(`transfer ${holder}`, token.transfer(holder, balance));
  }
  const certificates = Object.entries(s.mappings.certificate || {});
  for (const part of chunk(certificates, 100)) {
    await send(
      "certificates",
      token.migrateCertificates(
        part.map(([account]) => account),
        part.map(([, amount]) => amount)
      )
    );
  }
}

async function importCommunity(community, s) {
  const users = Object.entries(s.mappings.getUser || {});
  const invitations = values(s.mappings.getInvitation);
  for (const part of chunk(users, 100)) {
    await send(
      "users",
      community.migrateUsers(
        part.map(([address]) => address),
        part.map(([, type]) => type),
        []
      )
    );
  }
  for (const part of chunk(invitations, 100)) await send("invitations", community.migrateUsers([], [], part));

  const count = (mapping) => Array.from({ length: 8 }, (_, i) => mapping?.[i] ?? "0");
  await send(
    "users count",
    community.migrateUsersCount(
      s.scalars.usersCount,
      count(s.mappings.userTypesCount),
      count(s.mappings.userTypesTotalCount)
    )
  );
}

async function importInvitation(invitation, s) {
  const inviters = [
    ...new Set([
      ...Object.keys(s.mappings.lastInviteBlocks || {}),
      ...Object.keys(s.mappings.lastInviteActivist || {}),
    ]),
  ];
  await send(
    "invite blocks",
    invitation.migrateInviteBlocks(
      inviters,
      inviters.map((address) => s.mappings.lastInviteBlocks?.[address] ?? "0"),
      inviters.map((address) => s.mappings.lastInviteActivist?.[address] ?? "0")
    )
  );
}

async function importRegenerators(rules, s) {
  for (const [address, regenerator] of Object.entries(s.mappings.getRegenerator || {})) {
    await send(
      `regenerator ${regenerator.id}`,
      rules.migrateRegenerator(
        regenerator,
        s.mappings.getCoordinates?.[address] || [],
        s.mappings.projectDescriptions?.[address] || "",
        s.mappings.areaPhoto?.[address] || "",
        s.mappings.impactRegenerators?.[address] || false,
        s.mappings.certifiedRegenerators?.[address] || false
      )
    );
  }
  const certifications = Object.entries(s.mappings.newCertificationRegenerators || {});
  await send(
    "regenerators totals",
    rules.migrateRegeneratorsTotals(
      s.scalars.totalCertifiedRegenerators,
      s.scalars.regenerationArea,
      certifications.map(([era]) => era),
      certifications.map(([, total]) => total),
      Object.keys(s.storage?.processedInspections || {})
    )
  );
}

async function importInspectors(rules, s) {
  for (const part of chunk(values(s.mappings.getInspector).sort(byId))) {
    await send("inspectors", rules.migrateInspectors(part));
  }
}

async function importInspections(rules, s) {
  for (const part of chunk(values(s.mappings.getInspection).sort(byId))) {
    await send(`inspections from ${part[0].id}`, rules.migrateInspections(part));
  }
  const histories = Object.entries(s.mappings.getInspectionsHistory || {});
  for (const part of chunk(histories, 50)) {
    await send(
      "inspections history",
      rules.migrateInspectionsHistory(
        part.map(([regenerator]) => regenerator),
        part.map(([, ids]) => ids)
      )
    );
  }
  for (const part of chunk(pairs(s.storage?.inspectorInspected), 200)) {
    await send(
      "inspector inspected",
      rules.migrateInspectorInspected(
        part.map(([inspector]) => inspector),
        part.map(([, regenerator]) => regenerator)
      )
    );
  }
  const impacts = Object.entries(s.mappings.impactPerEra || {});
  const c = s.scalars;
  await send(
    "inspections totals",
    rules.migrateInspectionsTotals(
      [
        c.inspectionsCount,
        c.inspectionsTotalCount,
        c.realizedInspectionsCount,
        c.inspectionsTreesImpact,
        c.inspectionsBiodiversityImpact,
        c.totalImpactRegenerators,
        c.lastSettledEra,
      ],
      impacts.map(([era]) => era),
      impacts.map(([, impact]) => impact)
    )
  );
}

async function importActivists(rules, s) {
  for (const part of chunk(values(s.mappings.getActivist).sort(byId))) {
    await send("activists", rules.migrateActivists(part));
  }
  const won = pairs(s.storage?.activistWonLevel);
  await send(
    "activists totals",
    rules.migrateActivistsTotals(
      s.scalars.approvedInvites,
      s.scalars.totalActiveLevels,
      won.map(([inviter]) => inviter),
      won.map(([, invited]) => invited)
    )
  );
}

async function importResearchers(rules, s) {
  for (const part of chunk(values(s.mappings.getResearcher).sort(byId))) {
    await send("researchers", rules.migrateResearchers(part));
  }
  for (const part of chunk(values(s.mappings.getResearch).sort(byId))) {
    await send("researches", rules.migrateResearches(part, [], []));
  }
  await send(
    "calculator items and methods",
    rules.migrateResearches(
      [],
      values(s.mappings.getCalculatorItem).sort(byId),
      values(s.mappings.evaluationMethods).sort(byId)
    )
  );
  const c = s.scalars;
  await send(
    "researchers totals",
    rules.migrateResearchersTotals([
      c.researchesCount,
      c.researchesTotalCount,
      c.calculatorItemsCount,
      c.evaluationMethodsCount,
      c.totalActiveLevels,
    ])
  );
}

async function importDevelopers(rules, s) {
  await send("developers", rules.migrateDevelopers(values(s.mappings.getDeveloper).sort(byId), []));
  for (const part of chunk(values(s.mappings.getReport).sort(byId))) {
    await send("reports", rules.migrateDevelopers([], part));
  }
  const c = s.scalars;
  await send(
    "developers totals",
    rules.migrateDevelopersTotals(c.reportsCount, c.reportsTotalCount, c.totalActiveLevels)
  );
}

async function importContributors(rules, s) {
  await send("contributors", rules.migrateContributors(values(s.mappings.getContributor).sort(byId), []));
  for (const part of chunk(values(s.mappings.getContribution).sort(byId))) {
    await send("contributions", rules.migrateContributors([], part));
  }
  const c = s.scalars;
  await send(
    "contributors totals",
    rules.migrateContributorsTotals(c.contributionsCount, c.contributionsTotalCount, c.totalActiveLevels)
  );
}

async function importSupporters(rules, s) {
  const supporters = values(s.mappings.getSupporter).sort(byId);
  for (const part of chunk(supporters)) {
    await send(
      "supporters",
      rules.migrateSupporters(
        part,
        part.map((supporter) => s.mappings.getReductionCommitments?.[supporter.supporterWallet] || [])
      )
    );
  }
  const offsets = Object.entries(s.mappings.offsets || {}).sort(([a], [b]) => Number(a) - Number(b));
  const certificates = Object.entries(s.mappings.calculatorItemCertificates || {}).map(([key, amount]) => [
    ...key.split(":"),
    amount,
  ]);
  for (const part of chunk(offsets, 50)) {
    for (let i = 1; i < part.length; i++) {
      if (Number(part[i][0]) !== Number(part[i - 1][0]) + 1) throw new Error("Offsets ids are not sequential");
    }
    await send(
      `offsets from ${part[0][0]}`,
      rules.migrateOffsets(
        s.scalars.offsetsCount,
        part[0][0],
        part.map(([, offset]) => offset),
        [],
        [],
        []
      )
    );
  }
  await send(
    "calculator item certificates",
    rules.migrateOffsets(
      s.scalars.offsetsCount,
      1,
      [],
      certificates.map(([address]) => address),
      certificates.map(([, itemId]) => itemId),
      certificates.map(([, , amount]) => amount)
    )
  );
}

const IMPORTERS = {
  RegenerationCredit: importToken,
  CommunityRules: importCommunity,
  InvitationRules: importInvitation,
  RegeneratorRules: importRegenerators,
  InspectorRules: importInspectors,
  InspectionRules: importInspections,
  ActivistRules: importActivists,
  ResearcherRules: importResearchers,
  DeveloperRules: importDevelopers,
  ContributorRules: importContributors,
  SupporterRules: importSupporters,
};

async function replayLogs(name, contract, events) {
  const skip = new Set([...NOT_REPLAYED["*"], ...(NOT_REPLAYED[name] || [])]);
  const logs = events
    .filter((event) => event.contract === name && !skip.has(event.event))
    .map((event) => ({ topics: event.topics, data: event.data }));
  for (const part of chunk(logs, LOGS_BATCH)) await send(`${name} ${part.length} logs`, contract.migrateLogs(part));
  return logs.length;
}

/**
 * @param snapshot Result of loadSnapshot.
 * @param contracts Contract name => ethers contract of the new deployment, connected to the migrator.
 * @param options.importers Importers by contract name, merged over the common ones.
 */
async function importSnapshot(snapshot, contracts, options = {}) {
  const migrator = await contracts.RegenerationCredit.runner.getAddress();
  const importers = { ...IMPORTERS, ...(options.importers || {}) };
  const addressMap = {};
  for (const [name, address] of Object.entries(snapshot.meta.addresses)) {
    addressMap[address.toLowerCase()] = contracts[name].target;
  }
  const ctx = { migrator, addressMap, meta: snapshot.meta };

  for (const [name, importer] of Object.entries(importers)) {
    console.log(`Importing ${name}...`);
    await importer(contracts[name], snapshot.state[name], ctx);
  }
  for (const name of Object.keys(importers)) {
    console.log(`Replaying ${name} events...`);
    await replayLogs(name, contracts[name], snapshot.events);
  }
}

/**
 * Disables the migration functions of every contract. Irreversible.
 * @param contracts Contract name => ethers contract, connected to the migrator.
 */
async function closeMigration(contracts) {
  for (const [name, contract] of Object.entries(contracts)) {
    if (!contract.interface.hasFunction("closeMigration")) continue;
    await send(`${name} migration closed`, contract.closeMigration());
  }
}

module.exports = { loadSnapshot, importSnapshot, closeMigration, replayLogs, chunk, send, NOT_REPLAYED };
