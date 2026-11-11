/**
 * Snapshot of the v1 protocol state at a single block.
 *
 * Every read is pinned to the same block (SNAPSHOT_BLOCK, default: latest - 2), so the result is a consistent
 * picture of all contracts. Public getters are read through the ABI, and private mappings without getters are
 * read directly from storage using the compiler storage layout.
 *
 * Output (SNAPSHOT_OUT_DIR/v1-<block>/):
 * - meta.json: block, chain and contract addresses, plus the era clock (`deployedAt`) of every Blockable contract.
 * - events.json: every event emitted by the protocol contracts up to the snapshot block, in chain order.
 * - <Contract>.json: state of each contract. Mapping entries with default values (0, false, empty) are omitted.
 *
 * Usage: npx hardhat run scripts/migration/snapshot.js
 * Run it from a checkout whose contracts match the deployed ones (private mappings are read with the local storage
 * layout).
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const { ethers } = hre;

const RPC_URL = process.env.SNAPSHOT_RPC_URL || "https://rpc.sintrop.com";
const OUT_DIR = process.env.SNAPSHOT_OUT_DIR || path.join(__dirname, "../../migration/snapshots");
const CONCURRENCY = Number(process.env.SNAPSHOT_CONCURRENCY || 200);
const V1_ADDRESSES = require("./v1-mainnet-addresses.json");

const USER_TYPES = [0, 1, 2, 3, 4, 5, 6, 7];
const POOLS = [
  "ActivistPool",
  "ContributorPool",
  "DeveloperPool",
  "InspectorPool",
  "RegeneratorPool",
  "ResearcherPool",
  "ValidationPool",
];

// Functions that only compute values from their arguments or constants (no state to snapshot).
const SKIP = new Set([
  "canInvite",
  "canWithdraw",
  "canWithdrawTimes",
  "getEpochForEra",
  "nextEraIn",
  "tokensPerEpoch",
  "tokensPerEra",
  "haveTokensToWithdraw",
  "calculateScore",
  "calculateBlocksToExpire",
  "acceptInspectionDelayBlocksPassed",
  "waitToRequest",
  "regenerationIndex",
]);

// Getters of arrays inside mappings: (address, index), read until the index is out of bounds.
const ADDRESS_ARRAYS = new Set([
  "penalties",
  "contributionsIds",
  "reportsIds",
  "researchesIds",
  "coordinates",
  "reductionCommitments",
]);

// Getters keyed by (address, era).
const ADDRESS_ERA = new Set(["userValidations", "hunterVoter", "getUserValidations"]);

// Getters keyed by (era, address).
const ERA_ADDRESS = new Set(["eraLevels", "eraTokens", "hasWithdrawn"]);

let provider;
let snapshotBlock;
let ADDRESSES;

// --- Helpers ---

const isFatal = (error) => {
  const message = `${error?.message} ${error?.info?.error?.message} ${error?.error?.message}`;
  return /missing trie node|not available|header not found|timeout|ECONNRESET|\b429\b|rate limit/i.test(message);
};

async function call(contract, fn, args = []) {
  for (let attempt = 0; ; attempt++) {
    try {
      return { ok: true, value: await contract.getFunction(fn).staticCall(...args, { blockTag: snapshotBlock }) };
    } catch (error) {
      if (!isFatal(error)) return { ok: false };
      if (/missing trie node|not available|header not found/i.test(error?.info?.error?.message || error.message)) {
        throw new Error(`State of block ${snapshotBlock} is no longer available on the node. Run the snapshot again.`);
      }
      if (attempt >= 5) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

async function parallel(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
  return results;
}

function normalize(value, type) {
  if (type.baseType === "tuple") {
    const out = {};
    type.components.forEach((component, i) => {
      out[component.name || String(i)] = normalize(value[i], component);
    });
    return out;
  }
  if (type.baseType === "array") return Array.from(value).map((item) => normalize(item, type.arrayChildren));
  if (typeof value === "bigint") return value.toString();
  return value;
}

function normalizeOutputs(contract, fn, value) {
  const outputs = contract.interface.getFunction(fn).outputs;
  if (outputs.length === 1) return normalize(value, outputs[0]);
  const out = {};
  outputs.forEach((output, i) => {
    out[output.name || String(i)] = normalize(value[i], output);
  });
  return out;
}

function isDefault(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.values(value).every(isDefault);
  return value === "0" || value === false || value === "" || value === ethers.ZeroAddress || /^0x0*$/.test(value);
}

function collectAddresses(value, set) {
  if (typeof value === "string" && ethers.isAddress(value) && value !== ethers.ZeroAddress) {
    set.add(ethers.getAddress(value));
  } else if (Array.isArray(value)) value.forEach((item) => collectAddresses(item, set));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectAddresses(item, set));
}

function viewFunctions(contract) {
  return contract.interface.fragments.filter(
    (f) => f.type === "function" && (f.stateMutability === "view" || f.stateMutability === "pure") && !SKIP.has(f.name)
  );
}

const inputsOf = (fragment) => fragment.inputs.map((input) => input.type).join(",");

// --- Storage layout (private mappings without getters) ---

async function compileWithStorageLayout() {
  for (const compiler of hre.config.solidity.compilers) {
    const selection = compiler.settings.outputSelection["*"]["*"];
    if (!selection.includes("storageLayout")) selection.push("storageLayout");
  }
  await hre.run("compile", { force: true, quiet: true });
}

async function storageSlot(contractName, variable) {
  const buildInfo = await hre.artifacts.getBuildInfo(`contracts/${contractName}.sol:${contractName}`);
  const layout = buildInfo.output.contracts[`contracts/${contractName}.sol`][contractName].storageLayout;
  const entry = layout.storage.find((item) => item.label === variable);
  if (!entry) throw new Error(`Storage variable ${contractName}.${variable} not found`);
  return BigInt(entry.slot);
}

const coder = ethers.AbiCoder.defaultAbiCoder();
const mappingSlot = (keyType, key, slot) => BigInt(ethers.keccak256(coder.encode([keyType, "uint256"], [key, slot])));

async function readBool(address, slot) {
  for (let attempt = 0; ; attempt++) {
    try {
      const word = await provider.getStorage(address, slot, snapshotBlock);
      return (BigInt(word) & 0xffn) !== 0n;
    } catch (error) {
      if (attempt >= 5) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

async function readNestedBools(contractName, variable, keyTypes, keys) {
  const base = await storageSlot(contractName, variable);
  const out = {};
  await parallel(keys, async ([k1, k2]) => {
    const slot = mappingSlot(keyTypes[1], k2, mappingSlot(keyTypes[0], k1, base));
    if (await readBool(ADDRESSES[contractName], slot)) out[`${k1}:${k2}`] = true;
  });
  return out;
}

async function readBools(contractName, variable, keyType, keys) {
  const base = await storageSlot(contractName, variable);
  const out = {};
  await parallel(keys, async (key) => {
    if (await readBool(ADDRESSES[contractName], mappingSlot(keyType, key, base))) out[key] = true;
  });
  return out;
}

// --- Events ---

async function readEvents(contracts) {
  const events = [];
  for (const [name, contract] of Object.entries(contracts)) {
    const logs = await provider.getLogs({ address: ADDRESSES[name], fromBlock: 0, toBlock: snapshotBlock });
    for (const log of logs) {
      let parsed = null;
      try {
        parsed = contract.interface.parseLog(log);
      } catch (error) {
        parsed = null;
      }
      const args = {};
      if (parsed) {
        parsed.fragment.inputs.forEach((input, i) => {
          args[input.name || String(i)] = normalize(parsed.args[i], input);
        });
      }
      events.push({
        contract: name,
        event: parsed ? parsed.name : null,
        args,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
        logIndex: log.index,
        topics: log.topics,
        data: log.data,
      });
    }
  }
  events.sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);

  // Old transactions are not indexed by hash on every node, so senders are read from the full blocks.
  const blocks = [...new Set(events.map((event) => event.blockNumber))];
  const timestamps = {};
  const senders = {};
  await parallel(blocks, async (number) => {
    const fullBlock = await provider.getBlock(number, true);
    timestamps[number] = fullBlock.timestamp;
    for (const transaction of fullBlock.prefetchedTransactions) senders[transaction.hash] = transaction.from;
  });
  for (const event of events) {
    event.from = senders[event.transactionHash];
    event.timestamp = timestamps[event.blockNumber];
  }
  return events;
}

// --- Contract state ---

async function readScalars(contract) {
  const out = {};
  for (const fragment of viewFunctions(contract).filter((f) => f.inputs.length === 0)) {
    const result = await call(contract, fragment.name);
    if (result.ok) out[fragment.name] = normalizeOutputs(contract, fragment.name, result.value);
  }
  return out;
}

async function readKeyed(contract, fn, keys, toArgs = (key) => [key]) {
  const out = {};
  await parallel(keys, async (key) => {
    const result = await call(contract, fn, toArgs(key));
    if (!result.ok) return;
    const value = normalizeOutputs(contract, fn, result.value);
    if (!isDefault(value)) out[Array.isArray(key) ? key.join(":") : key] = value;
  });
  return out;
}

async function readArray(contract, fn, address) {
  const items = [];
  for (let i = 0; ; i++) {
    const result = await call(contract, fn, [address, i]);
    if (!result.ok) return items;
    items.push(normalizeOutputs(contract, fn, result.value));
  }
}

async function readContract(name, contract, ctx) {
  const state = { address: ADDRESSES[name], scalars: await readScalars(contract), mappings: {} };
  const { addresses, eras } = ctx;
  const count = (key) => Number(state.scalars[key] ?? 0);
  const range = (from, to) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

  for (const fragment of viewFunctions(contract).filter((f) => f.inputs.length > 0)) {
    const fn = fragment.name;
    const inputs = inputsOf(fragment);
    let keys = null;
    let toArgs;

    if (inputs === "address") keys = addresses;
    else if (inputs === "address,address" && fn === "allowance") keys = ctx.approvals;
    else if (inputs === "uint8") keys = USER_TYPES;
    else if (inputs.startsWith("address,uint") && ADDRESS_ARRAYS.has(fn)) {
      const out = {};
      await parallel(addresses, async (address) => {
        const items = await readArray(contract, fn, address);
        if (items.length) out[address] = items;
      });
      state.mappings[fn] = out;
      continue;
    } else if (inputs.startsWith("address,uint") && ADDRESS_ERA.has(fn)) {
      keys = addresses.flatMap((address) => eras.map((era) => [address, era]));
    } else if (
      inputs.startsWith("address,uint") &&
      (fn === "calculatorItemCertificates" || fn === "declaredReduction")
    ) {
      keys = addresses.flatMap((address) => ctx.calculatorItemIds.map((id) => [address, id]));
    } else if (inputs.startsWith("uint256,address") && ERA_ADDRESS.has(fn)) {
      keys = eras.flatMap((era) => ctx.poolUsers[name].map((address) => [era, address]));
    } else if (fn === "eras" || fn === "getEra" || fn === "impactPerEra" || fn === "newCertificationRegenerators") {
      keys = eras;
    } else if (fn === "hasProcessedLevel") {
      keys = inputs === "bytes32" ? ctx.activistEventIds : inputs === "address" ? addresses : ctx.poolIds[name];
    } else if (fn === "getInspection" || fn === "inspectionPenalized") keys = range(1, count("inspectionsTotalCount"));
    else if (fn === "getResearch" || fn === "researches" || fn === "researchPenalized") {
      keys = range(1, count("researchesTotalCount"));
    } else if (fn === "getCalculatorItem" || fn === "calculatorItems") keys = range(0, count("calculatorItemsCount"));
    else if (fn === "evaluationMethods") keys = range(0, count("evaluationMethodsCount"));
    else if (fn === "getReport" || fn === "reports" || fn === "reportPenalized")
      keys = range(1, count("reportsTotalCount"));
    else if (fn === "getContribution" || fn === "contributions" || fn === "contributionPenalized") {
      keys = range(1, count("contributionsTotalCount"));
    } else if (fn === "offsets") keys = range(0, count("offsetsCount"));
    else if (fn === "delationsById") keys = range(0, count("delationsCount"));
    else if (/Address$|^supportersAddress$/.test(fn) && inputs === "uint256") keys = range(0, ctx.maxUsersPerType);
    else if (fn === "categories" || fn === "getCategoryRegenerationIndexDescription") keys = range(0, 10);

    if (!keys) {
      state.skipped = [...(state.skipped || []), `${fn}(${inputs})`];
      continue;
    }
    state.mappings[fn] = await readKeyed(contract, fn, keys, toArgs || ((key) => (Array.isArray(key) ? key : [key])));
  }
  return state;
}

// --- Snapshot ---

/**
 * Reads the protocol state at one block.
 * @param options.provider Provider of the chain to read.
 * @param options.addresses Contract name => address.
 * @param options.block Block to read. Default: latest - 2.
 * @param options.extraAddresses Addresses to read besides the ones found in the events.
 * @param options.checkCreationBlock Require each pool era clock to start at its creation block.
 * @returns { meta, events, state }
 */
