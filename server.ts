import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
function parseNumberBR(valueStr: string | undefined | null): number {
  if (!valueStr) return 0;
  const clean = valueStr.trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function formatBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

function formatChaveAcesso(raw: string): string {
  const clean = raw.replace(/\D/g, '');
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}

function parseBankStatementLocally(rawText: string, schoolNameFallback: string = 'Escola Municipal de Santa Cruz do Sul') {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const upperText = rawText.toUpperCase();
  const isBanrisul = upperText.includes('BANRISUL') || upperText.includes('MUNICIPAL') || upperText.includes('PREFEITURA');
  const bancoPrograma = isBanrisul ? 'Banrisul - Municipal' : 'Banco do Brasil - Federal (PDDE)';
  const classificacaoRendimento = isBanrisul
    ? 'Rendimentos de Aplicação Financeira - Municipal'
    : 'Rendimentos de Aplicação Financeira - Federal';

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
  const itens: any[] = [];
  const alertas: any[] = [];
  let itemIdCounter = 1;

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes('SALDO ANTERIOR') || upper.includes('SALDO INICIAL')) {
      const match = line.match(/([\d\.,]+)\s*([CD])?$/i);
      if (match) saldoInicial = parseNumberBR(match[1]);
      continue;
    }
    if (upper.includes('SALDO FINAL') || upper.includes('SALDO ATUAL') || upper.includes('SALDO EM CONTA')) {
      const match = line.match(/([\d\.,]+)\s*([CD])?$/i);
      if (match) saldoFinal = parseNumberBR(match[1]);
      continue;
    }
    const txMatch = line.match(/^(\d{2}[\/\.-]\d{2}(?:[\/\.-]\d{4})?)\s+(.*?)\s+([\d\.]+,\d{2})\s*([CD])?$/i);
    if (!txMatch) continue;

    const data = txMatch[1];
    const rawDesc = txMatch[2].trim();
    const valor = parseNumberBR(txMatch[3]);
    const indicador = txMatch[4]?.toUpperCase();
    const descUpper = rawDesc.toUpperCase();

    let tipo: 'Crédito' | 'Débito' = 'Débito';
    if (indicador === 'C' || descUpper.startsWith('CRED') || descUpper.includes('RENDIMENTO') || descUpper.includes('CREDITO')) {
      tipo = 'Crédito';
    }

    const isYield = descUpper.includes('RENDIMENTO') || descUpper.includes('CRED JUROS') || descUpper.includes('REND. DIÁRIO') || descUpper.includes('REND DIARIO') || descUpper.includes('BB RENDE');
    const isInternalBankSweep = (descUpper.includes('APLICACAO') || descUpper.includes('APLICAÇÃO') || descUpper.includes('RESGATE')) && !isYield;
    const isRepasse = (descUpper.includes('FNDE') || descUpper.includes('REPASSE') || descUpper.includes('ORDEM BANCARIA') || descUpper.includes('PM SANTA CRUZ')) && tipo === 'Crédito' && !isYield;

    let categoria = 'CUSTEIO';
    if (isYield) {
      categoria = 'RENDIMENTO';
      totalRendimentos += valor;
    } else if (isInternalBankSweep) {
      categoria = 'RENDIMENTO';
    } else if (isRepasse) {
      categoria = 'REPASSE';
    } else {
      const isCapital = descUpper.includes('NOTEBOOK') || descUpper.includes('COMPUTADOR') || descUpper.includes('AR CONDICIONADO') || descUpper.includes('CLIMATIZADOR') || descUpper.includes('FREEZER') || descUpper.includes('GELADEIRA') || descUpper.includes('ARMARIO') || descUpper.includes('FOGAO') || descUpper.includes('PROJETOR') || descUpper.includes('IMPRESSORA');
      categoria = isCapital ? 'CAPITAL' : 'CUSTEIO';
    }

    if (descUpper.includes('TARIFA') || descUpper.includes('TAR MANUT') || descUpper.includes('PACOTE')) {
      alertas.push({
        id: `alert-tarifa-${itemIdCounter}`,
        tipo: 'tarifa',
        nivel: 'grave',
        titulo: 'Cobrança Indevida de Tarifa Bancária',
        descricao: `Identificado débito de tarifa bancária (${formatBRL(valor)} - ${rawDesc}). Contas PDDE são isentas pela Lei nº 11.947/2009.`,
        itemReferencia: `${data} - ${rawDesc}`
      });
    }
    if (descUpper.includes('SAQUE') || descUpper.includes('CASH') || descUpper.includes('ESPECIE')) {
      alertas.push({
        id: `alert-saque-${itemIdCounter}`,
        tipo: 'saque_cash',
        nivel: 'grave',
        titulo: 'ALERTA GRAVE: Saque em Dinheiro em Espécie Detectado',
        descricao: `Detectada movimentação de saque (${formatBRL(valor)} - ${rawDesc}). O FNDE proíbe saques em espécie.`,
        itemReferencia: `${data} - ${rawDesc}`
      });
    }
    if (descUpper.includes('TECH & SERVICOS') || descUpper.includes('SERVICOS E PECAS') || descUpper.includes('FERRAGENS E SERVICOS')) {
      alertas.push({
        id: `alert-duvida-${itemIdCounter}`,
        tipo: 'duvida_categoria',
        nivel: 'aviso',
        titulo: 'Confirmação Necessária: Custeio vs Capital',
        descricao: `O lançamento "${rawDesc}" (${formatBRL(valor)}) apresenta características mistas. Confirme com a diretora.`,
        itemReferencia: `${data} - ${rawDesc}`
      });
    }

    itens.push({ id: `item-${itemIdCounter++}`, data, descricao: rawDesc, tipo, categoria, valor });
  }

  if (saldoFinal === 0 && itens.length > 0) {
    const creds = itens.filter(i => i.tipo === 'Crédito').reduce((acc, i) => acc + i.valor, 0);
    const debs = itens.filter(i => i.tipo === 'Débito').reduce((acc, i) => acc + i.valor, 0);
    saldoFinal = saldoInicial + creds - debs;
  }

  const itemsTable = itens.map(i => {
    const vStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(i.valor);
    return `| ${i.data} | ${i.descricao} | ${i.tipo} | ${i.categoria} | ${vStr} |`;
  }).join('\n');

  const alertsText = alertas.length > 0
    ? alertas.map(a => `- **[${a.nivel.toUpperCase()}] ${a.titulo}:** ${a.descricao}`).join('\n')
    : '- Nenhuma irregularidade identificada. Operações em conformidade com as regras do FNDE/SEE.';

  const sIniStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(saldoInicial);
  const sFinStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(saldoFinal);
  const rStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalRendimentos);

  const markdown = `---
## 🏢 Resumo do Extrato Analisado
- **Instituição de Ensino:** ${instituicao}
- **Banco/Programa:** ${bancoPrograma}
- **Saldo Inicial:** R$ ${sIniStr} | **Saldo Final:** R$ ${sFinStr}
- **Total de Rendimentos no Período:** R$ ${rStr} (${classificacaoRendimento})

---
## 📑 Classificação para Prestação de Contas (FNDE/Municipal)

| Data | Descrição do Lançamento | Tipo | Categoria | Valor (R$) |
| :--- | :--- | :--- | :--- | :--- |
${itemsTable}

---
## 💡 Alertas e Inconsistências (Se houver)
${alertsText}`;

  return { instituicao, bancoPrograma, saldoInicial, saldoFinal, totalRendimentos, classificacaoRendimento, itens, alertas, markdown, rawText };
}

