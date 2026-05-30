import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/auth";

import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getErrorMessage(error: string | undefined): string | null {
  if (!error) {
    return null;
  }

  switch (error) {
    case "validation":
      return "Verifica email y contrasena.";
    case "credentials":
      return "Credenciales invalidas.";
    default:
      return "No se pudo iniciar sesion.";
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const errorValue = params.error;
  const error = Array.isArray(errorValue) ? errorValue[0] : errorValue;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ingreso Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="admin@demo.com"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="admin123"
                autoComplete="current-password"
              />
            </div>
            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
            <Button type="submit">Iniciar sesion</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

