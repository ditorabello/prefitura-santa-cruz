export type SchoolType = 'EMEF' | 'EMEI' | 'CEMEJA';

export type AccountStatus = 
  | 'nao_iniciado' 
  | 'em_elaboracao' 
  | 'aguardando_cpm' 
  | 'enviado_see' 
  | 'diligencia' 
  | 'aprovado';

export interface BankAccountInfo {
  bank: string;
  agency: string;
  accountNumber: string;
  savingsAccount: string;
  pixKey?: string;
}

export interface SchoolCensusBreakdown {
  infantil: number;
  anosIniciais: number;
  anosFinais: number;
  eja: number;
  especial: number;
}

export interface SchoolLinkedBankAccount {
  id: string;
  bank: string;
  agency: string;
  accountNumber: string;
  savingsAccount?: string;
  programLabel: string;
  pixKey?: string;
}

export interface DiligenceItem {
  id: string;
  schoolId: string;
  year: number;
  date: string;
  subject: string;
  description: string;
  legalReference?: string;
  schoolResponse?: string;
  responseDate?: string;
  status: 'pendente' | 'respondida' | 'homologada';
  reviewedBySEE?: string;
}

export interface School {
  id: string;
  name: string;
  type: SchoolType;
  inep: string;
  neighborhood: string;
  address: string;
  zone?: 'Urbana' | 'Rural';
  studentCount: number;
  censusYear?: number;
  censusBreakdown?: SchoolCensusBreakdown;
  uexName: string; // Ex: CPM da EMEF Menino Deus
  uexCnpj: string;
  presidentName: string;
  presidentCpf: string;
  presidentRg?: string;
  presidentTermStart?: string;
  presidentTermEnd?: string;
  treasurerName: string;
  treasurerCpf: string;
  fiscalCouncilMembers: string[];
  bankAccount: BankAccountInfo;
  bankAccountsList?: SchoolLinkedBankAccount[];
  status: AccountStatus;
  seeNotes?: string;
  lastReviewDate?: string;
  contactEmail: string;
  contactPhone: string;
  cpmName?: string;
  cpmCnpj?: string;
  principalName?: string;
  principalRegistration?: string;
  principalAppointmentAct?: string;
  vicePrincipals?: string[];
  systemUserLogin?: string;
  systemUserEmail?: string;
  accessStatus?: 'ativo' | 'bloqueado' | 'em_auditoria';
  enabledPrograms?: ProgramType[];
  cpmPresident?: string;
}

// Banco do Brasil Statement API Simulation Response Types
export interface BBLancamento {
  dataLancamento: string; // YYYY-MM-DD
  dataMovimento?: string;
  numeroDocumento: string; // Ex: OB 802144, PIX 984021, TED 004122
  codigoHistorico: number; // Ex: 375 (Ordem Bancaria), 108 (PIX), 105 (TED)
  descricaoHistorico: string;
  indicadorTipoLancamento: 'C' | 'D'; // C = Crédito, D = Débito
  valorLancamento: number;
  categoriaLancamento?: string;
  favorecido?: string;
  cnpjFavorecido?: string;
  naturezaDespesa?: string;
}

export interface BBStatementApiResponse {
  codigoRetorno: string;
  mensagem: string;
  timestampConsulta: string;
  instituicaoFinanceira: {
    codigoCompensacao: string; // "001"
    nomeInstituicao: string; // "BANCO DO BRASIL S.A."
    canalAtendimento: string; // "API BB Developers - Open Finance Gov / FNDE"
  };
  dadosConta: {
    numeroAgencia: string;
    numeroContaCorrente: string;
    titularConta: string;
    cnpjTitular: string;
    tipoConta: string;
    convenioFNDE?: string;
    codigoPrograma?: string;
  };
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  saldos: {
    saldoAnterior: number;
    totalCreditos: number;
    totalDebitos: number;
    saldoDisponivel: number;
    saldoBloqueado: number;
  };
  lancamentos: BBLancamento[];
}

export type ProgramType = 
  | 'PDDE_MUNICIPAL'
  | 'PDDE_BASICO_FNDE'
  | 'PDDE_EDUCACAO_CONECTADA'
  | 'PDDE_ESTRUTURA'
  | 'PDDE_TEMPO_INTEGRAL';

export const PROGRAM_LABELS: Record<ProgramType, { label: string; origin: 'Municipal' | 'Federal'; color: string }> = {
  PDDE_MUNICIPAL: {
    label: 'PDDE Municipal (Recurso Próprio SEE - Santa Cruz do Sul)',
    origin: 'Municipal',
    color: 'emerald',
  },
  PDDE_BASICO_FNDE: {
    label: 'PDDE Básico (FNDE / Ministério da Educação)',
    origin: 'Federal',
    color: 'sky',
  },
  PDDE_EDUCACAO_CONECTADA: {
    label: 'PDDE Educação Conectada (FNDE)',
    origin: 'Federal',
    color: 'blue',
  },
  PDDE_ESTRUTURA: {
    label: 'PDDE Estrutura / Acessibilidade (FNDE)',
    origin: 'Federal',
    color: 'indigo',
  },
  PDDE_TEMPO_INTEGRAL: {
    label: 'PDDE Tempo Integral (FNDE)',
    origin: 'Federal',
    color: 'violet',
  },
};

