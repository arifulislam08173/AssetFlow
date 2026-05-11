import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function DataTableShell({ toolbar, children, footer }: { toolbar?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/85 shadow-[var(--shadow-card)] backdrop-blur-xl">
      {toolbar && <div className="border-b border-border/60 bg-muted/25 p-4">{toolbar}</div>}
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="border-t border-border/60 bg-muted/25 p-3">{footer}</div>}
    </Card>
  );
}
