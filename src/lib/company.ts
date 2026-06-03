import { prisma } from "@/lib/prisma/prisma";

type CompanyScopedUser = {
  companyId: string | null;
};

export async function getCompanyIdForUser(user: CompanyScopedUser): Promise<string> {
  if (user.companyId) {
    return user.companyId;
  }

  // MVP/demo fallback: no tratar como frontera de seguridad multiempresa.
  // Las acciones deben validar propiedad contra la entidad protegida.
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!company) {
    throw new Error("No company found. Run prisma seed first.");
  }

  return company.id;
}