export type Category = 'CUSTEIO' | 'CAPITAL';

export const CATEGORY_LABELS: Record<Category, string> = {
  CUSTEIO: 'Custeio (Consumo, Materiais, Pequenos Reparos, Serviços)',
  CAPITAL: 'Capital (Equipamentos, Móveis, Bens Permanentes)',
};

export interface Transfer {
  id: string;
  schoolId: string;
  year: number;
  program: ProgramType;
  category: Category;
  date: string;
  description: string;
  docNumber: string; // Nº Ordem Bancária ou Empenho
  value: number;
}

export interface BankYield {
  id: string;
  schoolId: string;
  year: number;
  month: string; // Ex: "03/2024"
  program: ProgramType;
  category: Category;
  date: string;
  value: number;
}

export interface DemandItem {
  id: string;
  description: string;
  quantity: number;
  unit: 'un' | 'cx' | 'pct' | 'm' | 'servico' | 'resma' | 'kit' | 'frasco' | 'kg' | 'lt' | string;
  referencePrice?: number;
}

export interface QuoteItem {
  id?: string;
  companyName: string;
  cnpj: string;
  tradeName?: string;
  contactName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  statusReceita?: 'ATIVA' | 'INAPTA' | 'SUSPENSA';
  proposalValue: number;
  totalValue?: number;
  proposalDate?: string;
  itemPrices?: Record<string, number> | { itemId: string; description: string; quantity: number; unitPrice: number; subtotal: number }[];
  validityDays?: number;
  cndRegular: boolean;
  notes?: string;
  digitalSignature?: {
    signedBy: string;
    cpf?: string;
    signedAt: string;
    validationToken: string; // Token digital que substitui carimbo físico
    ipAddress?: string;
    legalDeclaration?: string;
  };
  attachedFileName?: string;
  attachedFileUrl?: string;
  submittedViaPublicLink?: boolean;
}

export interface SupplierDirectoryItem {
  id: string;
  companyName: string;
  tradeName: string;
  cnpj: string;
  category?: string;
  segment?: 'papelaria' | 'limpeza' | 'informatica' | 'manutencao' | 'mobiliario' | 'servicos' | string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address: string;
  city?: string;
  cndRegular?: boolean;
  cndValid?: boolean;
  contactPerson?: string;
  notes?: string;
}

export interface Quotation {
  id: string;
  schoolId: string;
  year: number;
  code: string; // Ex: "COT-2024-001"
  date: string;
  deadline?: string;
  objectDescription: string;
  description?: string;
  category: Category;
  program: ProgramType;
  itemsDemanded: DemandItem[];
  quotes: QuoteItem[];
  winningQuoteIndex: number;
  selectedQuoteId?: string;
  finalValue?: number;
  justification?: string;
  status: 'rascunho' | 'concluida' | 'cancelada' | 'em_andamento';
  publicToken?: string; // Token único para o link web da cotação
  allowSingleQuote?: boolean; // Permite 1 ou 2 orçamentos justificadamente
  singleQuoteReason?: 'praca_restrita' | 'fornecedor_exclusivo' | 'urgencia_emergencial' | 'outros' | string;
  singleQuoteJustification?: string; // Justificativa detalhada
}

export type ExpenseType = 
  | 'material_consumo' 
  | 'servico_pj' 
  | 'servico_pf' 
  | 'equipamento_permanente' 
  | 'mobiliario';

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  material_consumo: 'Material de Consumo / Pedagógico / Limpeza',
  servico_pj: 'Serviço de Terceiros - Pessoa Jurídica (Reparos, Manutenção)',
  servico_pf: 'Serviço de Terceiros - Pessoa Física (Pequenos Consertos)',
  equipamento_permanente: 'Equipamento de Informática / Eletrônico (Capital)',
  mobiliario: 'Mobiliário e Utensílio Escolar (Capital)',
};

export type PaymentMethod = 'PIX' | 'TRANSFERENCIA' | 'CHEQUE';

export interface Expense {
  id: string;
  schoolId: string;
  year: number;
  quotationId?: string;
  program: ProgramType;
  category: Category;
  expenseType: ExpenseType;
  supplierName: string;
  supplierCnpjCpf: string;
  invoiceNumber: string; // Nº Nota Fiscal / Cupom Fiscal
  invoiceSeries?: string;
  invoiceDate: string;
  attestationDate: string; // Data do Ateste ("Atesto que o material foi entregue...")
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentDocNumber: string; // ID da Transação PIX, Autenticação TED ou Nº Cheque
  grossValue: number;
  taxRetention: number;
  netValue: number;
  description: string;
  reconciled: boolean;
  nfeAccessKey?: string;
  nfeValidated?: boolean;
}