async function takeSnapshot(options) {
  provider = options.provider;
  ADDRESSES = options.addresses;
  const network = await provider.getNetwork();
  const latest = await provider.getBlockNumber();
  snapshotBlock = Number(options.block ?? latest - 2);
  const block = await provider.getBlock(snapshotBlock);
  console.log(`Snapshot of chain ${network.chainId} at block ${snapshotBlock}`);

  await compileWithStorageLayout();

  const contracts = {};
  for (const name of Object.keys(ADDRESSES)) {
    const artifact = await hre.artifacts.readArtifact(name);
    contracts[name] = new ethers.Contract(ADDRESSES[name], artifact.abi, provider);
    const code = await provider.getCode(ADDRESSES[name], snapshotBlock);
    const expected = artifact.deployedBytecode;
    if (code.length !== expected.length) {
      console.warn(`Warning: ${name} on-chain bytecode size differs from the compiled artifact`);
    }
  }

  console.log("Reading events...");
  const events = await readEvents(contracts);
  console.log(`  ${events.length} events`);

  const addressSet = new Set(Object.values(ADDRESSES).map((address) => ethers.getAddress(address)));
  for (const event of events) {
    collectAddresses(event.args, addressSet);
    addressSet.add(ethers.getAddress(event.from));
  }
  for (const address of options.extraAddresses || []) addressSet.add(ethers.getAddress(address));
  for (const contract of Object.values(contracts)) {
    const owner = await call(contract, "owner");
    if (owner.ok && owner.value !== ethers.ZeroAddress) addressSet.add(ethers.getAddress(owner.value));
  }
  const addresses = [...addressSet].sort();
  console.log(`  ${addresses.length} addresses`);

  // Era clock of each Blockable contract: deployedAt = snapshotBlock + nextEraIn(1) - blocksPerEra.
  const clocks = {};
  for (const name of POOLS) {
    const first = BigInt((await call(contracts[name], "nextEraIn", [1])).value);
    const second = BigInt((await call(contracts[name], "nextEraIn", [2])).value);
    const blocksPerEra = second - first;
    const deployedAt = BigInt(snapshotBlock) + first - blocksPerEra;
    const currentEra = Number((await call(contracts[name], "currentContractEra")).value);
    const firstEvent = events.find((event) => event.contract === name);
    clocks[name] = {
      deployedAt: deployedAt.toString(),
      blocksPerEra: blocksPerEra.toString(),
      currentEra,
      creationBlock: firstEvent ? firstEvent.blockNumber : null,
    };
    if (options.checkCreationBlock !== false && firstEvent && BigInt(firstEvent.blockNumber) !== deployedAt) {
      throw new Error(`${name}: deployedAt ${deployedAt} does not match the creation block ${firstEvent.blockNumber}`);
    }
  }
  const maxEra = Math.max(...Object.values(clocks).map((clock) => clock.currentEra));
  const eras = Array.from({ length: maxEra + 1 }, (_, i) => i + 1);

  const community = contracts.CommunityRules;
  const userTypesTotal = await Promise.all(
    USER_TYPES.map(async (type) => Number((await call(community, "userTypesTotalCount", [type])).value))
  );
  const userTypes = {};
  await parallel(addresses, async (address) => {
    userTypes[address] = Number((await call(community, "getUser", [address])).value);
  });
  const usersOfType = (type) => addresses.filter((address) => userTypes[address] === type);
  const regenerators = usersOfType(1);
  const inspectors = usersOfType(2);

  const invitationOf = async (address) => (await call(community, "getInvitation", [address])).value.inviter;
  const activistPairs = [];
  for (const user of [...regenerators, ...inspectors]) activistPairs.push([await invitationOf(user), user]);
  const activistEventIds = activistPairs.flatMap(([activist, user]) => [
    ethers.solidityPackedKeccak256(["string", "address", "address"], ["activist_reward_regenerator", activist, user]),
    ethers.solidityPackedKeccak256(["string", "address", "address"], ["activist_reward_inspector", activist, user]),
  ]);

  const total = async (name, fn) => Number((await call(contracts[name], fn)).value);
  const ids = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const inspectionsTotal = await total("InspectionRules", "inspectionsTotalCount");
  const poolIds = {
    InspectorPool: ids(inspectionsTotal),
    RegeneratorPool: ids(inspectionsTotal),
    DeveloperPool: ids(await total("DeveloperRules", "reportsTotalCount")),
    ContributorPool: ids(await total("ContributorRules", "contributionsTotalCount")),
    ResearcherPool: ids(await total("ResearcherRules", "researchesTotalCount")),
  };
  const calculatorItemIds = Array.from(
    { length: (await total("ResearcherRules", "calculatorItemsCount")) + 1 },
    (_, i) => i
  );
  const approvals = [
    ...new Set(
      events
        .filter((event) => event.contract === "RegenerationCredit" && event.event === "Approval")
        .map((event) => `${event.args.owner}:${event.args.spender}`)
    ),
  ].map((pair) => pair.split(":"));

  // Pool levels and withdrawals are only written for users of the pool's type (hunters for the ValidationPool).
  const voterTypes = new Set([1, 2, 3, 4, 5]);
  const poolUsers = {
    RegeneratorPool: usersOfType(1),
    InspectorPool: inspectors,
    ResearcherPool: usersOfType(3),
    DeveloperPool: usersOfType(4),
    ContributorPool: usersOfType(5),
    ActivistPool: usersOfType(6),
    ValidationPool: addresses.filter((address) => voterTypes.has(userTypes[address])),
  };

  const ctx = {
    poolUsers,
    addresses,
    eras,
    approvals,
    activistEventIds,
    poolIds,
    calculatorItemIds,
    maxUsersPerType: Math.max(...userTypesTotal),
  };

  const state = {};
  for (const [name, contract] of Object.entries(contracts)) {
    const start = Date.now();
    state[name] = await readContract(name, contract, ctx);
    console.log(`  ${name} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  }

  console.log("Reading private mappings from storage...");
  const voters = addresses.filter((address) => state.CommunityRules.mappings.isVoter?.[address]);
  const storage = {
    ActivistRules: {
      activistWonLevel: await readNestedBools(
        "ActivistRules",
        "activistWonLevel",
        ["address", "address"],
        activistPairs
      ),
    },
    InspectionRules: {
      inspectorInspected: await readNestedBools(
        "InspectionRules",
        "inspectorInspected",
        ["address", "address"],
        inspectors.flatMap((inspector) => regenerators.map((regenerator) => [inspector, regenerator]))
      ),
      validatorInspectionsValidations: await readNestedBools(
        "InspectionRules",
        "validatorInspectionsValidations",
        ["address", "uint256"],
        voters.flatMap((voter) => ids(inspectionsTotal).map((id) => [voter, id]))
      ),
    },
    RegeneratorRules: {
      processedInspections: await readBools(
        "RegeneratorRules",
        "processedInspections",
        "uint64",
        ids(inspectionsTotal)
      ),
    },
    ResearcherRules: {
      hasVotedOnResearch: await readNestedBools(
        "ResearcherRules",
        "hasVotedOnResearch",
        ["uint64", "address"],
        poolIds.ResearcherPool.flatMap((id) => voters.map((voter) => [id, voter]))
      ),
    },
    DeveloperRules: {
      hasVotedOnReport: await readNestedBools(
        "DeveloperRules",
        "hasVotedOnReport",
        ["uint64", "address"],
        poolIds.DeveloperPool.flatMap((id) => voters.map((voter) => [id, voter]))
      ),
    },
    ContributorRules: {
      hasVotedOnContribution: await readNestedBools(
        "ContributorRules",
        "hasVotedOnContribution",
        ["uint64", "address"],
        poolIds.ContributorPool.flatMap((id) => voters.map((voter) => [id, voter]))
      ),
    },
  };
  for (const [name, variables] of Object.entries(storage)) state[name].storage = variables;

  // Mappings only written by delations and hunter validations, read only when those features were used.
  const delations = Number(state.CommunityRules.scalars.delationsCount);
  const validations = events.filter(
    (event) => event.contract === "ValidationRules" && event.event !== "OwnershipTransferred"
  );
  if (delations > 0 || validations.length > 0) {
    throw new Error(
      "Delations or validations exist: extend the snapshot to _hasDelated, _hasVotedOnDelation and validatorUsersValidations"
    );
  }

  const latestAfter = await provider.getBlockNumber();
  const meta = {
    chainId: network.chainId.toString(),
    snapshotBlock,
    snapshotBlockHash: block.hash,
    snapshotTimestamp: block.timestamp,
    latestBlockAtStart: latest,
    latestBlockAtEnd: latestAfter,
    addresses: ADDRESSES,
    clocks,
    addressList: addresses,
    counts: {
      events: events.length,
      addresses: addresses.length,
      userTypesTotalCount: Object.fromEntries(USER_TYPES.map((type, i) => [type, userTypesTotal[i]])),
    },
  };

  return { meta, events, state };
}

function writeSnapshot(dir, { meta, events, state }) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "events.json"), JSON.stringify(events, null, 2) + "\n");
  for (const [name, contractState] of Object.entries(state)) {
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(contractState, null, 2) + "\n");
  }
}

// --- Main ---

async function main() {
  const snapshot = await takeSnapshot({
    provider: new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true }),
    addresses: V1_ADDRESSES,
    block: process.env.SNAPSHOT_BLOCK,
  });
  const dir = path.join(OUT_DIR, `v1-${snapshot.meta.snapshotBlock}`);
  writeSnapshot(dir, snapshot);
  console.log(`Snapshot saved to ${dir}`);
}

module.exports = { takeSnapshot, writeSnapshot };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
