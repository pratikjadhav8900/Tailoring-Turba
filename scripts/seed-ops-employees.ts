import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

export const OPS_EMPLOYEES = [
  {
    employeeCode: "TT001",
    name: "Niraj",
    email: "niraj@tailoringturba.com",
    roleTitle: "Operations Lead / Founder",
    passwordPlain: "Pass@1234",
    role: "ADMIN" as const,
  },
  {
    employeeCode: "TT002",
    name: "Sanjay",
    email: "sanjay@tailoringturba.com",
    roleTitle: "Master Cutter & Fabric",
    passwordPlain: "Pass@1234",
    role: "EMPLOYEE" as const,
  },
  {
    employeeCode: "TT003",
    name: "Pratik",
    email: "pratik.ops@tailoringturba.com",
    roleTitle: "Production & Stitching Lead",
    passwordPlain: "Pass@1234",
    role: "EMPLOYEE" as const,
  },
  {
    employeeCode: "TT004",
    name: "Mahesh",
    email: "mahesh@tailoringturba.com",
    roleTitle: "Branding & Printing Specialist",
    passwordPlain: "Pass@1234",
    role: "EMPLOYEE" as const,
  },
  {
    employeeCode: "TT005",
    name: "Ajay",
    email: "ajay@tailoringturba.com",
    roleTitle: "Quality Check & Dispatch",
    passwordPlain: "Pass@1234",
    role: "EMPLOYEE" as const,
  },
];

async function seedEmployees() {
  console.log("Seeding Turba Ops Employee Accounts...");

  for (const emp of OPS_EMPLOYEES) {
    const hashedPassword = await bcrypt.hash(emp.passwordPlain, 10);

    // 1. Create or update User record
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        name: emp.name,
        password: hashedPassword,
        role: emp.role,
        emailVerified: new Date(),
      },
      create: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: emp.role,
        emailVerified: new Date(),
      },
    });

    // 2. Create or update Employee profile record linked to User
    const employee = await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {
        name: emp.name,
        email: emp.email,
        roleTitle: emp.roleTitle,
        isActive: true,
        userId: user.id,
      },
      create: {
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        roleTitle: emp.roleTitle,
        isActive: true,
        userId: user.id,
      },
    });

    console.log(`✓ Seeded ${emp.employeeCode} (${emp.name}) -> ${emp.email} [${emp.roleTitle}]`);
  }

  console.log("\nAll 5 Turba Ops Employee Accounts successfully created/updated!");
}

seedEmployees()
  .catch((err) => {
    console.error("Failed to seed employees:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
