"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as workflow from "@/lib/workflow";
import { put } from "@vercel/blob";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session.user;
}

export type ActionState = { error?: string; success?: boolean };

export async function createIniciativaAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const productName = String(formData.get("productName") || "").trim();
  if (!productName) return { error: "Informe o nome do produto." };

  const fase1Data: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("fase1.")) {
      const field = key.replace("fase1.", "");
      fase1Data[field] = value;
    }
  }

  let iniciativaId: string;
  try {
    const { iniciativa } = await workflow.createIniciativa({
      requesterId: user.id,
      productName,
      fase1Data,
    });
    iniciativaId = iniciativa.id;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar iniciativa." };
  }

  revalidatePath("/iniciativas");
  redirect(`/iniciativas/${iniciativaId}`);
}

export async function completeStepAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const stepInstanceId = String(formData.get("stepInstanceId") || "");
  const decisionRaw = String(formData.get("decision") || "");
  const decisionNote = String(formData.get("decisionNote") || "");
  const comment = String(formData.get("comment") || "");

  const decision = decisionRaw === "GO" || decisionRaw === "HOLD" || decisionRaw === "NO_GO" ? decisionRaw : undefined;

  let iniciativaId: string | undefined;
  try {
    const step = await prisma.stepInstance.findUnique({ where: { id: stepInstanceId } });
    iniciativaId = step?.iniciativaId;

    await workflow.completeStep({
      stepInstanceId,
      userId: user.id,
      isAdmin: user.isAdmin,
      decision,
      decisionNote,
      comment,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao concluir etapa." };
  }

  if (iniciativaId) {
    revalidatePath(`/iniciativas/${iniciativaId}`);
  }
  revalidatePath("/iniciativas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function requestAmostrasAction(iniciativaId: string): Promise<ActionState> {
  const user = await requireUser();
  try {
    await workflow.requestAmostras({ iniciativaId, userId: user.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao solicitar amostras." };
  }
  revalidatePath(`/iniciativas/${iniciativaId}`);
  return { success: true };
}

export async function reassignStepAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const stepInstanceId = String(formData.get("stepInstanceId") || "");
  const newUserId = String(formData.get("newUserId") || "");

  let iniciativaId: string | undefined;
  try {
    const step = await prisma.stepInstance.findUnique({ where: { id: stepInstanceId } });
    iniciativaId = step?.iniciativaId;
    await workflow.reassignStep({ stepInstanceId, newUserId, actingUserId: user.id });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao reatribuir etapa." };
  }
  if (iniciativaId) revalidatePath(`/iniciativas/${iniciativaId}`);
  return { success: true };
}

export async function addCommentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const stepInstanceId = String(formData.get("stepInstanceId") || "");
  const iniciativaId = String(formData.get("iniciativaId") || "");
  const text = String(formData.get("text") || "").trim();

  if (!text) return { error: "Escreva um comentário." };

  await prisma.comment.create({
    data: { stepInstanceId, iniciativaId, userId: user.id, text },
  });

  revalidatePath(`/iniciativas/${iniciativaId}`);
  return { success: true };
}

export async function uploadAttachmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const iniciativaId = String(formData.get("iniciativaId") || "");
  const stepInstanceId = String(formData.get("stepInstanceId") || "") || null;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return { error: "Selecione um arquivo." };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "Armazenamento de arquivos (Vercel Blob) não está configurado neste ambiente. Configure BLOB_READ_WRITE_TOKEN para habilitar anexos.",
    };
  }

  try {
    const blob = await put(`iniciativas/${iniciativaId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    await prisma.attachment.create({
      data: {
        iniciativaId,
        stepInstanceId,
        uploadedById: user.id,
        fileName: file.name,
        blobUrl: blob.url,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao enviar arquivo." };
  }

  revalidatePath(`/iniciativas/${iniciativaId}`);
  return { success: true };
}
