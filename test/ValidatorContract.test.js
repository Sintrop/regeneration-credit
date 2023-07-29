const ValidatorContract = artifacts.require("ValidatorContract");
const UserContract = artifacts.require("UserContract");
const ProducerContract = artifacts.require("ProducerContract");
const DeveloperContract = artifacts.require("DeveloperContract");
const ProducerPool = artifacts.require("ProducerPool");
const DeveloperPool = artifacts.require("DeveloperPool");
const SacToken = artifacts.require("SacToken");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ValidatorContract", (accounts) => {
  let instance;
  let userContract;
  let producerContract;
  let developerContract;
  let producerPool;
  let developerPool;
  let sacToken;
  let [
    ownerAddress,
    producer1Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    validator5Address,
    validator6Address,
    otherAddress,
  ] = accounts;

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  let developerPoolArgs = {
    totalDeveloperPoolTokens: "15000000000000000000000000",
    blocksPerEra: 30,
    eraMax: 5,
  };

  const addValidator = async (address) => {
    await instance.addValidator({ from: address });
  };

  const addProducer = async (name, address) => {
    await producerContract.addProducer(10, name, "photoURL", "135465-005", { from: address });
  };

  const denyUser = async (userAddress) => {
    await userContract.setDeniedType(userAddress);
  };

  beforeEach(async () => {
    sacToken = await SacToken.new("150000000000000000000000000000");
    userContract = await UserContract.new();

    producerPool = await ProducerPool.new(
      sacToken.address,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    developerPool = await DeveloperPool.new(sacToken.address, developerPoolArgs.blocksPerEra, developerPoolArgs.eraMax);

    producerContract = await ProducerContract.new(userContract.address, producerPool.address);
    developerContract = await DeveloperContract.new(userContract.address, developerPool.address);

    instance = await ValidatorContract.new(userContract.address, producerContract.address, developerContract.address);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(developerContract.address);
    await userContract.newAllowedCaller(ownerAddress);
    await instance.newAllowedUser(validator1Address);
    await producerContract.newAllowedCaller(instance.address);
    await producerPool.newAllowedCaller(producerContract.address);
    await sacToken.addContractPool(instance.address, producerPoolArgs.totalTokens);
    await sacToken.addContractPool(producerContract.address, producerPoolArgs.totalTokens);
  });

  describe("#addValidator", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addValidator(validator2Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
      context("when validator exists", () => {
        it("should return error", async () => {
          await addValidator(validator1Address);
          await expectRevert(addValidator(validator1Address), "This validator already exist");
        });
      });

      context("when validator don't exist", () => {
        it("should create validator", async () => {
          await addValidator(validator1Address);
          const validator = await instance.getValidator(validator1Address);

          assert.equal(validator.validatorWallet, validator1Address);
        });

        it("should increment validatorCount after create validator", async () => {
          await addValidator(validator1Address);
          const validatorsCount = await instance.validatorsCount();

          assert.equal(validatorsCount, 1);
        });

        it("should add created validator in validatorList (array)", async () => {
          await addValidator(validator1Address);

          const validators = await instance.getValidators();

          assert.equal(validators[0].validatorWallet, validator1Address);
        });

        it("should add created validator in userType contract as a VALIDATOR", async () => {
          await addValidator(validator1Address);

          const userType = await userContract.getUser(validator1Address);
          const VALIDATOR = 8;

          assert.equal(userType, VALIDATOR);
        });
      });
    });
  });

  describe("#addValidation", () => {
    context("when caller is validator", () => {
      context("when user already is denied", () => {
        beforeEach(async () => {
          await instance.newAllowedUser(validator2Address);
          await addValidator(validator1Address);
          await addValidator(validator2Address);
          await denyUser(validator2Address);
        });

        it("should return error", async () => {
          await expectRevert(
            instance.addValidation(validator2Address, "justification", { from: validator1Address }),
            "User already denied"
          );
        });
      });

      context("when user is not denied", () => {
        context("when user validations count is not equal majorityValidatorsCount", () => {
          beforeEach(async () => {
            await instance.newAllowedUser(validator2Address);
            await instance.newAllowedUser(validator3Address);
            await instance.newAllowedUser(validator4Address);

            await addValidator(validator1Address);
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.addValidation(validator2Address, "my justification", { from: validator1Address });
          });

          it("should add validation", async () => {
            const validations = await instance.getValidations(validator2Address);

            assert.equal(validations[0].justification, "my justification");
            assert.equal(validations.length, 1);
          });

          it("user type must be the same", async () => {
            const user = await userContract.getUser(validator2Address);
            const VALIDATOR = 8;

            assert.equal(user, VALIDATOR);
          });
        });

        context("when user validations count is equal or bigger than majorityValidatorsCount", () => {
          beforeEach(async () => {
            await instance.newAllowedUser(validator2Address);
            await instance.newAllowedUser(validator3Address);
            await instance.newAllowedUser(validator4Address);

            await addValidator(validator1Address);
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);
          });

          context("with producer", () => {
            beforeEach(async () => {
              await addProducer("Producer A", producer1Address);

              await instance.addValidation(producer1Address, "my justification", { from: validator1Address });
              await instance.addValidation(producer1Address, "my justification", { from: validator3Address });
            });

            it("should add validation", async () => {
              const validations = await instance.getValidations(producer1Address);

              assert.equal(validations[0].justification, "my justification");
              assert.equal(validations.length, 2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(producer1Address);
              const DENIED = 9;

              assert.equal(user, DENIED);
            });

            it("remove user levels from pool", async () => {
              const levels = await producerPool.eraLevels(1, producer1Address);

              assert.equal(levels, 0);
            });

            it("remove user isaScore from producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              assert.equal(producer.isa.isaScore, 0);
            });
          });
        });
      });
    });

    context("when caller is not validator", () => {
      it("should return error", async () => {
        await expectRevert(
          instance.addValidation(validator1Address, "justification", { from: otherAddress }),
          "User must be a validator"
        );
      });
    });
  });

  describe("#getValidator", () => {
    context("when validator exists", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should return a validator", async () => {
        const validator = await instance.getValidator(validator1Address);

        assert.equal(validator.validatorWallet, validator1Address);
      });
    });

    context("when validator don't exists", () => {
      it("should return a validator", async () => {
        const validator = await instance.getValidator(validator2Address);

        assert.equal(validator.validatorWallet, "0x0000000000000000000000000000000000000000");
      });
    });
  });

  describe("#getValidators", () => {
    context("when has validators", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should return validators", async () => {
        const validators = await instance.getValidators();

        assert.equal(validators.length, 1);
      });
    });

    context("when don't has validators", () => {
      it("should return validators equal zero", async () => {
        const validators = await instance.getValidators();

        assert.equal(validators.length, 0);
      });
    });
  });

  describe("#validatorExists", () => {
    context("when validator exists", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("returns true", async () => {
        const validatorExists = await instance.validatorExists(validator1Address);

        assert.equal(validatorExists, true);
      });
    });

    context("when validator don't exists", () => {
      it("returns false", async () => {
        const validatorExists = await instance.validatorExists(validator2Address);

        assert.equal(validatorExists, false);
      });
    });
  });

  describe("#majorityValidatorsCount", () => {
    context("when have 2 validators", () => {
      beforeEach(async () => {
        await instance.newAllowedUser(validator2Address);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
      });

      it("returns 1", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();
        const majorityValidatorsCountMinimum = 1;

        assert.equal(majorityValidatorsCount, majorityValidatorsCountMinimum);
      });
    });

    context("when have 6 validators", () => {
      beforeEach(async () => {
        await instance.newAllowedUser(validator2Address);
        await instance.newAllowedUser(validator3Address);
        await instance.newAllowedUser(validator4Address);
        await instance.newAllowedUser(validator5Address);
        await instance.newAllowedUser(validator6Address);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
      });

      it("returns 3", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        assert.equal(majorityValidatorsCount, 3);
      });
    });
  });
});
