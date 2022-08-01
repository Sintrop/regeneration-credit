const Registrable = artifacts.require("Registrable");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("Registrable", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address] = accounts;

  beforeEach(async () => {
    instance = await Registrable.new();
  });

  it("should return error when .newAllowedUser and is not owner", async () => {
    await expectRevert(
        instance.newAllowedUser(user1Address, {from: user1Address}),
        "Ownable: caller is not the owner"
      );
    });
  
    it("should add .newAllowedUser when is owner", async () => {
      await instance.newAllowedUser(owner);
  
      const allowedUser = await instance.allowedUser(owner);
  
      assert.equal(allowedUser, true);
    });
  
    it("should be able to add many callers .newAllowedUser when is owner", async () => {
      await instance.newAllowedUser(owner);
      await instance.newAllowedUser(user1Address);
      await instance.newAllowedUser(user2Address);
  
      const allowedUser1 = await instance.allowedUser(owner);
      const allowedUser2 = await instance.allowedUser(owner);
      const allowedUser3 = await instance.allowedUser(owner);
  
      assert.equal(allowedUser1, true);
      assert.equal(allowedUser2, true);
      assert.equal(allowedUser3, true);
    });
  });