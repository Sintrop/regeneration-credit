const Sintrop = artifacts.require("Sintrop");
const CategoryContract = artifacts.require("CategoryContract");
const IsaPool = artifacts.require("IsaPool");
const SacToken = artifacts.require("SacToken");
const UserContract = artifacts.require("UserContract");
const ActivistContract = artifacts.require("ActivistContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ProducerPool = artifacts.require("ProducerPool");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("Sintrop", (accounts) => {
  let instance;
  let userContract;
  let activistContract;
  let producerContract;
  let researcherContract;
  let [
    ownerAddress,
    producerAddress,
    producer2Address,
    activistAddress,
    activist2Address,
    resea1Address,
  ] = accounts;
  const STATUS = {
    open: 0,
    accepted: 1,
    inspected: 2,
    expired: 3,
  };

  const addProducer = async (name, address) => {
    await producerContract.addProducer(
      10,
      name,
      "photoURL",
      "111.111.111-00",
      "CPF",
      "Brazil",
      "SP",
      "Jundiai",
      "Rua XV",
      "Complemento",
      "135465-005",
      { from: address }
    );
  };

  const addActivist = async (name, address) => {
    await activistContract.addActivist(
      name,
      "photoURL",
      "Brazil",
      "135465-005",
      { from: address }
    );
  };

  const addResearcher = async (name, address) => {
    await researcherContract.addResearcher(name, "photoURL", { from: address });
  };

  const addCategory = async (name, from) => {
    await categoryContract.addCategory(
      name,
      `The description of ${name}`,
      `How activists should evaluate ${name}`,
      `${name} totally sustainable`,
      `${name} partially sustainable`,
      `${name} neutro`,
      `${name} partially not sustainable`,
      `${name} totally not sustainable`,
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
        report: "Hash_1",
        indicator: 10,
      },
      {
        categoryId: 2,
        isaIndex: 0,
        report: "Hash_2",
        indicator: 10,
        report: "Hash_2",
        indicator: 10,
      },
      {
        categoryId: 3,
        isaIndex: 1,
        report: "Hash_3",
        indicator: 5,
        report: "Hash_3",
        indicator: 5,
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

  const producerPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    totalEras: 50,
    blocksPerEra: 50,
  };

  beforeEach(async () => {
    userContract = await UserContract.new();

    activistContract = await ActivistContract.new(userContract.address);
    researcherContract = await ResearcherContract.new(userContract.address);

    sacToken = await SacToken.new("1500000000000000000000000000");
    isaPool = await IsaPool.new(sacToken.address);

    producerPool = await ProducerPool.new(
      sacToken.address,
      producerPoolArgs.halving,
      producerPoolArgs.totalEras,
      producerPoolArgs.blocksPerEra
    );

    producerContract = await ProducerContract.new(
      userContract.address,
      producerPool.address
    );

    categoryContract = await CategoryContract.new(
      isaPool.address,
      researcherContract.address,
      userContract.address
    );
    instance = await Sintrop.new(
      activistContract.address,
      producerContract.address,
      20,
      15
    );

    await userContract.newAllowedCaller(activistContract.address);
    await userContract.newAllowedCaller(producerContract.address);
    await userContract.newAllowedCaller(researcherContract.address);
    await activistContract.newAllowedCaller(instance.address);
    await producerContract.newAllowedCaller(instance.address);
    await researcherContract.newAllowedUser(resea1Address);

    await addProducer("Producer A", producerAddress);
    await addActivist("Activist A", activistAddress);
    await addResearcher("Researcher 1", resea1Address);
  });

  context("when producer try request inspection", () => {
    context("when is the first request", () => {
      it("should request inspection", async () => {
        await instance.requestInspection({ from: producerAddress });
        const inspection = await instance.getInspection(1);

        assert.equal(inspection.createdBy, producerAddress);
      });
    });

    context("when is not the first request", () => {
      context("when has request OPEN or ACCEPTED", () => {
        it("should return error message", async () => {
          await instance.requestInspection({ from: producerAddress });
          await expectRevert(
            instance.requestInspection({ from: producerAddress }),
            "Request OPEN or ACCEPTED"
          );
        });
      });

      context("when don't has request OPEN or ACCEPTED", () => {
        beforeEach(async () => {
          await instance.requestInspection({ from: producerAddress });
          await instance.acceptInspection(1, { from: activistAddress });
          await addCategory("Soil A", resea1Address);

          const isas = [
            {
              categoryId: 1,
              isaIndex: 0,
              report: "Hash_1",
              indicator: 10,
              report: "Hash_1",
              indicator: 10,
            },
          ];
          await realizeInspection(1, isas, activistAddress);
        });

        context("when last request is recent", () => {
          it("should return error message", async () => {
            await expectRevert(
              instance.requestInspection({ from: producerAddress }),
              "Recent inspection"
            );
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
  });

  context("when is not producer and try request inspection", () => {
    it("should return message error", async () => {
      await expectRevert(instance.requestInspection(), "Please register as producer");
    });
  });

  context("when create inspection", () => {
    beforeEach(async () => {
      await instance.requestInspection({ from: producerAddress });
    });

    it("initial status should be equal OPEN", async () => {
      const inspection = await instance.getInspection(1);

      assert.equal(inspection.status, STATUS.open);
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

  context("when check if inspection exist", () => {
    it("should return inspection", async () => {
      await instance.requestInspection({ from: producerAddress });
      const inspection = await instance.getInspection(1);

      assert.equal(inspection.id, 1);
    });

    it("should return invalid id", async () => {
      const inspection = await instance.getInspection(1);

      assert.equal(inspection.id, 0);
    });
  });

  context("when call getInspections", () => {
    it("should return inspections when has", async () => {
      await instance.requestInspection({ from: producerAddress });

      const inspectionsList = await instance.getInspections();

      assert.equal(inspectionsList.length, 1);
    });

    it("should return zero inspections when dont has", async () => {
      const inspectionsList = await instance.getInspections();
      assert.equal(inspectionsList.length, 0);
    });
  });

  context("when getInspections", () => {
    it("show return all inspection from mapping", async () => {
      await addProducer("Producer B", producer2Address);

      await instance.requestInspection({ from: producerAddress });
      await instance.requestInspection({ from: producer2Address });

      const inspectionsList = await instance.getInspections();
      const inspection1 = await instance.getInspection(1);
      const inspection2 = await instance.getInspection(2);

      assert.equal(inspectionsList[0].id, inspection1.id);
      assert.equal(inspectionsList[1].id, inspection2.id);
    });
  });

  context("when activist accept inspection", () => {
    it("should return error when is before blocksToExpireAcceptedInspection", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addProducer("Producer B", producer2Address);
      await instance.requestInspection({ from: producer2Address });

      await expectRevert(
        instance.acceptInspection(2, { from: activistAddress }),
        "Can't accept yet"
      );
    });

    it("should accept inspection with success after blocksToExpireAcceptedInspection", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addProducer("Producer B", producer2Address);
      await instance.requestInspection({ from: producer2Address });

      await advanceBlock(20);
      await instance.acceptInspection(2, { from: activistAddress });

      const inspection = await instance.getInspection(2);

      assert.equal(inspection.status, STATUS.accepted);
    });

    it("should accept inspection with success when is OPEN", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.status, STATUS.accepted);
    });

    it("should set address of activist in inspection", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.acceptedBy, activistAddress);
    });

    it("should increment activist giveUps by 1", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      const activist = await activistContract.getActivist(activistAddress);

      assert.equal(activist.giveUps, "1");
    });
  });

  context("when is not activist try accept inspection", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });
      await expectRevert(
        instance.acceptInspection(1, { from: producerAddress }),
        "Please register as activist"
      );
    });
  });

  context("when activist try accept inspection that don't exist", () => {
    it("should return error message", async () => {
      await expectRevert(
        instance.acceptInspection(1, { from: activistAddress }),
        "This inspection don't exist"
      );
    });
  });

  context("when activist try realize inspection the same producer", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });
      await instance.realizeInspection(1, [], { from: activistAddress });

      await advanceBlock(20);
      await instance.requestInspection({ from: producerAddress });

      await expectRevert(
        instance.acceptInspection(2, { from: activistAddress }),
        "Already inspected this producer"
      );
    });
  });

  context("when activist try to realize expired inspection", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await advanceBlock(20);
      await expectRevert(
        instance.realizeInspection(1, [], { from: activistAddress }),
        "Inspection Expired"
      );
    });
  });

  context("when activist try accept inspection not OPEN", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addActivist("Activist B", activist2Address);

      await expectRevert(
        instance.acceptInspection(1, { from: activist2Address }),
        "This inspection is not OPEN"
      );
    });
  });

  context("when activist realize inspection", () => {
    it("should change inspection status to INSPECTED", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);
      await addCategory("Soil B", resea1Address);
      await addCategory("Soil C", resea1Address);

      await realizeInspection(1, isas(), activistAddress);

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.status, STATUS.inspected);
    });

    it("should decrease activist giveUps by 1", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);
      await addCategory("Soil B", resea1Address);
      await addCategory("Soil C", resea1Address);

      await realizeInspection(1, isas(), activistAddress);

      const activist = await activistContract.getActivist(activistAddress);

      assert.equal(activist.giveUps, "0");
    });

    it("should update inspectionList", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);
      await addCategory("Soil B", resea1Address);
      await addCategory("Soil C", resea1Address);

      await realizeInspection(1, isas(), activistAddress);

      const inspections = await instance.getInspections();

      assert.equal(inspections[0].status, STATUS.inspected);
    });

    it("should update inspection isas", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);
      await addCategory("Soil B", resea1Address);
      await addCategory("Soil C", resea1Address);

      await realizeInspection(1, isas(), activistAddress);

      const isasResponse = await instance.getIsa(1);
      const isas_ = [
        ["1", "0", "Hash_1", 10],
        ["2", "0", "Hash_2", 10],
        ["3", "1", "Hash_3", 10],
      ];

      assert.equal(JSON.stringify(isasResponse), JSON.stringify(isas_));
    });

    it("should add 10 isaScore to inspection when select totallySustainable", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.isaScore, 10);
    });

    it("should add 5 isaScore to inspection when select partiallySustainable", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 1,
          report: "PARTIALLY_SUSTAINABLE",
          indicator: 5,
          indicator: 5,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.isaScore, 5);
    });

    it("should add 0 isaScore to inspection when select neutro", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 2,
          report: "NEUTRO",
          indicator: 0,
          indicator: 0,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.isaScore, 0);
    });

    it("should remove 5 isaScore from inspection when select partiallyNotSustainable", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 3,
          report: "PARTIALLY_NOT_SUSTAINABLE",
          indicator: -5,
          indicator: -5,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.isaScore, -5);
    });

    it("should remove 10 isaScore from inspection when select totallyNotSustainable", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 4,
          report: "TOTALLY_NOT_SUSTAINABLE",
          indicator: -10,
          indicator: -10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const inspection = await instance.getInspection(1);

      assert.equal(inspection.isaScore, -10);
    });

    it("should add isaScore in producer", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const inspection = await instance.getInspection(1);
      const producer = await producerContract.getProducer(producerAddress);

      assert.equal(inspection.isaScore, producer.isa.isaScore);
    });

    it("should set producer recentInspection to false", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const producer = await producerContract.getProducer(producerAddress);

      assert.equal(producer.recentInspection, false);
    });

    it("should increment producer totalRequests", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const producer = await producerContract.getProducer(producerAddress);

      assert.equal(producer.totalInspections, 1);
    });

    it("should increment activist totalInspections", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const activist = await activistContract.getActivist(activistAddress);

      assert.equal(activist.totalInspections, 1);
    });

    it("should add inspection to activist in userInspections", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const userInspections = await instance.getInspectionsHistory({
        from: activistAddress,
      });

      assert.equal(userInspections.length, 1);
    });

    it("should add inspection to producer in userInspections", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addCategory("Soil A", resea1Address);

      const isas = [
        {
          categoryId: 1,
          isaIndex: 0,
          report: "TOTALLY_SUSTAINABLE",
          indicator: 10,
          indicator: 10,
        },
      ];
      await realizeInspection(1, isas, activistAddress);

      const userInspections = await instance.getInspectionsHistory({
        from: producerAddress,
      });

      assert.equal(userInspections.length, 1);
    });
  });

  context("when activist try realize inspection not accepted", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });

      await expectRevert(
        instance.realizeInspection(1, [], { from: activistAddress }),
        "Accept this inspection before"
      );
    });
  });

  context("when activist try realize inspection accepted by other activist", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await addActivist("Activist B", activist2Address);

      await expectRevert(
        instance.realizeInspection(1, [], { from: activist2Address }),
        "You not accepted this inspection"
      );
    });
  });

  context("when is not activist and try realize inspection", () => {
    it("should return error message", async () => {
      await instance.requestInspection({ from: producerAddress });
      await instance.acceptInspection(1, { from: activistAddress });

      await expectRevert(
        instance.realizeInspection(1, [], { from: producerAddress }),
        "Please register as activist"
      );
    });
  });

  context("when inspection don't exist and try realize inspection", () => {
    it("should return error message", async () => {
      await expectRevert(
        instance.realizeInspection(1, [], { from: activistAddress }),
        "This inspection don't exist"
      );
    });
  });
});
