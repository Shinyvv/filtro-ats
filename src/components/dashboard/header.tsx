import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  userName: string;
  onLogout: (formData: FormData) => Promise<void>;
};

export function DashboardHeader({
  userName,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <div>
        <p className="text-sm text-zinc-500">Sesion activa</p>
        <p className="text-base font-semibold text-zinc-900">{userName}</p>
      </div>
      <form action={onLogout}>
        <Button type="submit" variant="outline">
          Cerrar sesion
        </Button>
      </form>
    </header>
  );
}

