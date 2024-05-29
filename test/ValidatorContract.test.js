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
  let inspectorPool;
  let inspectorContract;
  let rcToken;
  let owner,
    producer1Address,
    inspector1Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    validator5Address,
    validator6Address,
    validator7Address,
    validator8Address,
    validator9Address,
    validator10Address,
    validator11Address,
    validator12Address,
    validator13Address,
    validator14Address,
    validator15Address,
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
    blocksPerEra: 16,
  };

  const inspectorPoolArgs = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 20,
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

  const addInspector = async (name, from) => {
    await inspectorContract.connect(from).addInspector(name, "photoURL");
  };

  const denyUser = async (userAddress) => {
    await userContract.setDeniedType(userAddress);
  };

  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  beforeEach(async () => {
    [
      owner,
      producer1Address,
      inspector1Address,
      validator1Address,
      validator2Address,
      validator3Address,
      validator4Address,
      validator5Address,
      validator6Address,
      validator7Address,
      validator8Address,
      validator9Address,
      validator10Address,
      validator11Address,
      validator12Address,
      validator13Address,
      validator14Address,
      validator15Address,
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

    const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
    inspectorPool = await inspectorPoolFactory.deploy(
      rcToken.target,
      inspectorPoolArgs.halving,
      inspectorPoolArgs.totalEras,
      inspectorPoolArgs.blocksPerEra
    );

    const maxPenalties = 2;
    const inspectorContractFactory = await ethers.getContractFactory("InspectorContract");
    inspectorContract = await inspectorContractFactory.deploy(userContract.target, inspectorPool.target, maxPenalties);

    const validatorContractFactory = await ethers.getContractFactory("ValidatorContract");
    instance = await validatorContractFactory.deploy(
      userContract.target,
      producerContract.target,
      validatorPool.target,
      inspectorContract.target,
      firstValidatorLimit,
      secondValidatorLimit
    );

    await userContract.newAllowedCaller(instance.target);
    await userContract.newAllowedCaller(producerContract.target);
    await userContract.newAllowedCaller(inspectorContract.target);
    await userContract.newAllowedCaller(owner);
    await producerContract.newAllowedCaller(instance.target);
    await producerContract.newAllowedCaller(owner);
    await producerPool.newAllowedCaller(producerContract.target);
    await producerPool.newAllowedCaller(owner);
    await validatorPool.newAllowedCaller(instance.target);
    await inspectorPool.newAllowedCaller(inspectorContract.target);
    await inspectorContract.newAllowedCaller(instance.target);
    await inspectorContract.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);

    await rcToken.addContractPool(validatorPool.target, validatorPoolArgs.totalTokens);
    await rcToken.addContractPool(producerContract.target, producerPoolArgs.totalTokens);

    await addInvitation(owner, validator1Address, userTypes.Validator, owner);
    await addInvitation(owner, inspector1Address, userTypes.Inspector, owner);
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

  describe("#addUserValidation", () => {
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
            instance.connect(validator1Address).addUserValidation(validator2Address, "justification")
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

            await instance.connect(validator1Address).addUserValidation(validator2Address, "my justification");
          });

          it("should add validation", async () => {
            const validations = await instance.getUserValidations(validator2Address);

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
              await addInvitation(owner, producer1Address, userTypes.Producer, owner);
              await addProducer("Producer A", producer1Address);

              await instance.connect(validator1Address).addUserValidation(producer1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(producer1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(producer1Address);

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

          context("with inspector", () => {
            beforeEach(async () => {
              await addInspector("Inspector A", inspector1Address);

              await inspectorContract.incrementInspections(inspector1Address);
              await inspectorContract.incrementInspections(inspector1Address);
              await inspectorContract.incrementInspections(inspector1Address);

              await instance.connect(validator1Address).addUserValidation(inspector1Address, "my justification");
              await instance.connect(validator3Address).addUserValidation(inspector1Address, "my justification");
            });

            it("should add validation", async () => {
              const validations = await instance.getUserValidations(inspector1Address);

              expect(validations[0].justification).to.equal("my justification");
              expect(validations.length).to.equal(2);
            });

            it("user type must be denied", async () => {
              const user = await userContract.getUser(inspector1Address);
              const DENIED = 9;

              expect(user).to.equal(DENIED);
            });

            it("remove user levels from pool", async () => {
              const levelsEra1 = await inspectorPool.eraLevels(1, inspector1Address);
              const levelsEra2 = await inspectorPool.eraLevels(2, inspector1Address);

              expect(levelsEra1).to.equal(0);
              expect(levelsEra2).to.equal(0);
            });

            it("remove user levels from inspector", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.pool.level).to.equal(0);
            });
          });
        });
      });
    });

    context("when caller is not validator", () => {
      it("should return error", async () => {
        expect(instance.connect(otherAddress).addUserValidation(validator1Address, "justification")).to.be.revertedWith(
          "User must be a validator"
        );
      });
    });
  });

  describe("#addInspectionValidation", () => {
    context("with allowed caller", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
      });

      context("when validator already voted to inspection", () => {
        beforeEach(async () => {
          inspectionMock = {
            id: 1,
            status: 3,
            createdBy: producer1Address,
            acceptedBy: inspector1Address,
            isaScore: 10,
            report: "",
            validationsCount: 0,
            createdAt: 100,
            acceptedAt: 100,
            inspectedAtEra: 10,
            invalidatedAt: 0,
          };

          await instance.connect(owner).addInspectionValidation(inspectionMock, "justification", validator1Address);
        });

        it("should return error", async () => {
          expect(
            instance.connect(owner).addInspectionValidation(inspectionMock, "justification", validator1Address)
          ).to.be.revertedWith("Already voted");
        });
      });

      context("when validator did not vote to inspection", () => {
        context("when inspection validations is => majorityValidatorsCount (addPenalty == true)", () => {
          context("when inspector total penalties is >= inspectorContract.maxPenalties", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                createdBy: producer1Address,
                acceptedBy: inspector1Address,
                isaScore: 20,
                report: "",
                validationsCount: 2,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await addInvitation(owner, producer1Address, userTypes.Producer, owner);
              await addProducer("Producer A", producer1Address);

              await inspectorContract.incrementInspections(inspectionMock.acceptedBy);
              await producerContract.incrementInspections(inspectionMock.createdBy);
              await producerContract.incrementInspections(inspectionMock.createdBy);
              await producerContract.incrementInspections(inspectionMock.createdBy);

              await producerContract.setIsaScore(inspectionMock.createdBy, 20);

              await inspectorContract.addPenalty(inspectionMock.acceptedBy, 2);
              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
            });

            it("deny inspector", async () => {
              const newInspectorType = await userContract.getUser(inspectionMock.acceptedBy);

              expect(newInspectorType).to.equal(9);
            });

            it("decrement total inspections of inspector", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.totalInspections).to.equal(0);
            });

            it("decrement total inspections of producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.totalInspections).to.equal(2);
            });

            it("remove inspection isa level from producer isaScore", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.isa.isaScore).to.equal(0);
            });

            it("remove inspection isa level from producer pool", async () => {
              const levels = await producerPool.eraLevels(3, producer1Address);

              expect(levels).to.equal(0);
            });
          });

          context("when inspectorTotal penalties is < inspectorContract.maxPenalties", () => {
            beforeEach(async () => {
              inspectionMock = {
                id: 1,
                status: 3,
                createdBy: producer1Address,
                acceptedBy: inspector1Address,
                isaScore: 20,
                report: "",
                validationsCount: 2,
                createdAt: 100,
                acceptedAt: 100,
                inspectedAtEra: 10,
                invalidatedAt: 0,
              };

              await addInvitation(owner, producer1Address, userTypes.Producer, owner);
              await addProducer("Producer A", producer1Address);

              await inspectorContract.incrementInspections(inspectionMock.acceptedBy);
              await producerContract.incrementInspections(inspectionMock.createdBy);
              await producerContract.incrementInspections(inspectionMock.createdBy);
              await producerContract.incrementInspections(inspectionMock.createdBy);

              await producerContract.setIsaScore(inspectionMock.createdBy, 20);

              await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
            });

            it("inspector is the same", async () => {
              const newInspectorType = await userContract.getUser(inspectionMock.acceptedBy);

              expect(newInspectorType).to.equal(0);
            });

            it("decrement total inspections of inspector", async () => {
              const inspector = await inspectorContract.getInspector(inspector1Address);

              expect(inspector.totalInspections).to.equal(0);
            });

            it("decrement total inspections of producer", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.totalInspections).to.equal(2);
            });

            it("remove inspection isa level from producer isaScore", async () => {
              const producer = await producerContract.getProducer(producer1Address);

              expect(producer.isa.isaScore).to.equal(0);
            });

            it("remove inspection isa level from producer pool", async () => {
              const levels = await producerPool.eraLevels(3, producer1Address);

              expect(levels).to.equal(0);
            });
          });
        });

        context("when inspection validations is < majorityValidatorsCount (addPenalty == false)", () => {
          beforeEach(async () => {
            inspectionMock = {
              id: 1,
              status: 3,
              createdBy: producer1Address,
              acceptedBy: inspector1Address,
              isaScore: 20,
              report: "",
              validationsCount: 1,
              createdAt: 100,
              acceptedAt: 100,
              inspectedAtEra: 10,
              invalidatedAt: 0,
            };

            await instance.connect(owner).addInspectionValidation(inspectionMock, "foo", validator1Address);
          });

          it("add inspection validation", async () => {
            const validations = await instance.getInspectionValidations(1);
            const validation = validations[0];

            expect(validations.length).to.equal(1);
            expect(validation.validator).to.equal(validator1Address.address);
            expect(validation.resourceId).to.equal(1);
            expect(validation.justification).to.equal("foo");
            expect(validation.majorityValidatorsCount).to.equal(2);
          });
        });
      });
    });

    context("without allowed caller", () => {
      it("should return error", async () => {
        expect(
          instance.connect(owner).addInspectionValidation(1, "justification", validator1Address)
        ).to.be.revertedWith("Not allowed caller");
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

    context("when have 8 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
      });

      it("returns 4", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(4);
      });
    });

    context("when have 10 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);
        await addInvitation(owner, validator9Address, userTypes.Validator, owner);
        await addInvitation(owner, validator10Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
        await addValidator(validator9Address);
        await addValidator(validator10Address);
      });

      it("returns 2", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(2);
      });
    });

    context("when have 14 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);
        await addInvitation(owner, validator9Address, userTypes.Validator, owner);
        await addInvitation(owner, validator10Address, userTypes.Validator, owner);
        await addInvitation(owner, validator11Address, userTypes.Validator, owner);
        await addInvitation(owner, validator12Address, userTypes.Validator, owner);
        await addInvitation(owner, validator13Address, userTypes.Validator, owner);
        await addInvitation(owner, validator14Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
        await addValidator(validator9Address);
        await addValidator(validator10Address);
        await addValidator(validator11Address);
        await addValidator(validator12Address);
        await addValidator(validator13Address);
        await addValidator(validator14Address);
      });

      it("returns 3", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(3);
      });
    });

    context("when have 15 validators", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);
        await addInvitation(owner, validator5Address, userTypes.Validator, owner);
        await addInvitation(owner, validator6Address, userTypes.Validator, owner);
        await addInvitation(owner, validator7Address, userTypes.Validator, owner);
        await addInvitation(owner, validator8Address, userTypes.Validator, owner);
        await addInvitation(owner, validator9Address, userTypes.Validator, owner);
        await addInvitation(owner, validator10Address, userTypes.Validator, owner);
        await addInvitation(owner, validator11Address, userTypes.Validator, owner);
        await addInvitation(owner, validator12Address, userTypes.Validator, owner);
        await addInvitation(owner, validator13Address, userTypes.Validator, owner);
        await addInvitation(owner, validator14Address, userTypes.Validator, owner);
        await addInvitation(owner, validator15Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
        await addValidator(validator5Address);
        await addValidator(validator6Address);
        await addValidator(validator7Address);
        await addValidator(validator8Address);
        await addValidator(validator9Address);
        await addValidator(validator10Address);
        await addValidator(validator11Address);
        await addValidator(validator12Address);
        await addValidator(validator13Address);
        await addValidator(validator14Address);
        await addValidator(validator15Address);
      });

      it("returns 1", async () => {
        const majorityValidatorsCount = await instance.majorityValidatorsCount();

        expect(majorityValidatorsCount).to.equal(1);
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
