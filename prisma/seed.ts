/* eslint-disable no-console */
// Seed script — run AFTER deploying against a real (Neon) database:
//   npx prisma db seed
// (or `npx prisma migrate deploy && npx prisma db seed` on first deploy).
// Do NOT run this against a fake/local DATABASE_URL — there is none configured
// in this sandbox on purpose (see README.md).

import { PrismaClient, Area } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STEP_DEFINITIONS } from "../src/lib/stepDefinitions";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "UBL2026!";

type SeedUser = {
  name: string;
  email: string;
  isAdmin: boolean;
  areas: { area: Area; isBackup: boolean }[];
};

const SEED_USERS: SeedUser[] = [
  {
    name: "João Guidetti",
    email: "joao.guidetti@usiquimica.com.br",
    isAdmin: true,
    areas: [{ area: "SOLICITANTE", isBackup: false }],
  },
  {
    name: "Veronica Alves",
    email: "veronica.alves@usiquimica.com.br",
    isAdmin: true,
    areas: [
      { area: "QUALIDADE", isBackup: false },
      { area: "CONTROLADORIA", isBackup: false },
    ],
  },
  {
    name: "Vanessa Almeida",
    email: "qualidade01@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "QUALIDADE", isBackup: true }],
  },
  {
    name: "Talita",
    email: "talita@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "CONTROLADORIA", isBackup: true }],
  },
  {
    name: "Camila Pereira",
    email: "criacao@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "MARKETING", isBackup: false }],
  },
  {
    name: "Antonio",
    email: "laboratorio@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "LABORATORIO", isBackup: false }],
  },
  {
    name: "Amanda Amorim",
    email: "amanda.amorim@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "ESPECIALISTA_PRODUTO", isBackup: false }],
  },
  {
    name: "Evelyn Lara",
    email: "evelyn.lara@usiblend.com.br",
    isAdmin: false,
    areas: [{ area: "ESPECIALISTA_PRODUTO", isBackup: true }],
  },
  {
    name: "Edivaldo Macedo",
    email: "edivaldo@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "FABRICA", isBackup: false }],
  },
  {
    name: "Everton Minatti",
    email: "everton.minatti@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "FABRICA", isBackup: true }],
  },
  {
    name: "Osvane Lazarone",
    email: "osvane@usiquimica.com.br",
    isAdmin: false,
    areas: [{ area: "DIRETORIA_COMERCIAL", isBackup: false }],
  },
];

async function main() {
  console.log("Seeding StepDefinitions...");
  for (const def of STEP_DEFINITIONS) {
    await prisma.stepDefinition.upsert({
      where: { key: def.key },
      update: {
        order: def.order,
        phase: def.phase,
        label: def.label,
        area: def.area,
        slaBusinessDays: def.slaBusinessDays,
        isGate: def.isGate,
        parallelGroup: def.parallelGroup,
      },
      create: def,
    });
  }
  console.log(`  ${STEP_DEFINITIONS.length} etapas ok.`);

  console.log("Seeding usuários...");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        isAdmin: u.isAdmin,
        active: true,
      },
      create: {
        name: u.name,
        email: u.email,
        isAdmin: u.isAdmin,
        active: true,
        passwordHash,
        mustChangePassword: true,
      },
    });

    for (const a of u.areas) {
      await prisma.userArea.upsert({
        where: { userId_areaId: { userId: user.id, areaId: a.area } },
        update: { isBackup: a.isBackup },
        create: { userId: user.id, areaId: a.area, isBackup: a.isBackup },
      });
    }
    console.log(`  ${u.name} <${u.email}> ok.`);
  }

  console.log("\nSenha padrão para todos os usuários criados: " + DEFAULT_PASSWORD);
  console.log("Todos deverão trocar a senha no primeiro login.");
  console.log("\nSeed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