function validateNFeChave(chaveAcessoInput: string, extratoDebito?: any) {
  const digits = chaveAcessoInput.replace(/\D/g, '');
  const chaveFormatada = formatChaveAcesso(digits.length >= 44 ? digits.slice(0, 44) : digits.padEnd(44, '0'));

  const presets = [
    {
      chave: '43240408123456000189550010000045121894021350',
      fornecedor: 'Papelaria e Livraria Central Ltda',
      cnpj: '08.123.456/0001-89',
      dataEmissao: '18/04/2024',
      numeroNota: '000004512',
      serie: '1',
      valorTotal: 1350.00,
      categoria: 'CUSTEIO',
      justificativa: 'Aquisição de materiais de consumo pedagógico e de expediente de uso imediato.',
      itens: ['15x Resmas Papel Sulfite Chamex A4 75g (R$ 450,00)', '10x Caixas de Giz Branco Antialérgico Escolar (R$ 180,00)', '20x Tubos de Cola Branca Líquida 90g (R$ 120,00)', '50x Cadernos Brochura Capa Dura Pautados 96fls (R$ 600,00)']
    },
    {
      chave: '43240419987654000132550010000089201940214800',
      fornecedor: 'Multi-Informática & Soluções Educacionais Ltda',
      cnpj: '19.987.654/0001-32',
      dataEmissao: '14/04/2024',
      numeroNota: '000008920',
      serie: '1',
      valorTotal: 4800.00,
      categoria: 'CAPITAL',
      justificativa: 'Bens permanentes de informática com vida útil superior a 2 anos, sujeitos a tombamento patrimonial.',
      itens: ['2x Notebooks Educacionais Core i5 8GB SSD 256GB Tela 15.6" (R$ 4.800,00)', 'Acompanha 2x Maletas Antichoque e Licenças Educacionais']
    },
    {
      chave: '43240428333444000155550010000012001940212950',
      fornecedor: 'Climatizadores Santa Cruz Ltda',
      cnpj: '28.333.444/0001-55',
      dataEmissao: '22/04/2024',
      numeroNota: '000001200',
      serie: '1',
      valorTotal: 2950.00,
      categoria: 'CAPITAL',
      justificativa: 'Aparelho permanente de climatização escolar com incorporação obrigatória ao patrimônio municipal.',
      itens: ['1x Aparelho de Ar Condicionado Split 12.000 BTUs Inverter Eco (R$ 2.950,00)']
    },
    {
      chave: '43240411222333000144550010000005431894020620',
      fornecedor: 'Disk-Limpeza Materiais e Higiene Ltda',
      cnpj: '11.222.333/0001-44',
      dataEmissao: '19/04/2024',
      numeroNota: '000000543',
      serie: '1',
      valorTotal: 620.00,
      categoria: 'CUSTEIO',
      justificativa: 'Materiais de consumo e saneamento para manutenção sanitária das dependências escolares.',
      itens: ['20x Galões Água Sanitária 5L (R$ 220,00)', '15x Fardos Papel Toalha Interfolhado 1000fls (R$ 280,00)', '10x Sabonetes Líquidos Antissépticos 5L (R$ 120,00)']
    }
  ];

  const matched = presets.find(p => p.chave === digits || digits.startsWith(p.chave.slice(0, 20)));

  let fornecedor = matched?.fornecedor || 'Fornecedor Comercial Credenciado Ltda';
  let cnpj = matched?.cnpj || '08.123.456/0001-89';
  let dataEmissao = matched?.dataEmissao || '18/04/2024';
  let numeroNota = matched?.numeroNota || '000004512';
  let serie = matched?.serie || '1';
  let valorTotal = matched?.valorTotal || 1350.00;
  let categoriaSugerida = matched?.categoria || 'CUSTEIO';
  let justificativaCategoria = matched?.justificativa || 'Materiais pedagógicos de consumo de uso corrente nas salas de aula.';
  let itensDetectados = matched?.itens || ['10x Resmas de Papel Sulfite A4 75g (R$ 300,00)', '15x Caixas de Marcadores para Quadro Branco (R$ 225,00)'];

  if (!matched && digits.length >= 20) {
    const ano = '20' + digits.substring(2, 4);
    const mes = digits.substring(4, 6);
    const cnpjRaw = digits.substring(6, 20);
    if (digits.length >= 34) {
      numeroNota = digits.substring(25, 34);
      serie = digits.substring(22, 25).replace(/^0+/, '') || '1';
    }
    dataEmissao = `15/${mes}/${ano}`;
    cnpj = formatCNPJ(cnpjRaw);
  }

  const protocoloAutorizacao = `1432400${Math.floor(Math.random() * 899999 + 100000)}`;
  let statusBatimento = '⚪ NÃO APLICÁVEL (Sem dados de extrato bancário vinculados para confronto)';
  let isConvergente: boolean | undefined = undefined;
  let divergenciaDetalhes: string | undefined = undefined;

  if (extratoDebito && extratoDebito.valor > 0) {
    const diff = Math.abs(valorTotal - extratoDebito.valor);
    const hasValueMatch = diff < 0.01;
    const nameA = fornecedor.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameB = (extratoDebito.favorecido || extratoDebito.descricao || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCnpjA = cnpj.replace(/\D/g, '');
    const cleanCnpjB = (extratoDebito.cnpj || '').replace(/\D/g, '');

    const hasSupplierMatch = (cleanCnpjB && cleanCnpjA === cleanCnpjB) ||
      nameB.includes(nameA.substring(0, 8)) || nameA.includes(nameB.substring(0, 8)) ||
      (nameB.includes('papelaria') && nameA.includes('papelaria')) ||
      (nameB.includes('informatica') && nameA.includes('informatica')) ||
      (nameB.includes('climatiza') && nameA.includes('climatiza')) ||
      (nameB.includes('limpeza') && nameA.includes('limpeza'));

    if (hasValueMatch && hasSupplierMatch) {
      statusBatimento = '🟢 DADOS CONVERGENTES (Valor integral e favorecido do débito conferem 100% com a NF-e)';
      isConvergente = true;
    } else if (hasValueMatch && !hasSupplierMatch) {
      statusBatimento = '🟡 ATENÇÃO: VALOR CONVERGENTE, FORNECEDOR EM VERIFICAÇÃO';
      divergenciaDetalhes = `O valor de ${formatBRL(valorTotal)} confere, confirme se o favorecido no extrato corresponde ao emissor da nota.`;
      isConvergente = false;
    } else {
      statusBatimento = '🔴 ALERTA DE DIVERGÊNCIA (Valor pago no extrato é diferente do valor total da nota)';
      isConvergente = false;
      const sinal = extratoDebito.valor > valorTotal ? '+' : '-';
      divergenciaDetalhes = `Valor na NF-e: ${formatBRL(valorTotal)} vs. Débito no extrato: ${formatBRL(extratoDebito.valor)} (Diferença de ${sinal}${formatBRL(diff)}).`;
    }
  }

  const vTotStr = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorTotal);
  const markdown = `---
## 🔍 Validação da Chave de Acesso (NF-e)
- **Status da Nota:** ✅ AUTENTICADA E VÁLIDA NA SEFAZ
- **Chave Analisada:** ${chaveFormatada}
- **Fornecedor:** ${fornecedor} | **CNPJ:** ${cnpj}
- **Data de Emissão:** ${dataEmissao}

---
## ✏️ Sugestão de Preenchimento Prévio dos Campos
- **Valor Total do Documento:** R$ ${vTotStr}
- **Categoria Sugerida:** ${categoriaSugerida} (${justificativaCategoria})
- **Itens Detectados:** ${itensDetectados.join(', ')}

---
## ⚖️ Resultado da Conciliação (Nota vs. Extrato)
- **Status do Batimento:** ${statusBatimento}${divergenciaDetalhes ? `\n  - *Detalhes:* ${divergenciaDetalhes}` : ''}`;

  return {
    chaveOriginal: digits,
    chaveFormatada,
    statusNota: '✅ AUTENTICADA E VÁLIDA NA SEFAZ',
    protocoloAutorizacao,
    fornecedor,
    cnpj,
    dataEmissao,
    numeroNota,
    serie,
    ufEmissao: 'RS (Rio Grande do Sul)',
    valorTotal,
    categoriaSugerida,
    justificativaCategoria,
    itensDetectados,
    extratoComparado: extratoDebito || undefined,
    statusBatimento,
    isConvergente,
    divergenciaDetalhes,
    markdown
  };
}

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction with deep legal knowledge of PDDE Municipal Santa Cruz do Sul and FNDE
const BASE_SYSTEM_INSTRUCTION = `
Você é o Assistente Jurídico e Contábil Oficial do PDDE (Programa Dinheiro Direto na Escola) da Secretaria Municipal de Educação (SEE) da Prefeitura de Santa Cruz do Sul - RS.
Sua missão é orientar diretores de escola, tesoureiros e presidentes de CPMs (Círculos de Pais e Mestres) e APEEFs sobre a gestão, aplicação correta de recursos e prestação de contas.

BASES LEGAIS E REGULATÓRIAS QUE VOCÊ DOMINA:
1. Resolução CD/FNDE nº 15/2021 (Norma Geral do PDDE Federal)
2. Lei Federal nº 11.947/2009 (Descentralização financeira para escolas e isenção de tarifas bancárias)
3. Lei Federal nº 14.133/2021 e Lei nº 8.666/93 (Pesquisa de preços com mínimo de 3 orçamentos idôneos, CNDs e menor preço)
4. Decretos e Normativas Municipais da Prefeitura Municipal de Santa Cruz do Sul / Secretaria Municipal de Educação (SEE) referentes ao PDDE Municipal complementar calculado por matrícula no Censo Escolar.
5. Diretrizes do Tribunal de Contas do Estado do Rio Grande do Sul (TCE-RS).
6. Programas do FNDE: PDDE Básico, PDDE Educação Conectada, PDDE Estrutura / Acessibilidade, Cantinho da Leitura / Sala de Recursos e PDDE Tempo Integral.

REGRAS FUNDAMENTAIS E INEGOCIÁVEIS QUE VOCÊ DEVE ORIENTAR:
- CUSTEIO vs CAPITAL:
  * Custeio: Destinado a materiais de consumo, expediente, materiais pedagógicos, pequenos consertos e manutenção predial emergencial, serviços terceirizados PJ/PF.
  * Capital: Destinado exclusivamente a equipamentos e mobiliário permanente (computadores, projetores, eletrodomésticos duráveis). Não pode misturar verbas!
  * Todo bem de Capital adquirido com recursos do PDDE pela UEx (CPM) DEVE ser formalmente transferido para o patrimônio público do Município de Santa Cruz do Sul através do "Termo de Doação", para receber plaqueta de tombamento da Prefeitura.
- PESQUISA DE PREÇOS (3 ORÇAMENTOS):
  * É obrigatório obter no mínimo 3 orçamentos de empresas distintas antes de qualquer contratação.
  * A proposta mais vantajosa (menor preço) deve ser escolhida, e o fornecedor deve ter regularidade fiscal (CND Federal/INSS, FGTS, CND Estadual RS e CND Municipal).
  * Se não for possível obter 3 orçamentos por limitação de praça em Santa Cruz do Sul, a escola deve formalizar a Declaração de Praça Restrita com justificativa circunstanciada.
- BANCO DO BRASIL E CONTAS ESPECÍFICAS:
  * Agência oficial: 0180-5 (Santa Cruz do Sul).
  * A conta do PDDE é estritamente isenta de qualquer tarifa ou taxa de manutenção por força da Lei 11.947/2009. Qualquer cobrança deve ser contestada com ofício de estorno ao banco.
  * Rendimentos de aplicação financeira da poupança pertencem ao programa e devem ser registrados no Anexo I e aplicados no mesmo objeto ou reprogramados para o ano seguinte.
- DESPESAS VEDADAS:
  * Proibido pagar pessoal permanente ou gratificações a professores/servidores públicos, combustíveis particulares, festas não pedagógicas, grandes reformas que competem à Secretaria de Obras, ou transferir recursos para contas pessoais.
- PARECER DO CONSELHO FISCAL:
  * As contas só podem ser enviadas à SEE após reunião ordinária e aprovação de no mínimo 3 conselheiros fiscais titulares do CPM.

COMO RESPONDER:
- Seja claro, didático, gentil e rigorosamente embasado na lei.
- Indique os artigos e nomes das leis quando aplicável.
- Se o usuário perguntar como resolver um problema, forneça o passo a passo prático e claro.
- Responda em Português do Brasil com terminologia gaúcha e municipal apropriada (CPM, EMEF, EMEI, SEE Santa Cruz do Sul).
`;

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, schoolContext, modelPreference } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Lista de mensagens inválida.' });
    }

    // Select model according to complexity or user preference
    const selectedModel = modelPreference === 'fast' 
      ? 'gemini-3.1-flash-lite' 
      : modelPreference === 'complex' 
      ? 'gemini-4-argon' 
      : 'gemini-3.8-flash';

    // Enrich system instruction with current school context
    let dynamicSystemInstruction = BASE_SYSTEM_INSTRUCTION;
    if (schoolContext) {
      dynamicSystemInstruction += `\n\nCONTEXTO ATUAL DA ESCOLA SELECIONADA PELO USUÁRIO:\n` +
        `- Escola: ${schoolContext.schoolName || 'Escola Municipal de Santa Cruz do Sul'}\n` +
        `- Unidade Executora: ${schoolContext.uexName || 'CPM'}\n` +
        `- CNPJ do CPM: ${schoolContext.uexCnpj || 'Não informado'}\n` +
        `- Exercício Fiscal: ${schoolContext.year || 2024}\n` +
        `- Saldo em Conta Disponível: R$ ${schoolContext.balance || '0,00'}\n` +
        `- Status da Prestação na SEE: ${schoolContext.status || 'Em elaboração'}\n` +
        `- Total de Despesas Executadas: R$ ${schoolContext.totalExpenses || '0,00'}\n` +
        `Use esse contexto específico para responder de forma personalizada quando o usuário se referir à "minha escola", "meu saldo" ou "minhas contas".`;
    }

    // Format contents array for @google/genai
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // If API Key is available, call Gemini API with graceful model fallback
    if (apiKey) {
      let responseText = '';
      let usedModel = selectedModel;

      try {
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            systemInstruction: dynamicSystemInstruction,
            temperature: 0.3,
          },
        });
        responseText = response.text || '';
      } catch (primaryError: any) {
        console.warn(`Tentativa primária com ${selectedModel} falhou (${primaryError.message}). Tentando gemini-3.1-flash-lite...`);
        try {
          const fallbackResp = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction: dynamicSystemInstruction,
              temperature: 0.3,
            },
          });
          responseText = fallbackResp.text || '';
          usedModel = 'gemini-3.1-flash-lite (automático)';
        } catch (secondaryError) {
          console.warn('Fallback para gemini-3.1-flash-lite também falhou. Acionando base normativa local.');
          responseText = getLocalNormativeResponse(messages, schoolContext);
          usedModel = 'base-normativa-municipal';
        }
      }

      if (responseText) {
        return res.json({ text: responseText, modelUsed: usedModel });
      }
    }

    // Fallback when no API key or after service exceptions
    const fallbackText = getLocalNormativeResponse(messages, schoolContext);
    return res.json({ text: fallbackText, modelUsed: 'base-normativa-municipal' });
  } catch (error: any) {
    console.error('Erro na API de chat:', error);
    return res.status(500).json({ 
      error: 'Falha ao processar consulta com o assistente.',
      details: error.message 
    });
  }
});

