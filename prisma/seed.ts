import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient, JobStatus, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
  const company = await prisma.company.upsert({
    where: { slug: "empresa-demo" },
    update: { name: "Empresa Demo" },
    create: {
      name: "Empresa Demo",
      slug: "empresa-demo",
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Administrador",
      role: UserRole.ADMIN,
      companyId: company.id,
      passwordHash,
    },
    create: {
      email: "admin@demo.com",
      name: "Administrador",
      passwordHash,
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });

  const existingJob = await prisma.job.findFirst({
    where: {
      companyId: company.id,
      title: "Desarrollador Full Stack Junior",
    },
  });

  if (!existingJob) {
    await prisma.job.create({
      data: {
        companyId: company.id,
        title: "Desarrollador Full Stack Junior",
        description:
          "Buscamos desarrollador junior para apoyar en proyectos web internos.",
        requirements:
          "Next.js, TypeScript, PostgreSQL, comunicación efectiva.",
        location: "Santiago, Chile",
        modality: "Híbrido",
        contractType: "Full-time",
        status: JobStatus.ACTIVE,
      },
    });
  }

  console.log("Seed ejecutado correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });