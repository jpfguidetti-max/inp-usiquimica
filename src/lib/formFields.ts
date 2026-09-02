// Typed field configs for the JSON payloads stored on Iniciativa
// (fase1Data, fase2Data, cadastroData, amostraData).
//
// These are deliberately data-driven (not one component per field) so an
// admin/developer can extend the list later without touching form/render
// logic. They cover the important fields from the source spreadsheets
// (F.VEN-0015 abas Fase 1 / Fase 2, and F.CT-0001) without attempting to
// replicate every single cell.

export type FieldType = "text" | "textarea" | "number" | "select" | "date";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for type "select"
  placeholder?: string;
  help?: string;
};

// F.VEN-0015, Fase 1 — Business Case
export const FASE1_FIELDS: FieldConfig[] = [
  { name: "racionalComercial", label: "Racional comercial", type: "textarea", required: true, help: "Por que lançar este produto agora?" },
  { name: "segmento", label: "Segmento / mercado alvo", type: "text", required: true },
  { name: "publicoAlvo", label: "Público-alvo", type: "text" },
  { name: "concorrentes", label: "Principais concorrentes", type: "textarea" },
  { name: "volumeAnualEstimado", label: "Volume anual estimado (kg/L)", type: "number" },
  { name: "ticketMedio", label: "Ticket médio estimado (R$)", type: "number" },
  { name: "faturamentoAnoI", label: "Faturamento estimado ano I (R$)", type: "number" },
  { name: "margemEstimada", label: "Margem estimada (%)", type: "number" },
  { name: "investimentoNecessario", label: "Investimento necessário (R$)", type: "number" },
  { name: "casNumber", label: "CAS Number (se conhecido)", type: "text" },
  { name: "ncmSugerido", label: "NCM sugerido", type: "text" },
  { name: "materiaPrimaPrincipal", label: "Matéria-prima principal", type: "text" },
  { name: "observacoes", label: "Observações adicionais", type: "textarea" },
];

// F.VEN-0015, Fase 2 — Preparação comercial
export const FASE2_FIELDS: FieldConfig[] = [
  { name: "nomeComercialProposto", label: "Nome comercial proposto", type: "text", required: true },
  { name: "categoria", label: "Categoria do produto", type: "text" },
  { name: "composicao", label: "Composição (resumo)", type: "textarea" },
  { name: "embalagens", label: "Embalagens previstas", type: "text", placeholder: "Ex.: 1L, 5L, 20L, 200L" },
  { name: "prazoValidade", label: "Prazo de validade previsto", type: "text" },
  { name: "condicoesArmazenamento", label: "Condições de armazenamento", type: "textarea" },
  { name: "canaisVenda", label: "Canais de venda", type: "text" },
  { name: "precoSugerido", label: "Preço sugerido (R$)", type: "number" },
  { name: "necessitaRegistroOrgao", label: "Necessita registro em órgão regulador?", type: "select", options: ["Sim", "Não", "A verificar"] },
  { name: "observacoesFase2", label: "Observações adicionais", type: "textarea" },
];

// F.CT-0001 — Solicitação de Cadastro (subset of the ~32 questions,
// covering the fields that materially drive the cadastro/custo steps).
export const CADASTRO_FIELDS: FieldConfig[] = [
  { name: "codigoInterno", label: "Código interno sugerido", type: "text" },
  { name: "descricaoCompleta", label: "Descrição completa do item", type: "textarea", required: true },
  { name: "unidadeMedida", label: "Unidade de medida", type: "text", placeholder: "Ex.: KG, L, UN" },
  { name: "ncm", label: "NCM", type: "text", required: true },
  { name: "cest", label: "CEST", type: "text" },
  { name: "origemMercadoria", label: "Origem da mercadoria", type: "select", options: ["Nacional", "Importada"] },
  { name: "classeFiscal", label: "Classe fiscal / tributação", type: "text" },
  { name: "fornecedorPrincipal", label: "Fornecedor principal (se insumo)", type: "text" },
  { name: "custoEstimado", label: "Custo estimado (R$)", type: "number" },
  { name: "pesoLiquido", label: "Peso líquido (kg)", type: "number" },
  { name: "pesoBruto", label: "Peso bruto (kg)", type: "number" },
  { name: "grupoProduto", label: "Grupo de produto", type: "text" },
  { name: "familiaProduto", label: "Família de produto", type: "text" },
  { name: "controlaLote", label: "Controla lote?", type: "select", options: ["Sim", "Não"] },
  { name: "controlaValidade", label: "Controla validade?", type: "select", options: ["Sim", "Não"] },
  { name: "observacoesCadastro", label: "Observações para a Controladoria", type: "textarea" },
];

// F.CT-0002 — Amostras (opcional, aberto sob demanda)
export const AMOSTRA_FIELDS: FieldConfig[] = [
  { name: "motivoAmostra", label: "Motivo da solicitação de amostra", type: "textarea", required: true },
  { name: "quantidadeSolicitada", label: "Quantidade solicitada", type: "text", required: true },
  { name: "destinatario", label: "Destinatário / cliente", type: "text" },
  { name: "prazoDesejado", label: "Prazo desejado", type: "date" },
  { name: "observacoesAmostra", label: "Observações", type: "textarea" },
];
