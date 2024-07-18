const { userTypes } = require("./shared/user_types");
const { userContractDeployed } = require("./shared/user_contract_deployed");
const { rcTokenDeployed } = require("./shared/rc_token_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZERO_ADDRESS } = require("./shared/zeroAddress");

describe("Sintrop", () => {
  let instance;
  let userContract;
  let inspectorContract;
  let producerContract;
  let researcherContract;
  let activistContract;
  let researcherPool;
  let inspectorPool;
  let producerPool;
  let validatorPool;
  let activistPool;

  const inspectorMaxPenalties = 2;

  let owner,
    producerAddress,
    producer2Address,
    inspectorAddress,
    inspector2Address,
    resea1Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
    activist1Address;

  const STATUS = {
    open: 0,
    accepted: 1,
    inspected: 2,
    expired: 3,
    invalidated: 4,
  };

  const USER_TYPES = {
    denied: 9,
  };

  const timeBetweenWorks = 6;
  const researcherMaxPenalties = 3;

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    totalEras: 50,
    blocksPerEra: 50,
  };

  const sintropArgs = {
    timeBetweenInspections: 20,
    blocksToExpireAcceptedInspection: 15,
    allowedInitialRequests: 1,
    acceptInspectionDelayBlocks: 5,
  };

  const researcherPoolargs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const inspectorPoolargs = {
    totalTokens: "180000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const validatorPoolargs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 12,
  };

  const activistPoolArgs = {
    totalTokens: "30000000000000000000000000",
    halving: 12,
    totalEras: 96,
    blocksPerEra: 13,
  };

  const addProducer = async (name, from) => {
    await producerContract.connect(from).addProducer(10, name, "photoURL", "135465-005");
  };

  const addInspector = async (name, from) => {
    await inspectorContract.connect(from).addInspector(name, "photoURL");
  };

  const addActivist = async (name, from) => {
    await activistContract.connect(from).addActivist(name, "photoURL");
  };

  const addResearcher = async (name, from) => {
    await researcherContract.connect(from).addResearcher(name, "photoURL");
  };

  const addValidator = async (from) => {
    await validatorContract.connect(from).addValidator();
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await userContract.connect(from).addInvitation(inviter, invited, userType);
  };

  const addCategory = async (name, from) => {
    const description = `The description of ${name}`;

    const isaDescriptions = [
      {
        isaId: 1,
        description: "Description for isaId 1 to category",
      },
      {
        isaId: 2,
        description: "Description for isaId 2 to category",
      },
    ];

    await categoryContract.connect(from).addCategory(name, description, isaDescriptions);
  };

  const isas = () => {
    return [
      {
        categoryId: 1,
        isaId: 1,
        indicator: 10,
      },
      {
        categoryId: 2,
        isaId: 1,
        indicator: 10,
      },
      {
        categoryId: 3,
        isaId: 2,
        indicator: 10,
      },
    ];
  };

  const report = "Hash";

  const requestInspection = async (from) => {
    await instance.connect(from).requestInspection();
  };

  const acceptInspection = async (inspectionId, from) => {
    await instance.connect(from).acceptInspection(inspectionId);
  };

  const realizeInspection = async (id, report, isas_, from) => {
    await instance.connect(from).realizeInspection(id, report, isas_);
  };

  const firstValidatorLimit = 8;
  const secondValidatorLimit = 14;

  beforeEach(async () => {
    [
      owner,
      producerAddress,
      producer2Address,
      inspectorAddress,
      inspector2Address,
      resea1Address,
      validator1Address,
      validator2Address,
      validator3Address,
      validator4Address,
      activist1Address,
    ] = await ethers.getSigners();

    rcToken = await rcTokenDeployed();
    userContract = await userContractDeployed();

    const researcherPoolFactory = await ethers.getContractFactory("ResearcherPool");
    researcherPool = await researcherPoolFactory.deploy(
      rcToken.target,
      researcherPoolargs.halving,
      researcherPoolargs.totalEras,
      researcherPoolargs.blocksPerEra
    );

    const inspectorPoolFactory = await ethers.getContractFactory("InspectorPool");
    inspectorPool = await inspectorPoolFactory.deploy(
      rcToken.target,
      inspectorPoolargs.halving,
      inspectorPoolargs.totalEras,
      inspectorPoolargs.blocksPerEra
    );

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
      validatorPoolargs.halving,
      validatorPoolargs.totalEras,
      validatorPoolargs.blocksPerEra
    );

    const activistPoolFactory = await ethers.getContractFactory("ActivistPool");
    activistPool = await activistPoolFactory.deploy(
      rcToken.target,
      activistPoolArgs.halving,
      activistPoolArgs.totalEras,
      activistPoolArgs.blocksPerEra
    );

    const inspectorContractFactory = await ethers.getContractFactory("InspectorContract");
    const researcherContractFactory = await ethers.getContractFactory("ResearcherContract");
    const producerContractFactory = await ethers.getContractFactory("ProducerContract");
    const activistContractFactory = await ethers.getContractFactory("ActivistContract");

    const validatorContractFactory = await ethers.getContractFactory("ValidatorContract");
    validatorContract = await validatorContractFactory.deploy(firstValidatorLimit, secondValidatorLimit);

    inspectorContract = await inspectorContractFactory.deploy(
      userContract.target,
      inspectorPool.target,
      inspectorMaxPenalties
    );

    researcherContract = await researcherContractFactory.deploy(
      userContract.target,
      researcherPool.target,
      validatorContract.target,
      timeBetweenWorks,
      researcherMaxPenalties
    );

    producerContract = await producerContractFactory.deploy(userContract.target, producerPool.target);
    activistContract = await activistContractFactory.deploy(userContract.target, activistPool.target);

    const categoryContractFactory = await ethers.getContractFactory("CategoryContract");
    categoryContract = await categoryContractFactory.deploy();

    const validatorContractDependencies = {
      userContractAddress: userContract.target,
      producerContractAddress: producerContract.target,
      validatorPoolAddress: validatorPool.target,
      inspectorContractAddress: inspectorContract.target,
      developerContractAddress: ZERO_ADDRESS,
      researcherContractAddress: researcherContract.target,
    };

    const instanceFactory = await ethers.getContractFactory("Sintrop");
    instance = await instanceFactory.deploy(
      inspectorContract.target,
      producerContract.target,
      userContract.target,
      validatorContract.target,
      activistContract.target,
      categoryContract.target,
      sintropArgs.timeBetweenInspections,
      sintropArgs.blocksToExpireAcceptedInspection,
      sintropArgs.allowedInitialRequests,
      sintropArgs.acceptInspectionDelayBlocks
    );

    await validatorContract.setContractAddressDependencies(validatorContractDependencies);
    await userContract.newAllowedCaller(inspectorContract.target);
    await userContract.newAllowedCaller(producerContract.target);
    await userContract.newAllowedCaller(researcherContract.target);
    await userContract.newAllowedCaller(validatorContract.target);
    await userContract.newAllowedCaller(activistContract.target);
    await userContract.newAllowedCaller(owner);
    await inspectorContract.newAllowedCaller(instance.target);
    await inspectorContract.newAllowedCaller(owner);
    await inspectorContract.newAllowedCaller(validatorContract.target);
    await validatorContract.newAllowedCaller(instance.target);
    await activistContract.newAllowedCaller(instance.target);
    await activistPool.newAllowedCaller(activistContract.target);
    await producerContract.newAllowedCaller(owner);
    await producerContract.newAllowedCaller(instance.target);
    await producerContract.newAllowedCaller(validatorContract.target);
    await producerPool.newAllowedCaller(producerContract.target);
    await inspectorPool.newAllowedCaller(inspectorContract.target);
    await validatorPool.newAllowedCaller(validatorContract.target);
    await categoryContract.newAllowedCaller(instance.target);

    await addInvitation(owner, resea1Address, userTypes.Researcher, owner);

    await addResearcher("Researcher 1", resea1Address);
  });

  describe("#getInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, producerAddress, userTypes.Producer, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addProducer("Producer A", producerAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when inspection exists", () => {
      beforeEach(async () => {
        await instance.connect(producerAddress).requestInspection();
      });

      it("should return inspection", async () => {
        const inspection = await instance.getInspection(1);

        expect(inspection.id).to.equal(1);
      });
    });

    context("when inspection dont exists", () => {
      it("should return inspection", async () => {
        const inspection = await instance.getInspection(1);

        expect(inspection.id).to.equal(0);
      });
    });
  });

  describe("#getInspections", () => {
    beforeEach(async () => {
      await addInvitation(owner, producerAddress, userTypes.Producer, owner);
      await addInvitation(owner, producer2Address, userTypes.Producer, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addProducer("Producer A", producerAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("when have inspections", () => {
      beforeEach(async () => {
        addProducer("Producer B", producer2Address);

        await requestInspection(producerAddress);
        await requestInspection(producer2Address);
      });

      it("should return inspections", async () => {
        const inspections = await instance.getInspections();

        const inspection1 = await instance.getInspection(1);
        const inspection2 = await instance.getInspection(2);

        expect(inspections[0].id).to.equal(inspection1.id);
        expect(inspections[1].id).to.equal(inspection2.id);
      });
    });

    context("when dont have inspections", () => {
      it("should return zero inspections", async () => {
        const inspections = await instance.getInspections();

        expect(inspections.length).to.equal(0);
      });
    });
  });

  describe("#requestInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, producerAddress, userTypes.Producer, owner);
      await addInvitation(owner, producer2Address, userTypes.Producer, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addProducer("Producer A", producerAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with producer", () => {
      beforeEach(async () => {
        await requestInspection(producerAddress);
        await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
      });

      context("when have less than ALLOWED_INITIAL_REQUESTS", () => {
        it("should request inspection", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.createdBy).to.equal(producerAddress.address);
        });
      });

      context("when have more than ALLOWED_INITIAL_REQUESTS", () => {
        context("when has request OPEN or ACCEPTED", () => {
          it("should return error message", async () => {
            await expect(requestInspection(producerAddress)).to.be.revertedWith("Request already OPEN");
          });
        });

        context("when don't has request OPEN or ACCEPTED", () => {
          beforeEach(async () => {
            await acceptInspection(1, inspectorAddress);
            await addCategory("Soil A", owner);

            const isas = [
              {
                categoryId: 1,
                isaId: 1,
                indicator: 10,
              },
            ];
            await realizeInspection(1, report, isas, inspectorAddress);
          });

          context("when last request is recent", () => {
            it("should return error message", async () => {
              await expect(requestInspection(producerAddress)).to.be.revertedWith("Wait to request");
            });
          });

          context("when last request is not recent", () => {
            it("should request inspection", async () => {
              await advanceBlock(20);

              await requestInspection(producerAddress);
              const inspection = await instance.getInspection(2);

              expect(inspection.createdBy).to.equal(producerAddress.address);
            });
          });
        });
      });

      describe("#afterRequestInspection", () => {
        it("initial status should be equal OPEN", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.status).to.equal(STATUS.open);
        });

        it("must set createdBy as producer address", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.createdBy).to.equal(producerAddress.address);
        });

        it("must set acceptedBy as zero address", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.acceptedBy).to.equal(ZERO_ADDRESS);
        });

        it("initial isaScore should be equal zero", async () => {
          const inspection = await instance.getInspection(1);

          expect(inspection.isaScore).to.equal(0);
        });

        it("should increment total of inspections", async () => {
          const inspectionsCount = await instance.inspectionsCount();

          expect(inspectionsCount).to.equal(1);
        });

        it("should set to true producer pendingInspection", async () => {
          const producer = await producerContract.getProducer(producerAddress);

          expect(producer.pendingInspection).to.equal(true);
        });
      });
    });

    context("with non producer", () => {
      context("when is not producer and try request inspection", () => {
        it("should return message error", async () => {
          await expect(instance.requestInspection()).to.be.revertedWith("Please register as producer");
        });
      });
    });
  });

  describe("#acceptInspection", () => {
    beforeEach(async () => {
      await addInvitation(owner, producerAddress, userTypes.Producer, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addProducer("Producer A", producerAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await requestInspection(producerAddress);
        });

        context("when have not waited inspection delay time", () => {
          it("should return error message", async () => {
            await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("Can't accept yet");
          });
        });

        context("when have waited inspection delay time", () => {
          it("", async () => {
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(1, inspectorAddress);
            const inspection = await instance.getInspection(1);
            expect(inspection.status).to.equal(STATUS.accepted);
          });
        });

        context("when never realized inspection from producer", () => {
          context("when inspection is OPEN", () => {
            beforeEach(async () => {
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await acceptInspection(1, inspectorAddress);
            });

            it("accept inspection with success", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.status).to.equal(STATUS.accepted);
            });

            it("acceptedBy must be inspectorAddress", async () => {
              const inspection = await instance.getInspection(1);

              expect(inspection.acceptedBy).to.equal(inspectorAddress.address);
            });

            it("should increment inspector giveUps by 1", async () => {
              const inspector = await inspectorContract.getInspector(inspectorAddress);

              expect(inspector.giveUps).to.equal("1");
            });

            it("Set last inspectionId to accepted inspection 1", async () => {
              const inspector = await inspectorContract.getInspector(inspectorAddress);

              expect(inspector.lastInspection).to.equal("1");
            });
          });

          context("when inspection is not OPEN", () => {
            beforeEach(async () => {
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
              await acceptInspection(1, inspectorAddress);
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expect(acceptInspection(1, inspector2Address)).to.be.revertedWith("This inspection is not OPEN");
            });
          });

          context("when have accepted other inspection", () => {
            beforeEach(async () => {
              await addInvitation(owner, producer2Address, userTypes.Producer, owner);
              await addProducer("Producer B", producer2Address);
              await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
              await acceptInspection(1, inspectorAddress);
              await requestInspection(producer2Address);
            });

            context("when last inspection is not expired", () => {
              it("should return error message", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Can't accept yet");
              });
            });

            context("when last inspection is expired", () => {
              beforeEach(async () => {
                await advanceBlock(sintropArgs.timeBetweenInspections);
                await acceptInspection(2, inspectorAddress);
              });

              it("should accept inspection with success after blocksToExpireAcceptedInspection", async () => {
                const inspection = await instance.getInspection(2);

                expect(inspection.status).to.equal(STATUS.accepted);
              });
            });

            context("when have finished last inspection", () => {
              beforeEach(async () => {
                await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
                await realizeInspection(1, "", [], inspectorAddress);
                await acceptInspection(2, inspectorAddress);
              });

              it("should accept inspection with success after finishing previous one", async () => {
                const inspection = await instance.getInspection(2);

                expect(inspection.status).to.equal(STATUS.accepted);
              });
            });

            context("when dont finished last inspection", () => {
              it("should return error message", async () => {
                await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Can't accept yet");
              });
            });
          });
        });

        context("when already realized inspection from producer", () => {
          beforeEach(async () => {
            await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
            await acceptInspection(1, inspectorAddress);
            await realizeInspection(1, report, [], inspectorAddress);

            await advanceBlock(20);

            await requestInspection(producerAddress);
          });

          it("should return error message", async () => {
            await expect(acceptInspection(2, inspectorAddress)).to.be.revertedWith("Already inspected this producer");
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expect(acceptInspection(1, inspectorAddress)).to.be.revertedWith("This inspection don't exists");
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await requestInspection(producerAddress);
        await expect(acceptInspection(1, producerAddress)).to.be.revertedWith("Please register as inspector");
      });
    });
  });

  describe("#realizeInspection", () => {
    beforeEach(async () => {
      await userContract.newAllowedCaller(activist1Address);
      await addInvitation(owner, activist1Address, userTypes.Activist, owner);
      await addActivist("Activist 1", activist1Address);
      await addInvitation(activist1Address, producerAddress, userTypes.Producer, activist1Address);
      await addInvitation(activist1Address, inspectorAddress, userTypes.Inspector, activist1Address);

      await addProducer("Producer A", producerAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await requestInspection(producerAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
        });

        context("when inspection is accepted", () => {
          beforeEach(async () => {
            await acceptInspection(1, inspectorAddress);
          });

          context("when is accepted by inspector", () => {
            context("when inspection is expired", () => {
              beforeEach(async () => {
                await advanceBlock(20);
              });

              it("should return error message", async () => {
                await expect(realizeInspection(1, report, [], inspectorAddress)).to.be.revertedWith(
                  "Inspection Expired"
                );
              });
            });

            context("when inspection is not expired", () => {
              beforeEach(async () => {
                await addCategory("Soil A", owner);
                await addCategory("Soil B", owner);
                await addCategory("Soil C", owner);
              });

              describe(".setActivistLevel", () => {
                context("when producer do not win minimum inspection", () => {
                  beforeEach(async () => {
                    await realizeInspection(1, report, isas(), inspectorAddress);
                  });

                  it("Activist must do not win levels", async () => {
                    const activist = await activistContract.getActivist(activistContract);

                    expect(activist.pool.level).to.equal(0);
                  });

                  it("Activist pool win 0 level to activist", async () => {
                    const levels = await activistPool.eraLevels(4, activist1Address);

                    expect(levels).to.equal(0);
                  });
                });

                context("when inspector do not win minimum inspection", () => {
                  beforeEach(async () => {
                    await realizeInspection(1, report, isas(), inspectorAddress);
                  });

                  it("Activist must do not win levels", async () => {
                    const activist = await activistContract.getActivist(activistContract);

                    expect(activist.pool.level).to.equal(0);
                  });

                  it("Activist pool win 0 level to activist", async () => {
                    const levels = await activistPool.eraLevels(4, activist1Address);

                    expect(levels).to.equal(0);
                  });
                });

                context("when producer win minimum inspection", () => {
                  beforeEach(async () => {
                    await producerContract.connect(owner).incrementInspections(producerAddress);
                    await producerContract.connect(owner).incrementInspections(producerAddress);
                    await realizeInspection(1, report, isas(), inspectorAddress);
                  });

                  it("Activist must win 1 level", async () => {
                    const activist = await activistContract.getActivist(activist1Address);

                    expect(activist.pool.level).to.equal(1);
                  });

                  it("Activist pool win 1 level to activist", async () => {
                    const levels = await activistPool.eraLevels(4, activist1Address);

                    expect(levels).to.equal(1);
                  });
                });

                context("when inspector win minimum inspection", () => {
                  beforeEach(async () => {
                    await inspectorContract.connect(owner).incrementInspections(inspectorAddress);
                    await inspectorContract.connect(owner).incrementInspections(inspectorAddress);
                    await realizeInspection(1, report, isas(), inspectorAddress);
                  });

                  it("Activist must win 1 level", async () => {
                    const activist = await activistContract.getActivist(activist1Address);

                    expect(activist.pool.level).to.equal(1);
                  });

                  it("Activist pool win 1 level to activist", async () => {
                    const levels = await activistPool.eraLevels(4, activist1Address);

                    expect(levels).to.equal(1);
                  });
                });

                context("when producer and inspector win minimum inspection", () => {
                  beforeEach(async () => {
                    await producerContract.connect(owner).incrementInspections(producerAddress);
                    await producerContract.connect(owner).incrementInspections(producerAddress);
                    await inspectorContract.connect(owner).incrementInspections(inspectorAddress);
                    await inspectorContract.connect(owner).incrementInspections(inspectorAddress);
                    await realizeInspection(1, report, isas(), inspectorAddress);
                  });

                  it("Activist must win 1 level", async () => {
                    const activist = await activistContract.getActivist(activist1Address);

                    expect(activist.pool.level).to.equal(2);
                  });

                  it("Activist pool win 1 level to activist", async () => {
                    const levels = await activistPool.eraLevels(4, activist1Address);

                    expect(levels).to.equal(2);
                  });
                });
              });

              context("when check inspection", () => {
                beforeEach(async () => {
                  await realizeInspection(1, report, isas(), inspectorAddress);
                });

                it("should change inspection status to INSPECTED", async () => {
                  const inspection = await instance.getInspection(1);

                  expect(inspection.status).to.equal(STATUS.inspected);
                });

                it("should decrease inspector giveUps by 1", async () => {
                  const inspector = await inspectorContract.getInspector(inspectorAddress);

                  expect(inspector.giveUps).to.equal("0");
                });

                it("should update inspectionList", async () => {
                  const inspections = await instance.getInspections();

                  expect(inspections[0].status).to.equal(STATUS.inspected);
                });

                it("should update inspection isas", async () => {
                  const isasResponse = await categoryContract.getIsa(1);
                  const isas_ = [
                    [1n, 1n, 10n],
                    [2n, 1n, 10n],
                    [3n, 2n, 10n],
                  ];

                  expect(isasResponse.join("")).to.equals(isas_.join(""));
                });

                it("should add isaScore in producer", async () => {
                  const inspection = await instance.getInspection(1);
                  const producer = await producerContract.getProducer(producerAddress);

                  expect(inspection.isaScore).to.equal(producer.isa.isaScore);
                });

                it("should set producer pendingInspection to false", async () => {
                  const producer = await producerContract.getProducer(producerAddress);

                  expect(producer.pendingInspection).to.equal(false);
                });

                it("should increment producer totalInspections", async () => {
                  const producer = await producerContract.getProducer(producerAddress);

                  expect(producer.totalInspections).to.equal(1);
                });

                it("should increment inspector totalInspections", async () => {
                  const inspector = await inspectorContract.getInspector(inspectorAddress);

                  expect(inspector.totalInspections).to.equal(1);
                });

                it("should add inspection to inspector in userInspections", async () => {
                  const userInspections = await instance.connect(inspectorAddress).getInspectionsHistory();

                  expect(userInspections.length).to.equal(1);
                });

                it("should add inspection to producer in userInspections", async () => {
                  const userInspections = await instance.connect(producerAddress).getInspectionsHistory();

                  expect(userInspections.length).to.equal(1);
                });
              });

              context("when check inspection isas", () => {
                context("when select REGENERATIVE_6", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 1,
                        indicator: 25,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 25 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(25);
                  });
                });

                context("when select REGENERATIVE_5", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 2,
                        indicator: 10,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 16 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(16);
                  });
                });

                context("when select REGENERATIVE_4", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 3,
                        report: "REGENERATIVE_1",
                        indicator: 1,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 8 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(8);
                  });
                });

                context("when select REGENERATIVE_3", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 4,
                        indicator: 25,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 4 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(4);
                  });
                });

                context("when select REGENERATIVE_2", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 5,
                        indicator: 10,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 2 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(2);
                  });
                });

                context("when select REGENERATIVE_1", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 6,
                        report: "REGENERATIVE_1",
                        indicator: 1,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 1 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(1);
                  });
                });

                context("when select NEUTRO", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 7,
                        indicator: 0,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add 0 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(0);
                  });
                });

                context("when select NOT_REGENERATIVE_1", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 8,
                        indicator: -1,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add -1 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(-1);
                  });
                });

                context("when select NOT_REGENERATIVE_2", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 9,
                        indicator: -10,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add -2 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(-2);
                  });
                });

                context("when select NOT_REGENERATIVE_3", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 10,
                        indicator: -25,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add -4 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(-4);
                  });
                });

                context("when select NOT_REGENERATIVE_4", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 11,
                        indicator: -25,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add -8 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(-8);
                  });
                });

                context("when select NOT_REGENERATIVE_5", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 12,
                        indicator: -25,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add -16 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(-16);
                  });
                });

                context("when select NOT_REGENERATIVE_6", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaId: 13,
                        indicator: -25,
                      },
                    ];

                    await realizeInspection(1, report, isas, inspectorAddress);
                  });

                  it("should add -25 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    expect(inspection.isaScore).to.equal(-25);
                  });
                });
              });
            });
          });

          context("when is accepted by other inspector", () => {
            beforeEach(async () => {
              await addInvitation(owner, inspector2Address, userTypes.Inspector, owner);
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expect(realizeInspection(1, report, [], inspector2Address)).to.be.revertedWith(
                "You not accepted this inspection"
              );
            });
          });
        });

        context("when inspection is not accepted", () => {
          it("should return error message", async () => {
            await expect(realizeInspection(1, report, [], inspectorAddress)).to.be.revertedWith(
              "Accept this inspection before"
            );
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expect(realizeInspection(1, report, [], inspectorAddress)).to.be.revertedWith(
            "This inspection don't exists"
          );
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await requestInspection(producerAddress);
        await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
        await acceptInspection(1, inspectorAddress);

        await expect(realizeInspection(1, report, [], producerAddress)).to.be.revertedWith(
          "Please register as inspector"
        );
      });
    });
  });

  describe("#addInspectionValidation", () => {
    beforeEach(async () => {
      await addInvitation(owner, producerAddress, userTypes.Producer, owner);
      await addInvitation(owner, inspectorAddress, userTypes.Inspector, owner);

      await addProducer("Producer A", producerAddress);
      await addInspector("Inspector A", inspectorAddress);
    });

    context("with validator", () => {
      beforeEach(async () => {
        await addInvitation(owner, validator1Address, userTypes.Validator, owner);
        await addInvitation(owner, validator2Address, userTypes.Validator, owner);
        await addInvitation(owner, validator3Address, userTypes.Validator, owner);
        await addInvitation(owner, validator4Address, userTypes.Validator, owner);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
      });

      context("with valid inspection", () => {
        beforeEach(async () => {
          await addCategory("Soil A", owner);
          await addCategory("Soil B", owner);
          await addCategory("Soil C", owner);

          await requestInspection(producerAddress);
          await advanceBlock(sintropArgs.acceptInspectionDelayBlocks);
          await acceptInspection(1, inspectorAddress);
          await realizeInspection(1, report, isas(), inspectorAddress);
        });

        context("when receive 1 validation", () => {
          beforeEach(async () => {
            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
          });

          it("add validation", async () => {
            const validations = await validatorContract.getInspectionValidations(1);
            const validation = validations[0];

            expect(validation.validator).to.equal(validator1Address.address);
            expect(validation.resourceId).to.equal(1);
            expect(validation.justification).to.equal("justification");
            expect(validation.majorityValidatorsCount).to.equal(2);
          });
        });

        context("when have 2 validations (half of the validators)", () => {
          beforeEach(async () => {
            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
            await instance.connect(validator2Address).addInspectionValidation(1, "justification");
          });

          it("add validations", async () => {
            const validation1 = await validatorContract.inspectionValidations(1, 0);
            const validation2 = await validatorContract.inspectionValidations(1, 1);

            expect(validation1.validator).to.equal(validator1Address.address);
            expect(validation2.validator).to.equal(validator2Address.address);
          });

          it("inspection status INVALIDATED", async () => {
            const inspection = await instance.getInspection(1);

            expect(inspection.status).to.equal(STATUS.invalidated);
          });

          it("inspector receive 1 penalty", async () => {
            const totalPenalties = await inspectorContract.totalPenalties(inspectorAddress);

            expect(totalPenalties).to.equal(1);
          });

          it("remove producer isaScore", async () => {
            const producer = await producerContract.getProducer(producerAddress);

            expect(producer.isa.isaScore).to.equal(0);
          });

          it("decrement producer totalInspections", async () => {
            const producer = await producerContract.getProducer(producerAddress);

            expect(producer.totalInspections).to.equal(0);
          });

          it("decrement inspector totalInspections", async () => {
            const inspector = await inspectorContract.getInspector(inspectorAddress);

            expect(inspector.totalInspections).to.equal(0);
          });

          it("zero producerPool era level score", async () => {
            const levels = await producerPool.eraLevels(1, producerAddress);

            expect(levels).to.equal(0);
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorContract.addPenalty(inspectorAddress, 1);

            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
            await instance.connect(validator2Address).addInspectionValidation(1, "justification");
          });

          it("inspector type to DENIED", async () => {
            const userType = await userContract.getUser(inspectorAddress);

            expect(userType).to.equal(USER_TYPES.denied);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.connect(validator1Address).addInspectionValidation(1, "justification");
          });

          it("should return error message", async () => {
            await expect(
              instance.connect(validator1Address).addInspectionValidation(1, "justification")
            ).to.be.revertedWith("Already voted");
          });
        });
      });

      context("with invalid inspection", () => {
        it("should return error message", async () => {
          await expect(
            instance.connect(validator1Address).addInspectionValidation(1, "justification")
          ).to.be.revertedWith("This inspection is not INSPECTED");
        });
      });
    });

    context("with non validator", () => {
      it("should return error message", async () => {
        await expect(instance.connect(producerAddress).addInspectionValidation(1, "justification")).to.be.revertedWith(
          "Please register as validator"
        );
      });
    });
  });
});
