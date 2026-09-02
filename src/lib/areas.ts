import { Area } from "@prisma/client";

export const AREA_LABELS: Record<Area, string> = {
  SOLICITANTE: "Solicitante (Comercial)",
  QUALIDADE: "Qualidade",
  MARKETING: "Marketing",
  LABORATORIO: "Laboratório",
  ESPECIALISTA_PRODUTO: "Especialista de Produto",
  FABRICA: "Fábrica",
  CONTROLADORIA: "Controladoria",
  DIRETORIA_COMERCIAL: "Diretoria Comercial",
};

export const ALL_AREAS: Area[] = [
  "SOLICITANTE",
  "QUALIDADE",
  "MARKETING",
  "LABORATORIO",
  "ESPECIALISTA_PRODUTO",
  "FABRICA",
  "CONTROLADORIA",
  "DIRETORIA_COMERCIAL",
];

// Tailwind classes for phase-colored left borders / pills, reused across the
// step-definition config and the workflow visualization.
export const PHASE_COLORS: Record<number, { border: string; bg: string; text: string; label: string }> = {
  1: { border: "border-l-teal-600", bg: "bg-teal-50", text: "text-teal-800", label: "Fase 1 — Business Case" },
  2: { border: "border-l-indigo-500", bg: "bg-indigo-50", text: "text-indigo-800", label: "Fase 2 — Preparação" },
  3: { border: "border-l-fuchsia-800", bg: "bg-fuchsia-50", text: "text-fuchsia-900", label: "Fase 3 — Cadastro" },
};
