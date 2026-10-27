import { formatBRL, parseNumberBR } from './formatters';

export interface StatementItem {
  id: string;
  data: string;
  descricao: string;
  tipo: 'Crédito' | 'Débito';
  categoria: 'CUSTEIO' | 'CAPITAL' | 'RENDIMENTO' | 'REPASSE';
  valor: number;
  documento?: string;
  favorecido?: string;
  alerta?: string;
}

export interface StatementAlert {
  id: string;
  tipo: 'tarifa' | 'saque_cash' | 'duvida_categoria' | 'inconsistencia';
  nivel: 'aviso' | 'grave';
  titulo: string;
  descricao: string;
  itemReferencia?: string;
}

export interface StatementAnalysisReport {
  instituicao: string;
  bancoPrograma: string;
  saldoInicial: number;
  saldoFinal: number;
  totalRendimentos: number;
  classificacaoRendimento: string;
  itens: StatementItem[];
  alertas: StatementAlert[];
  markdown: string;
  rawText: string;
}

// Built-in presets for instant testing
export const PRESET_STATEMENTS = {
  bancoDoBrasilFNDE: `BANCO DO BRASIL S.A. - AGÊNCIA 0180-5 SANTA CRUZ DO SUL
EXTRATO DE CONTA CORRENTE VINCULADA FNDE / PDDE BÁSICO
INSTITUIÇÃO: CPM DA EMEF MENINO DEUS - CNPJ: 02.456.789/0001-44
CONTA: 14.280-9  |  PERÍODO: 01/04/2024 A 30/04/2024

01/04  SALDO ANTERIOR CONTA CORRENTE                            1.250,00 C
05/04  CRED TED FNDE PDDE BASICO ORDEM BANCARIA 2024OB802319   18.450,00 C
06/04  APLICACAO BB CDB AUTOMATICO                             18.000,00 D
08/04  RENDIMENTO POUPANCA / BB RENDE FACIL                        12,40 C
12/04  DEB PIX PAPELARIA E LIVRARIA CENTRAL LTDA NF 4512        1.350,00 D
14/04  DEB TED MULTI-INFORMATICA NOTEBOOKS EDUCATIVOS           4.800,00 D
16/04  CRED JUROS S/ APLIC RECURSOS FEDERAIS                       18,95 C
19/04  DEB PIX DISK-LIMPEZA MATERIAIS DE HIGIENE E CONSUMO        620,00 D
22/04  DEB PIX CLIMATIZADORES SANTA CRUZ AR CONDICIONADO 12000  2.950,00 D
24/04  DEB PIX REPAROS ELETRICOS E TROCA DE LAMPADAS              430,00 D
25/04  SAQUE TERMINAL AUTOATENDIMENTO CASH                        500,00 D
26/04  DEB TARIFA MANUTENCAO PACOTE MENSAL CONTA                   59,90 D
28/04  DEB PIX TECH & SERVICOS MANUTENCAO COM TROCA DE PLACA    1.100,00 D
30/04  RENDIMENTO DIARIO APLICACAO RF FNDE                         15,80 C
30/04  RESGATE BB CDB AUTOMATICO                               10.500,00 C
30/04  SALDO FINAL ATUAL DISPONIVEL                            19.426,25 C`,

  banrisulMunicipal: `BANRISUL - BANCO DO ESTADO DO RS - AGÊNCIA 0340 SANTA CRUZ DO SUL
EXTRATO CONTA CONVÊNIO PDDE MUNICIPAL - SEE SANTA CRUZ DO SUL
INSTITUIÇÃO: EMEI CARROSSEL - CPM EMEI CARROSSEL
CONTA: 06.128450.0-8  |  PERÍODO: 01/05/2024 A 31/05/2024

01/05  SALDO ANTERIOR                                           2.100,00 C
04/05  CRED TRANSF PM SANTA CRUZ DO SUL - REPASSE RECURSO PROPR 15.000,00 C
06/05  RENDIMENTO AUTOMATICO BANRISUL FUNDO FIX MUNICIPAL          18,30 C
10/05  DEB PIX COMERCIAL DE ALIMENTOS E DESCARTAVEIS PEDAGOGICOS   780,00 D
13/05  DEB TED METALURGICA VALE DO RIO PARDO - ARMARIOS DE ACO   3.600,00 D
17/05  REND. DIARIO APLICACAO CONVENIO MUNICIPAL                   14,20 C
20/05  DEB PIX PINTURAS E REPAROS PREDIAIS EMERGENCIAL EMEI       850,00 D
23/05  DEB PIX ELETRO-SUL FREEZER HORIZONTAL PARA MERENDA ESCOL  2.890,00 D
25/05  DEB PIX PAPELARIA MUNICIPAL SULFITE E TINTAS GUACHE        540,00 D
27/05  DEB TED COMERCIO DE FERRAGENS E SERVICOS DIVERSOS           980,00 D
30/05  RENDIMENTO DE APLICACAO FINANCEIRA MUNICIPAL                21,45 C
31/05  SALDO FINAL EM CONTA                                     8.483,95 C`
};

