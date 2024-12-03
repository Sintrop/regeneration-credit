const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");

describe("Poolable", () => {
  let instance;

  const params = {
    halving: 12,
    totalTokens: 30000000000000000000000000n,
  };

  beforeEach(async () => {
    const poolableContractFactory = await ethers.getContractFactory("Poolable");

    instance = await poolableContractFactory.deploy(params.totalTokens);
  });

  describe("#tokensPerEra", () => {
    context("with valid epoch", () => {
      context("when current epoch is 1", () => {
        it("returns 1250000000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(1, params.halving);

          expect(tokensPerEra).to.equal(1250000000000000000000000n);
        });
      });

      context("when current epoch is 2", () => {
        it("returns 625000000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(2, params.halving);

          expect(tokensPerEra).to.equal(625000000000000000000000n);
        });
      });

      context("when current epoch is 3", () => {
        it("returns 312500000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(3, params.halving);

          expect(tokensPerEra).to.equal(312500000000000000000000n);
        });
      });

      context("when current epoch is 4", () => {
        it("returns 156250000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(4, params.halving);

          expect(tokensPerEra).to.equal(156250000000000000000000n);
        });
      });

      context("when current epoch is 5", () => {
        it("returns 78125000000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(5, params.halving);

          expect(tokensPerEra).to.equal(78125000000000000000000n);
        });
      });

      context("when current epoch is 6", () => {
        it("returns 39062500000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(6, params.halving);

          expect(tokensPerEra).to.equal(39062500000000000000000n);
        });
      });

      context("when current epoch is 7", () => {
        it("returns 19531250000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(7, params.halving);

          expect(tokensPerEra).to.equal(19531250000000000000000n);
        });
      });

      context("when current epoch is 8", () => {
        it("returns 9765625000000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(8, params.halving);

          expect(tokensPerEra).to.equal(9765625000000000000000n);
        });
      });

      context("when current epoch is 9", () => {
        it("returns 4882812500000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(9, params.halving);

          expect(tokensPerEra).to.equal(4882812500000000000000n);
        });
      });

      context("when current epoch is 10", () => {
        it("returns 2441406250000000000000 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(10, params.halving);

          expect(tokensPerEra).to.equal(2441406250000000000000n);
        });
      });
    });
  });

  describe("#tokensPerEpoch", () => {
    context("with valid epoch", () => {
      context("when current epoch is 1", () => {
        it("returns 15000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(1);

          expect(tokensPerEpoch).to.equal(15000000000000000000000000n);
        });
      });

      context("when current epoch is 2", () => {
        it("returns 7500000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(2);

          expect(tokensPerEpoch).to.equal(7500000000000000000000000n);
        });
      });

      context("when current epoch is 3", () => {
        it("returns 3750000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(3);

          expect(tokensPerEpoch).to.equal(3750000000000000000000000n);
        });
      });

      context("when current epoch is 4", () => {
        it("returns 1875000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(4);

          expect(tokensPerEpoch).to.equal(1875000000000000000000000n);
        });
      });

      context("when current epoch is 5", () => {
        it("returns 937500000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(5);

          expect(tokensPerEpoch).to.equal(937500000000000000000000n);
        });
      });

      context("when current epoch is 6", () => {
        it("returns 468750000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(6);

          expect(tokensPerEpoch).to.equal(468750000000000000000000n);
        });
      });

      context("when current epoch is 7", () => {
        it("returns 234375000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(7);

          expect(tokensPerEpoch).to.equal(234375000000000000000000n);
        });
      });

      context("when current epoch is 8", () => {
        it("returns 117187500000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(8);

          expect(tokensPerEpoch).to.equal(117187500000000000000000n);
        });
      });

      context("when current epoch is 9", () => {
        it("returns 58593750000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(9);

          expect(tokensPerEpoch).to.equal(58593750000000000000000n);
        });
      });

      context("when current epoch is 10", () => {
        it("returns 29296875000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(10);

          expect(tokensPerEpoch).to.equal(29296875000000000000000n);
        });
      });
    });
  });
});
