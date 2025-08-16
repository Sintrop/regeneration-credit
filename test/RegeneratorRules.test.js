const { communityRulesDeployed } = require("./shared/user_contract_deployed");
const { regenerationCreditDeployed } = require("./shared/regeneration_credit_deployed");
const { advanceBlock } = require("./shared/advance_block");
const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");

describe("RegeneratorRules", () => {
  let instance;
  let regenerationCredit;
  let communityRules;
  let regeneratorPool;
  let owner, prod1Address, prod2Address;

  const addRegenerator = async (name, from, _coordinates = []) => {
    const test = _coordinates.length > 0 ? _coordinates : coordinates();
    await instance.connect(from).addRegenerator(1000, name, "photoURL", "projectDescription", test);
  };

  const addRegenerator2 = async (name, from, _coordinates = []) => {
    const test = _coordinates.length > 0 ? _coordinates : coordinates();
    await instance.connect(from).addRegenerator(10, name, "photoURL", "projectDescription", test);
  };

  const addRegenerator3 = async (name, from, _coordinates = []) => {
    const test = _coordinates.length > 0 ? _coordinates : coordinates();
    await instance.connect(from).addRegenerator(4000000000, name, "photoURL", "projectDescription", test);
  };

  const coordinates = () => {
    return [
      {
        latitude: "-22.912554",
        longitude: "-44.4925355",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912555",
        longitude: "-44.4925354",
      },
      {
        latitude: "-22.912553",
        longitude: "-44.4925373",
      },
    ];
  };

  const addInvitation = async (inviter, invited, userType, from) => {
    await communityRules.connect(from).addInvitation(inviter, invited, userType);
  };

  const updateAreaPhoto = async (newPhoto, from) => {
    await instance.connect(from).updateAreaPhoto(newPhoto);
  };

  const regeneratorPoolArgs = {
    totalTokens: "750000000000000000000000000",
    halving: 50,
    blocksPerEra: 50,
  };

  beforeEach(async () => {
    [owner, prod1Address, prod2Address] = await ethers.getSigners();

    regenerationCredit = await regenerationCreditDeployed();

    communityRules = await communityRulesDeployed();

    const regeneratorPoolFactory = await ethers.getContractFactory("RegeneratorPool");

    regeneratorPool = await regeneratorPoolFactory.deploy(
      regenerationCredit.target,
      regeneratorPoolArgs.halving,
      regeneratorPoolArgs.blocksPerEra
    );

    const instanceFactory = await ethers.getContractFactory("RegeneratorRules");

    instance = await instanceFactory.deploy(communityRules.target, regeneratorPool.target);

    await regenerationCredit.addContractPool(regeneratorPool.target, regeneratorPoolArgs.totalTokens);
    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(owner);
    await instance.newAllowedCaller(owner);
    await regeneratorPool.newAllowedCaller(instance.target);

    await communityRules.setContractCall(owner, owner);
    await instance.setContractCall(owner, owner);
    await regeneratorPool.setContractCall(instance);

    await addInvitation(owner, prod1Address, userTypes.Regenerator, owner);
    await addInvitation(owner, prod2Address, userTypes.Regenerator, owner);
  });

  context("when access regenerator fields", () => {
    it("should have fields", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.id).to.equal("1");
      expect(regenerator.regeneratorWallet).to.equal(prod1Address.address);
      expect(regenerator.name).to.equal("Regenerator A");
      expect(regenerator.proofPhoto).to.equal("photoURL");
      expect(regenerator.totalArea).to.equal("1000");
      expect(regenerator.totalInspections).to.equal(0);
      expect(regenerator.pendingInspection).to.equal(false);
      expect(regenerator.regenerationScore.score).to.equal("0");
      expect(regenerator.coordinatesCount).to.equal("4");

      expect(regenerator.pool.currentEra).to.equal(1);
    });
  });

  context("when will create a regenerator (.addRegenerator)", () => {
    it("should create regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator B", prod2Address);
      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.regeneratorWallet).to.equal(prod1Address.address);
    });

    it("should be created with totalRequest equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.totalInspections).to.equal(0);
    });

    it("should be created with regenerationScore equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.regenerationScore.score).to.equal(0);
    });

    it("should be created with lastRequestAt equal zero", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const regenerator = await instance.getRegenerator(prod1Address);

      expect(regenerator.lastRequestAt).to.equal(0);
    });

    it("should add coordinates to regenerator mapping", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const coordinates = await instance.coordinates(prod1Address, 0);
      expect(coordinates.toString()).to.equal("-22.912554,-44.4925355");
    });

    it("should increment regeneratorsCount after create regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator B", prod2Address);
      const regeneratorsCount = await communityRules.userTypesCount(userTypes.Regenerator);

      expect(regeneratorsCount).to.equal(2);
    });

    it("should add created regenerator in userType contract as a REGENERATOR", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      const userType = await communityRules.getUser(prod1Address);
      const REGENERATOR = 1;

      expect(userType).to.equal(REGENERATOR);
    });

    it("should add totalArea to regenerationArea", async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await addRegenerator("Regenerator B", prod2Address);

      const newRegenerationArea = await instance.regenerationArea();
      expect(newRegenerationArea).to.equal(2000);
    });
  });

  context("when coordinate points is invalid", () => {
    context("when coordinates is below 3", () => {
      it("should return error when try create regenerator without valid coordinates", async () => {
        const _coordinates = [
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
        ];
        await expect(addRegenerator("Regenerator A", prod1Address, _coordinates)).to.be.revertedWith(
          "Minimum 3 and maximum 10 coordinate points"
        );
      });
    });

    context("when coordinates is bigger than 10", () => {
      it("should return error when try create regenerator without valid coordinates", async () => {
        const _coordinates = [
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
          {
            latitude: "-22.912554",
            longitude: "-44.4925355",
          },
        ];
        await expect(addRegenerator("Regenerator A", prod1Address, _coordinates)).to.be.revertedWith(
          "Minimum 3 and maximum 10 coordinate points"
        );
      });
    });
  });

  context("when coordinate values are invalid", () => {
    it("should revert if coordinates contain duplicates", async () => {
      // Here, the first and last coordinates are identical.
      const duplicateCoordinates = [
        { latitude: "-22.1", longitude: "-44.1" },
        { latitude: "-22.2", longitude: "-44.2" },
        { latitude: "-22.3", longitude: "-44.3" },
        { latitude: "-22.1", longitude: "-44.1" }, // Duplicate
      ];

      // We expect the transaction to revert with the specific error message.
      await expect(addRegenerator("Regenerator A", prod1Address, duplicateCoordinates)).to.be.revertedWith(
        "Duplicate coordinates are not allowed"
      );
    });

    it("should revert if latitude is out of range (> 90)", async () => {
      const invalidLatitudeCoords = [
        { latitude: "-22.1", longitude: "-44.1" },
        { latitude: "91.0", longitude: "-44.2" }, // Invalid Latitude
        { latitude: "-22.3", longitude: "-44.3" },
      ];

      await expect(addRegenerator("Regenerator A", prod1Address, invalidLatitudeCoords)).to.be.revertedWith(
        "Invalid latitude"
      );
    });

    it("should revert if longitude is out of range (> 180)", async () => {
      const invalidLongitudeCoords = [
        { latitude: "-22.1", longitude: "-44.1" },
        { latitude: "-22.2", longitude: "-181.0" }, // Invalid Longitude
        { latitude: "-22.3", longitude: "-44.3" },
      ];

      await expect(addRegenerator("Regenerator A", prod1Address, invalidLongitudeCoords)).to.be.revertedWith(
        "Invalid longitude"
      );
    });

    it("should revert if a coordinate string contains invalid characters", async () => {
      const malformedCoords = [
        { latitude: "-22.1", longitude: "-44.1" },
        { latitude: "abc_invalid", longitude: "-44.2" }, // Malformed string
        { latitude: "-22.3", longitude: "-44.3" },
      ];

      await expect(addRegenerator("Regenerator A", prod1Address, malformedCoords)).to.be.revertedWith(
        "Invalid character in coordinate"
      );
    });

    it("should revert if a coordinate string contains multiple dots", async () => {
      const multiDotCoords = [
        { latitude: "-22.1", longitude: "-44.1" },
        { latitude: "-22.2", longitude: "-44.2.2" }, // Multiple dots
        { latitude: "-22.3", longitude: "-44.3" },
      ];

      await expect(addRegenerator("Regenerator A", prod1Address, multiDotCoords)).to.be.revertedWith(
        "Multiple dots in coordinate"
      );
    });
  });

  context("when totalArea is below 500", () => {
    it("should return error", async () => {
      await expect(addRegenerator2("Regenerator A", prod1Address)).to.be.revertedWith(
        "Minimum 500 and maximum 500.000 square meters"
      );
    });
  });

  context("when totalArea is over 500.000", () => {
    it("should return error", async () => {
      await expect(addRegenerator3("Regenerator A", prod1Address)).to.be.revertedWith(
        "Minimum 500 and maximum 500.000 square meters"
      );
    });
  });

  context("when regenerator alredy exists", () => {
    it("should return error when try create same regenerator", async () => {
      await addRegenerator("Regenerator A", prod1Address);

      await expect(addRegenerator("Regenerator A", prod1Address)).to.be.revertedWith("User already exists");
    });
  });

  describe("#afterRequestInspection", () => {
    beforeEach(async () => {
      await addRegenerator("Regenerator A", prod1Address);
      await instance.afterRequestInspection(prod1Address);
    });

    context("with allowed caller", () => {
      it("set pendingInspection to true", async () => {
        const regenerator = await instance.getRegenerator(prod1Address);

        expect(regenerator.pendingInspection).to.equal(true);
      });

      it("set lastRequestAt", async () => {
        const regenerator = await instance.getRegenerator(prod1Address);

        expect(regenerator.lastRequestAt).to.above(0);
      });
    });

    context("with not allowed caller", () => {
      it("return message error", async () => {
        await expect(instance.connect(prod1Address).afterRequestInspection(prod1Address)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#afterRealizeInspection", () => {
    beforeEach(async () => {
      await addRegenerator("Regenerator A", prod1Address);
    });

    context("with allowed user", () => {
      describe(".setRegenerationScore", () => {
        context("when dont have regenerators sustainable", () => {
          context("when have 1 regenerator", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 64, 1);
            });

            context("when new score + regenerator score is smaller than limit score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 32, 2);
              });

              it("regenerator regeneration score must be 96", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(96);
              });
            });
          });

          context("when have more than one regenerator", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 60, 1);
              await addRegenerator("Regenerator B", prod2Address);
              await instance.afterRealizeInspection(prod2Address, 8, 2);
            });

            context("when new score + regenerator A score is smaller than limit score", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 7, 6);
              });

              it("regenerator regeneration score must be 67", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.regenerationScore.score).to.equal(67);
              });
            });
          });
        });

        context("when regenerator have reached minimum inspections", () => {
          beforeEach(async () => {
            await instance.afterRealizeInspection(prod1Address, 25, 1);
            await instance.afterRealizeInspection(prod1Address, 25, 2);
          });

          context("when is era 1", () => {
            context("when already have 50 levels in regenerator contract", () => {
              context("when receives more 25 levels", () => {
                beforeEach(async () => {
                  await instance.afterRealizeInspection(prod1Address, 25, 3);
                });

                context("when is not in the pool yet", () => {
                  it("set 75 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(75);
                  });

                  it("regenerator regenerationScore must be 75", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(75);
                  });
                });

                context("when already in the pool", () => {
                  beforeEach(async () => {
                    await instance.afterRealizeInspection(prod1Address, 25, 4);
                  });

                  it("set 100 levels to era 1 pool", async () => {
                    const eraLevels = await regeneratorPool.eraLevels(1, prod1Address);

                    expect(eraLevels).to.equal(100);
                  });

                  it("regenerator regenerationScore must be 100", async () => {
                    const regenerator = await instance.getRegenerator(prod1Address);

                    expect(regenerator.regenerationScore.score).to.equal(100);
                  });
                });
              });
            });
          });

          context("when is era 2", () => {
            context("when already have 50 levels in regenerator contract", () => {
              context("when receives more 50 levels", () => {
                beforeEach(async () => {
                  await advanceBlock(regeneratorPoolArgs.blocksPerEra);
                  await instance.afterRealizeInspection(prod1Address, 50, 10);
                });

                it("set 50 levels to era 2 pool", async () => {
                  const eraLevels = await regeneratorPool.eraLevels(2, prod1Address);

                  expect(eraLevels).to.equal(100);
                });

                it("regenerator regenerationScore must be 100", async () => {
                  const regenerator = await instance.getRegenerator(prod1Address);

                  expect(regenerator.regenerationScore.score).to.equal(100);
                });
              });
            });
          });
        });
      });

      describe(".incrementInspections", () => {
        beforeEach(async () => {
          await instance.afterRealizeInspection(prod1Address, 0, 1);
        });

        it("incrementInspections", async () => {
          const regenerator = await instance.getRegenerator(prod1Address);

          expect(regenerator.totalInspections).to.equal(1);
        });
      });
    });

    context("with not allowed user", () => {
      it("should return error message", async () => {
        await expect(instance.connect(prod1Address).afterRealizeInspection(prod1Address, 50, 1)).to.be.revertedWith(
          "Not allowed caller"
        );
      });
    });
  });

  describe("#withdraw", () => {
    context("with regenerator", () => {
      beforeEach(async () => {
        await addRegenerator("Regenerator A", prod1Address);
        await addRegenerator("Regenerator B", prod2Address);
      });

      context("when can approve #blockable", () => {
        context("when regenerator have minimum inspections", () => {
          context("when levels in era is 100", () => {
            beforeEach(async () => {
              await instance.afterRealizeInspection(prod1Address, 0, 1);
              await instance.afterRealizeInspection(prod1Address, 0, 2);
              await instance.afterRealizeInspection(prod1Address, 0, 3);
            });

            context("when regenerator have regenerationScore 50", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod2Address, 0, 4);
                await instance.afterRealizeInspection(prod2Address, 0, 5);
                await instance.afterRealizeInspection(prod2Address, 0, 6);

                await instance.afterRealizeInspection(prod1Address, 50, 7);
                await instance.afterRealizeInspection(prod2Address, 50, 8);

                await advanceBlock(regeneratorPoolArgs.blocksPerEra);

                await instance.connect(prod1Address).withdraw();
                await instance.connect(prod2Address).withdraw();
              });

              it("regenerator A must withdraw 3750000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod1Address);

                expect(balanceOf).to.equal(3750000000000000000000000n);
              });

              it("regenerator B must withdraw 3750000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod2Address);

                expect(balanceOf).to.equal(3750000000000000000000000n);
              });

              it("regenerator A current era must be incremented", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.pool.currentEra).to.equal(2);
              });

              it("regenerator B current era must be incremented", async () => {
                const regenerator = await instance.getRegenerator(prod2Address);

                expect(regenerator.pool.currentEra).to.equal(2);
              });
            });

            context("when regenerator have regenerationScore 50", () => {
              beforeEach(async () => {
                await instance.afterRealizeInspection(prod1Address, 50, 9);
                await advanceBlock(regeneratorPoolArgs.blocksPerEra);
                await instance.connect(prod1Address).withdraw();
              });

              it("must withdraw 7500000000000000000000000n tokens", async () => {
                const balanceOf = await regenerationCredit.balanceOf(prod1Address);

                expect(balanceOf).to.equal(7500000000000000000000000n);
              });

              it("regenerator current era must be increment", async () => {
                const regenerator = await instance.getRegenerator(prod1Address);

                expect(regenerator.pool.currentEra).to.equal(2);
              });
            });
          });
        });

        context("when regenerator dont have minimum inspections", () => {
          it("should return error message", async () => {
            await expect(instance.connect(prod1Address).withdraw()).to.be.revertedWith("Minimum inspections");
          });
        });
      });

      context("when cant approve #blockable", () => {
        beforeEach(async () => {
          await instance.afterRealizeInspection(prod1Address, 0, 1);
          await instance.afterRealizeInspection(prod1Address, 0, 2);
          await instance.afterRealizeInspection(prod1Address, 0, 3);
        });

        it("should return error message", async () => {
          await expect(instance.connect(prod1Address).withdraw()).to.be.revertedWith("You can't approve yet");
        });
      });
    });

    context("with not regenerator", () => {
      it("should return error message", async () => {
        await expect(instance.withdraw()).to.be.revertedWith("Only regenerators pool");
      });
    });
  });

  describe("#regeneratorPoolEra", () => {
    context("when pool is in era 1", () => {
      it("return era equal 1", async () => {
        const currentEra = await instance.poolCurrentEra();

        expect(currentEra).to.equal(1);
      });
    });

    context("when pool is in era 2", () => {
      beforeEach(async () => {
        await advanceBlock(regeneratorPoolArgs.blocksPerEra);
      });

      it("return era equal 1", async () => {
        const currentEra = await instance.poolCurrentEra();

        expect(currentEra).to.equal(2);
      });
    });
  });

  describe("#updateAreaPhoto", () => {
    context("without regenerator", () => {
      it("should return error", async () => {
        await addRegenerator("Regenerator A", prod1Address);
        await expect(updateAreaPhoto("newPhoto", prod2Address)).to.be.revertedWith("Only regenerators");
      });
    });

    context("with regenerator", () => {
      it("should update photo", async () => {
        await addRegenerator("Regenerator A", prod1Address);
        await updateAreaPhoto("newPhoto", prod1Address);
        const areaPhoto = await instance.areaPhoto(prod1Address);

        expect(areaPhoto).to.equal("newPhoto");
      });
    });
  });

  describe("#getCoordinates", () => {
    context("without regenerator", () => {
      it("should return coordinates arrayList", async () => {
        await addRegenerator("Regenerator A", prod1Address);

        const coordinatesList = await instance.getCoordinates(prod1Address);
        const expectedCoordinatesList = JSON.stringify([
          ["-22.912554", "-44.4925355"],
          ["-22.912553", "-44.4925354"],
          ["-22.912555", "-44.4925354"],
          ["-22.912553", "-44.4925373"],
        ]);

        expect(JSON.stringify(coordinatesList)).to.equal(expectedCoordinatesList);
      });
    });
  });
});