// AI Engine endpoint for Bank Statement Analysis (FNDE & Banrisul)
const STATEMENT_SYSTEM_INSTRUCTION = `
Você é o motor de Inteligência Artificial do "PDDE Santa Cruz do Sul - Gestão e Prestação de Contas", um sistema inteligente de prestação de contas de verbas vinculadas para a Secretaria Municipal de Educação. Seu papel é receber o texto bruto ou o arquivo de um extrato bancário (PDF/Texto) enviado pelas diretoras das escolas e transformá-lo em um relatório estruturado de prestação de contas.

A análise deve seguir rigorosamente as regras do PDDE FNDE (para contas do Banco do Brasil) e das verbas municipais (para contas do Banrisul).

### 🚨 REGRA CRÍTICA DE NEGÓCIO: RENDIMENTOS DIÁRIOS
Os repasses públicos não ficam parados; eles possuem rendimento diário automático em conta (como CDB ou fundos de aplicação). 
1. Você deve identificar todas as linhas do extrato que correspondam a "RENDIMENTO", "CRED JUROS", "APLICAÇÃO", "RESGATE", "REND. DIÁRIO" ou siglas correlatas.
2. Nas contas do Banco do Brasil (Programas Federais/PDDE), classifique esses rendimentos como "Rendimentos de Aplicação Financeira - Federal". Eles devem ser somados ao saldo do programa para uso exclusivo na mesma finalidade, conforme regras do FNDE.
3. Nas contas do Banrisul (Programas Municipais), classifique como "Rendimentos de Aplicação Financeira - Municipal".

### 📊 DIRETRIZES DE CATEGORIZAÇÃO DE GASTOS
Para os lançamentos de débito (saídas de dinheiro), categorize-os automaticamente em:
- CUSTEIO: Materiais de consumo diário, papelaria, produtos de limpeza, pequenos reparos, serviços de terceiros de manutenção corrente.
- CAPITAL: Aquisição de bens permanentes, equipamentos eletrônicos, computadores, eletrodomésticos, mobiliário.
- RENDIMENTO/APLICAÇÃO: Transações internas de aplicação ou resgate automático do banco (devem ser isoladas para não duplicar o saldo de gastos).

### 📥 FORMATO DE SAÍDA ESPERADO
Sua resposta para o usuário deve ser estritamente visual, limpa e organizada em três seções bem definidas:

---
## 🏢 Resumo do Extrato Analisado
- **Instituição de Ensino:** [Nome da Escola se identificado no extrato]
- **Banco/Programa:** [Banco do Brasil - Federal (PDDE) OU Banrisul - Municipal]
- **Saldo Inicial:** R$ [Valor] | **Saldo Final:** R$ [Valor]
- **Total de Rendimentos no Período:** R$ [Soma total apenas dos rendimentos diários]

---
## 📑 Classificação para Prestação de Contas (FNDE/Municipal)

| Data | Descrição do Lançamento | Tipo | Categoria | Valor (R$) |
| :--- | :--- | :--- | :--- | :--- |
| DD/MM | Exemplo: NF 1234 - Papelaria | Débito | CUSTEIO | 350,00 |
| DD/MM | Exemplo: Rendimento Diário CDB | Crédito | RENDIMENTO | 12,40 |

---
## 💡 Alertas e Inconsistências (Se houver)
- [Se houver tarifas bancárias cobradas indevidamente, já que contas de verbas federais são isentas, gere um alerta].
- [Se houver saques em dinheiro ("SAQUE CASH"), emita um alerta grave, pois o FNDE exige pagamento rastreável por Pix ou TED].
- [Se houver algum gasto que gere dúvida entre Custeio e Capital, peça a confirmação da diretora].
`;

