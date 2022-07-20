const ProducerContract = artifacts.require("ProducerContract");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("ProducerContract", (accounts) => {
  let instance;
  let userContract;
  let [ownerAddress, prod1Address, prod2Address] = accounts;

  const addProducer = async (name, address) => {
    await instance.addProducer(
      name,
      "111.111.111-00",
      "CPF",
      "Brazil",
      "SP",
      "Jundiai",
      "135465-005",
      {from: address}
    );
  };

  beforeEach(async () => {
    userContract = await UserContract.new();

    instance = await ProducerContract.new(userContract.address);

    await userContract.newAllowedCaller(instance.address);
    await instance.newAllowedCaller(ownerAddress);
  });
  context("when access producer fields",() => {
    it("should have fields", async () => {
      await addProducer("Producer A", prod1Address);
      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.id, "1")
      assert.equal(producer.producerWallet, prod1Address)
      assert.equal(producer.userType, 1)
      assert.equal(producer.name, "Producer A")
      assert.equal(producer.document, "111.111.111-00")
      assert.equal(producer.documentType, "CPF")
      assert.equal(producer.totalRequests, 0)
      assert.equal(producer.recentInspection, false)
      assert.equal(producer.isa.isaAverage, "0")
      assert.equal(producer.isa.isaScore, "0")
      assert.equal(producer.tokenApprove.allowed, 0)
      assert.equal(producer.tokenApprove.withdrewToken, false)

      assert.equal(producer.propertyAddress.country, "Brazil")
      assert.equal(producer.propertyAddress.state, "SP")
      assert.equal(producer.propertyAddress.city, "Jundiai")
      assert.equal(producer.propertyAddress.cep, "135465-005")
    })
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

      assert.equal(producer.totalRequests, 0);
    });

    it("should be created with isaAvarage equal zero", async () => {
      await addProducer("Producer A", prod1Address);
      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.isa.isaAverage, "0")
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

  context("when producer don't exists", () => {
    it("should return false when producer don't exists", async () => {
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

  context("when can't allow tokens", () => {
    it("should return zero when can't allowed tokens", async () => {
      await addProducer("Producer A", prod1Address);

      const tokensApprove = await instance.getProducerApprove(prod1Address);

      assert.equal(tokensApprove, 0);
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

    it("should success .updateIsaScore when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.updateIsaScore(prod1Address, 50);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.isa.isaScore, 50);
    });
    
    it("should success .incrementRequests when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.incrementRequests(prod1Address);

      const producer = await instance.getProducer(prod1Address);

      assert.equal(producer.totalRequests, 1);
    });

    it("should success .approveProducerNewTokens when is allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await instance.approveProducerNewTokens(prod1Address, 1000);
  
      const producer = await instance.getProducer(prod1Address);
  
      assert.equal(producer.tokenApprove.allowed, 1000);
    });
  });

  context("when is not allowed caller", () => {
    it("should return error .recentInspection when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expectRevert(
        instance.recentInspection(prod1Address, true, {from: prod1Address}),
        "Not allowed caller"
      );
    });

    it("should return error .updateIsaScore when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expectRevert(
        instance.updateIsaScore(prod1Address, 50, {from: prod1Address}),
        "Not allowed caller"
      );
    });

    it("should return error .incrementRequests when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expectRevert(
        instance.incrementRequests(prod1Address, {from: prod1Address}),
        "Not allowed caller"
      );
    });

    it("should return error .approveProducerNewTokens when is not allowed caller", async () => {
      await addProducer("Producer A", prod1Address);
      await expectRevert(
        instance.approveProducerNewTokens(prod1Address, 1000, {from: prod1Address}),
        "Not allowed caller"
      );
    });
  });
});
