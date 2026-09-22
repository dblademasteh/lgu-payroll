import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding LGU Payroll database...');

  // Create demo users
  const passwordHash = await bcrypt.hash('admin123', 12);

  const users = [
    { username: 'admin', fullName: 'System Administrator', role: 'ADMIN' },
    { username: 'hr_manager', fullName: 'HR Manager', role: 'HR_MANAGER' },
    { username: 'payroll_manager', fullName: 'Payroll Manager', role: 'PAYROLL_MANAGER' },
    { username: 'dept_head', fullName: 'Department Head', role: 'DEPARTMENT_HEAD' },
    { username: 'auditor', fullName: 'Internal Auditor', role: 'AUDITOR' },
    { username: 'viewer', fullName: 'Regular Employee', role: 'VIEWER', externalId: 'EMP-001' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, fullName: u.fullName, role: u.role, externalId: u.externalId },
      create: { username: u.username, passwordHash, fullName: u.fullName, role: u.role, externalId: u.externalId },
    });
    console.log(`  ✓ User: ${u.username} (${u.role})`);
  }

  // Create departments
  const departments = [
    { code: 'ADM', name: 'Administration', headId: null, budget: 2500000, description: 'Administrative and support services' },
    { code: 'HR', name: 'Human Resources', headId: null, budget: 1800000, description: 'Human resource management' },
    { code: 'ENG', name: 'Engineering', headId: null, budget: 5000000, description: 'Software development and IT infrastructure' },
    { code: 'FIN', name: 'Finance', headId: null, budget: 3200000, description: 'Financial management and accounting' },
    { code: 'OPS', name: 'Operations', headId: null, budget: 2800000, description: 'Field operations and service delivery' },
    { code: 'LEG', name: 'Legal', headId: null, budget: 1200000, description: 'Legal counsel and compliance' },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    console.log(`  ✓ Department: ${d.code} - ${d.name}`);
  }

  // Get department IDs
  const deptMap = {};
  for (const d of departments) {
    const dept = await prisma.department.findUnique({ where: { code: d.code } });
    deptMap[d.code] = dept.id;
  }

  // Create employees
  const employees = [
    { employeeNumber: 'EMP-001', firstName: 'Juan', lastName: 'Dela Cruz', middleName: 'Santos', email: 'juan.delacruz@lgu.gov.ph', department: 'Administration', position: 'Administrative Officer', hiredDate: new Date('2020-01-15'), monthlySalary: 25000, status: 'ACTIVE' },
    { employeeNumber: 'EMP-002', firstName: 'Maria', lastName: 'Santos', middleName: 'Reyes', email: 'maria.santos@lgu.gov.ph', department: 'Human Resources', position: 'HR Specialist', hiredDate: new Date('2021-03-22'), monthlySalary: 30000, status: 'ACTIVE' },
    { employeeNumber: 'EMP-003', firstName: 'Pedro', lastName: 'Garcia', middleName: 'Lopez', email: 'pedro.garcia@lgu.gov.ph', department: 'Engineering', position: 'Software Engineer', hiredDate: new Date('2022-06-10'), monthlySalary: 35000, status: 'ACTIVE' },
    { employeeNumber: 'EMP-004', firstName: 'Ana', lastName: 'Reyes', middleName: 'Cruz', email: 'ana.reyes@lgu.gov.ph', department: 'Finance', position: 'Accountant', hiredDate: new Date('2019-11-05'), monthlySalary: 28000, status: 'ACTIVE' },
    { employeeNumber: 'EMP-005', firstName: 'Jose', lastName: 'Mendoza', middleName: 'Torres', email: 'jose.mendoza@lgu.gov.ph', department: 'Operations', position: 'Operations Officer', hiredDate: new Date('2023-02-14'), monthlySalary: 22000, status: 'ACTIVE' },
    { employeeNumber: 'EMP-006', firstName: 'Luisa', lastName: 'Fernandez', middleName: 'Garcia', email: 'luisa.fernandez@lgu.gov.ph', department: 'Legal', position: 'Attorney', hiredDate: new Date('2018-08-20'), monthlySalary: 40000, status: 'INACTIVE' },
  ];

  for (const e of employees) {
    await prisma.employee.upsert({
      where: { employeeNumber: e.employeeNumber },
      update: e,
      create: e,
    });
    console.log(`  ✓ Employee: ${e.employeeNumber} - ${e.firstName} ${e.lastName}`);
  }

  // Create deductions
  const deductions = [
    { name: 'SSS Contribution', code: 'SSS_EE', type: 'GOVERNMENT', amountType: 'PERCENTAGE', basis: 'GROSS', rateOrAmount: '4.5', isMandatory: true, description: 'Social Security System employee share (4.5%)' },
    { name: 'PhilHealth Contribution', code: 'PHIC_EE', type: 'GOVERNMENT', amountType: 'PERCENTAGE', basis: 'GROSS', rateOrAmount: '2.0', isMandatory: true, description: 'PhilHealth employee share (2.0%, split 50/50)' },
    { name: 'Pag-IBIG Contribution', code: 'PAGIBIG_EE', type: 'GOVERNMENT', amountType: 'FIXED', basis: 'GROSS', rateOrAmount: '100', isMandatory: true, description: 'Pag-IBIG Fund employee share (₱100)' },
    { name: 'Withholding Tax', code: 'WHTAX', type: 'TAX', amountType: 'TABLE', basis: 'TAXABLE', rateOrAmount: '0', isMandatory: true, description: 'BIR Withholding Tax per TRAIN Law' },
    { name: 'SSS Loan', code: 'SSS_LOAN', type: 'LOAN', amountType: 'FIXED', basis: 'NET', rateOrAmount: '500', isMandatory: false, description: 'SSS Salary loan amortization' },
    { name: 'Pag-IBIG Loan', code: 'PAGIBIG_LOAN', type: 'LOAN', amountType: 'FIXED', basis: 'NET', rateOrAmount: '800', isMandatory: false, description: 'Pag-IBIG Multi-purpose loan amortization' },
    { name: 'Union Dues', code: 'UNION_DUES', type: 'OTHER', amountType: 'FIXED', basis: 'NET', rateOrAmount: '50', isMandatory: false, description: 'Monthly union membership fee' },
    { name: 'Cooperative Dues', code: 'COOP_DUES', type: 'OTHER', amountType: 'PERCENTAGE', basis: 'GROSS', rateOrAmount: '1.0', isMandatory: false, description: 'Employee cooperative contribution (1%)' },
  ];

  for (const d of deductions) {
    await prisma.deduction.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    console.log(`  ✓ Deduction: ${d.code} - ${d.name}`);
  }

  // Create holidays for 2025
  const holidays = [
    { date: new Date('2025-01-01'), name: "New Year's Day" },
    { date: new Date('2025-01-29'), name: 'Chinese New Year' },
    { date: new Date('2025-04-09'), name: 'Araw ng Kagitingan' },
    { date: new Date('2025-04-17'), name: 'Maundy Thursday' },
    { date: new Date('2025-04-18'), name: 'Good Friday' },
    { date: new Date('2025-04-19'), name: 'Black Saturday' },
    { date: new Date('2025-05-01'), name: 'Labor Day' },
    { date: new Date('2025-06-12'), name: 'Independence Day' },
    { date: new Date('2025-08-21'), name: 'Ninoy Aquino Day' },
    { date: new Date('2025-08-25'), name: 'National Heroes Day' },
    { date: new Date('2025-11-01'), name: 'All Saints Day' },
    { date: new Date('2025-11-30'), name: 'Bonifacio Day' },
    { date: new Date('2025-12-24'), name: 'Christmas Eve' },
    { date: new Date('2025-12-25'), name: 'Christmas Day' },
    { date: new Date('2025-12-30'), name: 'Rizal Day' },
    { date: new Date('2025-12-31'), name: 'New Year\'s Eve' },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: { name: h.name },
      create: h,
    });
    console.log(`  ✓ Holiday: ${h.name} (${h.date.toISOString().split('T')[0]})`);
  }

  // Create default integration config
  await prisma.integrationConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
  console.log('  ✓ Integration config created');

  console.log('\n✅ Seeding completed!');
  console.log('\nDemo accounts (password: admin123):');
  console.log('  admin / admin123');
  console.log('  hr_manager / admin123');
  console.log('  payroll_manager / admin123');
  console.log('  dept_head / admin123');
  console.log('  auditor / admin123');
  console.log('  viewer / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });