import { ReactNode } from "react";

/** Shared table chrome for every admin list screen — keeps column padding,
 *  borders, and hover states consistent without a heavyweight data-grid
 *  dependency (this project intentionally has no new UI library deps). */
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-card">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-sand/50 text-xs uppercase tracking-wide text-ink/50">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminTh({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

export function AdminTd({
  children,
  className = "",
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td className={`px-4 py-3 align-middle text-ink ${className}`} title={title}>
      {children}
    </td>
  );
}

export function AdminTr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-line last:border-0 hover:bg-sand/30">{children}</tr>;
}
