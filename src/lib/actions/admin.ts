"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Area } from "@prisma/client";

const DEFAULT_PASSWORD = "UBL2026!";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Apenas administradores podem executar esta ação.");
  return session.user;
}

export type ActionState = { error?: string; success?: boolean };

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

const userSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("Email inválido."),
  isAdmin: z.boolean(),
});

export async function createUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();

    const parsed = userSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      isAdmin: formData.get("isAdmin") === "on",
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "Já existe um usuário com este email." };

    const areaEntries = formData.getAll("areas") as string[]; // "AREA:titular" or "AREA:backup"
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        isAdmin: parsed.data.isAdmin,
        passwordHash,
        mustChangePassword: true,
        active: true,
      },
    });

    for (const entry of areaEntries) {
      const [areaId, role] = entry.split(":");
      if (!areaId) continue;
      await prisma.userArea.create({
        data: { userId: user.id, areaId: areaId as Area, isBackup: role === "backup" },
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar usuário." };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function updateUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const userId = String(formData.get("userId") || "");

    const parsed = userSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      isAdmin: formData.get("isAdmin") === "on",
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (existing) return { error: "Já existe outro usuário com este email." };

    await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name, email, isAdmin: parsed.data.isAdmin },
    });

    const areaEntries = formData.getAll("areas") as string[];
    await prisma.userArea.deleteMany({ where: { userId } });
    for (const entry of areaEntries) {
      const [areaId, role] = entry.split(":");
      if (!areaId) continue;
      await prisma.userArea.create({
        data: { userId, areaId: areaId as Area, isBackup: role === "backup" },
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar usuário." };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string, active: boolean): Promise<ActionState> {
  try {
    await requireAdmin();
    await prisma.user.update({ where: { id: userId }, data: { active } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar usuário." };
  }
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function resetPasswordAction(userId: string): Promise<ActionState> {
  try {
    await requireAdmin();
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao redefinir senha." };
  }
  revalidatePath("/admin/usuarios");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Feriados
// ---------------------------------------------------------------------------

export async function createHolidayAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const dateStr = String(formData.get("date") || "");
    const description = String(formData.get("description") || "").trim();
    if (!dateStr || !description) return { error: "Preencha data e descrição." };

    await prisma.holiday.create({
      data: { date: new Date(`${dateStr}T00:00:00.000Z`), description },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar feriado (já existe um feriado nesta data?)." };
  }
  revalidatePath("/admin/feriados");
  return { success: true };
}

export async function deleteHolidayAction(id: string): Promise<ActionState> {
  try {
    await requireAdmin();
    await prisma.holiday.delete({ where: { id } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao remover feriado." };
  }
  revalidatePath("/admin/feriados");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Configuração de etapas (SLA)
// ---------------------------------------------------------------------------

export async function updateStepSlaAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const sla = parseInt(String(formData.get("slaBusinessDays") || ""), 10);
    if (!id || Number.isNaN(sla) || sla < 1) return { error: "SLA inválido." };

    await prisma.stepDefinition.update({ where: { id }, data: { slaBusinessDays: sla } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar SLA." };
  }
  revalidatePath("/admin/config");
  return { success: true };
}
