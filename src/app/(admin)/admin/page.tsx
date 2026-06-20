import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          System overview placeholders for the Tiwana Connect admin panel.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Members", "Events", "Funds"].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>Phase 0 placeholder</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {label} module will be implemented in a later phase.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
