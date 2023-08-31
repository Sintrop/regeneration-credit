require("./shared/setup.js");
const Callable = artifacts.require("Callable");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("Callable", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address] = accounts;

  before(async () => {
    instance = await Callable.new();
  });

  it("should return error when .newAllowedCaller and is not owner", async () => {
    await expectRevert(
      instance.newAllowedCaller(user1Address, { from: user1Address }),
      "Ownable: caller is not the owner"
    );
  });

  it("should add .newAllowedCaller when is owner", async () => {
    await instance.newAllowedCaller(owner);

    const allowedCaller = await instance.allowedCallers(owner);

    assert.equal(allowedCaller, true);
  });

  it("should be able to add many callers .newAllowedCaller when is owner", async () => {
    await instance.newAllowedCaller(owner);
    await instance.newAllowedCaller(user1Address);
    await instance.newAllowedCaller(user2Address);

    const allowedCaller1 = await instance.allowedCallers(owner);
    const allowedCaller2 = await instance.allowedCallers(owner);
    const allowedCaller3 = await instance.allowedCallers(owner);

    assert.equal(allowedCaller1, true);
    assert.equal(allowedCaller2, true);
    assert.equal(allowedCaller3, true);
  });
});
