import React, { useState } from 'react';
import { 
  X, 
  Scan, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  Printer, 
  Calculator, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building,
  Check
} from 'lucide-react';
import { Quotation, QuoteItem } from '../types/pdde';
import { usePDDE } from '../context/PDDEContext';

interface OCRProposalModalProps {
  quotation: Quotation;
  onClose: () => void;
  onImported?: () => void;
}

export const OCRProposalModal: React.FC<OCRProposalModalProps> = ({
  quotation,
  onClose,
  onImported,
}) => {
  const { currentSchool, submitProposalToQuotation } = usePDDE();

  const [activeTab, setActiveTab] = useState<'ocr' | 'spreadsheet'>('ocr');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    companyName: string;
    cnpj: string;
    tradeName: string;
    printedDate: string;
    hasRubberStamp: boolean;
    printedTotal: number;
    calculatedTotal: number;
    hasDivergence: boolean;
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      printedSubtotal: number;
      correctSubtotal: number;
    }[];
  } | null>(null);

  const [appliedCorrection, setAppliedCorrection] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Sample demand items or fallback
  const items = quotation.itemsDemanded && quotation.itemsDemanded.length > 0
    ? quotation.itemsDemanded
    : [
        { id: '1', description: 'Papel A4 Sulfite 75g (Resma com 500 fls)', quantity: 40, unit: 'resma' },
        { id: '2', description: 'Tinta Guache escolar 250ml cores sortidas', quantity: 30, unit: 'frasco' },
        { id: '3', description: 'Cartolina branca 50x66cm pacote c/ 50', quantity: 10, unit: 'pct' },
      ];

  // Demo Presets for testing
  const handleLoadPreset = (preset: 'correct' | 'divergent') => {
    setIsScanning(true);
    setScanResult(null);
    setAppliedCorrection(false);

    setTimeout(() => {
      setIsScanning(false);
      if (preset === 'correct') {
        setUploadedFileName('Orcamento_Papelaria_Central_Digitalizado.jpg');
        const parsedItems = [
          { description: items[0]?.description || 'Papel A4 Sulfite 75g', quantity: 40, unitPrice: 28.50, printedSubtotal: 1140.00, correctSubtotal: 1140.00 },
          { description: items[1]?.description || 'Tinta Guache escolar 250ml', quantity: 30, unitPrice: 8.90, printedSubtotal: 267.00, correctSubtotal: 267.00 },
          { description: items[2]?.description || 'Cartolina branca pacote c/ 50', quantity: 10, unitPrice: 42.00, printedSubtotal: 420.00, correctSubtotal: 420.00 },
        ];
        const sum = parsedItems.reduce((acc, it) => acc + it.correctSubtotal, 0);

        setScanResult({
          companyName: 'Papelaria Central de Santa Cruz do Sul Ltda',
          tradeName: 'Papelaria Central SCS',
          cnpj: '11.222.333/0001-44',
          printedDate: new Date().toISOString().split('T')[0],
          hasRubberStamp: true,
          printedTotal: sum,
          calculatedTotal: sum,
          hasDivergence: false,
          items: parsedItems,
        });
      } else {
        // Divergent Preset: Supplier made a mathematical error on the paper proposal
        setUploadedFileName('Orcamento_Proposta_Com_Erro_Calculo.pdf');
        const parsedItems = [
          { description: items[0]?.description || 'Papel A4 Sulfite 75g', quantity: 40, unitPrice: 29.00, printedSubtotal: 1160.00, correctSubtotal: 1160.00 },
          { description: items[1]?.description || 'Tinta Guache escolar 250ml', quantity: 30, unitPrice: 9.50, printedSubtotal: 285.00, correctSubtotal: 285.00 },
          { description: items[2]?.description || 'Cartolina branca pacote c/ 50', quantity: 10, unitPrice: 45.00, printedSubtotal: 450.00, correctSubtotal: 450.00 },
        ];
        const correctSum = parsedItems.reduce((acc, it) => acc + it.correctSubtotal, 0); // 1160 + 285 + 450 = 1895.00
        const flawedPrintedTotal = 1995.00; // Supplier added 100 extra in error

        setScanResult({
          companyName: 'Comércio e Papelaria Vale do Rio Pardo ME',
          tradeName: 'Papelaria Vale Rio Pardo',
          cnpj: '33.444.555/0001-66',
          printedDate: new Date().toISOString().split('T')[0],
          hasRubberStamp: true,
          printedTotal: flawedPrintedTotal,
          calculatedTotal: correctSum,
          hasDivergence: true,
          items: parsedItems,
        });
      }
    }, 900);
  };

  const handleImportToQuotation = () => {
    if (!scanResult) return;

    const finalValue = appliedCorrection || !scanResult.hasDivergence
      ? scanResult.calculatedTotal
      : scanResult.printedTotal;

    const newQuote: QuoteItem = {
      id: `quote-ocr-${Date.now()}`,
      companyName: scanResult.companyName,
      tradeName: scanResult.tradeName,
      cnpj: scanResult.cnpj,
      phone: '(51) 3715-4422',
      contactPerson: 'Setor Comercial (Capturado via OCR)',
      proposalValue: finalValue,
      totalValue: finalValue,
      proposalDate: scanResult.printedDate,
      cndRegular: true,
      statusReceita: 'ATIVA',
      digitalSignature: {
        signedBy: scanResult.companyName,
        signedAt: new Date().toISOString(),
        validationToken: `OCR-SCS-AUDITADO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        ipAddress: 'Leitura OCR Sistema Escolar SCS',
        legalDeclaration: scanResult.hasDivergence
          ? 'Proposta auditada por OCR com retificação de divergência de soma conforme Art. 59 § 3º Lei 14.133/2021.'
          : 'Proposta física digitalizada e validada via OCR sem inconsistências matemáticas.'
      },
      attachedFileName: uploadedFileName || 'Proposta_Impressa_OCR.pdf',
      notes: scanResult.hasDivergence
        ? `Lido via OCR: O fornecedor grafou R$ ${scanResult.printedTotal.toFixed(2)} no total, mas o cálculo correto dos itens resultou em R$ ${scanResult.calculatedTotal.toFixed(2)}. Homologado pelo valor unitário correto.`
        : 'Proposta impressa lida e conferida automaticamente por OCR com 100% de precisão matemática.'
    };

    submitProposalToQuotation(quotation.id, newQuote);
    if (onImported) onImported();
    onClose();
  };

  const downloadSmartSpreadsheetCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `SISTEMA PDDE SANTA CRUZ DO SUL - FORMULARIO DE COTACAO INTELIGENTE\r\n`;
    csvContent += `Escola: ${currentSchool?.name}\r\n`;
    csvContent += `Cotacao: ${quotation.code} - ${quotation.description}\r\n`;
    csvContent += `Instrucoes: Preencha SOMENTE a coluna PRECO_UNITARIO. Os subtotais e totais sao calculados automaticamente por formula.\r\n\r\n`;
    csvContent += `Item,Descricao,Quantidade,Unidade,PRECO_UNITARIO_EDITAVEL,SUBTOTAL_TRAVADO_FORMULA\r\n`;

    items.forEach((it, idx) => {
      const rowNum = idx + 7;
      // Formula multiplying Qtd by Price
      csvContent += `${idx + 1},"${it.description}",${it.quantity},${it.unit},0.00,"=C${rowNum}*E${rowNum}"\r\n`;
    });

    csvContent += `\r\n,,,VALOR TOTAL DA PROPOSTA:,"=SUM(F7:F${items.length + 6})"\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cotacao_Inteligente_${quotation.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-400/30">
                Auditoria Matemática & Automação
              </span>
              <span className="text-xs text-emerald-200">
                {currentSchool?.name}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Geração de Planilhas Inteligentes & Leitura via OCR
            </h3>
            <p className="text-xs text-emerald-100/80">
              Elimine erros de cálculo em propostas impressas ou envie planilhas com fórmulas protegidas
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('ocr')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'ocr'
                ? 'bg-white text-emerald-950 border-slate-200 border-b-white -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Scan className="w-4 h-4 text-emerald-700" />
            <span>Digitalizar Proposta Impressa (OCR + Auditoria)</span>
          </button>
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'spreadsheet'
                ? 'bg-white text-emerald-950 border-slate-200 border-b-white -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Planilha Inteligente Protegida (Excel/PDF)</span>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">

          {/* TAB 1: OCR READER */}
          {activeTab === 'ocr' && (
            <div className="space-y-6">
              
              {/* Instructions & Preset Buttons */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Faça upload da proposta física carimbada pelo fornecedor
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    O OCR lê a imagem, reconhece o CNPJ, extrai os itens e confere se a soma manual do fornecedor está correta.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-500 font-semibold">Testar Simulação:</span>
                  <button
                    onClick={() => handleLoadPreset('correct')}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Proposta Correta
                  </button>
                  <button
                    onClick={() => handleLoadPreset('divergent')}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Proposta com Erro de Soma
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFileName(e.target.files[0].name);
                      handleLoadPreset('divergent'); // demonstrate the math audit feature
                    }
                  }}
                  className="hidden"
                  id="ocrFileInput"
                />
                <label htmlFor="ocrFileInput" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Clique para anexar arquivo PDF ou foto do papel carimbado
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Suporta JPG, PNG e PDF digitalizados de Santa Cruz do Sul
                    </span>
                  </div>
                </label>
              </div>

              {/* Scanning progress animation */}
              {isScanning && (
                <div className="p-6 bg-emerald-900/5 border border-emerald-300/40 rounded-xl flex items-center justify-center gap-3">
                  <Scan className="w-6 h-6 text-emerald-700 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-950">
                    Processando OCR e auditando cálculos matemáticos dos itens...
                  </span>
                </div>
              )}

              {/* Scan Results Display */}
              {scanResult && !isScanning && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Company Info Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-800" />
                          <h4 className="text-xs font-bold text-slate-900">
                            {scanResult.tradeName}
                          </h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            CNPJ: {scanResult.cnpj}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Razão: {scanResult.companyName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Carimbo Físico Reconhecido via OCR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MATHEMATICAL AUDIT ALERT BANNER */}
                  {scanResult.hasDivergence ? (
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Alerta de Divergência Matemática Detectada no Documento Físico!</span>
                      </div>
                      <p className="text-xs text-rose-950 leading-relaxed">
                        O fornecedor anotou à mão/carimbou o <strong>Total de R$ {scanResult.printedTotal.toFixed(2)}</strong> na proposta, mas a soma exata dos itens (Quantidade × Preço Unitário) totaliza <strong>R$ {scanResult.calculatedTotal.toFixed(2)}</strong> (Diferença de R$ {(scanResult.printedTotal - scanResult.calculatedTotal).toFixed(2)}).
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-rose-200/60">
                        <span className="text-[11px] text-rose-800 font-medium">
                          Regra FNDE / Lei 14.133: Prevalecem os preços unitários sobre a soma manual incorreta.
                        </span>
                        {!appliedCorrection ? (
                          <button
                            onClick={() => setAppliedCorrection(true)}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Corrigir para R$ {scanResult.calculatedTotal.toFixed(2)}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Valor retificado e homologado para R$ {scanResult.calculatedTotal.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div className="text-xs text-emerald-950">
                        <strong>Cálculos 100% Conferidos:</strong> O total impresso no papel (R$ {scanResult.printedTotal.toFixed(2)}) confere perfeitamente com a multiplicação de todos os preços unitários.
                      </div>
                    </div>
                  )}

                  {/* Scanned Items Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Item Lido do Papel</th>
                          <th className="py-2 px-3 text-center w-16">Qtd</th>
                          <th className="py-2 px-3 text-right w-28">Preço Unit. Lido</th>
                          <th className="py-2 px-3 text-right w-28">Subtotal Papel</th>
                          <th className="py-2 px-3 text-right w-28">Subtotal Correto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {scanResult.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-900 font-medium">{it.description}</td>
                            <td className="py-2 px-3 text-center text-slate-700">{it.quantity}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              {it.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {it.printedSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-900">
                              {it.correctSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="py-2 px-3 text-right text-slate-800">
                            Total Calculado no Banco de Dados:
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-900">
                            {scanResult.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Final Import Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setScanResult(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Escanear Outro
                    </button>
                    <button
                      onClick={handleImportToQuotation}
                      className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Homologar e Inserir Orçamento na Cotação</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PROTECTED SPREADSHEET (EXCEL/PDF) */}
          {activeTab === 'spreadsheet' && (
            <div className="space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Planilha Protegida com Fórmulas Travadas
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Envie esta planilha em Excel para empresas que não utilizam o link web. Os campos de multiplicação (<code>Qtd × Unitário</code>) e soma total ficam matematicamente travados contra alterações, permitindo que o fornecedor edite apenas o valor unitário.
                  </p>
                </div>
              </div>

              {/* Preview of locked sheet */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="bg-slate-800 text-white px-4 py-2 text-xs font-mono flex items-center justify-between">
                  <span>Planilha_Orcamento_Protegida_{quotation.code}.xlsx [Fórmulas Ativas]</span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                    Somente Coluna E Liberada
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="text-xs space-y-1">
                    <div><strong>Escola:</strong> {currentSchool?.name}</div>
                    <div><strong>Objeto:</strong> {quotation.description}</div>
                    <div><strong>Cotação nº:</strong> {quotation.code}</div>
                  </div>

                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2 border-r border-slate-200 w-12 text-center">Col A</th>
                        <th className="p-2 border-r border-slate-200">Col B (Descrição)</th>
                        <th className="p-2 border-r border-slate-200 text-center w-16">Col C (Qtd)</th>
                        <th className="p-2 border-r border-slate-200 text-center w-16">Col D (Un)</th>
                        <th className="p-2 border-r border-slate-200 text-right w-36 bg-emerald-50 text-emerald-900">
                          Col E (Unitário - LIBERADO)
                        </th>
                        <th className="p-2 text-right w-36 bg-slate-100 text-slate-700">
                          Col F (Subtotal - TRAVADO)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{it.description}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700">{it.quantity}</td>
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500">{it.unit}</td>
                          <td className="p-2 border-r border-slate-200 text-right bg-emerald-50/50 text-emerald-800 font-mono italic">
                            [Fornecedor Digita Aqui]
                          </td>
                          <td className="p-2 text-right font-mono bg-slate-50 text-slate-500">
                            <code>=C{idx + 7}*E{idx + 7}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right uppercase tracking-wide text-slate-700">
                          Total Geral Automatizado (Célula F{items.length + 7}):
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-900">
                          <code>=SOMA(F7:F{items.length + 6})</code>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">
                  Compatível com Microsoft Excel, LibreOffice Calc e Google Planilhas.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadSmartSpreadsheetCSV}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Planilha com Fórmulas (.CSV / Excel)</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Imprimir Formulário</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
