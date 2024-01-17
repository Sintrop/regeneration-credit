const ProducerContract = artifacts.require("ProducerContract");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const ProducerPool = artifacts.require("ProducerPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");

contract("ProducerContract", (accounts) => {
  let instance;
  let rcToken;
  let userContract;
  let producerPool;
  let [ownerAddress, prod1Address, prod2Address] = accounts;

  const addProducer = async (name, address) => {
    await instance.addProducer(10, name, "photoURL", "135465-005", { from: address });
  };

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    totalEras: 50,
    blocksPerEra: 50,
  };

  beforeEach(async () => {
    rcToken = await rcTokenDeployed();

    userContract = await userContractDeployed();

    producerPool = await ProducerPool.new(
      rcToken.address,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    instance = await ProducerContract.new(userContract.address, producerPool.address);

    await rcToken.addContractPool(producerPool.address, producerPoolArgs.totalTokens);
    await userContract.newAllowedCaller(instance.address);
    await instance.newAllowedCaller(ownerAddress);
    await producerPool.newAllowedCaller(instance.address);
  });

  context("when access producer fields", () => {
    it("should have fields", async () => {
      await addProducer("Producer A", prod1Address);
      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.id, "1");
      assert.equal(producer.producerWallet, prod1Address);
      assert.equal(producer.userType, 1);
      assert.equal(producer.name, "Producer A");
      assert.equal(producer.proofPhoto, "photoURL");
      assert.equal(producer.totalInspections, 0);
      assert.equal(producer.recentInspection, false);
      assert.equal(producer.isa.isaAverage, "0");
      assert.equal(producer.isa.isaScore, "0");

      assert.equal(producer.pool.currentEra, 1);

      assert.equal(producer.propertyAddress.coordinate, "135465-005");
    });
  });

  context("when will create a producer (.addProducer)", () => {
    it("should create producer", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer B", prod2Address);
      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.producerWallet, prod1Address);
    });

    it("should be created with totalRequest equal zero", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.totalInspections, 0);
    });

    it("should be created with isaAvarage equal zero", async () => {
      await addProducer("Producer A", prod1Address);
      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.isa.isaAverage, "0");
    });

    it("should be created with isaScore equal zero", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.isa.isaScore, 0);
    });

    it("should be created with lastRequestAt equal zero", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.lastRequestAt, 0);
    });

    it("should increment producersCount after create producer", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer B", prod2Address);
      const producersCount = await instance.producersCount();

      assert.equal(producersCount, 2);
    });

    it("should add created producer in userType contract as a PRODUCER", async () => {
      await addProducer("Producer A", prod1Address);

      const userType = await userContract.getUser(prod1Address);
      const PRODUCER = 1;

      assert.equal(userType, PRODUCER);
    });
  });

  context("when producer alredy exists", () => {
    it("should return error when try create same producer", async () => {
      await addProducer("Producer A", prod1Address);

      await expectRevert(addProducer("Producer A", prod1Address), "This producer already exist");
    });
  });

  context("when producer don't exist", () => {
    it("should return false when producer don't exist", async () => {
      const producerExists = await instance.producerExists(prod1Address);

      assert.equal(producerExists, false);
    });
  });

  context("when producer exists", () => {
    it("should return true when producer exists", async () => {
      await addProducer("Producer A", prod1Address);

      const producerExists = await instance.producerExists(prod1Address);

      assert.equal(producerExists, true);
    });
  });

  context("when call getProducer", () => {
    it("should return a producer", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.producerWallet, prod1Address);
    });

    it("should return producers when call getProducers and has it", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer A", prod2Address);

      const producers = await instance.getProducers();

      assert.equal(producers.length, 2);
    });

    it("should return producers zero when call getProducers and dont has it", async () => {
      const producers = await instance.getProducers();

      assert.equal(producers.length, 0);
    });

    it("should return same producer in mapping and array list", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer A", prod2Address);

      const producers = await instance.getProducers();
      const producer1 = await instance.getProducer(prod1Address);
      const producer2 = await instance.getProducer(prod2Address);

      assert.equal(producers[0].producer_wallet, producer1.producer_wallet);
      assert.equal(producers[1].producer_wallet, producer2.producer_wallet);
    });
  });

  context("when is allowed caller", () => {
    it("should success .recentInspection when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.recentInspection(prod1Address, true);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.recentInspection, true);
    });

    it("should success .incrementInspections when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.incrementInspections(prod1Address);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.totalInspections, 1);
    });
  });

  context("when is not allowed caller", () => {
    it("should return error .recentInspection when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expectRevert(instance.recentInspection(prod1Address, true, { from: prod1Address }), "Not allowed caller");
    });

    it("should return error .incrementInspections when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expectRevert(instance.incrementInspections(prod1Address, { from: prod1Address }), "Not allowed caller");
    });
  });

  describe("#setIsaScore", () => {
    beforeEach(async () => {
      await addProducer("Producer A", prod1Address);
    });

    context("with allowed user", () => {
      context("when dont have producers sustainable", () => {
        context("when have 1 producer", () => {
          beforeEach(async () => {
            await instance.setIsaScore(prod1Address, 600);
          });

          context("when new score + producer score is smaller than limit score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 70);
            });

            it("producer isa score must be 670", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 670);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, false);
            });
          });

          context("when new score is negative", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, -70);
            });

            it("producer isa score must be 530", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 530);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, false);
            });
          });

          context("when new score + producer score result in a negative value", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, -610);
            });

            it("producer isa score must be -10", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, -10);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, false);
            });
          });

          context("when new score + producer score is equal or bigger limit score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 400);
            });

            it("producer isa score must be 1000", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 1000);
            });

            it("producer must be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, true);
            });

            it("producers sustainable must increment", async () => {
              const producersSustainable = await instance.producersSustainable();

              assert.equal(producersSustainable, 1);
            });
          });
        });

        context("when have more tha one producer", () => {
          beforeEach(async () => {
            await instance.setIsaScore(prod1Address, 600);
            await addProducer("Producer B", prod2Address);
            await instance.setIsaScore(prod2Address, 800);
          });

          context("when new score + producer A score is smaller than limit score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 70);
            });

            it("producer isa score must be 670", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 670);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, false);
            });
          });

          context("when new score + producer A score is equal than limit score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 400);
            });

            it("producer A isa score must be 1000", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 1000);
            });

            it("producer A must be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, true);
            });

            it("producers sustainable must increment", async () => {
              const producersSustainable = await instance.producersSustainable();

              assert.equal(producersSustainable, 1);
            });
          });

          context("when new score + producer score result in a negative value", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, -610);
            });

            it("producer isa score must be -10", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, -10);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, false);
            });
          });
        });
      });

      context("when have producers sustainable", () => {
        context("when have 1 producer", () => {
          beforeEach(async () => {
            await instance.setIsaScore(prod1Address, 1000);
          });

          context("when producer receive more 100 isa score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 100);
            });

            it("producer isa score must be 1100", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 1100);
            });

            it("producer must be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.sustainable, true);
            });
          });
        });

        context("when have more than one producer", () => {
          beforeEach(async () => {
            await instance.setIsaScore(prod1Address, 1000);
            await addProducer("Producer B", prod2Address);
            await instance.setIsaScore(prod2Address, 800);
          });

          context("when producer A receive more 100 isa score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 100);
            });

            it("producer A isa score must be 1100", async () => {
              const producer = await instance.getProducer(prod1Address);

              assert.equal(producer.isa.isaScore, 1100);
            });
          });

          context("when producer B receive more 100 isa score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod2Address, 100);
            });

            it("producer B isa score must be 900", async () => {
              const producer = await instance.getProducer(prod2Address);

              assert.equal(producer.isa.isaScore, 900);
            });
          });
        });
      });

      context("when producer have reached minimum inspections", () => {
        beforeEach(async () => {
          await instance.incrementInspections(prod1Address);
          await instance.incrementInspections(prod1Address);
          await instance.incrementInspections(prod1Address);

          await instance.setIsaScore(prod1Address, 50);
        });

        context("when is era 1", () => {
          it("set 50 levels to era 1 pool", async () => {
            const eraLevels = await producerPool.eraLevels(1, prod1Address);

            assert.equal(eraLevels, 50);
          });

          it("producer isaScore must be 50", async () => {
            const producer = await instance.getProducer(prod1Address);

            assert.equal(producer.isa.isaScore, 50);
          });
        });

        context("when is era 2", () => {
          beforeEach(async () => {
            await advanceBlock(producerPoolArgs.blocksPerEra);
            await instance.setIsaScore(prod1Address, 50);
          });

          it("set 50 levels to era 2 pool", async () => {
            const eraLevels = await producerPool.eraLevels(2, prod1Address);

            assert.equal(eraLevels, 50);
          });

          it("producer isaScore must be 100", async () => {
            const producer = await instance.getProducer(prod1Address);

            assert.equal(producer.isa.isaScore, 100);
          });
        });
      });
    });

    context("with not allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(instance.setIsaScore(prod1Address, 50, { from: prod1Address }), "Not allowed caller");
      });
    });
  });

  describe("#withdraw", () => {
    context("with producer", () => {
      beforeEach(async () => {
        await addProducer("Producer A", prod1Address);
        await addProducer("Producer B", prod2Address);
      });

      context("when can approve #blockable", () => {
        context("when producer have minimum inspections", () => {
          context("when levels in era is 100", () => {
            beforeEach(async () => {
              await instance.incrementInspections(prod1Address);
              await instance.incrementInspections(prod1Address);
              await instance.incrementInspections(prod1Address);
            });

            context("when producer have isaScore 50", () => {
              beforeEach(async () => {
                await instance.incrementInspections(prod2Address);
                await instance.incrementInspections(prod2Address);
                await instance.incrementInspections(prod2Address);

                await instance.setIsaScore(prod1Address, 50);
                await instance.setIsaScore(prod2Address, 50);

                await advanceBlock(producerPoolArgs.blocksPerEra);

                await instance.withdraw({ from: prod1Address });
                await instance.withdraw({ from: prod2Address });
              });

              it("producer A must withdraw 3600000000000000000000000n tokens", async () => {
                const balanceOf = await producerPool.balanceOf(prod1Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });

              it("producer B must withdraw 3600000000000000000000000n tokens", async () => {
                const balanceOf = await producerPool.balanceOf(prod2Address);

                assert.equal(balanceOf, 3600000000000000000000000n);
              });

              it("producer A current era must be incremented", async () => {
                const producer = await instance.getProducer(prod1Address);

                assert.equal(producer.pool.currentEra, 2);
              });

              it("producer B current era must be incremented", async () => {
                const producer = await instance.getProducer(prod2Address);

                assert.equal(producer.pool.currentEra, 2);
              });
            });

            context("when producer have isaScore 100", () => {
              beforeEach(async () => {
                await instance.setIsaScore(prod1Address, 100);
                await advanceBlock(producerPoolArgs.blocksPerEra);
                await instance.withdraw({ from: prod1Address });
              });

              it("must withdraw 7200000000000000000000000n tokens", async () => {
                const balanceOf = await producerPool.balanceOf(prod1Address);

                assert.equal(balanceOf, 7200000000000000000000000n);
              });

              it("producer current era must be increment", async () => {
                const producer = await instance.getProducer(prod1Address);

                assert.equal(producer.pool.currentEra, 2);
              });
            });

            context("when producer have isa score >= limiteIsaScore", () => {
              beforeEach(async () => {
                await instance.setIsaScore(prod1Address, 1000);
              });

              it("should return error message", async () => {
                await expectRevert(instance.withdraw({ from: prod1Address }), "Limit ISA Score");
              });
            });
          });
        });

        context("when producer dont have minimum inspections", () => {
          it("should return error message", async () => {
            await expectRevert(instance.withdraw({ from: prod1Address }), "Minimum inspections");
          });
        });
      });

      context("when cant approve #blockable", () => {
        beforeEach(async () => {
          await instance.incrementInspections(prod1Address);
          await instance.incrementInspections(prod1Address);
          await instance.incrementInspections(prod1Address);
        });

        it("should return error message", async () => {
          await expectRevert(instance.withdraw({ from: prod1Address }), "You can't approve yet");
        });
      });
    });

    context("with not producer", () => {
      it("should return error message", async () => {
        await expectRevert(instance.withdraw(), "Only producers pool");
      });
    });
  });
});
