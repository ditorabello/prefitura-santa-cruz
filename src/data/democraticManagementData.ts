import { 
  DemocraticEvaluation, 
  DirectorshipRequirements, 
  DemocraticIndicatorCode,
  School,
  DiligenceItem,
  Expense,
  AssetItem
} from '../types/pdde';

export const DEMOCRATIC_INDICATOR_DEFINITIONS: Record<DemocraticIndicatorCode, {
  title: string;
  shortTitle: string;
  legalBasis: string;
  description: string;
  verificationSources: string[];
}> = {
  a: {
    title: 'a) Coordenação administrativa',
    shortTitle: 'Coordenação Administrativa & Prazos',
    legalBasis: 'Art. 6º, § 3º, II da Lei Municipal nº 9.738/2024',
    description: 'Cumprimento de prazos para entrega de documentações diversas solicitadas pela mantenedora e outros órgãos (ponto dos servidores, folha de pagamento, relatórios de RH, frequência de alunos no Bolsa Família/SEE, registros escolares, gerenciamento de vagas e matrículas).',
    verificationSources: [
      'Registros de protocolo',
      'Memorandos e comunicações internas',
      'E-mails institucionais da direção',
      'Relatórios e chamados do sistema acadêmico SEE'
    ],
  },
  b: {
    title: 'b) Gestão do patrimônio e da infraestrutura escolar',
    shortTitle: 'Patrimônio & Infraestrutura Escolar',
    legalBasis: 'Art. 6º, § 3º, II da Lei Municipal nº 9.738/2024',
    description: 'Acompanhamento da conservação do prédio escolar, móveis e equipamentos; realização e envio do Inventário Patrimonial Anual à SEE; elaboração e assinatura do Termo de Doação e Tombamento de bens permanentes adquiridos; abertura tempestiva de chamados de manutenção preventiva e corretiva via sistema oficial.',
    verificationSources: [
      'Relatório de inventário patrimonial anual',
      'Termos de doação e tombamento formalizados',
      'Vistorias técnicas da SEE/Obras',
      'Registros de chamados de manutenção predial'
    ],
  },
  c: {
    title: 'c) Coordenação e organização das equipes de trabalho',
    shortTitle: 'Coordenação de Equipes & Clima Escolar',
    legalBasis: 'Art. 6º, § 3º, II e III da Lei Municipal nº 9.738/2024',
    description: 'Organização e cumprimento de escalas de serviço (professores, secretários, monitores, merendeiras e higienização); realização periódica de reuniões de alinhamento com atas lavradas e assinadas; mediação construtiva de conflitos e divisão clara de atribuições na unidade.',
    verificationSources: [
      'Escalas de trabalho afixadas e cumpridas',
      'Livros de atas de reuniões pedagógicas e administrativas',
      'Folhas de ponto e registros funcionais',
      'Relatórios de mediação e conselho escolar'
    ],
  },
  d: {
    title: 'd) Gestão e aplicação de recursos financeiros (PDDE / CPM) & Diligências',
    shortTitle: 'Gestão Financeira, PDDE & Diligências Técnicas',
    legalBasis: 'Art. 6º, § 3º, II c/c Art. 19, VII da Lei Municipal nº 9.738/2024',
    description: 'Correta aplicação dos recursos financeiros conforme planos de aplicação aprovados; rigorosa pesquisa de preços com mínimo de 3 orçamentos válidos; adimplemento das obrigações fiscais e tributárias do CPM (CNPJ ativo, certidões negativas válidas); tempestividade e rigor documental na entrega das Prestações de Contas à SEE; saneamento e resolução ágil das diligências notificadas.',
    verificationSources: [
      'Prestações de contas formais no sistema PDDE',
      'Pastas de despesas com notas fiscais, atestes e conciliação',
      'Mapas comparativos com 3 orçamentos idôneos',
      'Atas e parecer do Conselho Fiscal do CPM',
      'Histórico de atendimento e resolução de diligências da SEE'
    ],
  },
  e: {
    title: 'e) Transparência pública e prestação de contas à comunidade escolar',
    shortTitle: 'Transparência Pública & Prestação à Comunidade',
    legalBasis: 'Art. 6º, § 3º, IV da Lei Municipal nº 9.738/2024',
    description: 'Publicização e divulgação dos demonstrativos de receitas e despesas no mural escolar físico e canais digitais para conhecimento da comunidade escolar; prestação periódica de contas em assembleias gerais do CPM e Conselho Escolar; atendimento cordial, transparente e resolutivo aos pedidos de informação de pais e servidores.',
    verificationSources: [
      'Mural de transparência física da escola (comprovantes e fotos)',
      'Atas de assembleias ordinárias do CPM com aprovação de contas',
      'Livro de atas do Conselho Escolar',
      'Divulgações nos canais oficiais da comunidade escolar'
    ],
  },
};

