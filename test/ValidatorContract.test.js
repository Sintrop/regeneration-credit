const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { userContractDeployed } = require("./shared/user_contract_deployed");

describe("ValidatorContract", () => {
  let instance;
  let userContract;
  let producerContract;
  let producerPool;
  let validatorPool;
  let rcToken;
  let owner,
    producer1Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    validator5Address,
    validator6Address,
    otherAddress;

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const validatorPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const addValidator = async (from) => {
    await instance.connect(from).addValidator();
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const addProducer = async (name, from) => {
    await producerContract.connect(from).addProducer(10, name, "photoURL", "135465-005");
  };

  const denyUser = async (userAddress) => {
    await userContract.setDeniedType(userAddress);
  };

  beforeEach(async () => {
    [
      owner,
      producer1Address,
      validator1Address,
      validator2Address,
      validator3Address,
      validator4Address,
      validator5Address,
      validator6Address,
      otherAddress,
    ] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();

    const producerPoolFactory = await ethers.getContractFactory("ProducerPool");
    producerPool = await producerPoolFactory.deploy(
      rcToken.target,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    const validatorPoolFactory = await ethers.getContractFactory("ValidatorPool");
    validatorPool = await validatorPoolFactory.deploy(
      rcToken.target,
      validatorPoolArgs.halving,
      validatorPoolArgs.totalEras,
      validatorPoolArgs.blocksPerEra
    );

    const producerContractFactory = await ethers.getContractFactory("ProducerContract");
    producerContract = await producerContractFactory.deploy(userContract.target, producerPool.target);

    const validatorContractFactory = await ethers.getContractFactory("ValidatorContract");
    instance = await validatorContractFactory.deploy(
      userContract.target,
      producerContract.target,
      validatorPool.target
    );

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(producerContract.target);
    await userContract.newAllowedCaller(owner);
    await producerContract.newAllowedCaller(instance.target);
    await producerPool.newAllowedCaller(producerContract.target);
    await validatorPool.newAllowedCaller(instance.target);
    await rcToken.addContractPool(validatorPool.target, validatorPoolArgs.totalTokens);
    await rcToken.addContractPool(producerContract.target, producerPoolArgs.totalTokens);

    await addInvitation(owner, validator1Address, userTypes.Validator, owner);
  });

  describe("#addValidator", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expect(addValidator(validator2Address)).to.be.revertedWith("Invalid invitation");
      });
    });

    context("when is an allowed user", () => {
      context("when validator exists", () => {
        it("should return error", async () => {
          await addValidator(validator1Address);
          await expect(addValidator(validator1Address)).to.be.revertedWith("This validator already exist");
        });
      });

      context("when validator don't exist", () => {
        it("should create validator", async () => {
          await addValidator(validator1Address);
          const validator = await instance.getValidator(validator1Address);

          expect(validator.validatorWallet).to.equal(validator1Address.address);
        });

        it("should increment validatorCount after create validator", async () => {
          await addValidator(validator1Address);
          const validatorsCount = await instance.validatorsCount();

          expect(validatorsCount).to.equal(1);
        });

        it("should add created validator in validatorList (array)", async () => {
          await addValidator(validator1Address);

          const validators = await instance.getValidators();

          expect(validators[0].validatorWallet).to.equal(validator1Address.address);
        });

        it("should add created validator in userType contract as a VALIDATOR", async () => {
          await addValidator(validator1Address);

          const userType = await userContract.getUser(validator1Address);
          const VALIDATOR = 8;

          expect(userType).to.equal(VALIDATOR);
        });
      });
    });
  });

  describe("#addValidation", () => {
    context("when caller is validator", () => {
      context("when user already is denied", () => {
        beforeEach(async () => {
          await addInvitation(owner, validator2Address, userTypes.Validator, owner);
          await addValidator(validator1Address);
          await addValidator(validator2Address);
          await denyUser(validator2Address);
        });

        it("should return error", async () => {
          expect(
            instance.connect(validator1Address).addValidation(validator2Address, "justification")
          ).to.be.revertedWith("User already denied");
        });
      });

      context("when user is not denied", () => {
        context("when user validations count is not equal majorityValidatorsCount", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addInvitation(owner, validator3Address, userTypes.Validator, owner);
            await addInvitation(owner, validator4Address, userTypes.Validator, owner);

            await addValidator(validator1Address);
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);

            await instance.connect(validator1Address).addValidation(validator2Address, "my justification");
          });

          it("should add validation", async () => {
            const validations = await instance.getValidations(validator2Address);

            expect(validations[0].justification).to.equal("my justification");
            expect(validations.length).to.equal(1);
          });

          it("user type must be the same", async () => {
            const user = await userContract.getUser(validator2Address);
            const VALIDATOR = 8;

            expect(user).to.equal(VALIDATOR);
          });
        });

        context("when user validations count is equal or bigger than majorityValidatorsCount", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addInvitation(owner, validator3Address, userTypes.Validator, owner);
            await addInvitation(owner, validator4Address, userTypes.Validator, owner);

            await addValidator(validator1Address);
            await addValidator(validator2Address);
            await addValidator(validator3Address);
            await addValidator(validator4Address);
          });

          context("with producer", () => {
            beforeEach(async () => {
              await addProducer("Producer A", producer1Address);

              await instance.connect(validator1Address).addValidation(producer1Address, "my justification");
              await instance.connect(validator3Address).addValidation(producer1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getValidations(producer1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(producer1Address);
              const DENIED = 9;

              expect(user).to.equal(DENIED);
            });

            it("remove user levels from pool", async () => {
              const levels = await producerPool.eraLevels(1, producer1Address);

              expect(levels).to.equal(0);
            });

            it("remove user isaScore from producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.isa.isaScore).to.equal(0);
            });
          });
        });
      });
    });

    context("when caller is not validator", () => {
      it("should return error", async () => {
        expect(instance.connect(otherAddress).addValidation(validator1Address, "justification")).to.be.revertedWith(
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

        expect(validator.validatorWallet).to.equal(validator1Address.address);
      });
    });

    context("when validator don't exists", () => {
      it("should return a validator", async () => {
        const validator = await instance.getValidator(validator2Address);

        expect(validator.validatorWallet).to.equal("0x0000000000000000000000000000000000000000");
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

        expect(validators.length).to.equal(1);
      });
    });

    context("when don't has validators", () => {
      it("should return validators equal zero", async () => {
        const validators = await instance.getValidators();

        expect(validators.length).to.equal(0);
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

        expect(validatorExists).to.equal(true);
      });
    });

    context("when validator don't exists", () => {
      it("returns false", async () => {
        const validatorExists = await instance.validatorExists(validator2Address);

        expect(validatorExists).to.equal(false);
      });
    });
  });

  describe("#majorityValidatorsCount", () => {
    context("when have 2 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addValidator(validator1Address);
        await addValidator(validator2Address);
      });

      it("returns 1", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();
        const majorityValidatorsCountMinimum = 1;

        expect(majorityValidatorsCount).to.equal(majorityValidatorsCountMinimum);
      });
    });

    context("when have 6 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
      });

      it("returns 3", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(3);
      });
    });
  });

  describe("#addLevel", () => {
    context("when is not a validator", () => {
      it("should return error", async () => {
        await expect(instance.connect(producer1Address).addLevel()).to.be.revertedWith("User must be a validator");
      });
    });

    context("when is a validator", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
      });

      it("should add 1 level", async () => {
        await instance.connect(validator1Address).addLevel();

        const validator = await instance.getValidator(validator1Address);

        expect(validator.pool.level).to.equal(1);
      });
    });

    context("when is a validator and has already added a level in that era", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
        await instance.connect(validator1Address).addLevel();
      });

      it("should return error", async () => {
        await expect(instance.connect(validator1Address).addLevel()).to.be.revertedWith("Only once per era");
      });
    });
  });

  describe("#withdraw", () => {
    context("when is a validator", () => {
      beforeEach(async () => {
        await addValidator(validator1Address);
        await instance.connect(validator1Address).addLevel();
      });

      context("when validator is in era 1 and current era is 1", () => {
        it("should return error", async () => {
          await expect(instance.connect(validator1Address).withdraw()).to.be.revertedWith("Can't approve withdraw");
        });
      });

      context("when validator is in era 1 and current era is 2", () => {
        context("with one validator", () => {
          beforeEach(async () => {
            await advanceBlock(validatorPoolArgs.blocksPerEra);
            await instance.connect(validator1Address).withdraw();
          });

          it("withdraw 1200000000000000000000000 tokens", async () => {
            const balanceOf = await validatorPool.balanceOf(validator1Address);
            const expectedBalance = 1200000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });

        context("with two validators", () => {
          beforeEach(async () => {
            await addInvitation(owner, validator2Address, userTypes.Validator, owner);
            await addValidator(validator2Address);
            await instance.connect(validator2Address).addLevel();

            await advanceBlock(validatorPoolArgs.blocksPerEra);

            await instance.connect(validator1Address).withdraw();
          });

          it("withdraw 600000000000000000000000n tokens", async () => {
            const balanceOf = await validatorPool.balanceOf(validator1Address);
            const expectedBalance = 600000000000000000000000n;

            expect(balanceOf).to.equal(expectedBalance);
          });
        });
      });
    });

    context("when is not a validator", () => {
      it("should return error", async () => {
        await expect(instance.connect(producer1Address).withdraw()).to.be.revertedWith("Pool only to validators");
      });
    });
  });
});
