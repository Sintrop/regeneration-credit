const ValidatorContract = artifacts.require("ValidatorContract");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ValidatorContract", (accounts) => {
  let instance;
  let userContract;
  let [
    ownerAddress,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    validator5Address,
    validator6Address,
    otherAddress,
  ] = accounts;

  const addValidator = async (name, address) => {
    await instance.addValidator(name, "photoURL", { from: address });
  };

  const denyUser = async (userAddress) => {
    await userContract.setDeniedType(userAddress);
  };

  beforeEach(async () => {
    userContract = await UserContract.new();

    instance = await ValidatorContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await userContract.newAllowedCaller(ownerAddress);
    await instance.newAllowedUser(validator1Address);
  });

  describe("#addValidator", () => {
    context("when is not an allowed user", () => {
      it("should return error message", async () => {
        await expectRevert(addValidator("Validator B", validator2Address), "Not allowed user");
      });
    });

    context("when is an allowed user", () => {
      context("when validator exists", () => {
        it("should return error", async () => {
          await addValidator("Validator A", validator1Address);
          await expectRevert(addValidator("Validator A", validator1Address), "This validator already exist");
        });
      });

      context("when validator don't exist", () => {
        it("should create validator", async () => {
          await addValidator("Validator A", validator1Address);
          const validator = await instance.getValidator(validator1Address);

          assert.equal(validator.validatorWallet, validator1Address);
        });

        it("should increment validatorCount after create validator", async () => {
          await addValidator("Validator A", validator1Address);
          const validatorsCount = await instance.validatorsCount();

          assert.equal(validatorsCount, 1);
        });

        it("should add created validator in validatorList (array)", async () => {
          await addValidator("Validator A", validator1Address);

          const validators = await instance.getValidators();

          assert.equal(validators[0].validatorWallet, validator1Address);
        });

        it("should add created validator in userType contract as a VALIDATOR", async () => {
          await addValidator("Validator A", validator1Address);

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
          await addValidator("Validator A", validator1Address);
          await addValidator("Validator B", validator2Address);
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
            await addValidator("Validator A", validator1Address);
            await addValidator("Validator B", validator2Address);

            await instance.addValidation(validator2Address, "my justification", { from: validator1Address });
          });

          it("should add validation", async () => {
            const validations = await instance.getValidations(validator2Address);

            assert.equal(validations[0].justification, "my justification");
            assert.equal(validations.length, 1);
          });

          it("user type must be validator", async () => {
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
            await addValidator("Validator A", validator1Address);
            await addValidator("Validator B", validator2Address);
            await addValidator("Validator C", validator3Address);
            await addValidator("Validator D", validator4Address);

            await instance.addValidation(validator2Address, "my justification", { from: validator1Address });
            await instance.addValidation(validator2Address, "my justification", { from: validator3Address });
          });

          it("should add validation", async () => {
            const validations = await instance.getValidations(validator2Address);

            assert.equal(validations[0].justification, "my justification");
            assert.equal(validations.length, 2);
          });

          it("user type must be denied", async () => {
            const user = await userContract.getUser(validator2Address);
            const DENIED = 9;

            assert.equal(user, DENIED);
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
        await addValidator("Validator A", validator1Address);
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
        await addValidator("Validator A", validator1Address);
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
        await addValidator("Validator A", validator1Address);
      });

      it("should return true when exists", async () => {
        const validatorExists = await instance.validatorExists(validator1Address);

        assert.equal(validatorExists, true);
      });
    });

    context("when validator don't exists", () => {
      it("should return false when don't exist", async () => {
        const validatorExists = await instance.validatorExists(validator2Address);

        assert.equal(validatorExists, false);
      });
    });
  });

  describe("#majorityValidatorsCount", () => {
    context("when have less than minimum validators", () => {
      beforeEach(async () => {
        await instance.newAllowedUser(validator2Address);
        await addValidator("Validator A", validator1Address);
        await addValidator("Validator B", validator2Address);
      });

      it("must returns minimum majorityValidatorsCount", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();
        const majorityValidatorsCountMinimum = 2;

        assert.equal(majorityValidatorsCount, majorityValidatorsCountMinimum);
      });
    });

    context("when have more than minimum validators", () => {
      beforeEach(async () => {
        await instance.newAllowedUser(validator2Address);
        await instance.newAllowedUser(validator3Address);
        await instance.newAllowedUser(validator4Address);
        await instance.newAllowedUser(validator5Address);
        await instance.newAllowedUser(validator6Address);
        await addValidator("Validator A", validator1Address);
        await addValidator("Validator B", validator2Address);
        await addValidator("Validator C", validator3Address);
        await addValidator("Validator D", validator4Address);
        await addValidator("Validator E", validator5Address);
        await addValidator("Validator F", validator6Address);
      });

      it("must returns 3", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        assert.equal(majorityValidatorsCount, 3);
      });
    });
  });
});
