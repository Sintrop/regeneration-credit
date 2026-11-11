/**
 * Comparison of a new deployment with the v1 snapshot, shared by the rehearsal and the production script.
 */
const hre = require("hardhat");
const { NOT_REPLAYED } = require("./import");
const { takeSnapshot } = require("./snapshot");

const { ethers } = hre;

// Values that legitimately differ between deployments.
const IGNORED_SCALARS = new Set(["owner", "migrator"]);

function replaceAddresses(value, map) {
  if (typeof value === "string") return map[value.toLowerCase()] ?? value;
  if (Array.isArray(value)) return value.map((item) => replaceAddresses(item, map));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key
          .split(":")
          .map((part) => map[part.toLowerCase()] ?? part)
          .join(":"),
        replaceAddresses(item, map),
      ])
    );
  }
  return value;
}

function diff(expected, actual, prefix, out) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return;
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (isObject(expected) && isObject(actual)) {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      diff(expected[key], actual[key], `${prefix}.${key}`, out);
    }
    return;
  }
  out.push({ path: prefix, expected, actual });
}

function compareState(v1, v2, map, options) {
  const report = {};
  for (const name of Object.keys(v1.state)) {
    if (options.skipContracts.has(name)) continue;
    const expected = replaceAddresses(v1.state[name], map);
    const actual = v2.state[name];
    const out = [];
    for (const section of ["scalars", "mappings", "storage"]) {
      const e = { ...(expected[section] || {}) };
      const a = { ...(actual[section] || {}) };
      if (section === "scalars") for (const key of IGNORED_SCALARS) delete e[key], delete a[key];
      if (section === "mappings") {
        for (const key of Object.keys(a)) if (!(key in e)) delete a[key];
        // Permission views (can*, is*, has*, waited*) of addresses that are not users, such as the migrator.
        for (const [fn, entries] of Object.entries(a)) {
          if (!/^(can|is|has|waited)/.test(fn)) continue;
          a[fn] = Object.fromEntries(Object.entries(entries).filter(([key]) => key in (e[fn] || {})));
        }
      }
      diff(e, a, `${name}.${section}`, out);
    }
    if (out.length) report[name] = out;
  }
  return report;
}

function compareEvents(v1, v2) {
  const report = {};
  for (const name of Object.keys(v1.meta.addresses)) {
    const skip = new Set([...NOT_REPLAYED["*"], ...(NOT_REPLAYED[name] || [])]);
    const key = (event) => JSON.stringify([event.topics, event.data]);
    const expected = v1.events.filter((event) => event.contract === name && !skip.has(event.event)).map(key);
    const actual = v2.events
      .filter((event) => event.contract === name && !skip.has(event.event) && event.event !== "MigrationClosed")
      .map(key);
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      report[name] = { expected: expected.length, actual: actual.length };
    }
  }
  return report;
}

/**
 * Reads the new deployment with the snapshot reader and compares it with v1.
 * @param v1 Snapshot loaded with loadSnapshot.
 * @param addresses Contract name => address of the new deployment.
 * @param options.skipContracts Contract names left out of the state comparison.
 * @returns { stateReport, eventsReport }
 */
async function verifyDeployment(v1, addresses, options = {}) {
  const map = {};
  for (const [name, address] of Object.entries(v1.meta.addresses)) map[address.toLowerCase()] = addresses[name];
  const extraAddresses = [...new Set([...(v1.meta.addressList || []), ...v1.events.map((event) => event.from)])].map(
    (address) => map[address.toLowerCase()] ?? address
  );
  const v2Addresses = Object.fromEntries(Object.keys(v1.meta.addresses).map((name) => [name, addresses[name]]));

  const v2 = await takeSnapshot({
    provider: new ethers.BrowserProvider(hre.network.provider),
    addresses: v2Addresses,
    block: options.block ?? (await ethers.provider.getBlockNumber()),
    extraAddresses,
    checkCreationBlock: false,
  });

  return {
    stateReport: compareState(v1, v2, map, { skipContracts: options.skipContracts || new Set() }),
    eventsReport: compareEvents(v1, v2),
  };
}

function printReport({ stateReport, eventsReport }) {
  console.log("\n=== State differences ===");
  for (const [name, items] of Object.entries(stateReport)) {
    console.log(`${name}: ${items.length}`);
    for (const item of items.slice(0, 15)) {
      console.log(`  ${item.path}\n    v1: ${JSON.stringify(item.expected)}\n    v2: ${JSON.stringify(item.actual)}`);
    }
  }
  console.log("\n=== Event differences ===");
  for (const [name, item] of Object.entries(eventsReport)) {
    console.log(`${name}: v1 ${item.expected}, v2 ${item.actual}`);
  }
  if (!Object.keys(stateReport).length && !Object.keys(eventsReport).length) console.log("No differences");
}

module.exports = { verifyDeployment, printReport, compareState, compareEvents };
