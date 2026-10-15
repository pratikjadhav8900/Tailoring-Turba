import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const CORE_EMPLOYEES = [
  {
    employeeCode: 'TT001',
    name: 'Neeraj Shingavi',
    email: 'neeraj@tailoringturba.com',
    roleTitle: 'Founder',
    role: 'SUPER_ADMIN' as const,
    defaultPassword: 'turba@neeraj123',
    phone: '9822000001',
  },
  {
    employeeCode: 'TT002',
    name: 'Sanjay Shingavi',
    email: 'sanjay@tailoringturba.com',
    roleTitle: 'Co-Founder',
    role: 'ADMIN' as const,
    defaultPassword: 'turba@sanjay123',
    phone: '9822000002',
  },
  {
    employeeCode: 'TT003',
    name: 'Pratik Jadhav',
    email: 'pratik@tailoringturba.com',
    roleTitle: 'Sales, Marketing & Software Developer',
    role: 'ADMIN' as const,
    defaultPassword: 'turba@pratik123',
    phone: '9822000003',
  },
  {
    employeeCode: 'TT004',
    name: 'Mahesh Ghavale',
    email: 'mahesh@tailoringturba.com',
    roleTitle: 'Worker',
    role: 'EMPLOYEE' as const,
    defaultPassword: 'worker@mahesh123',
    phone: '9822000004',
  },
  {
    employeeCode: 'TT005',
    name: 'Ajay',
    email: 'ajay@tailoringturba.com',
    roleTitle: 'Worker',
    role: 'EMPLOYEE' as const,
    defaultPassword: 'worker@ajay123',
    phone: '9822000005',
  },
];

export async function seedEmployees() {
  console.log('Synchronizing Tailoring Turba 5 core team members...');

  // Remove the temporary EMP-001 if it exists
  const tempEmp = await prisma.employee.findUnique({ where: { employeeCode: 'EMP-001' } });
  if (tempEmp) {
    await prisma.employee.delete({ where: { id: tempEmp.id } });
    if (tempEmp.userId) {
      await prisma.user.delete({ where: { id: tempEmp.userId } }).catch(() => {});
    }
  }

  for (const emp of CORE_EMPLOYEES) {
    const hashedPassword = await bcrypt.hash(emp.defaultPassword, 10);

    // Find existing employee by code
    const existing = await prisma.employee.findUnique({
      where: { employeeCode: emp.employeeCode },
      include: { user: true },
    });

    if (existing) {
      // Update User
      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: {
            name: emp.name,
            email: emp.email,
            role: emp.role,
            phone: emp.phone,
            password: hashedPassword,
          },
        });
      } else {
        const newUser = await prisma.user.create({
          data: {
            name: emp.name,
            email: emp.email,
            role: emp.role,
            phone: emp.phone,
            password: hashedPassword,
          },
        });
        await prisma.employee.update({
          where: { id: existing.id },
          data: { userId: newUser.id },
        });
      }

      // Update Employee record
      await prisma.employee.update({
        where: { id: existing.id },
        data: {
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          roleTitle: emp.roleTitle,
          isActive: true,
        },
      });

      console.log(`✓ Synchronized ${emp.employeeCode}: ${emp.name} (${emp.roleTitle})`);
    } else {
      // Create new
      const user = await prisma.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          role: emp.role,
          phone: emp.phone,
          password: hashedPassword,
        },
      });

      await prisma.employee.create({
        data: {
          employeeCode: emp.employeeCode,
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          roleTitle: emp.roleTitle,
          isActive: true,
          userId: user.id,
        },
      });

      console.log(`✓ Created ${emp.employeeCode}: ${emp.name} (${emp.roleTitle})`);
    }
  }

  console.log('All 5 core team members synchronized.');
}
