import { Quotation, School } from '../types/pdde';

/**
 * Generates and triggers download of a standardized CSV spreadsheet for suppliers.
 * Includes UTF-8 BOM so Microsoft Excel and LibreOffice Calc open it with correct accents
 * and semicolons for Brazilian Portuguese locale.
 */
export function downloadQuotationCSV(quotation: Quotation, school?: School) {
  const schoolName = school?.name || 'Escola Municipal de Santa Cruz do Sul';
  const uexName = school?.uexName || 'Círculo de Pais e Mestres (CPM)';
  const uexCnpj = school?.uexCnpj || '00.000.000/0001-00';
  const deadlineStr = quotation.deadline
    ? new Date(quotation.deadline).toLocaleDateString('pt-BR')
    : '5 dias úteis';

  const rows: string[][] = [
    ['ESTADO DO RIO GRANDE DO SUL - MUNICÍPIO DE SANTA CRUZ DO SUL'],
    ['SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEE) - PROGRAMA DINHEIRO DIRETO NA ESCOLA (PDDE)'],
    ['FORMULÁRIO OFICIAL DE COTAÇÃO DE PREÇOS'],
    [''],
    ['DADOS DA ESCOLA SOLICITANTE:'],
    ['Unidade Escolar:', schoolName],
    ['Unidade Executora (CPM):', uexName],
    ['CNPJ da UEx:', uexCnpj],
    ['Nº do Processo de Cotação:', quotation.code],
    ['Data de Emissão:', new Date(quotation.date).toLocaleDateString('pt-BR')],
    ['Prazo Limite para Resposta:', deadlineStr],
    ['Objeto / Necessidade:', quotation.description || quotation.objectDescription || 'Aquisição de materiais/serviços'],
    [''],
    ['DADOS DO FORNECEDOR PARTICIPANTE (PREENCHIMENTO OBRIGATÓRIO):'],
    ['Razão Social:'],
    ['Nome Fantasia:'],
    ['CNPJ (válido na Receita Federal):'],
    ['Endereço Comercial / Cidade:'],
    ['Telefone / WhatsApp:'],
    ['E-mail Comercial:'],
    ['Representante Legal:'],
    [''],
    ['PLANILHA DE PROPOSTA DE PREÇOS (O FORNECEDOR DEVE PREENCHER APENAS O PREÇO UNITÁRIO):'],
    ['Item Nº', 'Descrição Detalhada do Item / Serviço', 'Unidade', 'Quantidade Solicitada', 'Preço Unitário Ofertado (R$)', 'Valor Total do Item (R$)'],
  ];

  const items = quotation.itemsDemanded && quotation.itemsDemanded.length > 0
    ? quotation.itemsDemanded
    : [
        { id: '1', description: 'Item 1 da cotação', quantity: 1, unit: 'un' }
      ];

  items.forEach((it, idx) => {
    rows.push([
      String(idx + 1),
      it.description,
      it.unit,
      String(it.quantity),
      '', // Unit price left blank for supplier
      '', // Total calculated by supplier or formula
    ]);
  });

  rows.push(['']);
  rows.push(['VALOR GLOBAL TOTAL DA PROPOSTA (R$):', '']);
  rows.push(['PRAZO DE VALIDADE DA PROPOSTA (MÍNIMO 30 DIAS):', '60 dias']);
  rows.push(['PRAZO DE ENTREGA NA ESCOLA:', 'Imediato / Conforme solicitação']);
  rows.push(['']);
  rows.push([
    'DECLARAÇÃO DO FORNECEDOR: Declaramos sob as penas da lei que os preços cotados incluem todos os tributos, encargos sociais e frete até o endereço da escola, bem como possuímos regularidade fiscal perante a Receita Federal, Fazenda Estadual e Municipal.'
  ]);
  rows.push(['Assinatura Digital / Responsável Comercial:']);

  // Convert array of rows to CSV text separated by semicolon
  const csvContent = rows
    .map(row =>
      row
        .map(cell => {
          const str = (cell ?? '').toString().replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';')
    )
    .join('\r\n');

  // \uFEFF is the UTF-8 Byte Order Mark for Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Cotacao_${quotation.code.replace(/[^a-zA-Z0-9]/g, '_')}_Fornecedor.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
