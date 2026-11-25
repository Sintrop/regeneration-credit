const { userTypes } = require("./shared/user_types");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { voteRulesDeployed } = require("./shared/vote_rules_deployed");

describe("SupporterRules", () => {
  let instance, communityRules, regenerationCredit, researcherRules;
  let ownerAddress, inv1Address, inv2Address, user1Address;

  const addSupporter = async (name, description, profilePhoto, from, inviter = ethers.ZeroAddress) => {
    await instance.connect(from).addSupporter(name, description, profilePhoto, inviter);
  };

  const updateProfilePhoto = async (newPhoto, from) => {
    await instance.connect(from).updateProfilePhoto(newPhoto);
  };

  const transferTokensTo = async (userAddress, tokens) => {
    await regenerationCredit.transfer(userAddress, tokens);
  };

  const addCalculatorItem = async (from) => {
    await researcherRules.connect(from).addCalculatorItem("item", "g", "thesis", 1);
  };

  beforeEach(async () => {
    [ownerAddress, inv1Address, inv2Address, user1Address] = await ethers.getSigners();

    const validatorRulesDeployed = await voteRulesDeployed();

    regenerationCredit = validatorRulesDeployed.regenerationCredit;
    communityRules = validatorRulesDeployed.communityRules;
    researcherRules = validatorRulesDeployed.researcherRules;

    const instanceFactory = await ethers.getContractFactory("SupporterRules");
    instance = await instanceFactory.deploy(communityRules.target, researcherRules.target, regenerationCredit.target);

    await communityRules.newAllowedCaller(instance.target);
    await communityRules.newAllowedCaller(researcherRules.target);
    await communityRules.newAllowedCaller(ownerAddress);
    await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
  });

  describe("#addSupporter", () => {
    context("when supporter exists", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await expect(addSupporter("Supporter A", "description", "profilePhoto", inv1Address)).to.be.revertedWith(
          "Already registered"
        );
      });
    });

    context("when supporter don't exist", () => {
      it("create supporter", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
        expect(supporter.description).to.equal("description");
        expect(supporter.profilePhoto).to.equal("profilePhoto");
        expect(supporter.offsetsCount).to.equal(0);
        expect(supporter.reductionItemsCount).to.equal(0);
      });

      it("increment supporterCount", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
        const supportersCount = await communityRules.userTypesCount(userTypes.Supporter);

        expect(supportersCount).to.equal(2);
      });

      it("add created supporter in userType contract as a SUPPORTER", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);

        const userType = await communityRules.getUser(inv1Address);
        const SUPPORTER = 7;

        expect(userType).to.equal(SUPPORTER);
      });
    });

    context("when the supporter declares an inviter", () => {
      beforeEach(async () => {
        await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
      });

      it("records the declared inviter", async () => {
        await addSupporter("Supporter B", "description", "profilePhoto", inv2Address, inv1Address);

        const invitation = await communityRules.getInvitation(inv2Address);
        expect(invitation.inviter).to.equal(inv1Address.address);
        expect(invitation.userType).to.equal(userTypes.Supporter);
      });

      it("emits InvitationAdded", async () => {
        await expect(
          instance.connect(inv2Address).addSupporter("Supporter B", "description", "profilePhoto", inv1Address)
        )
          .to.emit(communityRules, "InvitationAdded")
          .withArgs(inv1Address.address, inv2Address.address, userTypes.Supporter);
      });

      it("does not need an invitation sent by the inviter", async () => {
        await addSupporter("Supporter B", "description", "profilePhoto", inv2Address, inv1Address);

        expect(await communityRules.getUser(inv2Address)).to.equal(userTypes.Supporter);
      });
    });

    context("when the supporter declares no inviter", () => {
      it("registers the supporter without invitation", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);

        const invitation = await communityRules.getInvitation(inv1Address);
        expect(invitation.inviter).to.equal(ethers.ZeroAddress);
        expect(invitation.createdAtBlock).to.equal(0);
      });
    });

    context("when the declared inviter is not a supporter", () => {
      it("should return error when the inviter is not registered", async () => {
        await expect(
          addSupporter("Supporter A", "description", "profilePhoto", inv1Address, inv2Address)
        ).to.be.revertedWith("Inviter must be a supporter");
      });

      it("should return error when the inviter is another user type", async () => {
        await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
        await communityRules.addInvitation(ownerAddress, user1Address, userTypes.Activist);
        await communityRules.addUser(user1Address, userTypes.Activist);

        await expect(
          addSupporter("Supporter B", "description", "profilePhoto", inv2Address, user1Address)
        ).to.be.revertedWith("Inviter must be a supporter");
      });

      it("should return error when the supporter declares itself", async () => {
        await expect(
          addSupporter("Supporter A", "description", "profilePhoto", inv1Address, inv1Address)
        ).to.be.revertedWith("Inviter must be a supporter");
      });
    });

    context("when the declared inviter has been denied", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await communityRules.setToDenied(inv1Address);

        await expect(
          addSupporter("Supporter B", "description", "profilePhoto", inv2Address, inv1Address)
        ).to.be.revertedWith("Inviter denied");
      });
    });

    context("when an invitation for another user type exists before registration", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await communityRules.addInvitation(ownerAddress, user1Address, userTypes.Activist);
        await communityRules.addUser(user1Address, userTypes.Activist);
        await communityRules.addInvitation(user1Address, inv2Address, userTypes.Regenerator);
      });

      it("should return error when the supporter declares an inviter", async () => {
        await expect(
          addSupporter("Supporter B", "description", "profilePhoto", inv2Address, inv1Address)
        ).to.be.revertedWith("Already invited");
      });

      it("should return error when the supporter declares no inviter", async () => {
        await expect(addSupporter("Supporter B", "description", "profilePhoto", inv2Address)).to.be.revertedWith(
          "Already invited"
        );
      });

      it("keeps the invitation", async () => {
        await expect(addSupporter("Supporter B", "description", "profilePhoto", inv2Address)).to.be.reverted;

        const invitation = await communityRules.getInvitation(inv2Address);
        expect(invitation.inviter).to.equal(user1Address.address);
        expect(invitation.userType).to.equal(userTypes.Regenerator);
      });
    });
  });

  describe("#updateProfilePhoto", () => {
    context("without supporter", () => {
      it("should return error", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await expect(updateProfilePhoto("newPhoto", inv2Address)).to.be.revertedWith("Only supporters");
      });
    });

    context("with supporter", () => {
      it("should update photo", async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
        await updateProfilePhoto("newPhoto", inv1Address);
        const supporter = await instance.getSupporter(inv1Address);

        expect(supporter.supporterWallet).to.equal(inv1Address.address);
        expect(supporter.profilePhoto).to.equal("newPhoto");
      });
    });
  });

  describe("#getSupporter", () => {
    it("return a supporter", async () => {
      await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);

      const supporter = await instance.getSupporter(inv1Address);

      expect(supporter.supporterWallet).to.equal(inv1Address.address);
      expect(supporter.profilePhoto).to.equal("profilePhoto");
    });
  });

  describe("#offset", () => {
    context("when msg.sender is SUPPORTER", () => {
      beforeEach(async () => {
        await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
      });

      context("when amount is valid", () => {
        context("when calculatorItemId exists", () => {
          beforeEach(async () => {
            await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
            await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
            await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

            await addCalculatorItem(user1Address);
          });

          context("when SUPPORTER was invited", () => {
            beforeEach(async () => {
              await addSupporter("Supporter B", "description", "profilePhoto", inv2Address, inv1Address);
              await transferTokensTo(inv2Address, 100000000000000000000n);
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await regenerationCredit.connect(inv2Address).approve(instance.target, 1000000000000000000n);
                await instance.connect(inv2Address).offset(1000000000000000000n, 950000000000000000n, 1, "message");
              });

              it("calculatorItemCertificates to item 1 must be 950000000000000000", async () => {
                const value = await instance.calculatorItemCertificates(inv2Address, 1);

                expect(value).to.equal(950000000000000000n);
              });

              it("must add offset amount", async () => {
                const offset = await instance.offsets(1);
                expect(offset.supporterAddress).to.equal(inv2Address);
                expect(offset.amountBurn).to.equal("950000000000000000");
                expect(offset.calculatorItemId).to.equal(1);
                expect(offset.message).to.equal("message");
              });

              it("must add offset total count", async () => {
                const offsetsCount = await instance.offsetsCount();
                expect(offsetsCount).to.equal(1);
              });

              it("must add offset supporter count", async () => {
                const supporter = await instance.getSupporter(inv2Address);
                expect(supporter.offsetsCount).to.equal(1);
              });

              it("must pay comission", async () => {
                const balanceOf = await regenerationCredit.balanceOf(inv1Address);
                const expectedBalance = 50000000000000000n;

                expect(balanceOf).to.equal(expectedBalance);
              });
            });
          });

          context("when SUPPORTER wasn't invited", () => {
            beforeEach(async () => {
              await transferTokensTo(inv1Address, 100000000000000000000n);
            });

            context("when burn 1000000000000000000 tokens", () => {
              beforeEach(async () => {
                await regenerationCredit.connect(inv1Address).approve(instance.target, 1000000000000000000n);
                await instance.connect(inv1Address).offset(1000000000000000000n, 950000000000000000n, 1, "message");
              });

              it("calculatorItemCertificates to item 1 must be 1000000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(1000000000000000000n);
              });
            });

            context("when burn 5000000000000000000 tokens", () => {
              beforeEach(async () => {
                await regenerationCredit.connect(inv1Address).approve(instance.target, 5000000000000000000n);
                await instance.connect(inv1Address).offset(5000000000000000000n, 4750000000000000000n, 1, "message");
              });

              it("calculatorItemCertificates to item 1 must be 5000000000000000000n", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(5000000000000000000n);
              });
            });

            context("when burn multiple times", () => {
              beforeEach(async () => {
                await regenerationCredit.connect(inv1Address).approve(instance.target, 3500000000000000000n);
                await instance.connect(inv1Address).offset(1000000000000000000n, 950000000000000000n, 1, "message");
                await instance.connect(inv1Address).offset(1000000000000000000n, 950000000000000000n, 1, "message");
                await instance.connect(inv1Address).offset(1500000000000000000n, 100000000000000000n, 1, "message");
              });

              it("calculatorItemCertificates must sum all offsets", async () => {
                const value = await instance.calculatorItemCertificates(inv1Address, 1);

                expect(value).to.equal(3500000000000000000n);
              });
            });
          });
        });

        context("when calculatorItemId does not exists", () => {
          beforeEach(async () => {
            await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
            await addSupporter("Supporter B", "description", "profilePhoto", inv2Address, inv1Address);
            await transferTokensTo(inv2Address, 100000000000000000000n);
          });

          context("when burn 1000000000000000000 tokens", () => {
            it("calculatorItemCertificates to item 10 must be 0", async () => {
              await expect(
                instance.connect(inv2Address).offset(1000000000000000000n, 950000000000000000n, 10, "message")
              ).to.be.revertedWith("Calculator item does not exist");
            });
          });
        });
      });

      context("when amount is invalid", () => {
        beforeEach(async () => {
          await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
          await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
          await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

          await addCalculatorItem(user1Address);
        });

        context("without allowance", () => {
          it("should return error", async () => {
            await expect(
              instance.connect(inv1Address).offset(1000000000000000000n, 950000000000000000n, 1, "message")
            ).to.be.revertedWithCustomError(regenerationCredit, "ERC20InsufficientAllowance");
          });
        });

        context("without minimum amount", () => {
          it("should return error", async () => {
            await expect(
              instance.connect(inv1Address).offset(100000000000000000n, 95000000000000000n, 1, "message")
            ).to.be.revertedWith("Amount must be at least 1 RC");
          });
        });
      });
    });
  });

  // describe("#publish", () => {
  //   context("when msg.sender is SUPPORTER", () => {
  //     beforeEach(async () => {
  //       await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
  //     });

  //     context("when amount is valid", () => {
  //       context("when text is valid", () => {
  //         beforeEach(async () => {
  //           await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
  //         });

  //         context("when SUPPORTER was invited", () => {
  //           beforeEach(async () => {
  //             await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
  //             await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
  //             await transferTokensTo(inv2Address, 10000000000000000000n);
  //           });

  //           context("when burn 1000000000000000000 tokens", () => {
  //             beforeEach(async () => {
  //               await regenerationCredit.connect(inv2Address).approve(instance.target, 10000000000000000000n);
  //               await instance
  //                 .connect(inv2Address)
  //                 .publish(10000000000000000000n, 9500000000000000000n, "text", "description");
  //             });

  //             it("must add publication amount", async () => {
  //               const publication = await instance.publications(1);
  //               expect(publication.amount).to.equal("9500000000000000000");
  //               expect(publication.description).to.equal("text");
  //               expect(publication.content).to.equal("description");
  //             });

  //             it("must add publication total count", async () => {
  //               const publicationsCount = await instance.publicationsCount();
  //               expect(publicationsCount).to.equal(1);
  //             });

  //             it("must add publication supporter count", async () => {
  //               const supporter = await instance.getSupporter(inv2Address);
  //               expect(supporter.publicationsCount).to.equal(1);
  //             });

  //             it("must pay comission", async () => {
  //               const balanceOf = await regenerationCredit.balanceOf(inv1Address);
  //               const expectedBalance = 500000000000000000n;

  //               expect(balanceOf).to.equal(expectedBalance);
  //             });
  //           });
  //         });

  //         context("when SUPPORTER wasn't invited", () => {
  //           beforeEach(async () => {
  //             await transferTokensTo(inv1Address, 100000000000000000000n);
  //           });

  //           context("when burn 1000000000000000000 tokens", () => {
  //             beforeEach(async () => {
  //               await regenerationCredit.connect(inv1Address).approve(instance.target, 10000000000000000000n);
  //               await instance
  //                 .connect(inv1Address)
  //                 .publish(10000000000000000000n, 9500000000000000000n, "text", "description");
  //             });

  //             it("certificate must be 10000000000000000000n", async () => {
  //               const certificate = await regenerationCredit.certificate(inv1Address);

  //               expect(certificate).to.equal(10000000000000000000n);
  //             });
  //           });

  //           context("when burn multiple times", () => {
  //             beforeEach(async () => {
  //               await regenerationCredit.connect(inv1Address).approve(instance.target, 35000000000000000000n);
  //               await instance
  //                 .connect(inv1Address)
  //                 .publish(10000000000000000000n, 9500000000000000000n, "text", "description");
  //               await instance
  //                 .connect(inv1Address)
  //                 .publish(10000000000000000000n, 9500000000000000000n, "text", "description");
  //               await instance
  //                 .connect(inv1Address)
  //                 .publish(15000000000000000000n, 1000000000000000000n, "text", "description");
  //             });

  //             it("user certificate must sum all offsets", async () => {
  //               const certificate = await regenerationCredit.certificate(inv1Address);

  //               expect(certificate).to.equal(35000000000000000000n);
  //             });
  //           });
  //         });
  //       });

  //       context("when text is invalid", () => {
  //         beforeEach(async () => {
  //           await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
  //           await communityRules.addInvitation(inv1Address, inv2Address, userTypes.Supporter);
  //           await addSupporter("Supporter B", "description", "profilePhoto", inv2Address);
  //           await transferTokensTo(inv2Address, 100000000000000000000n);
  //           await regenerationCredit.connect(inv1Address).approve(instance.target, 100000000000000000000n);
  //         });

  //         context("when burn 1000000000000000000 tokens", () => {
  //           it("should rever", async () => {
  //             await expect(
  //               instance
  //                 .connect(inv2Address)
  //                 .publish(
  //                   10000000000000000000n,
  //                   9500000000000000000n,
  //                   "text",
  //                   "lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum lorem ipsum ipsum"
  //                 )
  //             ).to.be.revertedWith("Max characters");
  //           });
  //         });
  //       });
  //     });

  //     context("when amount is invalid", () => {
  //       beforeEach(async () => {
  //         await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
  //       });

  //       context("without allowance", () => {
  //         it("should return error", async () => {
  //           await expect(
  //             instance.connect(inv1Address).publish(10000000000000000000n, 9500000000000000000n, "text", "text")
  //           ).to.be.revertedWithCustomError(regenerationCredit, "ERC20InsufficientAllowance");
  //         });
  //       });

  //       context("without minimum amount", () => {
  //         it("should return error", async () => {
  //           await expect(
  //             instance.connect(inv1Address).publish(100000000000000000n, 95000000000000000n, "text", "text")
  //           ).to.be.revertedWith("Amount must be at least 10 RC");
  //         });
  //       });
  //     });
  //   });
  // });

  describe("#declareReductionCommitment", () => {
    beforeEach(async () => {
      await addSupporter("Supporter A", "description", "profilePhoto", inv1Address);
    });

    context("when is supporter", () => {
      context("when calculatorItem exists", () => {
        beforeEach(async () => {
          await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
          await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
          await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

          await addCalculatorItem(user1Address);

          await instance.connect(inv1Address).declareReductionCommitment(1);
        });

        it("return a supporter", async () => {
          const reductionCommitments = await instance.getReductionCommitments(inv1Address);

          expect(reductionCommitments[0]).to.eq(1);
        });

        it("must add reduction item supporter count", async () => {
          const supporter = await instance.getSupporter(inv1Address);
          expect(supporter.reductionItemsCount).to.equal(1);
        });
      });

      context("when try to declared the same item twice", () => {
        it("should return error", async () => {
          await communityRules.setContractCall(ownerAddress, ownerAddress, instance.target);
          await communityRules.addInvitation(inv1Address, user1Address, userTypes.Researcher);
          await researcherRules.connect(user1Address).addResearcher("Researcher  A", "photoURL");

          await addCalculatorItem(user1Address);

          await instance.connect(inv1Address).declareReductionCommitment(1);

          await expect(instance.connect(inv1Address).declareReductionCommitment(1)).to.be.revertedWith(
            "Commitment already declared"
          );
        });
      });

      context("when calculatorItem does not exists", () => {
        it("should return error", async () => {
          await expect(instance.connect(inv1Address).declareReductionCommitment(100)).to.be.revertedWith(
            "Calculator item does not exist"
          );
        });
      });
    });

    context("when is not a supporter", () => {
      it("return a supporter", async () => {
        await expect(instance.connect(user1Address).declareReductionCommitment(100)).to.be.revertedWith(
          "Only supporters"
        );
      });
    });
  });
});