export function parseBankStatementLocally(
  rawText: string,
  schoolNameFallback: string = 'Escola Municipal de Santa Cruz do Sul'
): StatementAnalysisReport {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const upperText = rawText.toUpperCase();
  const isBanrisul = upperText.includes('BANRISUL') || upperText.includes('MUNICIPAL') || upperText.includes('PREFEITURA');
  const isBancoDoBrasil = upperText.includes('BANCO DO BRASIL') || upperText.includes('BB') || upperText.includes('FNDE') || !isBanrisul;

  const bancoPrograma = isBanrisul 
    ? 'Banrisul - Municipal' 
    : 'Banco do Brasil - Federal (PDDE)';

  const classificacaoRendimento = isBanrisul
    ? 'Rendimentos de Aplicação Financeira - Municipal'
    : 'Rendimentos de Aplicação Financeira - Federal';

  // Detect institution name if present
  let instituicao = schoolNameFallback;
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes('INSTITUIÇÃO:') || upper.includes('INSTITUICAO:') || upper.includes('CLIENTE:') || upper.includes('TITULAR:')) {
      const parts = line.split(/[:|-]/);
      if (parts[1]) {
        instituicao = parts[1].replace(/CNPJ.*/i, '').trim();
        break;
      }
    }
  }

  let saldoInicial = 0;
  let saldoFinal = 0;
  let totalRendimentos = 0;

  const itens: StatementItem[] = [];
  const alertas: StatementAlert[] = [];

  // Parse lines
  let itemIdCounter = 1;

  for (const line of lines) {
    const upper = line.toUpperCase();

    // Check for Saldo Anterior
    if (upper.includes('SALDO ANTERIOR') || upper.includes('SALDO INICIAL')) {
      const match = line.match(/([\d\.,]+)\s*([CD])?$/i);
      if (match) {
        saldoInicial = parseNumberBR(match[1]);
      }
      continue;
    }

    // Check for Saldo Final
    if (upper.includes('SALDO FINAL') || upper.includes('SALDO ATUAL') || upper.includes('SALDO EM CONTA')) {
      const match = line.match(/([\d\.,]+)\s*([CD])?$/i);
      if (match) {
        saldoFinal = parseNumberBR(match[1]);
      }
      continue;
    }

    // Regex to match statement transaction lines: e.g. "05/04 CRED TED ... 18.450,00 C" or "10/05/2024 DEB ... -1.350,00"
    const txMatch = line.match(/^(\d{2}[\/\.-]\d{2}(?:[\/\.-]\d{4})?)\s+(.*?)\s+([\d\.]+,\d{2})\s*([CD])?$/i);
    if (!txMatch) {
      continue;
    }

    const data = txMatch[1];
    const rawDesc = txMatch[2].trim();
    const valorStr = txMatch[3];
    const indicador = txMatch[4]?.toUpperCase();

    const descUpper = rawDesc.toUpperCase();
    const valor = parseNumberBR(valorStr);

    // Determine type: Credit vs Debit
    let tipo: 'Crédito' | 'Débito' = 'Débito';
    if (indicador === 'C' || descUpper.startsWith('CRED') || descUpper.includes('RENDIMENTO') || descUpper.includes('CREDITO')) {
      tipo = 'Crédito';
    } else if (indicador === 'D' || descUpper.startsWith('DEB') || descUpper.includes('DEBITO') || descUpper.includes('SAQUE')) {
      tipo = 'Débito';
    }

    // Check if it's Daily Yield / Rendimento
    const isYield = 
      descUpper.includes('RENDIMENTO') || 
      descUpper.includes('CRED JUROS') || 
      descUpper.includes('REND. DIÁRIO') || 
      descUpper.includes('REND DIARIO') || 
      descUpper.includes('REND. DIARIO') || 
      descUpper.includes('REND POUP') || 
      descUpper.includes('BB RENDE') ||
      descUpper.includes('REMUNERACAO APLIC');

    // Check if it's internal Bank Application / Sweep (APLICAÇÃO / RESGATE)
    const isInternalBankSweep = 
      (descUpper.includes('APLICACAO') || descUpper.includes('APLICAÇÃO') || descUpper.includes('RESGATE')) &&
      !isYield;

    // Check if it's Repasse FNDE or Repasse Municipal
    const isRepasse = 
      (descUpper.includes('FNDE') || descUpper.includes('REPASSE') || descUpper.includes('ORDEM BANCARIA') || descUpper.includes('PM SANTA CRUZ')) &&
      tipo === 'Crédito' && !isYield;

    let categoria: 'CUSTEIO' | 'CAPITAL' | 'RENDIMENTO' | 'REPASSE' = 'CUSTEIO';

    if (isYield) {
      categoria = 'RENDIMENTO';
      totalRendimentos += valor;
    } else if (isInternalBankSweep) {
      categoria = 'RENDIMENTO';
    } else if (isRepasse) {
      categoria = 'REPASSE';
    } else {
      // Determine Custeio vs Capital for Debits
      const isCapital = 
        descUpper.includes('NOTEBOOK') || 
        descUpper.includes('COMPUTADOR') || 
        descUpper.includes('AR CONDICIONADO') || 
        descUpper.includes('AR-CONDICIONADO') || 
        descUpper.includes('CLIMATIZADOR') || 
        descUpper.includes('FREEZER') || 
        descUpper.includes('GELADEIRA') || 
        descUpper.includes('ARMARIO') || 
        descUpper.includes('ARMÁRIO') || 
        descUpper.includes('FOGAO') || 
        descUpper.includes('FOGÃO') || 
        descUpper.includes('PROJETOR') || 
        descUpper.includes('DATA SHOW') || 
        descUpper.includes('MOBILIARIO') || 
        descUpper.includes('IMPRESSORA');

      if (isCapital) {
        categoria = 'CAPITAL';
      } else {
        categoria = 'CUSTEIO';
      }
    }

    // CHECK FOR ALERTS
    // 1. Bank fees
    if (descUpper.includes('TARIFA') || descUpper.includes('TAR MANUT') || descUpper.includes('PACOTE')) {
      alertas.push({
        id: `alert-tarifa-${itemIdCounter}`,
        tipo: 'tarifa',
        nivel: 'grave',
        titulo: 'Cobrança Indevida de Tarifa Bancária',
        descricao: `Identificado débito de tarifa bancária no valor de ${formatBRL(valor)} (${rawDesc}). Conforme o Art. 10 da Lei Federal nº 11.947/2009 e normas do FNDE, contas vinculadas a repasses educacionais são isentas de tarifas. Deve-se protocolar requerimento de estorno imediato junto à agência.`,
        itemReferencia: `${data} - ${rawDesc}`
      });
    }

    // 2. Cash withdrawal (SAQUE CASH)
    if (descUpper.includes('SAQUE') || descUpper.includes('CASH') || descUpper.includes('ESPECIE')) {
      alertas.push({
        id: `alert-saque-${itemIdCounter}`,
        tipo: 'saque_cash',
        nivel: 'grave',
        titulo: 'ALERTA GRAVE: Saque em Dinheiro em Espécie Detectado',
        descricao: `Detectada movimentação de saque no valor de ${formatBRL(valor)} (${rawDesc}). A Resolução CD/FNDE nº 15/2021 proíbe terminantemente saques em espécie. Todo recurso deve ser liquidado diretamente ao credor por meio de transferência eletrônica rastreável (Pix ou TED nominal) com respectiva Nota Fiscal.`,
        itemReferencia: `${data} - ${rawDesc}`
      });
    }

    // 3. Doubt between Custeio and Capital
    if (descUpper.includes('TECH & SERVICOS') || descUpper.includes('SERVICOS E PECAS') || descUpper.includes('FERRAGENS E SERVICOS') || (descUpper.includes('MANUTENCAO') && descUpper.includes('PLACA'))) {
      alertas.push({
        id: `alert-duvida-${itemIdCounter}`,
        tipo: 'duvida_categoria',
        nivel: 'aviso',
        titulo: 'Confirmação Necessária: Custeio vs Capital',
        descricao: `O lançamento "${rawDesc}" (${formatBRL(valor)}) apresenta características mistas entre manutenção corrente (Custeio) e substituição de componente permanente/melhoria de bem (Capital). Favor solicitar a confirmação expressa da diretora da escola antes do fechamento do DRE.`,
        itemReferencia: `${data} - ${rawDesc}`
      });
    }

    itens.push({
      id: `item-${itemIdCounter++}`,
      data,
      descricao: rawDesc,
      tipo,
      categoria,
      valor
    });
  }

  // Calculate default final balance if not stated in text
  if (saldoFinal === 0 && itens.length > 0) {
    const creds = itens.filter(i => i.tipo === 'Crédito').reduce((acc, i) => acc + i.valor, 0);
    const debs = itens.filter(i => i.tipo === 'Débito').reduce((acc, i) => acc + i.valor, 0);
    saldoFinal = saldoInicial + creds - debs;
  }

  // Generate markdown exactly following user brief
  const markdown = generateStatementMarkdown({
    instituicao,
    bancoPrograma,
    saldoInicial,
    saldoFinal,
    totalRendimentos,
    classificacaoRendimento,
    itens,
    alertas,
    rawText,
    markdown: ''
  });

  return {
    instituicao,
    bancoPrograma,
    saldoInicial,
    saldoFinal,
    totalRendimentos,
    classificacaoRendimento,
    itens,
    alertas,
    markdown,
    rawText
  };
}

