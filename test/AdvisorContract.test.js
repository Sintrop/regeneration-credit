const AdvisorContract = artifacts.require("AdvisorContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("AdvisorContract", (accounts) => {
  let instance;
  let userContract;
  let [owner, adv1Address, adv2Address, adv3Address] = accounts;

  const addAdvisor = async (name, address) => {
    await instance.addAdvisor(name, "photoURL", { from: address });
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.addInvitation(inviter, invited, userType, {
      from: from,
    });
  };

  beforeEach(async () => {
    userContract = await userContractDeployed();

    instance = await AdvisorContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(owner);

    await addInvitation(owner, adv1Address, userTypes.Advisor, owner);
    await addInvitation(owner, adv3Address, userTypes.Advisor, owner);
  });

  context("when will create new advisor (.addAdvisor)", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addAdvisor("Advisor B", adv2Address), "Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when advisor exists", () => {
        it("should return error", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await expectRevert(addAdvisor("Advisor A", adv1Address), "This advisor already exist");
        });
      });

      context("when advisor don't exists", () => {
        it("should create advisor", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await addAdvisor("Advisor C", adv3Address);
          const advisor = await instance.getAdvisor(adv1Address);

          assert.equal(advisor.advisorWallet, adv1Address);
        });

        it("should increment advisorCount after create advisor", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await addAdvisor("Advisor C", adv3Address);
          const advisorsCount = await instance.advisorsCount();

          assert.equal(advisorsCount, 2);
        });

        it("should add created advisor in advisorList (array)", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await addAdvisor("Advisor C", adv3Address);

          const advisors = await instance.getAdvisors();

          assert.equal(advisors[0].advisorWallet, adv1Address);
        });

        it("should add created advisor in userType contract as a ADVISOR", async () => {
          await addAdvisor("Advisor A", adv1Address);

          const userType = await userContract.getUser(adv1Address);
          const ADVISOR = 5;

          assert.equal(userType, ADVISOR);
        });
      });
    });
  });

  context("when will get advisors (.getAdvisors)", () => {
    it("should return advisors when has advisors", async () => {
      await addAdvisor("Advisor A", adv1Address);
      await addAdvisor("Advisor C", adv3Address);

      const advisors = await instance.getAdvisors();

      assert.equal(advisors.length, 2);
    });

    it("should return advisors equal zero when dont has it", async () => {
      const advisors = await instance.getAdvisors();

      assert.equal(advisors.length, 0);
    });
  });

  context("when will get advisor (.getAdvisor)", () => {
    it("should return a advisor", async () => {
      await addAdvisor("Advisor A", adv1Address);

      const advisor = await instance.getAdvisor(adv1Address);

      assert.equal(advisor.advisorWallet, adv1Address);
    });
  });

  context("when will check if advisor exists", () => {
    it("should return true when exists", async () => {
      await addAdvisor("Advisor A", adv1Address);
      const advisorExists = await instance.advisorExists(adv1Address);

      assert.equal(advisorExists, true);
    });

    it("it should return false when don't exist", async () => {
      const advisorExists = await instance.advisorExists(adv1Address);

      assert.equal(advisorExists, false);
    });
  });
});
