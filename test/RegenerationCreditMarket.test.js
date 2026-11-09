const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");

describe("RegenerationCreditMarket", () => {
  let instance, communityRules, regenerationCredit;
  let owner, seller, buyer, unregistered;

  const RC = (value) => ethers.parseUnits(value.toString(), 18);

  const createOffer = (from, amount = RC(100), price = "R$0,10", payment = "pix: random key", description = "offer") =>
    instance.connect(from).createOffer(amount, price, payment, description);

  const fundAndApprove = async (user, amount) => {
    await regenerationCredit.transfer(user.address, amount);
    await regenerationCredit.connect(user).approve(instance.target, amount);
  };

  beforeEach(async () => {
    [owner, seller, buyer, unregistered] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();
    communityRules = await communityRulesDeployed();

    const instanceFactory = await ethers.getContractFactory("RegenerationCreditMarket");
    instance = await instanceFactory.deploy(regenerationCredit.target, communityRules.target);

    await communityRules.newAllowedCaller(owner.address);
    await communityRules.addUser(seller.address, userTypes.Supporter);
  });

  describe("#constructor", () => {
    it("should revert with zero addresses", async () => {
      const factory = await ethers.getContractFactory("RegenerationCreditMarket");
      await expect(factory.deploy(ethers.ZeroAddress, communityRules.target)).to.be.revertedWithCustomError(
        instance,
        "ZeroAddress"
      );
      await expect(factory.deploy(regenerationCredit.target, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        instance,
        "ZeroAddress"
      );
    });
  });

  describe("#createOffer", () => {
    context("when seller is not registered", () => {
      it("should revert", async () => {
        await fundAndApprove(unregistered, RC(100));
        await expect(createOffer(unregistered)).to.be.revertedWithCustomError(instance, "NotRegistered");
      });
    });

    context("when seller is denied", () => {
      it("should revert", async () => {
        await fundAndApprove(seller, RC(100));
        await communityRules.setToDenied(seller.address);
        await expect(createOffer(seller)).to.be.revertedWithCustomError(instance, "UserDenied");
      });
    });

    context("when amount is below 1 RC", () => {
      it("should revert", async () => {
        await fundAndApprove(seller, RC(100));
        await expect(createOffer(seller, 500n)).to.be.revertedWithCustomError(instance, "InvalidAmount");
      });
    });

    context("when strings are invalid", () => {
      beforeEach(async () => {
        await fundAndApprove(seller, RC(100));
      });

      it("should revert with empty or long price", async () => {
        await expect(createOffer(seller, RC(1), "")).to.be.revertedWithCustomError(instance, "InvalidPrice");
        await expect(createOffer(seller, RC(1), "a".repeat(51))).to.be.revertedWithCustomError(
          instance,
          "InvalidPrice"
        );
      });

      it("should revert with empty or long payment method", async () => {
        await expect(createOffer(seller, RC(1), "R$1", "")).to.be.revertedWithCustomError(
          instance,
          "InvalidPaymentMethod"
        );
        await expect(createOffer(seller, RC(1), "R$1", "a".repeat(201))).to.be.revertedWithCustomError(
          instance,
          "InvalidPaymentMethod"
        );
      });

      it("should revert with empty or long description", async () => {
        await expect(createOffer(seller, RC(1), "R$1", "pix", "")).to.be.revertedWithCustomError(
          instance,
          "InvalidDescription"
        );
        await expect(createOffer(seller, RC(1), "R$1", "pix", "a".repeat(501))).to.be.revertedWithCustomError(
          instance,
          "InvalidDescription"
        );
      });
    });

    context("when seller has not enough balance", () => {
      it("should revert", async () => {
        await fundAndApprove(seller, RC(10));
        await regenerationCredit.connect(seller).approve(instance.target, RC(100));
        await expect(createOffer(seller, RC(100))).to.be.revertedWithCustomError(instance, "InsufficientBalance");
      });
    });

    context("when seller has not approved enough tokens", () => {
      it("should revert", async () => {
        await fundAndApprove(seller, RC(100));
        await regenerationCredit.connect(seller).approve(instance.target, RC(10));
        await expect(createOffer(seller, RC(100))).to.be.revertedWithCustomError(instance, "InsufficientAllowance");
      });
    });

    context("when everything is valid", () => {
      beforeEach(async () => {
        await fundAndApprove(seller, RC(100));
      });

      it("should store the offer with block number", async () => {
        const tx = await createOffer(seller);
        const receipt = await tx.wait();
        const offer = await instance.getOffer(1);

        expect(offer.id).to.equal(1);
        expect(offer.seller).to.equal(seller.address);
        expect(offer.amountRC).to.equal(RC(100));
        expect(offer.unitPrice).to.equal("R$0,10");
        expect(offer.paymentMethod).to.equal("pix: random key");
        expect(offer.active).to.equal(true);
        expect(offer.createdAt).to.equal(receipt.blockNumber);
        expect(offer.buyer).to.equal(ethers.ZeroAddress);
        expect(offer.completedAt).to.equal(0);
      });

      it("should emit OfferCreated", async () => {
        await expect(createOffer(seller))
          .to.emit(instance, "OfferCreated")
          .withArgs(1, seller.address, RC(100), "R$0,10");
      });

      it("should update counters and seller offers", async () => {
        await createOffer(seller, RC(50));
        await createOffer(seller, RC(50));

        expect(await instance.getOffersCount()).to.equal(2);
        expect(await instance.getSellerOfferIds(seller.address)).to.deep.equal([1n, 2n]);
      });

      it("should not move tokens", async () => {
        await createOffer(seller);
        expect(await regenerationCredit.balanceOf(seller.address)).to.equal(RC(100));
        expect(await regenerationCredit.balanceOf(instance.target)).to.equal(0);
      });
    });
  });

  describe("#cancelOffer", () => {
    beforeEach(async () => {
      await fundAndApprove(seller, RC(100));
      await createOffer(seller);
    });

    it("should revert when caller is not the seller", async () => {
      await expect(instance.connect(buyer).cancelOffer(1)).to.be.revertedWithCustomError(instance, "NotSeller");
    });

    it("should deactivate the offer and emit OfferCancelled", async () => {
      await expect(instance.connect(seller).cancelOffer(1))
        .to.emit(instance, "OfferCancelled")
        .withArgs(1, seller.address);
      expect((await instance.getOffer(1)).active).to.equal(false);
    });

    it("should revert when offer is not active", async () => {
      await instance.connect(seller).cancelOffer(1);
      await expect(instance.connect(seller).cancelOffer(1)).to.be.revertedWithCustomError(instance, "OfferNotActive");
    });

    it("should allow a denied seller to cancel", async () => {
      await communityRules.setToDenied(seller.address);
      await instance.connect(seller).cancelOffer(1);
      expect((await instance.getOffer(1)).active).to.equal(false);
    });
  });

  describe("#confirmSale", () => {
    beforeEach(async () => {
      await fundAndApprove(seller, RC(100));
      await createOffer(seller);
    });

    it("should revert with zero buyer", async () => {
      await expect(instance.connect(seller).confirmSale(1, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        instance,
        "ZeroAddress"
      );
    });

    it("should revert when caller is not the seller", async () => {
      await expect(instance.connect(buyer).confirmSale(1, buyer.address)).to.be.revertedWithCustomError(
        instance,
        "NotSeller"
      );
    });

    it("should revert when buyer is the seller", async () => {
      await expect(instance.connect(seller).confirmSale(1, seller.address)).to.be.revertedWithCustomError(
        instance,
        "InvalidBuyer"
      );
    });

    it("should allow a seller denied after the offer to confirm", async () => {
      await communityRules.setToDenied(seller.address);
      await instance.connect(seller).confirmSale(1, buyer.address);

      expect(await regenerationCredit.balanceOf(buyer.address)).to.equal(RC(100));
    });

    it("should revert when seller no longer has the balance", async () => {
      await regenerationCredit.connect(seller).transfer(owner.address, RC(1));
      await expect(instance.connect(seller).confirmSale(1, buyer.address)).to.be.revertedWithCustomError(
        instance,
        "InsufficientBalance"
      );
    });

    it("should revert when seller removed the allowance", async () => {
      await regenerationCredit.connect(seller).approve(instance.target, 0);
      await expect(instance.connect(seller).confirmSale(1, buyer.address)).to.be.revertedWithCustomError(
        instance,
        "InsufficientAllowance"
      );
    });

    context("when sale is valid", () => {
      it("should transfer the tokens from seller to buyer", async () => {
        await instance.connect(seller).confirmSale(1, buyer.address);

        expect(await regenerationCredit.balanceOf(seller.address)).to.equal(0);
        expect(await regenerationCredit.balanceOf(buyer.address)).to.equal(RC(100));
        expect(await regenerationCredit.balanceOf(instance.target)).to.equal(0);
      });

      it("should record the sale with block number", async () => {
        const tx = await instance.connect(seller).confirmSale(1, buyer.address);
        const receipt = await tx.wait();
        const offer = await instance.getOffer(1);

        expect(offer.active).to.equal(false);
        expect(offer.buyer).to.equal(buyer.address);
        expect(offer.completedAt).to.equal(receipt.blockNumber);
        expect(await instance.getSellerSalesCount(seller.address)).to.equal(1);
      });

      it("should emit Transfer and OfferCompleted", async () => {
        await expect(instance.connect(seller).confirmSale(1, buyer.address))
          .to.emit(regenerationCredit, "Transfer")
          .withArgs(seller.address, buyer.address, RC(100))
          .and.to.emit(instance, "OfferCompleted")
          .withArgs(1, seller.address, buyer.address, RC(100));
      });

      it("should not confirm the same offer twice", async () => {
        await instance.connect(seller).confirmSale(1, buyer.address);
        await expect(instance.connect(seller).confirmSale(1, buyer.address)).to.be.revertedWithCustomError(
          instance,
          "OfferNotActive"
        );
      });

      it("should accept an unregistered buyer", async () => {
        await instance.connect(seller).confirmSale(1, unregistered.address);
        expect(await regenerationCredit.balanceOf(unregistered.address)).to.equal(RC(100));
      });
    });
  });

  describe("#getOffer", () => {
    it("should revert when offer does not exist", async () => {
      await expect(instance.getOffer(0)).to.be.revertedWithCustomError(instance, "OfferNotFound");
      await expect(instance.getOffer(1)).to.be.revertedWithCustomError(instance, "OfferNotFound");
    });
  });
});
