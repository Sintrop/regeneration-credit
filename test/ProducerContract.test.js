const { userContractDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("ProducerContract", () => {
  let instance;
  let regenerationCredit;
  let userContract;
  let producerPool;
  let owner, prod1Address, prod2Address;

  const addProducer = async (name, from) => {
    await instance.connect(from).addProducer(10, name, "photoURL", "135465-005");
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    totalEras: 50,
    blocksPerEra: 50,
  };

  beforeEach(async () => {
    [owner, prod1Address, prod2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    userContract = await userContractDeployed();

    const producerPoolFactory = await ethers.getContractFactory("ProducerPool");

    producerPool = await producerPoolFactory.deploy(
      regenerationCredit.target,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    const instanceFactory = await ethers.getContractFactory("ProducerContract");

    instance = await instanceFactory.deploy(userContract.target, producerPool.target);

    await regenerationCredit.addContractPool(producerPool.target, producerPoolArgs.totalTokens);
    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);
    await producerPool.newAllowedCaller(instance.target);

    await addInvitation(owner, prod1Address, userTypes.Producer, owner);
    await addInvitation(owner, prod2Address, userTypes.Producer, owner);
  });

  context("when access producer fields", () => {
    it("should have fields", async () => {
      await addProducer("Producer A", prod1Address);
      const producer = await instance.getProducer(prod1Address);

      expect(producer.id).to.equal("1");
      expect(producer.producerWallet).to.equal(prod1Address.address);
      expect(producer.name).to.equal("Producer A");
      expect(producer.proofPhoto).to.equal("photoURL");
      expect(producer.totalInspections).to.equal(0);
      expect(producer.pendingInspection).to.equal(false);
      expect(producer.isa.isaAverage).to.equal("0");
      expect(producer.isa.isaScore).to.equal("0");

      expect(producer.pool.currentEra).to.equal(1);

      expect(producer.areaInformation.coordinates).to.equal("135465-005");
      expect(producer.areaInformation.totalArea).to.equal("10");
    });
  });

  context("when will create a producer (.addProducer)", () => {
    it("should create producer", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer B", prod2Address);
      const producer = await instance.getProducer(prod1Address);

      expect(producer.producerWallet).to.equal(prod1Address.address);
    });

    it("should be created with totalRequest equal zero", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      expect(producer.totalInspections).to.equal(0);
    });

    it("should be created with isaAvarage equal zero", async () => {
      await addProducer("Producer A", prod1Address);
      const producer = await instance.getProducer(prod1Address);

      expect(producer.isa.isaAverage).to.equal("0");
    });

    it("should be created with isaScore equal zero", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      expect(producer.isa.isaScore).to.equal(0);
    });

    it("should be created with lastRequestAt equal zero", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      expect(producer.lastRequestAt).to.equal(0);
    });

    it("should increment producersCount after create producer", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer B", prod2Address);
      const producersCount = await userContract.userTypesCount(userTypes.Producer);

      expect(producersCount).to.equal(2);
    });

    it("should add created producer in userType contract as a PRODUCER", async () => {
      await addProducer("Producer A", prod1Address);

      const userType = await userContract.getUser(prod1Address);
      const PRODUCER = 1;

      expect(userType).to.equal(PRODUCER);
    });
  });

  context("when producer alredy exists", () => {
    it("should return error when try create same producer", async () => {
      await addProducer("Producer A", prod1Address);

      await expect(addProducer("Producer A", prod1Address)).to.be.revertedWith("This producer already exist");
    });
  });

  context("when producer don't exist", () => {
    it("should return false when producer don't exist", async () => {
      const producerExists = await instance.producerExists(prod1Address);

      expect(producerExists).to.equal(false);
    });
  });

  context("when producer exists", () => {
    it("should return true when producer exists", async () => {
      await addProducer("Producer A", prod1Address);

      const producerExists = await instance.producerExists(prod1Address);

      expect(producerExists).to.equal(true);
    });
  });

  context("when call getProducer", () => {
    it("should return a producer", async () => {
      await addProducer("Producer A", prod1Address);

      const producer = await instance.getProducer(prod1Address);

      expect(producer.producerWallet).to.equal(prod1Address.address);
    });

    it("should return producers when call getProducers and has it", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer A", prod2Address);

      const producers = await instance.getProducers();

      expect(producers.length).to.equal(2);
    });

    it("should return producers zero when call getProducers and dont has it", async () => {
      const producers = await instance.getProducers();

      expect(producers.length).to.equal(0);
    });

    it("should return same producer in mapping and array list", async () => {
      await addProducer("Producer A", prod1Address);
      await addProducer("Producer A", prod2Address);

      const producers = await instance.getProducers();
      const producer1 = await instance.getProducer(prod1Address);
      const producer2 = await instance.getProducer(prod2Address);

      expect(producers[0].producer_wallet).to.equal(producer1.producer_wallet);
      expect(producers[1].producer_wallet).to.equal(producer2.producer_wallet);
    });
  });

  context("when is allowed caller", () => {
    it("should success .pendingInspection when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.pendingInspection(prod1Address, true);

      const producer = await instance.getProducer(prod1Address);

      expect(producer.pendingInspection).to.equal(true);
    });

    it("should success .incrementInspections when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.incrementInspections(prod1Address);

      const producer = await instance.getProducer(prod1Address);

      expect(producer.totalInspections).to.equal(1);
    });
  });

  context("when is not allowed caller", () => {
    it("should return error .pendingInspection when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expect(instance.connect(prod1Address).pendingInspection(prod1Address, true)).to.be.revertedWith(
        "Not allowed caller"
      );
    });

    it("should return error .incrementInspections when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expect(instance.connect(prod1Address).incrementInspections(prod1Address)).to.be.revertedWith(
        "Not allowed caller"
      );
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

              expect(producer.isa.isaScore).to.equal(670);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(false);
            });
          });

          context("when new score is negative", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, -70);
            });

            it("producer isa score must be 530", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.isaScore).to.equal(530);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(false);
            });
          });

          context("when new score + producer score result in a negative value", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, -610);
            });

            it("producer isa score must be -10", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.isaScore).to.equal(-10);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(false);
            });
          });

          context("when new score + producer score is equal or bigger limit score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 400);
            });

            it("producer isa score must be 1000", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.isaScore).to.equal(1000);
            });

            it("producer must be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(true);
            });

            it("producers sustainable must increment", async () => {
              const producersSustainable = await instance.producersSustainable();

              expect(producersSustainable).to.equal(1);
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

              expect(producer.isa.isaScore).to.equal(670);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(false);
            });
          });

          context("when new score + producer A score is equal than limit score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, 400);
            });

            it("producer A isa score must be 1000", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.isaScore).to.equal(1000);
            });

            it("producer A must be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(true);
            });

            it("producers sustainable must increment", async () => {
              const producersSustainable = await instance.producersSustainable();

              expect(producersSustainable).to.equal(1);
            });
          });

          context("when new score + producer score result in a negative value", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod1Address, -610);
            });

            it("producer isa score must be -10", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.isaScore).to.equal(-10);
            });

            it("producer must not be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(false);
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

              expect(producer.isa.isaScore).to.equal(1100);
            });

            it("producer must be sustainable", async () => {
              const producer = await instance.getProducer(prod1Address);

              expect(producer.isa.sustainable).to.equal(true);
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

              expect(producer.isa.isaScore).to.equal(1100);
            });
          });

          context("when producer B receive more 100 isa score", () => {
            beforeEach(async () => {
              await instance.setIsaScore(prod2Address, 100);
            });

            it("producer B isa score must be 900", async () => {
              const producer = await instance.getProducer(prod2Address);

              expect(producer.isa.isaScore).to.equal(900);
            });
          });
        });
      });

      context("when producer have reached minimum inspections", () => {
        beforeEach(async () => {
          await instance.setIsaScore(prod1Address, 25);
          await instance.setIsaScore(prod1Address, 25);

          await instance.incrementInspections(prod1Address);
          await instance.incrementInspections(prod1Address);
          await instance.incrementInspections(prod1Address);
        });

        context("when is era 1", () => {
          context("when already have 50 levels in producer contract", () => {
            context("when receives more 25 levels", () => {
              beforeEach(async () => {
                await instance.setIsaScore(prod1Address, 25);
              });

              context("when is not in the pool yet", () => {
                it("set 75 levels to era 1 pool", async () => {
                  const eraLevels = await producerPool.eraLevels(1, prod1Address);

                  expect(eraLevels).to.equal(75);
                });

                it("producer isaScore must be 75", async () => {
                  const producer = await instance.getProducer(prod1Address);

                  expect(producer.isa.isaScore).to.equal(75);
                });
              });

              context("when already in the pool", () => {
                beforeEach(async () => {
                  await instance.setIsaScore(prod1Address, 25);
                });

                it("set 100 levels to era 1 pool", async () => {
                  const eraLevels = await producerPool.eraLevels(1, prod1Address);

                  expect(eraLevels).to.equal(100);
                });

                it("producer isaScore must be 100", async () => {
                  const producer = await instance.getProducer(prod1Address);

                  expect(producer.isa.isaScore).to.equal(100);
                });
              });
            });

            context("when receives more -25 levels", () => {
              context("when is not in the pool yet", () => {
                beforeEach(async () => {
                  await instance.setIsaScore(prod1Address, -25);
                });

                it("set 0 levels to era 1 pool", async () => {
                  const eraLevels = await producerPool.eraLevels(1, prod1Address);

                  expect(eraLevels).to.equal(0);
                });

                it("producer isaScore must be 25", async () => {
                  const producer = await instance.getProducer(prod1Address);

                  expect(producer.isa.isaScore).to.equal(25);
                });
              });

              context("when already in the pool", () => {
                beforeEach(async () => {
                  await instance.setIsaScore(prod1Address, 25);
                  await instance.setIsaScore(prod1Address, -25);
                });

                it("set 50 levels to era 1 pool", async () => {
                  const eraLevels = await producerPool.eraLevels(1, prod1Address);

                  expect(eraLevels).to.equal(50);
                });

                it("producer isaScore must be 50", async () => {
                  const producer = await instance.getProducer(prod1Address);

                  expect(producer.isa.isaScore).to.equal(50);
                });
              });

              context("when have negative values in producer contract", () => {
                beforeEach(async () => {
                  await instance.setIsaScore(prod1Address, -75);
                  await instance.setIsaScore(prod1Address, 30);
                });

                it("set 5 levels to era 1 pool", async () => {
                  const eraLevels = await producerPool.eraLevels(1, prod1Address);

                  expect(eraLevels).to.equal(5);
                });

                it("producer isaScore must be 5", async () => {
                  const producer = await instance.getProducer(prod1Address);

                  expect(producer.isa.isaScore).to.equal(5);
                });
              });
            });
          });
        });

        context("when is era 2", () => {
          context("when already have 50 levels in producer contract", () => {
            context("when receives more 50 levels", () => {
              beforeEach(async () => {
                await advanceBlock(producerPoolArgs.blocksPerEra);
                await instance.setIsaScore(prod1Address, 50);
              });

              it("set 50 levels to era 2 pool", async () => {
                const eraLevels = await producerPool.eraLevels(2, prod1Address);

                expect(eraLevels).to.equal(100);
              });

              it("producer isaScore must be 100", async () => {
                const producer = await instance.getProducer(prod1Address);

                expect(producer.isa.isaScore).to.equal(100);
              });
            });
          });
        });
      });
    });

    context("with not allowed user", () => {
      it("should return error message", async () => {
        await expect(instance.connect(prod1Address).setIsaScore(prod1Address, 50)).to.be.revertedWith(
          "Not allowed caller"
        );
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

                await instance.connect(prod1Address).withdraw();
                await instance.connect(prod2Address).withdraw();
              });

              it("producer A must withdraw 3600000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod1Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });

              it("producer B must withdraw 3600000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod2Address);

                expect(balanceOf).to.equal(3600000000000000000000000n);
              });

              it("producer A current era must be incremented", async () => {
                const producer = await instance.getProducer(prod1Address);

                expect(producer.pool.currentEra).to.equal(2);
              });

              it("producer B current era must be incremented", async () => {
                const producer = await instance.getProducer(prod2Address);

                expect(producer.pool.currentEra).to.equal(2);
              });
            });

            context("when producer have isaScore 100", () => {
              beforeEach(async () => {
                await instance.setIsaScore(prod1Address, 100);
                await advanceBlock(producerPoolArgs.blocksPerEra);
                await instance.connect(prod1Address).withdraw();
              });

              it("must withdraw 7200000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod1Address);

                expect(balanceOf).to.equal(7200000000000000000000000n);
              });

              it("producer current era must be increment", async () => {
                const producer = await instance.getProducer(prod1Address);

                expect(producer.pool.currentEra).to.equal(2);
              });
            });
          });
        });

        context("when producer dont have minimum inspections", () => {
          it("should return error message", async () => {
            await expect(instance.connect(prod1Address).withdraw()).to.be.revertedWith("Minimum inspections");
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
          await expect(instance.connect(prod1Address).withdraw()).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with not producer", () => {
      it("should return error message", async () => {
        await expect(instance.withdraw()).to.be.revertedWith("Only producers pool");
      });
    });
  });

  describe("#producerPoolEra", () => {
    context("when pool is in era 1", () => {
      it("return era equal 1", async () => {
        const currentEra = await instance.producerPoolEra();

        expect(currentEra).to.equal(1);
      });
    });

    context("when pool is in era 2", () => {
      beforeEach(async () => {
        await advanceBlock(producerPoolArgs.blocksPerEra);
      });

      it("return era equal 1", async () => {
        const currentEra = await instance.producerPoolEra();

        expect(currentEra).to.equal(2);
      });
    });
  });
});
