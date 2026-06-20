import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  phase: string;
};

export function ModulePlaceholder({ title, phase }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {title} module will be implemented in {phase}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Professional placeholder for Phase 0.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {title} module will be implemented in {phase}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
