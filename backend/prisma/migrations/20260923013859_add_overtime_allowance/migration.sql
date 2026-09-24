-- CreateTable
CREATE TABLE "OvertimeAllowance" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "overtimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "overtimeRate" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "overtimePay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OvertimeAllowance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OvertimeAllowance_payrollRunId_idx" ON "OvertimeAllowance"("payrollRunId");

-- CreateIndex
CREATE INDEX "OvertimeAllowance_employeeId_idx" ON "OvertimeAllowance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "OvertimeAllowance_payrollRunId_employeeId_key" ON "OvertimeAllowance"("payrollRunId", "employeeId");

-- AddForeignKey
ALTER TABLE "OvertimeAllowance" ADD CONSTRAINT "OvertimeAllowance_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeAllowance" ADD CONSTRAINT "OvertimeAllowance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