/**
 * Motor de direcionamento prévio automático da SEE
 * Cruza a base cadastral da escola, despesas, patrimônio e histórico de diligências
 */
export function generateSystemGuidanceForSchool(
  school: School,
  schoolDiligences: DiligenceItem[],
  expenses: Expense[] = [],
  assets: AssetItem[] = [],
  semester = '2024/2'
): DemocraticEvaluation {
  const pendingDiligences = schoolDiligences.filter(d => d.status === 'pendente');
  const respondedDiligences = schoolDiligences.filter(d => d.status === 'respondida');
  const homologatedDiligences = schoolDiligences.filter(d => d.status === 'homologada');
  const totalDiligences = schoolDiligences.length;

  const schoolExpenses = expenses.filter(e => e.schoolId === school.id);
  const unreconciledExpenses = schoolExpenses.filter(e => !e.reconciled);
  const schoolAssets = assets.filter(a => a.schoolId === school.id);
  const undonatedAssets = schoolAssets.filter(a => !a.donatedToMunicipality);

  // 1. INDICADOR A: Coordenação Administrativa
  let scoreA = 4;
  let guidanceA = 'A direção escolar mantém bom fluxo documental com a SEE.';
  let justA = 'Cumprimento tempestivo dos prazos de entrega do ponto eletrônico, frequência escolar e relatórios de matrícula solicitados pela mantenedora.';
  
  if (school.status === 'aprovado') {
    scoreA = 5;
    guidanceA = 'Excelente pontualidade e exatidão documental perante a SEE.';
    justA = 'Atendimento com excelência aos prazos e protocolos da Secretaria Municipal de Educação de Santa Cruz do Sul. Folhas de ponto e registros acadêmicos 100% tempestivos.';
  } else if (school.status === 'diligencia') {
    scoreA = 3;
    guidanceA = 'Necessidade de aperfeiçoar o retorno de documentos e prazos da mantenedora.';
    justA = 'Constatou-se pequenos atrasos no retorno de solicitações documentais intermediárias da SEE, recomendando-se maior agilidade nos despachos de secretaria.';
  }

  // 2. INDICADOR B: Gestão do Patrimônio
  let scoreB = 4;
  let guidanceB = 'Patrimônio escolar conservado e inventariado.';
  let justB = 'Acompanhamento satisfatório da manutenção predial e inventário patrimonial encaminhado ao setor de patrimônio do município.';
  
  if (undonatedAssets.length > 0) {
    scoreB = 3;
    guidanceB = `Constatado(s) ${undonatedAssets.length} bem(ns) permanente(s) com termo de doação/tombamento pendente no município.`;
    justB = `Foram identificados bens de capital adquiridos com recursos do PDDE (${undonatedAssets.map(a => a.description).slice(0, 2).join(', ')}) pendentes de formalização do Termo de Doação e plaqueta de tombamento pela Prefeitura.`;
  } else if (schoolAssets.length > 0 && undonatedAssets.length === 0) {
    scoreB = 5;
    guidanceB = 'Inventário 100% tombado e doado formalmente ao patrimônio municipal.';
    justB = 'Bens permanentes e equipamentos catalogados com plaqueta patrimonial e Termo de Doação formal devidamente arquivado na SEE, em estrita conformidade normativa.';
  }

  // 3. INDICADOR C: Coordenação de Equipes
  let scoreC = 5;
  let guidanceC = 'Ambiente de trabalho articulado e escalas organizadas.';
  let justC = 'Equipes docentes, administrativas e de apoio com escalas de trabalho transparentes e cumpridas. Reuniões pedagógicas e administrativas periódicas registradas em ata.';

  // 4. INDICADOR D: Gestão de Recursos & Diligências (Integração Direta)
  let scoreD = 4;
  let guidanceD = '';
  let justD = '';

  if (pendingDiligences.length > 0) {
    scoreD = pendingDiligences.length >= 2 ? 2 : 3;
    const pendSubject = pendingDiligences[0]?.subject || 'Inconformidade na prestação';
    guidanceD = `ALERTA DO SISTEMA: Consta(m) ${pendingDiligences.length} diligência(s) pendente(s) de saneamento junto à SEE.`;
    justD = `Constatada(s) ${pendingDiligences.length} pendência(s) em aberto na prestação de contas ("${pendSubject}"). Exige-se agilização da juntada documental e atendimento das notificações técnicas nos termos do Art. 6º, § 3º, II e Art. 19 da Lei Municipal nº 9.738/2024.`;
  } else if (respondedDiligences.length > 0 || homologatedDiligences.length > 0) {
    scoreD = 4;
    guidanceD = `Diligências previamente notificadas foram respondidas e saneadas tempestivamente pela direção escolar.`;
    justD = `A escola foi notificada em diligência técnica da SEE e apresentou saneamento tempestivo com justificativas e juntada de certidões, demonstrando zelo, rigor e capacidade resolutiva da equipe gestora.`;
  } else if (school.status === 'aprovado' && unreconciledExpenses.length === 0) {
    scoreD = 5;
    guidanceD = `Prestação de contas 100% aprovada sem ressalvas, 3 orçamentos idôneos em todas as despesas e conciliação bancária plena.`;
    justD = `Gestão orçamentária exemplar. Rigorosa observância aos três orçamentos na tomada de preços, conciliação de receitas e rendimentos perfeita, adimplemento fiscal do CPM e homologação integral das contas pela SEE sem qualquer diligência.`;
  } else {
    scoreD = 4;
    guidanceD = `Execução orçamentária regular e sem apontamentos graves.`;
    justD = `Recursos do PDDE Municipal e FNDE aplicados em conformidade com o plano de aplicação aprovado pelo CPM. Tomadas de preço formalizadas e conciliação em dia.`;
  }

  // 5. INDICADOR E: Transparência Pública
  let scoreE = 4;
  let guidanceE = 'Demonstrativos e atas afixados em mural e comunicados à comunidade.';
  let justE = 'Demonstrativos de aplicação financeira divulgados à comunidade escolar no mural e aprovados em reunião ordinária com o Conselho Escolar e CPM.';

  if (school.status === 'aprovado') {
    scoreE = 5;
    guidanceE = 'Plena transparência ativa perante a comunidade escolar e conselhos.';
    justE = 'Publicização impecável dos demonstrativos contábeis no mural informativo e assembleias do CPM, com aprovação unânime do Conselho Fiscal e ampla participação da comunidade escolar.';
  }

  const indicators = {
    a: {
      ...DEMOCRATIC_INDICATOR_DEFINITIONS.a,
      code: 'a' as DemocraticIndicatorCode,
      score: scoreA,
      justification: justA,
      suggestedScore: scoreA,
      systemGuidance: guidanceA,
    },
    b: {
      ...DEMOCRATIC_INDICATOR_DEFINITIONS.b,
      code: 'b' as DemocraticIndicatorCode,
      score: scoreB,
      justification: justB,
      suggestedScore: scoreB,
      systemGuidance: guidanceB,
    },
    c: {
      ...DEMOCRATIC_INDICATOR_DEFINITIONS.c,
      code: 'c' as DemocraticIndicatorCode,
      score: scoreC,
      justification: justC,
      suggestedScore: scoreC,
      systemGuidance: guidanceC,
    },
    d: {
      ...DEMOCRATIC_INDICATOR_DEFINITIONS.d,
      code: 'd' as DemocraticIndicatorCode,
      score: scoreD,
      justification: justD,
      suggestedScore: scoreD,
      systemGuidance: guidanceD,
    },
    e: {
      ...DEMOCRATIC_INDICATOR_DEFINITIONS.e,
      code: 'e' as DemocraticIndicatorCode,
      score: scoreE,
      justification: justE,
      suggestedScore: scoreE,
      systemGuidance: guidanceE,
    },
  };

  const totalScore = scoreA + scoreB + scoreC + scoreD + scoreE;
  const percentage = Math.round((totalScore / 25) * 100);

  let performanceTier: DemocraticEvaluation['performanceTier'] = 'Bom / Satisfatório (70-89%)';
  if (percentage >= 90) performanceTier = 'Excelente (90-100%)';
  else if (percentage >= 70) performanceTier = 'Bom / Satisfatório (70-89%)';
  else if (percentage >= 50) performanceTier = 'Regular com Ressalvas (50-69%)';
  else performanceTier = 'Insatisfatório (<50%)';

  // Art. 18, III - Parecer Conclusivo oficial pré-formatado e fundamentado na Lei Municipal 9.738/2024
  let complianceNote = '';
  if (pendingDiligences.length > 0) {
    complianceNote = `Ressalta-se a existência de ${pendingDiligences.length} diligência(s) pendente(s) de saneamento na prestação de contas, cujo prazo de cumprimento deve ser observado para evitar apontamentos em auditorias dos órgãos de controle.`;
  } else if (respondedDiligences.length > 0) {
    complianceNote = `Registra-se positivamente que as diligências notificadas foram respondidas e saneadas satisfatoriamente pela direção.`;
  } else {
    complianceNote = `Inexiste registro de pendências ou diligências ativas no âmbito da Secretaria de Educação para a respectiva unidade escolar.`;
  }

  const generalOpinion = `PARECER TÉCNICO CONCLUSIVO DA SECRETARIA MUNICIPAL DE EDUCAÇÃO
MUNICÍPIO DE SANTA CRUZ DO SUL - RS
COMISSÃO DE GESTÃO DEMOCRÁTICA E AUDITORIA ESCOLAR

1. IDENTIFICAÇÃO E FUNDAMENTAÇÃO LEGAL:
Aos autos da Avaliação Semestral da Equipe Gestora da ${school.name} (${school.uexName}), referente ao semestre letivo ${semester}, em cumprimento ao Art. 6º, § 3º e Art. 41 da Lei Ordinária Municipal nº 9.738/2024 de Santa Cruz do Sul.

2. ANÁLISE DE DESEMPENHO ADMINISTRATIVO-FINANCEIRO:
Avaliados os 5 (cinco) indicadores da Matriz Oficial de Gestão Democrática, a Direção Escolar obteve a pontuação de ${totalScore} de 25 pontos possíveis, correspondendo a um aproveitamento global de ${percentage}% (${performanceTier}).

3. SITUAÇÃO DAS PRESTAÇÕES DE CONTAS E DILIGÊNCIAS:
${complianceNote}
- Total de diligências notificadas: ${totalDiligences}
- Diligências pendentes de saneamento: ${pendingDiligences.length}
- Diligências respondidas/homologadas: ${respondedDiligences.length + homologatedDiligences.length}

4. CONCLUSÃO E ACOMPANHAMENTO LEGAL:
Diante dos elementos apurados, a Comissão Técnica da SEE considera o desempenho da equipe gestora no presente semestre como ${performanceTier.toUpperCase()}. O índice percentual de ${percentage}% encontra-se ${percentage >= 50 ? 'acima do patamar mínimo regulamentar de 50%, não incidindo qualquer hipótese do Art. 18, inciso III da Lei Municipal nº 9.738/2024' : 'ABAIXO do patamar de 50%, gerando registro de advertência no Boletim Semestral sob o crivo do Art. 18, inciso III da Lei Municipal nº 9.738/2024'}.

Recomenda-se à Direção a manutenção dos registros e o cumprimento rigoroso das orientações técnicas exaradas.`;

  return {
    id: `eval-${school.id}-${semester.replace('/', '-')}`,
    schoolId: school.id,
    schoolName: school.name,
    principalName: school.presidentName || 'Direção Escolar',
    semester,
    evaluationDate: new Date().toISOString().split('T')[0],
    evaluatorName: 'Equipe de Auditoria e Supervisão Escolar - SEE',
    evaluatorRole: 'Auditor Técnico de Gestão Escolar (Lei Municipal 9.738/2024)',
    status: 'rascunho',
    indicators,
    totalScore,
    percentage,
    performanceTier,
    consecutiveUnder50Count: percentage < 50 ? 1 : 0,
    atDestitutionRisk: false,
    generalOpinion,
    recommendations: [
      'Manter cópia das 3 cotações de preços anexadas a cada despesa do PDDE.',
      'Afixar demonstrativo sintético bimestral no mural escolar para ampla publicidade.',
      'Acompanhar junto ao setor de patrimônio o tombamento tempestivo de equipamentos adquiridos.',
    ],
    diligencesSummary: {
      total: totalDiligences,
      pending: pendingDiligences.length,
      responded: respondedDiligences.length,
      homologated: homologatedDiligences.length,
      complianceImpactNote: complianceNote,
    },
    historicalSemesters: [
      { semester: '2023/1', totalScore: 23, percentage: 92, status: 'aprovado', isUnder50Percent: false },
      { semester: '2023/2', totalScore: 22, percentage: 88, status: 'aprovado', isUnder50Percent: false },
      { semester: '2024/1', totalScore: totalScore >= 20 ? 22 : 18, percentage: totalScore >= 20 ? 88 : 72, status: 'aprovado', isUnder50Percent: false },
      { semester: semester, totalScore, percentage, status: percentage >= 50 ? 'aprovado' : 'insatisfatorio', isUnder50Percent: percentage < 50 },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

export const INITIAL_DIRECTORSHIP_REQUIREMENTS: DirectorshipRequirements[] = [
  {
    schoolId: 'emef-menino-deus',
    schoolName: 'EMEF Menino Deus',
    directorName: 'Profª. Clarice Marlene Weber',
    viceDirectorName: 'Profª. Rosane Beatriz Kappel',
    isEffectiveMagisterio: true,
    effectiveRoleDetail: 'Professora Titular Nível IV - Matrícula 12480-2',
    passedProbationaryPeriod: true,
    probationaryCompletionDate: '2014-03-15',
    hasPostGraduationOrPedagogy: true,
    postGraduationCourse: 'Especialização em Gestão e Supervisão Escolar (UNISC)',
    has180hManagementCourses: true,
    completedCourseHours: 220,
    courseCertificatesDetail: 'Formação Continuada em Liderança Educacional e Gestão Pública (SEE Santa Cruz / 2022-2024)',
    hasCleanRecordAndCertificates: true,
    certificatesValidityDate: '2025-06-30',
    schoolManagementPlanSubmitted: true,
    managementPlanCycle: '2024-2027 (Homologado em 12/2023)',
    cpmFiscalRegularity: true,
    isEligible: true,
    lastAuditedDate: '2024-07-05',
    auditorNotes: 'Documentação completa e regular perante todos os incisos do Art. 19 da Lei 9.738/2024.',
  },
  {
    schoolId: 'emef-christiano-smidt',
    schoolName: 'EMEF Christiano J. Smidt',
    directorName: 'Prof. Leandro Augusto Kist',
    viceDirectorName: 'Profª. Maria Denise Sehn',
    isEffectiveMagisterio: true,
    effectiveRoleDetail: 'Professor Titular Nível V - Matrícula 09840-1',
    passedProbationaryPeriod: true,
    probationaryCompletionDate: '2010-08-20',
    hasPostGraduationOrPedagogy: true,
    postGraduationCourse: 'Mestrado Profissional em Educação (UNISC) / Pós em Gestão',
    has180hManagementCourses: true,
    completedCourseHours: 260,
    courseCertificatesDetail: 'Gestão Orçamentária e Prestação de Contas do PDDE (FNDE/SEE - 2023)',
    hasCleanRecordAndCertificates: true,
    certificatesValidityDate: '2025-04-15',
    schoolManagementPlanSubmitted: true,
    managementPlanCycle: '2024-2027 (Homologado)',
    cpmFiscalRegularity: true,
    isEligible: true,
    lastAuditedDate: '2024-07-02',
    auditorNotes: 'Equipe gestora plenamente qualificada e em dia com todos os requisitos legais.',
  },
  {
    schoolId: 'emef-jose-broch',
    schoolName: 'EMEF Prof. José Aloysio Broch',
    directorName: 'Profª. Silvia Maria Becker',
    viceDirectorName: 'Prof. Gilberto Paulo Heiss',
    isEffectiveMagisterio: true,
    effectiveRoleDetail: 'Professora Titular Nível III - Matrícula 14320-9',
    passedProbationaryPeriod: true,
    probationaryCompletionDate: '2016-11-10',
    hasPostGraduationOrPedagogy: true,
    postGraduationCourse: 'Pós-Graduação em Coordenação Pedagógica e Gestão Democrática',
    has180hManagementCourses: true,
    completedCourseHours: 195,
    courseCertificatesDetail: 'Cursos de Mediação Escolar e Gestão de Recursos Públicos (SEE - 2022 a 2024)',
    hasCleanRecordAndCertificates: true,
    certificatesValidityDate: '2025-05-20',
    schoolManagementPlanSubmitted: true,
    managementPlanCycle: '2024-2027 (Aprovado pelo Conselho Escolar)',
    cpmFiscalRegularity: false, // Flag de atenção devido à certidão em diligência
    isEligible: true,
    lastAuditedDate: '2024-07-10',
    auditorNotes: 'Apto no Art. 19. Notificada diligência quanto à CND do fornecedor da NF 1045 que já foi saneada.',
  },
  {
    schoolId: 'emei-raio-de-sol',
    schoolName: 'EMEI Raio de Sol',
    directorName: 'Profª. Marta Elisabete Sehnem',
    viceDirectorName: 'Profª. Cristiane Vogt',
    isEffectiveMagisterio: true,
    effectiveRoleDetail: 'Professora de Educação Infantil Nível IV - Matrícula 11200-3',
    passedProbationaryPeriod: true,
    probationaryCompletionDate: '2012-05-18',
    hasPostGraduationOrPedagogy: true,
    postGraduationCourse: 'Licenciatura Plena em Pedagogia / Especialização em Educação Infantil e Gestão',
    has180hManagementCourses: true,
    completedCourseHours: 240,
    courseCertificatesDetail: 'Gestão Escolar na Primeira Infância e Administração de CPMs (2023)',
    hasCleanRecordAndCertificates: true,
    certificatesValidityDate: '2025-08-30',
    schoolManagementPlanSubmitted: true,
    managementPlanCycle: '2024-2027 (Homologado)',
    cpmFiscalRegularity: true,
    isEligible: true,
    lastAuditedDate: '2024-07-15',
    auditorNotes: 'Conformidade integral com os requisitos de elegibilidade do Art. 19.',
  },
  {
    schoolId: 'cemeja-santa-cruz',
    schoolName: 'CEMEJA - Centro Municipal de EJA',
    directorName: 'Prof. Vanderlei José Schlosser',
    viceDirectorName: 'Profª. Vera Lucia Muller',
    isEffectiveMagisterio: true,
    effectiveRoleDetail: 'Professor Titular Nível IV - Matrícula 13410-7',
    passedProbationaryPeriod: true,
    probationaryCompletionDate: '2015-09-22',
    hasPostGraduationOrPedagogy: true,
    postGraduationCourse: 'Pós-Graduação em Educação de Jovens e Adultos e Gestão Pública',
    has180hManagementCourses: false, // Pendência de comprovação de horas complementares
    completedCourseHours: 140, // Falta 40h para 180h
    courseCertificatesDetail: 'Comprovou 140h de formação; faltam 40h para atingir o mínimo de 180h do Art. 19, IV',
    hasCleanRecordAndCertificates: true,
    certificatesValidityDate: '2025-02-10',
    schoolManagementPlanSubmitted: true,
    managementPlanCycle: '2024-2027',
    cpmFiscalRegularity: false,
    isEligible: false, // Pendência documental identificada
    lastAuditedDate: '2024-06-28',
    auditorNotes: 'Notificada pendência para complementação de 40h de cursos de gestão escolar e regularização do 3º membro fiscal do CPM.',
  },
];