export interface AssetItem {
  id: string;
  schoolId: string;
  year: number;
  expenseId: string;
  description: string;
  brandModel?: string;
  serialNumber?: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  location: string; // Ex: "Sala de Informática", "Refeitório"
  invoiceNumber: string;
  invoiceDate: string;
  tombamentoNumber?: string; // Código de patrimônio conferido pelo Município
  donatedToMunicipality: boolean;
}

export interface CouncilOpinion {
  schoolId: string;
  year: number;
  meetingDate: string;
  opinionType: 'APROVADO' | 'APROVADO_COM_RESSALVAS' | 'REJEITADO';
  observations: string;
  signedByPresident: boolean;
  signedByTreasurer: boolean;
  fiscalCouncilSignatures: boolean[];
}

export interface AuditCheckResult {
  id: string;
  category: 'cotações' | 'despesas' | 'banco' | 'patrimonio' | 'conselho' | 'saldo';
  severity: 'bloqueante' | 'advertencia' | 'conforme';
  title: string;
  description: string;
  legalBasis: string;
  status: 'pendente' | 'corrigido' | 'justificado';
  actionTab?: string;
  affectedItem?: string;
}

// ==========================================
// GESTÃO DEMOCRÁTICA - LEI MUNICIPAL Nº 9.738/2024 (SANTA CRUZ DO SUL)
// ==========================================

export type DemocraticIndicatorCode = 'a' | 'b' | 'c' | 'd' | 'e';

export interface DemocraticIndicatorScore {
  code: DemocraticIndicatorCode;
  title: string;
  shortTitle: string;
  legalBasis: string;
  description: string;
  verificationSources: string[];
  score: number; // 1 a 5
  justification: string;
  suggestedScore: number;
  systemGuidance: string;
  isCustomized?: boolean;
}

export interface DirectorshipRequirements {
  schoolId: string;
  schoolName: string;
  directorName: string;
  viceDirectorName?: string;
  // Art. 19, I: Cargo efetivo magistério municipal
  isEffectiveMagisterio: boolean;
  effectiveRoleDetail?: string;
  // Art. 19, II: Conclusão de estágio probatório
  passedProbationaryPeriod: boolean;
  probationaryCompletionDate?: string;
  // Art. 19, III: Pós-graduação lato/stricto sensu na área ou Pedagogia
  hasPostGraduationOrPedagogy: boolean;
  postGraduationCourse?: string;
  // Art. 19, IV: Mínimo 180h formação em gestão escolar nos últimos 3 anos
  has180hManagementCourses: boolean;
  completedCourseHours: number;
  courseCertificatesDetail?: string;
  // Art. 19, V: Obrigações eleitorais, antecedentes e sem punição disciplinar em 5 anos
  hasCleanRecordAndCertificates: boolean;
  certificatesValidityDate?: string;
  // Art. 19, VI: Apresentação e cumprimento do Plano de Gestão Escolar (PGE)
  schoolManagementPlanSubmitted: boolean;
  managementPlanCycle?: string;
  // Regularidade cadastral e fiscal do CPM perante Receita e SEE
  cpmFiscalRegularity: boolean;
  isEligible: boolean;
  lastAuditedDate: string;
  auditorNotes?: string;
}

export interface SemesterPerformance {
  semester: string; // Ex: '2023/1', '2023/2', '2024/1', '2024/2'
  totalScore: number; // 5 a 25
  percentage: number; // 0 a 100%
  status: 'aprovado' | 'insatisfatorio' | 'em_analise';
  isUnder50Percent: boolean; // Flag para risco de destituição (Art. 18, III)
}

export interface DemocraticEvaluation {
  id: string;
  schoolId: string;
  schoolName: string;
  principalName: string;
  semester: string; // Ex: '2024/2'
  evaluationDate: string;
  evaluatorName: string;
  evaluatorRole: string;
  status: 'rascunho' | 'homologado' | 'recurso';
  indicators: Record<DemocraticIndicatorCode, DemocraticIndicatorScore>;
  totalScore: number; // 5 a 25
  percentage: number; // 0 a 100%
  performanceTier: 'Excelente (90-100%)' | 'Bom / Satisfatório (70-89%)' | 'Regular com Ressalvas (50-69%)' | 'Insatisfatório (<50%)';
  consecutiveUnder50Count: number; // Art. 18, III: perda do mandato com 4 semestres consecutivos < 50%
  atDestitutionRisk: boolean;
  generalOpinion: string; // Parecer Técnico Conclusivo Oficial da SEE (editável)
  recommendations: string[];
  diligencesSummary: {
    total: number;
    pending: number;
    responded: number;
    homologated: number;
    complianceImpactNote: string;
  };
  historicalSemesters: SemesterPerformance[];
  lastUpdated: string;
}

