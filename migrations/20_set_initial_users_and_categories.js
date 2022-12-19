const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    let accounts = await web3.eth.getAccounts();
    let [_, producer1, producer2, activist1, activist2, researcher1] = accounts;

    const categoryContract = await CategoryContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();

    await researcherContract.newAllowedUser(researcher1);

    await producerContract.addProducer(
      "Fazenda Ouro Fino",
      "photoURL",
      "123456789123456",
      "CNPJ",
      "Brazil",
      "Bahia",
      "Jequié",
      "Rua Exemplo",
      "Informação adicional",
      "1234567",
      { from: producer1 }
    );

    await producerContract.addProducer(
      "Fazenda Guirra",
      "photoURL",
      "11111111111111",
      "CNPJ",
      "Brazil",
      "São Paulo",
      "São José dos Campos",
      "Rua Exemplo",
      "Como chegar",
      "1111111111111",
      { from: producer2 }
    );

    await activistContract.addActivist(
      "Marcos da Silva",
      "photoURL",
      "Brazil",
      "SP",
      "Ribeirão Preto",
      "2222222222222222",
      { from: activist1 }
    );

    await activistContract.addActivist(
      "Rafaela Carvalho",
      "photoURL",
      "Brazil",
      "SC",
      "Florianopolis",
      "333333333333333",
      { from: activist2 }
    );

    await researcherContract.addResearcher("André de Oliveira Ravagnani", "photoURL", {
      from: researcher1,
    });

    await categoryContract.addCategory(
      "Origem da Água",
      `Categoria para medir a origem da água utilizada na produção. Variáveis: A [m2] = área propriedade, We [m3] = água concessionária comprada, Wc [m3] = água coletada na própria propriedade; Wn [m3] = água coletada fora da propriedade; W [m3] = consumo total. IuA = Wc - ( We + Wn ). Considerando o consumo no período de 1 era, qual foi o índice de uso da água (IuA) do produtor avaliado? `,
      `Para medir o Wc, analise se o produtor coleta água da chuva ou de poços localmente. Faça uma estimativa do volume de água coletada por era dessa forma. Para medir o We, verifique se o produtor compra algo de terceiros e cooperativas com contratos públicos. Tire foto do sistema. Avalie o volume comprado. Tire foto da conta cobrada ou de nota fiscal emitida. Para avaliar água coletada fora da propriedade, estime o consumo e verifique a origem. Calcule IuA e exiba o cálculo e valores encontrados.`,
      ` IuA > 0 e We = 0`,
      `IuA > 0 e We ≠ 0`,
      `Não se aplica`,
      `IuA < 0 e Wc > 0`,
      `IuA < 0 e Wc = 0`,
      { from: researcher1 }
    );
  });
};
