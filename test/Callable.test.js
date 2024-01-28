const { expect } = require("chai");

describe("Callable", () => {
  let instance;
  let owner, user1Address, user2Address;

  beforeEach(async () => {
    [owner, user1Address, user2Address] = await ethers.getSigners();

    const instanceFactory = await ethers.getContractFactory("Callable");

    instance = await instanceFactory.deploy();
  });

  it("should return error when .newAllowedCaller and is not owner", async () => {
    await expect(instance.connect(user1Address).newAllowedCaller(user1Address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("should add .newAllowedCaller when is owner", async () => {
    await instance.newAllowedCaller(owner);

    const allowedCaller = await instance.allowedCallers(owner);

    expect(allowedCaller).to.equal(true);
  });

  it("should be able to add many callers .newAllowedCaller when is owner", async () => {
    await instance.newAllowedCaller(owner);
    await instance.newAllowedCaller(user1Address);
    await instance.newAllowedCaller(user2Address);

    const allowedCaller1 = await instance.allowedCallers(owner);
    const allowedCaller2 = await instance.allowedCallers(owner);
    const allowedCaller3 = await instance.allowedCallers(owner);

    expect(allowedCaller1).to.equal(true);
    expect(allowedCaller2).to.equal(true);
    expect(allowedCaller3).to.equal(true);
  });
});
