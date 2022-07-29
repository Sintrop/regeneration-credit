const InvestorContract = artifacts.require("InvestorContract");
const UserContract = artifacts.require("UserContract");

const expectRevert = require("@openzeppelin/test-helpers").expectRevert;

contract("InvestorContract", (accounts) => {
    let instance;
    let userContract;
    let [ownerAddress, inv1Address, inv2Address] = accounts;

    const addInvestor = async (name, address) => {
        await instance.addInvestor(
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

        instance = await InvestorContract.new(userContract.address);

        await userContract.newAllowedCaller(instance.address);
    });

    context("when will create new investor (.addInvestor)", () => {
        context("when investor exists", () => {
            it("should return error", async () => {
                await addInvestor("Investor A", inv1Address);
                await expectRevert(
                    addInvestor("Investor A", inv1Address),
                    "This investor already exist"
                );
            });

            context("when investor don't exists", () => {
                it("should create investor", async () => {
                    await addInvestor("Investor A", inv1Address);
                    await addInvestor("Investor B", inv2Address);
                    const investor = await instance.getInvestor(inv1Address);

                    assert.equal(investor.investorWallet, inv1Address);
                });

                it("should increment investorCount after create investor", async () => {
                    await addInvestor("Investor A", inv1Address);
                    await addInvestor("Investor B", inv2Address);
                    const investorsCount = await instance.investorsCount();

                    assert.equal(investorsCount, 2);
                });

                it("should add create investor in investorList (array)", async () => {
                    await addInvestor("Investor A", inv1Address);
                    await addInvestor("Investor B", inv2Address);

                    const investors = await instance.getInvestors();

                    assert.equal(investors[0].investorWallet, inv1Address);
                });

                it("should add created investor in userType contract as a INVESTOR", async () => {
                    await addInvestor("Investor A", inv1Address);

                    const userType = await userContract.getUser(inv1Address);
                    const INVESTOR = 7;

                    assert.equal(userType, INVESTOR);
                });
            });
        });
    });

    context("when will get investors (.getInvestors)", () => {
        it("should return investors when has investors", async () => {
            await addInvestor("Investor A", inv1Address);
            await addInvestor("Investor B", inv2Address);

            const investors = await instance.getInvestors();

            assert.equal(investors.length, 2);
        });

        it("should return investors equal zero when don't has it", async () => {
            const investors = await instance.getInvestors();

            assert.equal(investors.length, 0);
        });
    });

    context("when will get investor (.getInvestor)", () => {
        it("should return a investor", async () => {
            await addInvestor("Investor A", inv1Address);

            const investor = await instance.getInvestor(inv1Address);
        
            assert.equal(investor.investorWallet, inv1Address);
        });
    });

    context("when will check if investor exists", () => {
        it("should return true when exists", async () => {
            await addInvestor("Investor A", inv1Address);
            const investorExists = await instance.investorExists(inv1Address);

            assert.equal(investorExists, true);
        });

        it("it should return false when don't exists", async () => {
            const investorExists = await instance.investorExists(inv1Address);

            assert.equal(investorExists, false);
        })
    });
});
