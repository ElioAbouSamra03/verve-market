import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: ReactNode;
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink/60">{label}</p>
        {accent}
      </div>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
