const CategoryContract = artifacts.require("CategoryContract");
const ProducerContract = artifacts.require("ProducerContract");
const ResearcherContract = artifacts.require("ResearcherContract");
const ActivistContract = artifacts.require("ActivistContract");
const Sintrop = artifacts.require("Sintrop");

module.exports = function (deployer) {
  deployer.then(async () => {
    let accounts = await web3.eth.getAccounts();
    let [_, producer1, producer2, activist1, activist2, researcher1] = accounts;

    const categoryContract = await CategoryContract.deployed();
    const activistContract = await ActivistContract.deployed();
    const producerContract = await ProducerContract.deployed();
    const researcherContract = await ResearcherContract.deployed();
    const sintrop = await Sintrop.deployed();

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

    await categoryContract.addCategory(
      "Origem da energia",
      `Categoria para medir a origem da energia utilizada na produção. Variáveis: Es [kwh] = Energia solar produzida; Ee [kwh] Energia eólica produzida;  Eh  = Energia hídrica produzida; Eb = Energia biomassa produzida; Ec = Energia comprada da concessionária; ERP = Energia renovável produzida = Es + Ee + Eh + Eb; `,
      `Calcule a quantidade de energia consumida da produção (kwh) para cada uma das variáveis. Tire foto do sistema de produção local, tire foto da conta da energia ou nota fiscal emitida. `,
      `Ec = 0`,
      `ERP > Ec`,
      `Não gasta energia elétrica`,
      `Ec > ERP`,
      `Ec > 0 e ERP = 0`,     
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Origem fertilizantes",
      `Categoria para medir a origem dos fertilizantes utilizados na produção. Variáveis [m3] : B = biofertilizante produzido; NPK = fertilizante npk comprado; BM = biomassa local; O = adubo orgânico comprado; AQ = fertilizantes químicos comprados. Considerando a utilização nas últimas 12 eras, qual foi a quantidade utilizada de cada tipo no total?`,
      `Para medir a BM, calcule a quantidade utilizada de todo tipo de matéria orgânica produzida localmente. O que inclui: Matéria proveniente de poda, esterco de animais, cultivo de plantas aquáticas como a azolla. Para medir B, calcule a quantidade de fertilizante produzido através da fermentação por microorganismos, como fertilizantes provenientes da biodigestão. Para medir os itens comprados, verifique as notas fiscais e os registros de compra. No relatório, publique as fotos, os cálculos utilizados e o valor final estimado.`,
      `AQ = 0, NPK = 0, B > 0, BM > 0, O = 0`,
      `AQ = 0, NPK = 0, B = 0, BM > 0, O = 0`,
      `AQ = 0, NPK = 0, O ≠ 0`,
      `AQ ≠ 0 ou NPK ≠ 0; B > 0, BM >0 `,
      `AQ ≠ 0 ou NPK ≠ 0, B = 0 `,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Biodiversidade vegetal",
      `Categoria para medir a quantidade de árvores perenes na propriedade e o sequestro CO2 estimado por elas. Variáveis: A [ha] = área da propriedade; T10 = quantidade de árvores com 10 anos de vida ou mais. T5 = quantidade de árvores entre 5 e 10 anos de vida. T3 = quantidade de árvores entre 3 e 5 anos de vida. IAH = [ (5*T10) + (2*T5) + T3 ] / A. Excluindo as áreas de proteção permanente, considerando apenas a área de produção qual é o IAH ou índice de árvores por hectar do produtor?`,
      `Calcule a quantidade de árvores de toda a propriedade estimando a idade delas. Deverá chegar em um valor final em cada uma das idades. No relatório, publique fotos e o cálculo utilizado para chegar no valor final.`,
      `IAA > 1000`,
      `1000 > IAA > 200`,
      `200 > IAA > 100`,
      `IAA < 100`,
      `IAA < 50`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Biodiversidade animal",
      `Categoria para medir a biodiversidade animal da propriedade.  Sendo B a quantidade de vida animal encontrada, qual o valor de B encontrado?`,
      `Registre todos os animais e insetos encontrados a olho nu e apresente as fotos no relatório final.`,
      `B > 40`,
      `25 < B <= 40`,
      `20 < B <= 25`,
      `10 < B <= 20`,
      `B <= 10`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Solos",
      `Categoria para medir a saúde do solo da propriedade. Considerando 3 tipos de solos: S1 = solo vivo, de coloração escura, com presença de inúmeros microorganismos, coberto com matéria orgânica e com alta biodiversidade animal no solo. S2 = solo em processo de recuperação, com alguma biodiversidade e insetos no local, de coloração não muito escura porém já com indícios de matéria orgânica. S3 = solo em degradação, de coloração bem clara, com pouca ou nenhuma biodervisisadae e insetos, com baixíssima concentração de matéria orgânica, sem cobertura de solo e baixa capacidade de reter humidade e baixa fertilidade. Considerando toda área de produção, qual alternativa melhor encaixa para o produtor avaliado?`,
      `Recorra pelas áreas produtivas, recolhendo amostras e tirando fotos do solo encontrado. Exiba fotos, cálculos e a linha de raciocínio que te levou a conclusão da alternativa selecionada.`,
      `S1 > 70% e S3 < 5%`,
      `S1 > 50%`,
      `Produção que não utiliza o solo. Ex: indoor, hidropônica.`,
      `S3 > (S1 + S2)`,
      `S3 > 70%`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Esgoto e saneamento",
      `Categoria para medir o destino do esgoto e saneamento da propriedade. Qual alternativa melhor descreve o produtor avaliado?`,
      `Registre e tire fotos da entrada e saída dos efluentes da propriedade. Em caso de criação de animais, registre o destino dos dejetos. `,
      `Trata 100% de seus efluentes localmente, com técnicas sustentáveis como biodigestores, banheiro seco e utiliza os subprodutos do processo localmente, não enviando nenhum resíduo para outros locais.`,
      `Trata 100% de seus efluentes localmente, com técnicas sustentáveis como biodigestores, banheiro seco e envia os resíduos tratados para a natureza.`,
      `Trata parcialmente seus efluentes localmente, com técnicas sustentáveis como biodigestores, banheiro seco. Envia efluentes tratados para a rede pública de esgoto e saneamento.`,
      `Propriedade utiliza somente a rede pública de esgoto e saneamento.`,
      `Propriedade despeja, com pouco ou nenhum tratamento, esgoto, dejetos ou outros poluentes diretamente na natureza.`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Combustíveis fósseis",
      `Categoria para medir a quantidade de combustíveis fósseis utilizada na produção e logística. Qual opção melhor descreve o produtor inspecionado`,
      `Considere como comustível fóssil os provenientes do petróleo, como a gasolina, o diesel, querosene e semelhantes. Considere biocombustível como os provenientes de matéria orgânica, como o etanol.`,
      `Não utiliza nenhum tipo de comustível fóssil na produção, somente equipamentos com energia limpa. Vende os produtos apenas localmente e não utiliza comustível fóssil na logística.`,
      `Não utiliza nenhum tipo de combustível fóssil na produção, somente com equipamentos com energia limpa. Vende os produtos regionalmente com utilização de comustível na logística apenas com veículos de pequeno porte.`,
      `Utiliza combustível fóssil na produção apenas com pequenas máquinas, com um consumo de menos de 100 litros por era. Vende os produtores regionalmente com pequena utilização de combustível fóssil na logística.`,
      `Utiliza centenas de litros de comustíveis na produção com máquinas agrícolas pesadas e/ou trabalha com longos fretes nacionais e transporte por veículos pesados.`,
      `Utiliza milhares de litros de combustíveis na produção com máquinas agrícolas pesadas e/ou vende os produtos por longas distâncias com logística internacional.`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Defensivos",
      `Categoria para medir a utilização de defensivos na produção. Considere como um defensivo químico, ou agrotóxico, todo e qualquer produto de origem química aplicado na produção. Considere como defensivo biológico os produtos industriais com base em ativos biológicos. Considere como defensivo natural a própria natureza manipulada pelo ser humano, com fungos ou outros animais por exemplo. Considere defensivo caseiro produtos produzidos naturalmente sem nenhum tipo de química.`,
      `Analise todos os mecanismos de defesa utilizado pelo produtor rural durante o período das últimas 12 eras.`,
      `Não utiliza nenhum tipo de defensivo. Trabalha com processos ao invés de insumos e enxerga a biodiversidade como parte do ecossistema.`,
      `Utiliza métodos de defesa naturais com zero utilização de químicos e biológicos.`,
      `Utiliza apenas defensivos caseiros`,
      `Utiliza defensivos biológicos`,
      `Utiliza defensivos químicos`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Desmatamento",
      `Categoria para medir o nível de desmatamento da propriedade. Considerando a data de entrada do produtor no local e o histórico da região, qual alternativa melhor se aplica? `,
      `Registre a data de entrada do produtor na propriedade. Avalie as condições atuais do local e use imagens de satélite e indicações históricas sobre o passado da região. Registre foto do local reflorestado ou desmatado.`,
      `Local reflorestado após a entrada do produtor na propriedade.`,
      `Local não desmatado após entrada do produtor da propriedade com áreas de preservação.`,
      `Produção indoor ou não se aplica`,
      `Local desmatado antes da entrada do produtor na propriedade e sem áreas reflorestadas.`,
      `Local desmatado após a entrada do produtor na propriedade. `,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Quantidade de queimadas",
      `Categoria para medir a quantidade de queimadas realizadas pelo produtor rural`,
      `Sendo Q a quantidade de queimadas intencionais realizadas pelo produtor, e K a quantidade de queimadas acidentais ocorridas na propriedade, qual o valor de Q e K para o produtor inspecionado?`,
      `Q = 0 e K = 0;`,
      `Q = 0 e K = 1;`,
      `Q = 0 e K >= 2;`,
      `Q = 1;`,
      `Q >= 2`,
      { from: researcher1 }
    );

    await categoryContract.addCategory(
      "Quantidade de embalagens distribuídas.",
      `Categoria para medir a quantidade de embalagens distribuídas ao consumidor/comprador. Variáveis: Er = embalagens retornáveis; Ep = embalagens plásticas ou provenientes do petróleo; Eb = embalagens biodegradáveis, Ev = embalagens de vidro; Ea = embalagens de alumínio. No período de 1 era, qual a quantidade de embalagens que melhor descreve a distribuição do produtor?`,
      `Calcule a quantidade de embalagens de cada material, e a quantidade de embalagens retornáveis. Tire foto delas. Exiba o cálculo e como chegou na estimativa final.`,
      `Ep = 0; Ev = 0; Ea = 0; `,
      `Ep = 0; Ev ≠ 0; Ea ≠ 0;`,
      `Eb > 0`,
      `Ep > 0`,
      `Ep > 1000`,
      { from: researcher1 }
    );

    await sintrop.requestInspection({ from: producer1 });
    await sintrop.requestInspection({ from: producer2 });
    await sintrop.acceptInspection(1, { from: activist1 });    

//    await sintrop.realizeInspection(1, [
//      {categoryId: 1, isaIndex: 0, report: "Solo A totalmente sustentável", proofPhoto: "Hash_1"}, 
//      {categoryId: 2, isaIndex: 1, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 3, isaIndex: 2, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 4, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 5, isaIndex: 4, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 6, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 7, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 8, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 9, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 10, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 11, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}, 
//      {categoryId: 12, isaIndex: 3, report: "Utiliza defensivo químico", proofPhoto: "Hash_2"}], 
//      { from: activist1 })
  });
};
