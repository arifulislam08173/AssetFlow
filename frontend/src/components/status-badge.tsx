import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Available: "bg-success/10 text-success border-success/20",
  Assigned: "bg-info/10 text-info border-info/20",
  Returned: "bg-muted text-muted-foreground border-border",
  "In Repair": "bg-warning/15 text-warning-foreground border-warning/30",
  Damaged: "bg-destructive/10 text-destructive border-destructive/20",
  Lost: "bg-destructive/15 text-destructive border-destructive/30",
  Disposed: "bg-muted text-muted-foreground border-border",
  Reserved: "bg-accent text-accent-foreground border-accent",
  "Pending Approval": "bg-warning/10 text-warning-foreground border-warning/20",
  Active: "bg-success/10 text-success border-success/20",
  Inactive: "bg-muted text-muted-foreground border-border",
  Resigned: "bg-warning/10 text-warning-foreground border-warning/20",
  Terminated: "bg-destructive/10 text-destructive border-destructive/20",
  Paid: "bg-success/10 text-success border-success/20",
  Partial: "bg-warning/10 text-warning-foreground border-warning/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  Open: "bg-info/10 text-info border-info/20",
  "Sent to Vendor": "bg-accent text-accent-foreground border-accent",
  "Under Repair": "bg-warning/15 text-warning-foreground border-warning/30",
  Repaired: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-muted text-muted-foreground border-border",
  Pending: "bg-warning/10 text-warning-foreground border-warning/20",
  "In Progress": "bg-info/10 text-info border-info/20",
  Cleared: "bg-success/10 text-success border-success/20",
  "N/A": "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", map[status] ?? "bg-muted text-muted-foreground", className)}>
      {status}
    </Badge>
  );
}