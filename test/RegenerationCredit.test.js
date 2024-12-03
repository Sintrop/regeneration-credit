const { ethers } = require("hardhat");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { expect } = require("chai");

describe("RegenerationCredit", (accounts) => {
  let instance;
  let ownerAddress, user1Address, user2Address, anyContractAddress;
  let producerPool;

  let args = {
    totalRegenerationCredits: "1500000000000000000000000000",
  };

  const argsProducerPool = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    blocksPerEra: 12,
  };

  beforeEach(async () => {
    [ownerAddress, user1Address, user2Address, anyContractAddress] = await ethers.getSigners();

    const instanceFactory = await ethers.getContractFactory("RegenerationCredit");
    instance = await instanceFactory.deploy(args.totalRegenerationCredits);
    userContract = await userContractDeployed();

    const producerPoolFactory = await ethers.getContractFactory("ProducerPool");
    producerPool = await producerPoolFactory.deploy(
      instance.target,
      argsProducerPool.halving,
      argsProducerPool.blocksPerEra
    );
  });

  describe(".afterDeploy", () => {
    it("total suply should be equal to 1500000000000000000000000000", async () => {
      const totalSupply = await instance.totalSupply();
      expect(totalSupply).to.equal(args.totalRegenerationCredits);
    });

    it("totalCertified should be equal zero", async () => {
      const totalCertified = await instance.totalCertified();
      expect(totalCertified).to.equal(0);
    });

    it("totalLocked should be equal zero", async () => {
      const totalLocked = await instance.totalLocked();
      expect(totalLocked).to.equal(0);
    });

    it("balance of contract owner should be equal to 1500000000000000000000000000", async () => {
      const ownerBalance = await instance.balanceOf(ownerAddress);
      expect(ownerBalance).to.equal(1500000000000000000000000000n);
    });
  });

  describe("#addContractPool", () => {
    context("when totalTokens is bigger than tokens contract owner", () => {
      beforeEach(async () => {
        await instance.addContractPool(producerPool.target, "100000000000000000000000000");
      });

      it("it should add totalLocked tokens", async () => {
        const totalLocked = await instance.totalLocked();

        expect(totalLocked).to.equal("100000000000000000000000000");
      });

      it("it should add as a contract pool", async () => {
        const contractPool = await instance.contractPool(producerPool.target);

        expect(contractPool).to.equal(true);
      });

      it("it should have balance", async () => {
        const balanceOf = await instance.balanceOf(producerPool.target);

        expect(balanceOf).to.equal("100000000000000000000000000");
      });
    });

    context("when totalTokens is less than tokens contract owner", () => {
      it("must return erro message", async () => {
        await expect(instance.transfer(producerPool.target, "8000000000000000000000000000")).to.be.revertedWith(
          "Insufficient balance."
        );
      });
    });
  });

  describe("#transferWith", () => {
    context("when caller is a contract pool", () => {
      context("when tokenOwner is contract pool address", () => {
        context("when caller have tokens", () => {
          beforeEach(async () => {
            await instance.addContractPool(anyContractAddress, "100000000000000000000");

            await instance
              .connect(anyContractAddress)
              .transferWith(anyContractAddress, user1Address, "100000000000000000");
          });

          it("user1Address must receive 100000000000000000 tokens", async () => {
            const balanceOf = await instance.balanceOf(user1Address);

            expect(balanceOf).to.equal("100000000000000000");
          });

          it("totalLocked must be decremented to 99900000000000000000", async () => {
            const totalLocked = await instance.totalLocked();

            expect(totalLocked).to.equal("99900000000000000000");
          });

          it("balanceOf pool must be decremented to 99900000000000000000", async () => {
            const balanceOf = await instance.balanceOf(anyContractAddress);

            expect(balanceOf).to.equal("99900000000000000000");
          });
        });

        context("when caller does not have tokens", () => {
          beforeEach(async () => {
            await instance.addContractPool(anyContractAddress, "0");
          });

          it("must return erro message", async () => {
            await expect(
              instance
                .connect(anyContractAddress)
                .transferWith(anyContractAddress, user1Address, "100000000000000000000")
            ).to.be.revertedWith("You don't have RC Tokens");
          });
        });
      });

      context("when tokenOwner is not contract pool address", () => {
        context("when caller have tokens", () => {
          beforeEach(async () => {
            await instance.addContractPool(anyContractAddress, "100000000000000000000");

            await instance.connect(anyContractAddress).transferWith(ownerAddress, user1Address, "100000000000000000");
          });

          it("user1Address must receive 100000000000000000 tokens", async () => {
            const balanceOf = await instance.balanceOf(user1Address);

            expect(balanceOf).to.equal("100000000000000000");
          });

          it("totalLocked must be decremented to 100000000000000000000", async () => {
            const totalLocked = await instance.totalLocked();

            expect(totalLocked).to.equal("100000000000000000000");
          });

          it("balanceOf pool must be decremented to 100000000000000000000", async () => {
            const balanceOf = await instance.balanceOf(anyContractAddress);

            expect(balanceOf).to.equal("100000000000000000000");
          });
        });

        context("when caller does not have tokens", () => {
          beforeEach(async () => {
            await instance.addContractPool(anyContractAddress, "0");
          });

          it("must return erro message", async () => {
            await expect(
              instance
                .connect(anyContractAddress)
                .transferWith(anyContractAddress, user1Address, "100000000000000000000")
            ).to.be.revertedWith("You don't have RC Tokens");
          });
        });
      });
    });

    context("when caller is not a contract pool", () => {
      it("must return erro message", async () => {
        await expect(instance.transferWith(ownerAddress, user1Address, "100000000000000000000")).to.be.revertedWith(
          "Not a contract pool"
        );
      });
    });
  });

  describe("#transfer", () => {
    context("when user have tokens", () => {
      context("when a user transfer 100000000000000000000 sac token", () => {
        it("it should transfer when user has tokens", async () => {
          await instance.transfer(user1Address, "100000000000000000000");
          const balanceOf = await instance.balanceOf(user1Address);
          expect(balanceOf).to.equal("100000000000000000000");
        });
      });
    });

    context("when user doesn't have tokens", () => {
      it("must return erro message", async () => {
        await expect(instance.connect(user2Address).transfer(user1Address, "100000000000000000000")).to.be.revertedWith(
          "Insufficient balance."
        );
      });
    });
  });

  describe("#approve", () => {
    beforeEach(async () => {
      await instance.approve(user1Address, "100000000000000000000");
    });

    it("it should transfer when user has tokens", async () => {
      const allowance = await instance.allowance(ownerAddress, user1Address);

      expect(allowance).to.equal("100000000000000000000");
    });
  });

  describe("#transferFrom", () => {
    context("when user is approved to transfer from other address", () => {
      beforeEach(async () => {
        await instance.approve(user1Address, "100000000000000000000");
        await instance.connect(user1Address).transferFrom(ownerAddress, user2Address, "1000000000000000000");
      });

      context("when tokenOwner is sufficient to transfer", () => {
        it("user2Address must receive 1000000000000000000 tokens", async () => {
          const balanceOf = await instance.balanceOf(user2Address);

          expect(balanceOf).to.equal("1000000000000000000");
        });

        it("owner tokens must be decremented to 1499999999000000000000000000", async () => {
          const balanceOf = await instance.balanceOf(ownerAddress);

          expect(balanceOf).to.equal("1499999999000000000000000000");
        });
      });

      context("when tokenOwner is not sufficiente to transfer", () => {
        it("must return erro message", async () => {
          await expect(
            instance.connect(user1Address).transferFrom(ownerAddress, user2Address, "13754999990000000000000000000")
          ).to.be.revertedWith("Insufficient balance.");
        });
      });
    });

    context("when user is not approved to transfer from other address", () => {
      it("must return erro message", async () => {
        await expect(
          instance.connect(user1Address).transferFrom(ownerAddress, user2Address, "1000000000000000000")
        ).to.be.revertedWith("Insufficient allowance.");
      });
    });
  });

  describe("#burnTokens", () => {
    context("when user have tokens", () => {
      beforeEach(async () => {
        await instance.transfer(user1Address, "200000000000000000000");
        await instance.connect(user1Address).burnTokens("100000000000000000000");
      });

      context("when burn 100000000000000000000 tokens", () => {
        it("should burn when has tokens", async () => {
          const burnedTokens = await instance.balanceOf(user1Address);

          expect(burnedTokens).to.equal("100000000000000000000");
        });

        it("should add 100000000000000000000 to user certificate mapping", async () => {
          const userCertificate = await instance.certificate(user1Address);

          expect(userCertificate).to.equal("100000000000000000000");
        });

        it("should add 100000000000000000000 to totalCertified", async () => {
          const totalBurned = await instance.totalCertified();

          expect(totalBurned).to.equal("100000000000000000000");
        });
      });

      context("when burn another 100000000000000000000 tokens", () => {
        beforeEach(async () => {
          await instance.connect(user1Address).burnTokens("100000000000000000000");
        });

        it("should burn when has tokens", async () => {
          const burnedTokens = await instance.balanceOf(user1Address);

          expect(burnedTokens).to.equal("0");
        });

        it("should increase 100000000000000000000 tokens to certificate mapping", async () => {
          const userCertificate = await instance.certificate(user1Address);

          expect(userCertificate).to.equal("200000000000000000000");
        });

        it("should increase totalCertified in 100000000000000000000", async () => {
          const totalCertified = await instance.totalCertified();

          expect(totalCertified).to.equal("200000000000000000000");
        });
      });
    });

    context("when user does not have tokens", () => {
      it("must return error message", async () => {
        await expect(instance.connect(user2Address).burnTokens("100000000000000000000")).to.be.revertedWith(
          "Burn amount exceeds balance"
        );
      });
    });
  });

  describe("#burnTokensWith", () => {
    context("when msg.sender is a contractPool", () => {
      beforeEach(async () => {
        await instance.addContractPool(ownerAddress, 0);
        await instance.transfer(user1Address, "200000000000000000000");
        await instance.connect(ownerAddress).burnTokensWith(user1Address, "100000000000000000000");
      });

      it("should burn when has tokens", async () => {
        const burnedTokens = await instance.balanceOf(user1Address);

        expect(burnedTokens).to.equal("100000000000000000000");
      });
    });

    context("when msg.sender is not a contractPool", () => {
      it("should return error", async () => {
        await expect(instance.connect(ownerAddress).burnTokensWith(user1Address, 100)).to.be.revertedWith(
          "Not a contract pool"
        );
      });
    });
  });

  describe("#totalLocked", () => {
    context("when add contract pool", () => {
      beforeEach(async () => {
        await instance.addContractPool(producerPool.target, argsProducerPool.totalTokens);
      });

      it("it should set totalLocked to 750000000000000000000000000", async () => {
        const totalLocked = await instance.totalLocked();
        expect(totalLocked).to.equal(750000000000000000000000000n);
      });
    });
  });
});
