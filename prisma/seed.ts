import bcrypt from "bcryptjs";
import { PrismaClient, JobStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

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
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
