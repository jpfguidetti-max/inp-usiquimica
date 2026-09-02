import { Area } from "@prisma/client";

// Canonical, ordered definition of every step in the INP workflow.
// This is the single source of truth used both by prisma/seed.ts (to create
// the StepDefinition rows) and, indirectly, by the workflow engine, which
// reads StepDefinition rows from the database (editable later at
// /admin/config) rather than importing this list directly at runtime.
//
// key: AMOSTRAS_F_CT_0002 is the off-sequence "Solicitar Cadastro de
// Amostras" step — order/phase/parallelGroup are all null, it never
// participates in the main chain's auto-advance logic.

export type StepDefinitionSeed = {
  order: number | null;
  phase: number | null;
  key: string;
  label: string;
  area: Area;
  slaBusinessDays: number;
  isGate: boolean;
  parallelGroup: string | null;
};

export const STEP_DEFINITIONS: StepDefinitionSeed[] = [
  {
    order: 1,
    phase: 1,
    key: "F1_BUSINESS_CASE",
    label: "Preencher Business Case (F.VEN-0015, Fase 1)",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 2,
    phase: 1,
    key: "F1_QUALIDADE_REGULATORIO",
    label: "Analisar viabilidade regulatória (CAS Number / NCM)",
    area: "QUALIDADE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P1",
  },
  {
    order: 3,
    phase: 1,
    key: "F1_FABRICA_VIABILIDADE",
    label: "Verificar viabilidade fabril / armazenagem",
    area: "FABRICA",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P1",
  },
  {
    order: 4,
    phase: 1,
    key: "F1_ENCAMINHAR_DIRETORIA",
    label: "Completar Business Case e encaminhar à Diretoria Comercial",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 5,
    phase: 1,
    key: "F1_ARQUIVAMENTO",
    label: "Arquivar documentos do INP na pasta de rede",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 6,
    phase: 1,
    key: "F1_GATE1",
    label: "Gate 1 — Aprovação do Business Case",
    area: "DIRETORIA_COMERCIAL",
    slaBusinessDays: 3,
    isGate: true,
    parallelGroup: null,
  },
  {
    order: 7,
    phase: 2,
    key: "F2_PREENCHER_FASE2",
    label: "Preencher F.VEN-0015, aba Fase 2",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 8,
    phase: 2,
    key: "F2_ENCAMINHAR",
    label: "Encaminhar Fase 2 para Marketing, Qualidade, Laboratório e Esp. Produto",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 9,
    phase: 2,
    key: "F2_MKT_INPI",
    label: "Validar nome comercial junto ao INPI",
    area: "MARKETING",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P2",
  },
  {
    order: 10,
    phase: 2,
    key: "F2_MKT_MATERIAL",
    label: "Preparar material comercial, site e rótulo",
    area: "MARKETING",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P2",
  },
  {
    order: 11,
    phase: 2,
    key: "F2_LAB_FDS",
    label: "Preparar conteúdo da FDS",
    area: "LABORATORIO",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P2",
  },
  {
    order: 12,
    phase: 2,
    key: "F2_QUALIDADE_LICENCAS",
    label: "Incluir produto nas licenças pertinentes",
    area: "QUALIDADE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P2",
  },
  {
    order: 13,
    phase: 2,
    key: "F2_ESPECIALISTA_GTIN",
    label: "Registrar GTIN do produto",
    area: "ESPECIALISTA_PRODUTO",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: "P2",
  },
  {
    order: 14,
    phase: 3,
    key: "F3_PREENCHER_CADASTRO",
    label: "Preencher Solicitação de Cadastro (F.CT-0001)",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 15,
    phase: 3,
    key: "F3_ENVIAR_CONTROLADORIA",
    label: "Enviar F.CT-0001 e documentos técnicos à Controladoria",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 16,
    phase: 3,
    key: "F3_CONTROLADORIA_CADASTRO",
    label: "Cadastrar item no sistema",
    area: "CONTROLADORIA",
    slaBusinessDays: 5,
    isGate: false,
    parallelGroup: "P3",
  },
  {
    order: 17,
    phase: 3,
    key: "F3_CONTROLADORIA_CUSTO",
    label: "Cadastrar custo do item",
    area: "CONTROLADORIA",
    slaBusinessDays: 5,
    isGate: false,
    parallelGroup: "P3",
  },
  {
    order: 18,
    phase: 3,
    key: "F3_ACOMPANHAR_VINCULOS",
    label: "Acompanhar cadastro dos vínculos",
    area: "SOLICITANTE",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: 19,
    phase: 3,
    key: "F3_MKT_SITE",
    label: "Informar solicitante quando os documentos estiverem no site",
    area: "MARKETING",
    slaBusinessDays: 3,
    isGate: false,
    parallelGroup: null,
  },
  {
    order: null,
    phase: null,
    key: "AMOSTRAS_F_CT_0002",
    label: "Solicitação de Cadastro de Amostras (F.CT-0002)",
    area: "SOLICITANTE",
    slaBusinessDays: 5,
    isGate: false,
    parallelGroup: null,
  },
];

export const FIRST_STEP_KEY = "F1_BUSINESS_CASE";
export const GATE_STEP_KEY = "F1_GATE1";
export const AMOSTRAS_STEP_KEY = "AMOSTRAS_F_CT_0002";
export const LAST_STEP_ORDER = 19;
