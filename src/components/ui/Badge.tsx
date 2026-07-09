import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-slate-100 text-slate-700": variant === "default",
          "bg-green-100 text-green-700": variant === "success",
          "bg-yellow-100 text-yellow-700": variant === "warning",
          "bg-red-100 text-red-700": variant === "danger",
          "bg-blue-100 text-blue-700": variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    ACTIVE: "success",
    SENT: "success",
    QUEUED: "info",
    SENDING: "info",
    SCHEDULED: "info",
    CANCELLED: "default",
    FAILED: "danger",
    EXPIRED: "warning",
    DISABLED: "warning",
    DRAFT: "default",
    UNSUBSCRIBED: "default",
  };
  return <Badge variant={map[status] ?? "default"}>{status}</Badge>;
}
