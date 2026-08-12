-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneVerified" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UsedSignupAttempt" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedSignupAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpRequestLog" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsedSignupAttempt_attemptId_key" ON "UsedSignupAttempt"("attemptId");