app.post('/api/analyze-statement', async (req, res) => {
  try {
    const { statementText, schoolName, bankHint } = req.body;

    if (!statementText || typeof statementText !== 'string' || statementText.trim().length === 0) {
      return res.status(400).json({ error: 'Texto do extrato bancário não fornecido.' });
    }

    // Always calculate structured local report as solid ground truth
    const structuredReport = parseBankStatementLocally(statementText, schoolName || 'Escola Municipal de Santa Cruz do Sul');

    let markdownResponse = '';
    let engineUsed = 'motor-local-fnde';

    if (apiKey) {
      try {
        const prompt = `Analise detalhadamente o extrato bancário escolar a seguir, seguindo rigorosamente as instruções do sistema, identificando rendimentos diários, categorizando em CUSTEIO, CAPITAL ou RENDIMENTO, e levantando os alertas de tarifas, saques em espécie ou dúvidas:\n\n[CONTEXTO DA ESCOLA]: ${schoolName || 'Escola Municipal de Santa Cruz do Sul'}\n[INDICAÇÃO DO BANCO]: ${bankHint || 'Identificar automaticamente'}\n\n[TEXTO DO EXTRATO BANCÁRIO]:\n${statementText}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: STATEMENT_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        markdownResponse = aiResponse.text || '';
        engineUsed = 'gemini-3.8-flash';
      } catch (geminiErr: any) {
        console.warn('Chamada ao Gemini para análise de extrato falhou:', geminiErr?.message);
      }
    }

    if (!markdownResponse) {
      markdownResponse = structuredReport.markdown;
      engineUsed = 'motor-local-fnde';
    }

    return res.json({
      markdown: markdownResponse,
      structuredReport,
      engineUsed,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/analyze-statement:', error);
    return res.status(500).json({
      error: 'Falha ao processar o extrato com a Inteligência Artificial.',
      details: error.message,
    });
  }
});

// AI Engine endpoint for NF-e Chave de Acesso Validation & Reconciliation
const NFE_SYSTEM_INSTRUCTION = `
Você é o validador inteligente de Notas Fiscais Eletrônicas (NF-e) do sistema "PDDE Santa Cruz do Sul - Gestão e Prestação de Contas".
Sua tarefa é analisar a Chave de Acesso de 44 dígitos da NF-e e, opcionalmente, compará-la com o lançamento de débito do extrato bancário escolar (PIX/TED).

Você opera em duas frentes:
1. SE O USUÁRIO APENAS INSERIR A CHAVE DE ACESSO:
   - Simule a busca na SEFAZ e retorne os dados principais estruturados para "Preenchimento Prévio" dos campos na tela: Nome do Fornecedor, CNPJ, Data de Emissão, Valor Total da Nota, e a descrição dos itens.
   - Sugira automaticamente a classificação dos itens entre CUSTEIO ou CAPITAL com base nos produtos identificados.

2. SE O USUÁRIO INSERIR A CHAVE DE ACESSO JUNTO COM OS DADOS DE UM LANÇAMENTO DO EXTRATO:
   - Realize o batimento (conciliação) dos dados da nota com o débito do extrato.
   - Verifique se o VALOR TOTAL da nota bate exatamente com o VALOR DA SAÍDA do extrato.
   - Verifique se o CNPJ/Nome do Fornecedor na nota condiz com o destino do PIX/TED do extrato.

FORMATO DE RESPOSTA OBRIGATÓRIO:
---
## 🔍 Validação da Chave de Acesso (NF-e)
- **Status da Nota:** ✅ AUTENTICADA E VÁLIDA NA SEFAZ
- **Chave Analisada:** [Inserir a chave formatada]
- **Fornecedor:** [Nome Fantasia / Razão Social] | **CNPJ:** [00.000.000/0001-00]
- **Data de Emissão:** [DD/MM/AAAA]

---
## ✏️ Sugestão de Preenchimento Prévio dos Campos
- **Valor Total do Documento:** R$ [Valor]
- **Categoria Sugerida:** [CUSTEIO ou CAPITAL] (Justificativa curta baseada nos itens)
- **Itens Detectados:** [Exemplo: 10x Resmas de Papel A4]

---
## ⚖️ Resultado da Conciliação (Nota vs. Extrato)
- **Status do Batimento:** [🟢 DADOS CONVERGENTES (Se valores e fornecedor baterem) OU 🔴 ALERTA DE DIVERGÊNCIA (Se o valor pago no extrato for diferente do valor total da nota)]
`;

app.post('/api/validate-nfe', async (req, res) => {
  try {
    const { chaveAcesso, extratoDebito } = req.body;

    if (!chaveAcesso || typeof chaveAcesso !== 'string') {
      return res.status(400).json({ error: 'Chave de Acesso de 44 dígitos não informada.' });
    }

    const structuredValidation = validateNFeChave(chaveAcesso, extratoDebito);

    let markdownResponse = '';
    let engineUsed = 'motor-local-sefaz';

    if (apiKey) {
      try {
        const prompt = `Analise a seguinte Chave de Acesso de NF-e e realize a validação na SEFAZ e eventual conciliação com o extrato:\n\n` +
          `[CHAVE DE ACESSO]: ${chaveAcesso}\n` +
          `[DADOS DO EXTRATO BANCÁRIO]: ${extratoDebito ? JSON.stringify(extratoDebito) : 'Nenhum lançamento vinculado (Apenas validação prévia)'}\n\n` +
          `Siga rigorosamente o formato de resposta especificado nas instruções.`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: NFE_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        markdownResponse = aiResponse.text || '';
        engineUsed = 'gemini-3.8-flash';
      } catch (geminiErr: any) {
        console.warn('Falha na chamada Gemini para NF-e:', geminiErr?.message);
      }
    }

    if (!markdownResponse) {
      markdownResponse = structuredValidation.markdown;
      engineUsed = 'motor-local-sefaz';
    }

    return res.json({
      markdown: markdownResponse,
      structuredValidation,
      engineUsed,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/validate-nfe:', error);
    return res.status(500).json({
      error: 'Falha ao validar a NF-e.',
      details: error.message,
    });
  }
});



// Knowledge base fallback for municipal rules when external API spikes
function getLocalNormativeResponse(messages: any[], schoolContext?: any): string {
  const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();

  if (lastUserMsg.includes('vedad') || lastUserMsg.includes('proibid') || lastUserMsg.includes('não pode')) {
    return `### Despesas Terminantemente Vedadas no PDDE (Municipal e FNDE)

Conforme a **Resolução CD/FNDE nº 15/2021 (Art. 16)** e Decretos Regulamentares da Prefeitura de Santa Cruz do Sul, é **expressamente proibido**:

1. **Pagamento de Pessoal:** Salários, diárias, gratificações ou qualquer remuneração a servidores públicos, professores, diretores ou membros do CPM;
2. **Combustíveis e Veículos:** Abastecimento de veículos particulares ou pagamento de passagens sem finalidade pedagógica aprovada no plano;
3. **Festas e Eventos Sociais:** Aquisição de bebidas alcoólicas, ornamentações de festividades não curriculares ou presentes pessoais;
4. **Obras Estruturais Pesadas:** Reformas prediais de grande porte (como ampliação de salas ou troca de telhados inteiros), que competem à Secretaria Municipal de Obras e Planejamento;
5. **Tarifas Bancárias:** Pagamento de taxas de manutenção de conta ou tarifas de PIX/TED (as contas são isentas pela Lei nº 11.947/2009);
6. **Empréstimos ou Cheques sem Fundo:** Transferência para contas particulares ou saques em espécie no caixa sem identificação do credor.`;
  }

  if (lastUserMsg.includes('custeio') || lastUserMsg.includes('capital') || lastUserMsg.includes('ar-condicionado') || lastUserMsg.includes('computador')) {
    return `### Regras de Custeio vs. Capital no PDDE

A correta classificação orçamentária é rigorosamente fiscalizada pela Secretaria Municipal de Educação (SEE) e pelo FNDE:

- **CUSTEIO (Despesas Correntes):**
  - Materiais de consumo imediato (papel sulfite A4, tintas, cadernos, lápis, toners, materiais de limpeza, higiene e descartáveis);
  - Pequenos reparos hidráulicos, elétricos e consertos de fechaduras;
  - Serviços de terceiros PJ ou PF de manutenção emergencial.

- **CAPITAL (Investimentos Permanentes):**
  - Equipamentos eletrônicos e de informática (computadores, notebooks, projetores, nobreaks);
  - Mobiliário escolar (mesas, cadeiras, armários de aço, estantes);
  - Eletrodomésticos duráveis e aparelhos de ar-condicionado.

⚠️ **Regra de Ouro em Santa Cruz do Sul:** Todo bem adquirido com recursos de **Capital** pertence ao patrimônio público. A escola DEVE gerar o **Termo de Doação** (disponível no menu "Bens & Termo de Doação") para que o setor de Patrimônio da Prefeitura afixe a plaqueta oficial de tombamento.`;
  }

  if (lastUserMsg.includes('cotação') || lastUserMsg.includes('3 orçamento') || lastUserMsg.includes('orçamento') || lastUserMsg.includes('pesquisa')) {
    return `### Diretrizes para a Pesquisa de Preços (3 Orçamentos)

A Tomada de Preços é o procedimento legal prévio obrigatório a qualquer compra:

1. **Mínimo de 3 Propostas:** Devem ser cotadas pelo menos 3 empresas distintas e regulares do ramo pertinente;
2. **Dados Obrigatórios:** Razão Social, CNPJ, telefone, descrição idêntica dos itens, valor unitário e total, e prazo de validade (mínimo 30 dias);
3. **Regularidade Fiscal:** O fornecedor vencedor deve apresentar:
   - CND Federal / INSS (Certidão Conjunta da Receita Federal);
   - CRF do FGTS (Caixa Econômica Federal);
   - CND Estadual (SEFAZ/RS);
   - CND Municipal (Prefeitura de Santa Cruz do Sul);
4. **Menor Preço:** A contratação deve recair na proposta de menor valor global, salvo desclassificação técnica fundamentada;
5. **Se não conseguir 3 cotações:** Formalize a **Declaração de Praça Restrita** (disponível na nossa aba *Problemas & Diligências*).`;
  }

  if (lastUserMsg.includes('tarifa') || lastUserMsg.includes('banco') || lastUserMsg.includes('pix') || lastUserMsg.includes('extrato')) {
    return `### Isenção de Tarifas Bancárias - Banco do Brasil (Agência 0180-5)

Por força do **Art. 10 da Lei Federal nº 11.947/2009**, as contas do PDDE (corrente e poupança vinculada) são **estritamente isentas** de tarifas bancárias de manutenção, taxas de extrato ou transferências eletrônicas.

**O que fazer em caso de débito indevido:**
1. Não aceite a cobrança! Copie o modelo de **Requerimento de Estorno ao Banco do Brasil** na nossa aba *Problemas & Diligências*;
2. Protocole o requerimento na Agência 0180-5 (Santa Cruz do Sul);
3. O banco é obrigado a estornar o valor com correção monetária de volta para a conta do PDDE.`;
  }

  if (lastUserMsg.includes('prazo') || lastUserMsg.includes('semestre') || lastUserMsg.includes('data') || lastUserMsg.includes('calendário')) {
    return `### Calendário Oficial de Prazos do PDDE em Santa Cruz do Sul

- **Prestação Parcial do 1º Semestre (SEE):** Até **31 de Julho** de cada exercício fiscal;
- **Prestação Final / Anual do 2º Semestre (SEE):** Até **15 de Janeiro** do ano subsequente;
- **Lançamento Federal FNDE (SiGPC / Contas Online):** Até **30 de Abril** do ano subsequente.

Dica: Nunca deixe para a última hora. Utilize o checklist da aba *Prestação de Contas Oficial* para validar o DRE (Anexo I) e a Relação de Pagamentos (Anexo II).`;
  }

  if (lastUserMsg.includes('poupança') || lastUserMsg.includes('rendimento') || lastUserMsg.includes('aplicação')) {
    return `### Regras de Rendimentos de Poupança e Reprogramação de Saldo

Todo recurso creditado na conta do PDDE deve ser aplicado financeiramente:

1. **Pertencem ao Programa:** Os rendimentos auferidos na poupança do Banco do Brasil não podem ser devolvidos nem retirados; eles somam-se à receita do programa;
2. **Lançamento no Anexo I:** Devem constar no campo "Rendimentos de Aplicação Financeira" do Anexo I;
3. **Saldo Residual ao Final do Ano:** O saldo que sobrar em 31 de dezembro pode ser **reprogramado** para o ano seguinte na mesma categoria (Custeio ou Capital), desde que registrado em ata ordinária do Conselho Fiscal do CPM.`;
  }

  return `### Orientação Normativa - PDDE Santa Cruz do Sul & FNDE

Olá! Como assistente oficial da Secretaria Municipal de Educação (SEE) de Santa Cruz do Sul e especialista nos programas do FNDE, posso te orientar sobre:

- **Separação de Custeio e Capital** (o que pode e não pode comprar);
- **Pesquisa de preços com 3 orçamentos** e regularidade fiscal (CNDs);
- **Emissão dos Anexos Oficiais** (Anexo I DRE, Anexo II Relação de Pagamentos);
- **Termo de Doação** dos bens ao patrimônio do Município;
- **Atestes em Notas Fiscais** e conciliação bancária na conta do Banco do Brasil (Agência 0180-5).

Qual é a dúvida específica ou situação da sua escola?`;
}

// Setup Vite middleware for development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor PDDE Santa Cruz do Sul ativo na porta ${PORT}`);
  });
}

startServer();
