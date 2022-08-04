const Registrable = artifacts.require("Registrable");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("Registrable", (accounts) => {
  let instance;
  let [owner, user1Address, user2Address] = accounts;

  beforeEach(async () => {
    instance = await Registrable.new();
  });

  context("when will add new allowed user", () => {
    context("when is not owner", () => {
      it("should return error message", async () => {
        await expectRevert(
          instance.newAllowedUser(user1Address, {from: user1Address}),
          "Ownable: caller is not the owner"
        );
      });
    })
    
    context("when is the owner", () => {
      it("should add newAllowedUser", async () => {
        await instance.newAllowedUser(owner);
        const allowedUser = await instance.allowedUsers(owner);

        assert.equal(allowedUser, true);
      });

      context("when try add many allowedUsers", () => {
        it("should add all", async () => {
          await instance.newAllowedUser(owner);
          await instance.newAllowedUser(user1Address);
          await instance.newAllowedUser(user2Address);

          const allowedUser1 = await instance.allowedUsers(owner);
          const allowedUser2 = await instance.allowedUsers(user1Address);
          const allowedUser3 = await instance.allowedUsers(user2Address);

          assert.equal(allowedUser1, true);
          assert.equal(allowedUser2, true);
          assert.equal(allowedUser3, true);
        });
      });
    });
  });
});