export function generateStatementMarkdown(report: StatementAnalysisReport): string {
  const itemsTable = report.itens
    .filter(i => i.categoria !== 'REPASSE' || true) // list all
    .map(i => {
      const valorStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(i.valor);
      return `| ${i.data} | ${i.descricao} | ${i.tipo} | ${i.categoria} | ${valorStr} |`;
    })
    .join('\n');

  const alertsText = report.alertas.length > 0
    ? report.alertas.map(a => `- **[${a.nivel.toUpperCase()}] ${a.titulo}:** ${a.descricao}`).join('\n')
    : '- Nenhuma irregularidade identificada. Todas as operações estão em conformidade com as diretrizes do FNDE e da SEE Santa Cruz do Sul.';

  const saldoIniStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(report.saldoInicial);
  const saldoFinStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(report.saldoFinal);
  const rendStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(report.totalRendimentos);

  return `---
## 🏢 Resumo do Extrato Analisado
- **Instituição de Ensino:** ${report.instituicao}
- **Banco/Programa:** ${report.bancoPrograma}
- **Saldo Inicial:** R$ ${saldoIniStr} | **Saldo Final:** R$ ${saldoFinStr}
- **Total de Rendimentos no Período:** R$ ${rendStr} (${report.classificacaoRendimento})

---
## 📑 Classificação para Prestação de Contas (FNDE/Municipal)

| Data | Descrição do Lançamento | Tipo | Categoria | Valor (R$) |
| :--- | :--- | :--- | :--- | :--- |
${itemsTable}

---
## 💡 Alertas e Inconsistências (Se houver)
${alertsText}`;
}
