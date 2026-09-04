import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-sand/40 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-moss-500">{icon}</div>}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-ink/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
