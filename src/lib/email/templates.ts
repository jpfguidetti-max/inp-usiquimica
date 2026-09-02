// Plain hand-written HTML email templates (pt-BR). Kept intentionally simple
// (no react-email) per the project's tech-stack decision.

const BRAND_COLOR = "#1f6f5c";

function layout(title: string, bodyHtml: string, ctaUrl?: string, ctaLabel?: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "";
  const cta =
    ctaUrl && ctaLabel
      ? `<tr><td style="padding-top:24px;">
           <a href="${baseUrl}${ctaUrl}" style="background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;display:inline-block;">${ctaLabel}</a>
         </td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f5f4;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:${BRAND_COLOR};padding:16px 24px;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;">Usiquimica — Introdução de Novo Produto</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="font-size:18px;margin:0 0 12px 0;color:#111827;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            ${cta}
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <span style="font-size:11px;color:#6b7280;">Este é um email automático do sistema de Introdução de Novo Produto (INP). Não responda diretamente a este email.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function transicaoTemplate(params: {
  code: string;
  productName: string;
  stepAnteriorLabel: string;
  stepAtualLabel: string;
  responsavelNome: string;
  iniciativaId: string;
}): { subject: string; html: string } {
  const { code, productName, stepAnteriorLabel, stepAtualLabel, responsavelNome, iniciativaId } = params;
  const subject = `[INP ${code}] Etapa concluída — avançou para "${stepAtualLabel}"`;
  const body = `
    <p style="font-size:14px;line-height:1.6;">
      A etapa <strong>"${stepAnteriorLabel}"</strong> foi concluída.
    </p>
    <p style="font-size:14px;line-height:1.6;">
      A iniciativa <strong>${code}</strong> (produto: <strong>${productName}</strong>) está agora na etapa
      <strong>"${stepAtualLabel}"</strong>, sob responsabilidade de <strong>${responsavelNome}</strong>.
    </p>`;
  return { subject, html: layout(subject, body, `/iniciativas/${iniciativaId}`, "Ver iniciativa") };
}

export function dia4Template(params: {
  code: string;
  productName: string;
  stepLabel: string;
  responsavelNome: string;
  diasUteis: number;
  iniciativaId: string;
}): { subject: string; html: string } {
  const { code, productName, stepLabel, responsavelNome, diasUteis, iniciativaId } = params;
  const subject = `[INP ${code}] Etapa parada há ${diasUteis} dias úteis — "${stepLabel}"`;
  const body = `
    <p style="font-size:14px;line-height:1.6;">
      A etapa <strong>"${stepLabel}"</strong> da iniciativa <strong>${code}</strong>
      (produto: <strong>${productName}</strong>) está parada há <strong>${diasUteis} dias úteis</strong>
      com <strong>${responsavelNome}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6b7280;">
      Este é um alerta preventivo — a etapa ainda não está vencida, mas está próxima do prazo.
    </p>`;
  return { subject, html: layout(subject, body, `/iniciativas/${iniciativaId}`, "Ver iniciativa") };
}

export function vencidaTemplate(params: {
  code: string;
  productName: string;
  stepLabel: string;
  responsavelNome: string;
  dueAt: Date;
  iniciativaId: string;
}): { subject: string; html: string } {
  const { code, productName, stepLabel, responsavelNome, dueAt, iniciativaId } = params;
  const dueAtStr = dueAt.toLocaleDateString("pt-BR");
  const subject = `[INP ${code}] URGENTE — etapa VENCIDA — "${stepLabel}"`;
  const body = `
    <p style="font-size:14px;line-height:1.6;">
      <strong style="color:#b91c1c;">URGENTE:</strong> a etapa <strong>"${stepLabel}"</strong> da iniciativa
      <strong>${code}</strong> (produto: <strong>${productName}</strong>) está <strong>VENCIDA</strong> desde
      <strong>${dueAtStr}</strong>, sob responsabilidade de <strong>${responsavelNome}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#b91c1c;font-weight:600;">
      Ação necessária.
    </p>`;
  return { subject, html: layout(subject, body, `/iniciativas/${iniciativaId}`, "Ver iniciativa") };
}

export function gateRejectedTemplate(params: {
  code: string;
  productName: string;
  decision: "HOLD" | "NO_GO";
  decisionNote: string;
  iniciativaId: string;
}): { subject: string; html: string } {
  const { code, productName, decision, decisionNote, iniciativaId } = params;
  const decisionLabel = decision === "HOLD" ? "EM ESPERA (HOLD)" : "REPROVADO (NO-GO)";
  const subject = `[INP ${code}] Gate 1 — ${decisionLabel}`;
  const body = `
    <p style="font-size:14px;line-height:1.6;">
      A Diretoria Comercial avaliou o Business Case da iniciativa <strong>${code}</strong>
      (produto: <strong>${productName}</strong>) no <strong>Gate 1</strong> e a decisão foi:
      <strong>${decisionLabel}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;">
      <strong>Observação da Diretoria:</strong><br/>${decisionNote}
    </p>
    <p style="font-size:14px;line-height:1.6;">
      A etapa "Preencher Business Case" foi reaberta para ajustes.
    </p>`;
  return { subject, html: layout(subject, body, `/iniciativas/${iniciativaId}`, "Ver iniciativa") };
}
