const { userContractDeployed } = require("./shared/user_contract_deployed");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("AdvisorContract", () => {
  let instance;
  let userContract;
  let owner, adv1Address, adv2Address, adv3Address;

  const addAdvisor = async (name, from) => {
    await instance.connect(from).addAdvisor(name, "photoURL");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  beforeEach(async () => {
    [owner, adv1Address, adv2Address, adv3Address] = await ethers.getSigners();

    userContract = await userContractDeployed();

    const instanceContractFactory = await ethers.getContractFactory("AdvisorContract");
    instance = await instanceContractFactory.deploy(userContract.target);

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);

    await addInvitation(owner, adv1Address, userTypes.Advisor, owner);
    await addInvitation(owner, adv3Address, userTypes.Advisor, owner);
  });

  context("when will create new advisor (.addAdvisor)", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expect(addAdvisor("Advisor B", adv2Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when advisor exists", () => {
        it("should return error", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await expect(addAdvisor("Advisor A", adv1Address)).to.be.revertedWith("This advisor already exist");
        });
      });

      context("when advisor don't exists", () => {
        it("should create advisor", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await addAdvisor("Advisor C", adv3Address);
          const advisor = await instance.getAdvisor(adv1Address);

          expect(advisor.advisorWallet).to.equal(adv1Address.address);
        });

        it("should increment advisorCount after create advisor", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await addAdvisor("Advisor C", adv3Address);
          const advisorsCount = await instance.advisorsCount();

          expect(advisorsCount).to.equal(2);
        });

        it("should add created advisor in advisorList (array)", async () => {
          await addAdvisor("Advisor A", adv1Address);
          await addAdvisor("Advisor C", adv3Address);

          const advisors = await instance.getAdvisors();

          expect(advisors[0].advisorWallet).to.equal(adv1Address.address);
        });

        it("should add created advisor in userType contract as a ADVISOR", async () => {
          await addAdvisor("Advisor A", adv1Address);

          const userType = await userContract.getUser(adv1Address);
          const ADVISOR = 5;

          expect(userType).to.equal(ADVISOR);
        });
      });
    });
  });

  context("when will get advisors (.getAdvisors)", () => {
    it("should return advisors when has advisors", async () => {
      await addAdvisor("Advisor A", adv1Address);
      await addAdvisor("Advisor C", adv3Address);

      const advisors = await instance.getAdvisors();

      expect(advisors.length).to.equal(2);
    });

    it("should return advisors equal zero when dont has it", async () => {
      const advisors = await instance.getAdvisors();

      expect(advisors.length).to.equal(0);
    });
  });

  context("when will get advisor (.getAdvisor)", () => {
    it("should return a advisor", async () => {
      await addAdvisor("Advisor A", adv1Address);

      const advisor = await instance.getAdvisor(adv1Address);

      expect(advisor.advisorWallet).to.equal(adv1Address.address);
    });
  });

  context("when will check if advisor exists", () => {
    it("should return true when exists", async () => {
      await addAdvisor("Advisor A", adv1Address);
      const advisorExists = await instance.advisorExists(adv1Address);

      expect(advisorExists).to.equal(true);
    });

    it("it should return false when don't exist", async () => {
      const advisorExists = await instance.advisorExists(adv1Address);

      expect(advisorExists).to.equal(false);
    });
  });
});
