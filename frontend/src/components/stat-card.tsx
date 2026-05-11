import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}

const tones: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "from-primary/16 to-primary/5 text-primary ring-primary/10",
  success: "from-success/16 to-success/5 text-success ring-success/10",
  warning: "from-warning/20 to-warning/5 text-warning-foreground ring-warning/15",
  destructive: "from-destructive/16 to-destructive/5 text-destructive ring-destructive/10",
  info: "from-info/16 to-info/5 text-info ring-info/10",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "default" }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/80 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 transition-transform duration-300 group-hover:scale-105", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
