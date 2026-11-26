const { ethers, network } = require("hardhat");

// Slot of `pool.level` inside each user struct: slot 0 packs `id` (uint64) and the wallet address.
const POOL_LEVEL_SLOT = { getResearcher: 2n, getDeveloper: 3n, getContributor: 3n };

/**
 * Gives pool levels to a registered voter without publishing a work, so the ids and counters of the works
 * under test do not change. A voter needs at least one level to vote and invite.
 * Finds the user mapping by its first slot and checks the result through the contract getter.
 */
const addVoterLevel = async (instance, getter, address, levels = 1n) => {
  const before = await instance[getter](address);
  const packed = (BigInt(address) << 64n) | BigInt(before.id);
  const coder = ethers.AbiCoder.defaultAbiCoder();

  for (let mappingSlot = 0n; mappingSlot < 256n; mappingSlot++) {
    const structSlot = BigInt(ethers.keccak256(coder.encode(["address", "uint256"], [address, mappingSlot])));
    if (BigInt(await ethers.provider.getStorage(instance.target, structSlot)) !== packed) continue;

    const levelSlot = ethers.toBeHex(structSlot + POOL_LEVEL_SLOT[getter]);
    const value = ethers.zeroPadValue(ethers.toBeHex(before.pool.level + levels), 32);
    await network.provider.send("hardhat_setStorageAt", [instance.target, levelSlot, value]);

    const after = await instance[getter](address);
    if (after.pool.level !== before.pool.level + levels) throw new Error("addVoterLevel: pool.level not updated");
    return;
  }
  throw new Error("addVoterLevel: user struct not found");
};

module.exports = { addVoterLevel };
