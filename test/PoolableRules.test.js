const { expect } = require("chai");

describe("Poolable", () => {
  let instance;

  const params = {
    halving: 12,
    totalTokens: 40000000000000000000000000n,
  };

  beforeEach(async () => {
    const poolableContractFactory = await ethers.getContractFactory("Poolable");

    instance = await poolableContractFactory.deploy(params.totalTokens);
  });

  describe("#tokensPerEra", () => {
    context("with valid epoch", () => {
      context("when current epoch is 1", () => {
        it("returns 1666666666666666666666666 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(1, params.halving);

          expect(tokensPerEra).to.equal(1666666666666666666666666n);
        });
      });

      context("when current epoch is 2", () => {
        it("returns 833333333333333333333333 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(2, params.halving);

          expect(tokensPerEra).to.equal(833333333333333333333333n);
        });
      });

      context("when current epoch is 3", () => {
        it("returns 416666666666666666666666 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(3, params.halving);

          expect(tokensPerEra).to.equal(416666666666666666666666n);
        });
      });

      context("when current epoch is 4", () => {
        it("returns 208333333333333333333333 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(4, params.halving);

          expect(tokensPerEra).to.equal(208333333333333333333333n);
        });
      });

      context("when current epoch is 5", () => {
        it("returns 104166666666666666666666 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(5, params.halving);

          expect(tokensPerEra).to.equal(104166666666666666666666n);
        });
      });

      context("when current epoch is 6", () => {
        it("returns 52083333333333333333333 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(6, params.halving);

          expect(tokensPerEra).to.equal(52083333333333333333333n);
        });
      });

      context("when current epoch is 7", () => {
        it("returns 26041666666666666666666 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(7, params.halving);

          expect(tokensPerEra).to.equal(26041666666666666666666n);
        });
      });

      context("when current epoch is 8", () => {
        it("returns 13020833333333333333333 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(8, params.halving);

          expect(tokensPerEra).to.equal(13020833333333333333333n);
        });
      });

      context("when current epoch is 9", () => {
        it("returns 6510416666666666666666 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(9, params.halving);

          expect(tokensPerEra).to.equal(6510416666666666666666n);
        });
      });

      context("when current epoch is 10", () => {
        it("returns 3255208333333333333333 tokens", async () => {
          const tokensPerEra = await instance.tokensPerEra(10, params.halving);

          expect(tokensPerEra).to.equal(3255208333333333333333n);
        });
      });
    });
  });

  describe("#tokensPerEpoch", () => {
    context("with valid epoch", () => {
      context("when current epoch is 1", () => {
        it("returns 20000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(1);

          expect(tokensPerEpoch).to.equal(20000000000000000000000000n);
        });
      });

      context("when current epoch is 2", () => {
        it("returns 10000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(2);

          expect(tokensPerEpoch).to.equal(10000000000000000000000000n);
        });
      });

      context("when current epoch is 3", () => {
        it("returns 5000000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(3);

          expect(tokensPerEpoch).to.equal(5000000000000000000000000n);
        });
      });

      context("when current epoch is 4", () => {
        it("returns 2500000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(4);

          expect(tokensPerEpoch).to.equal(2500000000000000000000000n);
        });
      });

      context("when current epoch is 5", () => {
        it("returns 1250000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(5);

          expect(tokensPerEpoch).to.equal(1250000000000000000000000n);
        });
      });

      context("when current epoch is 6", () => {
        it("returns 625000000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(6);

          expect(tokensPerEpoch).to.equal(625000000000000000000000n);
        });
      });

      context("when current epoch is 7", () => {
        it("returns 312500000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(7);

          expect(tokensPerEpoch).to.equal(312500000000000000000000n);
        });
      });

      context("when current epoch is 8", () => {
        it("returns 156250000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(8);

          expect(tokensPerEpoch).to.equal(156250000000000000000000n);
        });
      });

      context("when current epoch is 9", () => {
        it("returns 78125000000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(9);

          expect(tokensPerEpoch).to.equal(78125000000000000000000n);
        });
      });

      context("when current epoch is 10", () => {
        it("returns 39062500000000000000000 tokens", async () => {
          const tokensPerEpoch = await instance.tokensPerEpoch(10);

          expect(tokensPerEpoch).to.equal(39062500000000000000000n);
        });
      });
    });
  });
});
