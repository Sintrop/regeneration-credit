const Sintrop = artifacts.require("Sintrop");
const CategoryContract = artifacts.require("CategoryContract");
const RcToken = artifacts.require("RcToken");
const UserContract = artifacts.require("UserContract");
const InspectorContract = artifacts.require("InspectorContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ProducerPool = artifacts.require("ProducerPool");
const ResearcherPool = artifacts.require("ResearcherPool");
const InspectorPool = artifacts.require("InspectorPool");
const ValidatorContract = artifacts.require("ValidatorContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("Sintrop", (accounts) => {
  let instance;
  let userContract;
  let inspectorContract;
  let producerContract;
  let researcherContract;
  let researcherPool;
  let inspectorPool;

  let [
    ownerAddress,
    producerAddress,
    producer2Address,
    inspectorAddress,
    inspector2Address,
    resea1Address,
    validator1Address,
    validator2Address,
    validator3Address,
    validator4Address,
  ] = accounts;

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

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const timeBetweenWorks = 6;

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

  const addProducer = async (name, address) => {
    await producerContract.addProducer(10, name, "photoURL", "135465-005", {
      from: address,
    });
  };

  const addInspector = async (name, address) => {
    await inspectorContract.addInspector(name, "photoURL", "135465-005", { from: address });
  };

  const addResearcher = async (name, address) => {
    await researcherContract.addResearcher(name, "photoURL", { from: address });
  };

  const addValidator = async (address) => {
    await validatorContract.addValidator({ from: address });
  };

  const addCategory = async (name, from) => {
    await categoryContract.addCategory(
      name,
      `The description of ${name}`,
      `How inspectors should evaluate ${name}`,
      `${name} regenerative 3`,
      `${name} regenerative 2`,
      `${name} regenerative 1`,
      `${name} neutro`,
      `${name} notRegenerative 1`,
      `${name} notRegenerative 2`,
      `${name} notRegenerative 3`,
      { from: from }
    );
  };

  const isas = () => {
    return [
      {
        categoryId: 1,
        isaIndex: 0,
        report: "Hash_1",
        indicator: 10,
      },
      {
        categoryId: 2,
        isaIndex: 0,
        report: "Hash_2",
        indicator: 10,
      },
      {
        categoryId: 3,
        isaIndex: 1,
        report: "Hash_3",
        indicator: 10,
      },
    ];
  };

  const realizeInspection = async (id, isas_, from) => {
    await instance.realizeInspection(id, isas_, { from: from });
  };

  advanceBlock = async (blocksNumber) => {
    for (let i = 0; i < blocksNumber; i++) {
      let promise = new Promise((resolve, reject) => {
        web3.currentProvider.send(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime(),
          },
          (err, result) => {
            if (err) {
              return reject(err);
            }
            const newBlockHash = web3.eth.getBlock("latest").hash;

            return resolve(newBlockHash);
          }
        );
      });
    }
  };

  beforeEach(async () => {
    rcToken = await RcToken.new("1500000000000000000000000000");
    userContract = await UserContract.new();

    researcherPool = await ResearcherPool.new(
      rcToken.address,
      researcherPoolargs.halving,
      researcherPoolargs.totalEras,
      researcherPoolargs.blocksPerEra
    );

    inspectorMaxPenalties = 2;
    inspectorContract = await InspectorContract.new(userContract.address, inspectorPool.address, inspectorMaxPenalties);
    researcherContract = await ResearcherContract.new(userContract.address, researcherPool.address, timeBetweenWorks);

    producerPool = await ProducerPool.new(
      rcToken.address,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    researcherPool = await ResearcherPool.new(
      rcToken.address,
      researcherPoolargs.halving,
      researcherPoolargs.totalEras,
      researcherPoolargs.blocksPerEra
    );

    inspectorPool = await InspectorPool.new(
      rcToken.address,
      inspectorPoolargs.halving,
      inspectorPoolargs.totalEras,
      inspectorPoolargs.blocksPerEra
    );

    producerContract = await ProducerContract.new(userContract.address, producerPool.address);
    inspectorContract = await InspectorContract.new(userContract.address, inspectorPool.address);
    researcherContract = await ResearcherContract.new(userContract.address, researcherPool.address);

    categoryContract = await CategoryContract.new(userContract.address);

    validatorContract = await ValidatorContract.new(userContract.address, producerContract.address);

    instance = await Sintrop.new(
      inspectorContract.address,
      producerContract.address,
      userContract.address,
      validatorContract.address,
      sintropArgs.timeBetweenInspections,
      sintropArgs.blocksToExpireAcceptedInspection,
      sintropArgs.allowedInitialRequests
    );

    await userContract.newAllowedCaller(inspectorContract.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(researcherContract.address);
    await userContract.newAllowedCaller(validatorContract.address);
    await inspectorContract.newAllowedCaller(instance.address);
    await inspectorContract.newAllowedCaller(ownerAddress);
    await validatorContract.newAllowedCaller(instance.address);
    await producerContract.newAllowedCaller(instance.address);
    await producerContract.newAllowedCaller(validatorContract.address);
    await researcherContract.newAllowedUser(resea1Address);
    await producerPool.newAllowedCaller(producerContract.address);
    await inspectorPool.newAllowedCaller(inspectorContract.address);

    await addProducer("Producer A", producerAddress);
    await addInspector("Inspector A", inspectorAddress);
    await addResearcher("Researcher 1", resea1Address);
  });

  describe("#getInspection", () => {
    context("when inspection exists", () => {
      beforeEach(async () => {
        await instance.requestInspection({ from: producerAddress });
      });

      it("should return inspection", async () => {
        const inspection = await instance.getInspection(1);

        assert.equal(inspection.id, 1);
      });
    });

    context("when inspection dont exists", () => {
      it("should return inspection", async () => {
        const inspection = await instance.getInspection(1);

        assert.equal(inspection.id, 0);
      });
    });
  });

  describe("#getInspections", () => {
    context("when have inspections", () => {
      beforeEach(async () => {
        addProducer("Producer B", producer2Address);

        await instance.requestInspection({ from: producerAddress });
        await instance.requestInspection({ from: producer2Address });
      });

      it("should return inspections", async () => {
        const inspections = await instance.getInspections();

        const inspection1 = await instance.getInspection(1);
        const inspection2 = await instance.getInspection(2);

        assert.equal(inspections[0].id, inspection1.id);
        assert.equal(inspections[1].id, inspection2.id);
      });
    });

    context("when dont have inspections", () => {
      it("should return zero inspections", async () => {
        const inspections = await instance.getInspections();

        assert.equal(inspections.length, 0);
      });
    });
  });

  describe("#requestInspection", () => {
    context("with producer", () => {
      beforeEach(async () => {
        await instance.requestInspection({ from: producerAddress });
      });

      context("when have less than ALLOWED_INITIAL_REQUESTS", () => {
        it("should request inspection", async () => {
          const inspection = await instance.getInspection(1);

          assert.equal(inspection.createdBy, producerAddress);
        });
      });

      context("when have more than ALLOWED_INITIAL_REQUESTS", () => {
        context("when has request OPEN or ACCEPTED", () => {
          it("should return error message", async () => {
            await expectRevert(instance.requestInspection({ from: producerAddress }), "Request OPEN or ACCEPTED");
          });
        });

        context("when don't has request OPEN or ACCEPTED", () => {
          beforeEach(async () => {
            await instance.acceptInspection(1, { from: inspectorAddress });
            await addCategory("Soil A", ownerAddress);

            const isas = [
              {
                categoryId: 1,
                isaIndex: 0,
                report: "Hash_1",
                indicator: 10,
              },
            ];
            await realizeInspection(1, isas, inspectorAddress);
          });

          context("when last request is recent", () => {
            it("should return error message", async () => {
              await expectRevert(instance.requestInspection({ from: producerAddress }), "Recent inspection");
            });
          });

          context("when last request is not recent", () => {
            it("should request inspection", async () => {
              await advanceBlock(20);

              await instance.requestInspection({ from: producerAddress });
              const inspection = await instance.getInspection(2);

              assert.equal(inspection.createdBy, producerAddress);
            });
          });
        });
      });

      describe("#afterRequestInspection", () => {
        it("initial status should be equal OPEN", async () => {
          const inspection = await instance.getInspection(1);

          assert.equal(inspection.status, STATUS.open);
        });

        it("must set createdBy as producer address", async () => {
          const inspection = await instance.getInspection(1);

          assert.equal(inspection.createdBy, producerAddress);
        });

        it("must set acceptedBy as zero address", async () => {
          const inspection = await instance.getInspection(1);

          assert.equal(inspection.acceptedBy, ZERO_ADDRESS);
        });

        it("initial isaScore should be equal zero", async () => {
          const inspection = await instance.getInspection(1);

          assert.equal(inspection.isaScore, 0);
        });

        it("initial isas should be equal empty array", async () => {
          const isas = await instance.getIsa(1);

          assert.equal(isas.length, 0);
        });

        it("should increment total of inspections", async () => {
          const inspectionsCount = await instance.inspectionsCount();

          assert.equal(inspectionsCount, 1);
        });

        it("should set to true producer recentInspection", async () => {
          const producer = await producerContract.getProducer(producerAddress);

          assert.equal(producer.recentInspection, true);
        });
      });
    });

    context("with non producer", () => {
      context("when is not producer and try request inspection", () => {
        it("should return message error", async () => {
          await expectRevert(instance.requestInspection(), "Please register as producer");
        });
      });
    });
  });

  describe("#acceptInspection", () => {
    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await instance.requestInspection({ from: producerAddress });
        });

        context("when never realized inspection from producer", () => {
          context("when inspection is OPEN", () => {
            beforeEach(async () => {
              await instance.acceptInspection(1, { from: inspectorAddress });
            });

            it("accept inspection with success", async () => {
              const inspection = await instance.getInspection(1);

              assert.equal(inspection.status, STATUS.accepted);
            });

            it("acceptedBy must be inspectorAddress", async () => {
              const inspection = await instance.getInspection(1);

              assert.equal(inspection.acceptedBy, inspectorAddress);
            });

            it("should increment inspector giveUps by 1", async () => {
              const inspector = await inspectorContract.getInspector(inspectorAddress);

              assert.equal(inspector.giveUps, "1");
            });
          });

          context("when inspection is not OPEN", () => {
            beforeEach(async () => {
              await instance.acceptInspection(1, { from: inspectorAddress });
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expectRevert(
                instance.acceptInspection(1, { from: inspector2Address }),
                "This inspection is not OPEN"
              );
            });
          });

          context("when have accepted other inspection", () => {
            beforeEach(async () => {
              await addProducer("Producer B", producer2Address);

              await instance.acceptInspection(1, { from: inspectorAddress });
              await instance.requestInspection({ from: producer2Address });
            });

            context("when last inspection is not expired", () => {
              it("should return error message", async () => {
                await expectRevert(instance.acceptInspection(2, { from: inspectorAddress }), "Can't accept yet");
              });
            });

            context("when last inspection is expired", () => {
              beforeEach(async () => {
                await advanceBlock(sintropArgs.timeBetweenInspections);
                await instance.acceptInspection(2, { from: inspectorAddress });
              });

              it("should accept inspection with success after blocksToExpireAcceptedInspection", async () => {
                const inspection = await instance.getInspection(2);

                assert.equal(inspection.status, STATUS.accepted);
              });
            });
          });
        });

        context("when already realized inspection from producer", () => {
          beforeEach(async () => {
            await instance.acceptInspection(1, { from: inspectorAddress });
            await instance.realizeInspection(1, [], { from: inspectorAddress });

            await advanceBlock(20);

            await instance.requestInspection({ from: producerAddress });
          });

          it("should return error message", async () => {
            await expectRevert(
              instance.acceptInspection(2, { from: inspectorAddress }),
              "Already inspected this producer"
            );
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expectRevert(instance.acceptInspection(1, { from: inspectorAddress }), "This inspection don't exist");
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await instance.requestInspection({ from: producerAddress });
        await expectRevert(instance.acceptInspection(1, { from: producerAddress }), "Please register as inspector");
      });
    });
  });

  describe("#realizeInspection", () => {
    context("with inspector", () => {
      context("when inspection exists", () => {
        beforeEach(async () => {
          await instance.requestInspection({ from: producerAddress });
        });

        context("when inspection is accepted", () => {
          beforeEach(async () => {
            await instance.acceptInspection(1, { from: inspectorAddress });
          });

          context("when is accepted by inspector", () => {
            context("when inspection is expired", () => {
              beforeEach(async () => {
                await advanceBlock(20);
              });

              it("should return error message", async () => {
                await expectRevert(instance.realizeInspection(1, [], { from: inspectorAddress }), "Inspection Expired");
              });
            });

            context("when inspection is not expired", () => {
              beforeEach(async () => {
                await addCategory("Soil A", ownerAddress);
                await addCategory("Soil B", ownerAddress);
                await addCategory("Soil C", ownerAddress);
              });

              context("when check inspection", () => {
                beforeEach(async () => {
                  await realizeInspection(1, isas(), inspectorAddress);
                });

                it("should change inspection status to INSPECTED", async () => {
                  const inspection = await instance.getInspection(1);

                  assert.equal(inspection.status, STATUS.inspected);
                });

                it("should decrease inspector giveUps by 1", async () => {
                  const inspector = await inspectorContract.getInspector(inspectorAddress);

                  assert.equal(inspector.giveUps, "0");
                });

                it("should update inspectionList", async () => {
                  const inspections = await instance.getInspections();

                  assert.equal(inspections[0].status, STATUS.inspected);
                });

                it("should update inspection isas", async () => {
                  const isasResponse = await instance.getIsa(1);
                  const isas_ = [
                    ["1", "0", "Hash_1", "10"],
                    ["2", "0", "Hash_2", "10"],
                    ["3", "1", "Hash_3", "10"],
                  ];

                  assert.equal(JSON.stringify(isasResponse), JSON.stringify(isas_));
                });

                it("should add isaScore in producer", async () => {
                  const inspection = await instance.getInspection(1);
                  const producer = await producerContract.getProducer(producerAddress);

                  assert.equal(inspection.isaScore, producer.isa.isaScore);
                });

                it("should set producer recentInspection to false", async () => {
                  const producer = await producerContract.getProducer(producerAddress);

                  assert.equal(producer.recentInspection, false);
                });

                it("should increment producer totalInspections", async () => {
                  const producer = await producerContract.getProducer(producerAddress);

                  assert.equal(producer.totalInspections, 1);
                });

                it("should increment inspector totalInspections", async () => {
                  const inspector = await inspectorContract.getInspector(inspectorAddress);

                  assert.equal(inspector.totalInspections, 1);
                });

                it("should add inspection to inspector in userInspections", async () => {
                  const userInspections = await instance.getInspectionsHistory({
                    from: inspectorAddress,
                  });

                  assert.equal(userInspections.length, 1);
                });

                it("should add inspection to producer in userInspections", async () => {
                  const userInspections = await instance.getInspectionsHistory({
                    from: producerAddress,
                  });

                  assert.equal(userInspections.length, 1);
                });
              });

              context("when check inspection isas", () => {
                context("when select REGENERATIVE_3", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 0,
                        report: "REGENERATIVE_3",
                        indicator: 100,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add 20 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, 20);
                  });
                });

                context("when select REGENERATIVE_2", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 1,
                        report: "REGENERATIVE_2",
                        indicator: 10,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add 10 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, 10);
                  });
                });

                context("when select REGENERATIVE_1", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 2,
                        report: "REGENERATIVE_1",
                        indicator: 10,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add 5 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, 5);
                  });
                });

                context("when select NEUTRO", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 3,
                        report: "NEUTRO",
                        indicator: 0,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add 0 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, 0);
                  });
                });

                context("when select NOT_REGENERATIVE1", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 4,
                        report: "NOT_REGENERATIVE1",
                        indicator: -5,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add -5 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, -5);
                  });
                });

                context("when select NOT_REGENERATIVE2", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 5,
                        report: "NOT_REGENERATIVE2",
                        indicator: -10,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add -10 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, -10);
                  });
                });

                context("when select NOT_REGENERATIVE3", () => {
                  beforeEach(async () => {
                    const isas = [
                      {
                        categoryId: 1,
                        isaIndex: 6,
                        report: "NOT_REGENERATIVE3",
                        indicator: -20,
                      },
                    ];

                    await realizeInspection(1, isas, inspectorAddress);
                  });

                  it("should add -20 isaScore to inspection", async () => {
                    const inspection = await instance.getInspection(1);

                    assert.equal(inspection.isaScore, -20);
                  });
                });
              });
            });
          });

          context("when is accepted by other inspector", () => {
            beforeEach(async () => {
              await addInspector("Inspector B", inspector2Address);
            });

            it("should return error message", async () => {
              await expectRevert(
                instance.realizeInspection(1, [], { from: inspector2Address }),
                "You not accepted this inspection"
              );
            });
          });
        });

        context("when inspection is not accepted", () => {
          it("should return error message", async () => {
            await expectRevert(
              instance.realizeInspection(1, [], { from: inspectorAddress }),
              "Accept this inspection before"
            );
          });
        });
      });

      context("when inspection dont exists", () => {
        it("should return error message", async () => {
          await expectRevert(
            instance.realizeInspection(1, [], { from: inspectorAddress }),
            "This inspection don't exist"
          );
        });
      });
    });

    context("with non inspector", () => {
      it("should return error message", async () => {
        await instance.requestInspection({ from: producerAddress });
        await instance.acceptInspection(1, { from: inspectorAddress });

        await expectRevert(
          instance.realizeInspection(1, [], { from: producerAddress }),
          "Please register as inspector"
        );
      });
    });
  });

  describe("#addInspectionValidation", () => {
    context("with validator", () => {
      beforeEach(async () => {
        await validatorContract.newAllowedUser(validator1Address);
        await validatorContract.newAllowedUser(validator2Address);
        await validatorContract.newAllowedUser(validator3Address);
        await validatorContract.newAllowedUser(validator4Address);

        await addValidator(validator1Address);
        await addValidator(validator2Address);
        await addValidator(validator3Address);
        await addValidator(validator4Address);
      });

      context("with valid inspection", () => {
        beforeEach(async () => {
          await instance.requestInspection({ from: producerAddress });
          await instance.acceptInspection(1, { from: inspectorAddress });
          await realizeInspection(1, isas(), inspectorAddress);
        });

        context("when receive 1 validation", () => {
          beforeEach(async () => {
            await instance.addInspectionValidation(1, "justification", { from: validator1Address });
          });

          it("add validation", async () => {
            const validation = await instance.validations(1, 0);

            assert.equal(validation.validator, validator1Address);
            assert.equal(validation.user, inspectorAddress);
            assert.equal(validation.resourceId, 1);
            assert.equal(validation.justification, "justification");
            assert.equal(validation.majorityValidatorsCount, 2);
          });
        });

        context("when have 2 validations (half of the validators)", () => {
          beforeEach(async () => {
            await instance.addInspectionValidation(1, "justification", { from: validator1Address });
            await instance.addInspectionValidation(1, "justification", { from: validator2Address });
          });

          it("add validations", async () => {
            const validation1 = await instance.validations(1, 0);
            const validation2 = await instance.validations(1, 1);

            assert.equal(validation1.validator, validator1Address);
            assert.equal(validation2.validator, validator2Address);
          });

          it("inspection status INVALIDATED", async () => {
            const inspection = await instance.getInspection(1);

            assert.equal(inspection.status, STATUS.invalidated);
          });

          it("inspector receive 1 penalty", async () => {
            const totalPenalties = await inspectorContract.totalPenalties(inspectorAddress);

            assert.equal(totalPenalties, 1);
          });

          it("remove producer isaScore", async () => {
            const producer = await producerContract.getProducer(producerAddress);

            assert.equal(producer.isa.isaScore, 0);
          });

          it("zero producerPool era level score", async () => {
            const levels = await producerPool.eraLevels(1, producerAddress);

            assert.equal(levels, 0);
          });
        });

        context("when inspector receive max penalties alloweds", () => {
          beforeEach(async () => {
            await inspectorContract.addPenalty(inspectorAddress, 1);

            await instance.addInspectionValidation(1, "justification", { from: validator1Address });
            await instance.addInspectionValidation(1, "justification", { from: validator2Address });
          });

          it("inspector type to DENIED", async () => {
            const userType = await userContract.getUser(inspectorAddress);

            assert.equal(userType, USER_TYPES.denied);
          });
        });

        context("when already voted in this inspection", () => {
          beforeEach(async () => {
            await instance.addInspectionValidation(1, "justification", { from: validator1Address });
          });

          it("should return error message", async () => {
            await expectRevert(
              instance.addInspectionValidation(1, "justification", { from: validator1Address }),
              "Already voted"
            );
          });
        });
      });

      context("with invalid inspection", () => {
        it("should return error message", async () => {
          await expectRevert(
            instance.addInspectionValidation(1, "justification", { from: validator1Address }),
            "This inspection is not INSPECTED"
          );
        });
      });
    });

    context("with non validator", () => {
      it("should return error message", async () => {
        await instance.requestInspection({ from: producerAddress });
        await instance.acceptInspection(1, { from: inspectorAddress });
        await realizeInspection(1, isas(), inspectorAddress);

        await expectRevert(
          instance.addInspectionValidation(1, "justification", { from: producerAddress }),
          "Please register as validator"
        );
      });
    });
  });
});
