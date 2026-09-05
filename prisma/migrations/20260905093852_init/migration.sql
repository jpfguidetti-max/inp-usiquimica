-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('SOLICITANTE', 'QUALIDADE', 'MARKETING', 'LABORATORIO', 'ESPECIALISTA_PRODUTO', 'FABRICA', 'CONTROLADORIA', 'DIRETORIA_COMERCIAL');

-- CreateEnum
CREATE TYPE "IniciativaStatus" AS ENUM ('ABERTA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "GateDecision" AS ENUM ('GO', 'HOLD', 'NO_GO');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('TRANSICAO', 'DIA4', 'VENCIDA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" "Area" NOT NULL,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepDefinition" (
    "id" TEXT NOT NULL,
    "order" INTEGER,
    "phase" INTEGER,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "area" "Area" NOT NULL,
    "slaBusinessDays" INTEGER NOT NULL DEFAULT 3,
    "isGate" BOOLEAN NOT NULL DEFAULT false,
    "parallelGroup" TEXT,

    CONSTRAINT "StepDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iniciativa" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "IniciativaStatus" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "fase1Data" JSONB,
    "fase2Data" JSONB,
    "cadastroData" JSONB,
    "amostraData" JSONB,

    CONSTRAINT "Iniciativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepInstance" (
    "id" TEXT NOT NULL,
    "iniciativaId" TEXT NOT NULL,
    "stepDefinitionId" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "assignedUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "decision" "GateDecision",
    "decisionNote" TEXT,
    "data" JSONB,
    "day4NotifiedAt" TIMESTAMP(3),
    "lastOverdueNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "StepInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "iniciativaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "iniciativaId" TEXT NOT NULL,
    "stepInstanceId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "iniciativaId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "iniciativaId" TEXT NOT NULL,
    "stepInstanceId" TEXT,
    "type" "EmailType" NOT NULL,
    "recipients" JSONB NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserArea_areaId_idx" ON "UserArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserArea_userId_areaId_key" ON "UserArea"("userId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "StepDefinition_key_key" ON "StepDefinition"("key");

-- CreateIndex
CREATE INDEX "StepDefinition_order_idx" ON "StepDefinition"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Iniciativa_code_key" ON "Iniciativa"("code");

-- CreateIndex
CREATE INDEX "Iniciativa_status_idx" ON "Iniciativa"("status");

-- CreateIndex
CREATE INDEX "Iniciativa_requesterId_idx" ON "Iniciativa"("requesterId");

-- CreateIndex
CREATE INDEX "StepInstance_iniciativaId_idx" ON "StepInstance"("iniciativaId");

-- CreateIndex
CREATE INDEX "StepInstance_status_idx" ON "StepInstance"("status");

-- CreateIndex
CREATE INDEX "StepInstance_assignedUserId_idx" ON "StepInstance"("assignedUserId");

-- CreateIndex
CREATE INDEX "Comment_stepInstanceId_idx" ON "Comment"("stepInstanceId");

-- CreateIndex
CREATE INDEX "Comment_iniciativaId_idx" ON "Comment"("iniciativaId");

-- CreateIndex
CREATE INDEX "Attachment_iniciativaId_idx" ON "Attachment"("iniciativaId");

-- CreateIndex
CREATE INDEX "Attachment_stepInstanceId_idx" ON "Attachment"("stepInstanceId");

-- CreateIndex
CREATE INDEX "AuditLog_iniciativaId_idx" ON "AuditLog"("iniciativaId");

-- CreateIndex
CREATE INDEX "EmailLog_iniciativaId_idx" ON "EmailLog"("iniciativaId");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- AddForeignKey
ALTER TABLE "UserArea" ADD CONSTRAINT "UserArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iniciativa" ADD CONSTRAINT "Iniciativa_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepInstance" ADD CONSTRAINT "StepInstance_iniciativaId_fkey" FOREIGN KEY ("iniciativaId") REFERENCES "Iniciativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepInstance" ADD CONSTRAINT "StepInstance_stepDefinitionId_fkey" FOREIGN KEY ("stepDefinitionId") REFERENCES "StepDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepInstance" ADD CONSTRAINT "StepInstance_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepInstance" ADD CONSTRAINT "StepInstance_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "StepInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_iniciativaId_fkey" FOREIGN KEY ("iniciativaId") REFERENCES "Iniciativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_iniciativaId_fkey" FOREIGN KEY ("iniciativaId") REFERENCES "Iniciativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "StepInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_iniciativaId_fkey" FOREIGN KEY ("iniciativaId") REFERENCES "Iniciativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_iniciativaId_fkey" FOREIGN KEY ("iniciativaId") REFERENCES "Iniciativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

