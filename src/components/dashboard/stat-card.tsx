import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: number;
  helper?: string;
};

export function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-zinc-900">{value}</p>
        {helper ? <p className="mt-1 text-sm text-zinc-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

