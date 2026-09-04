type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-sand text-ink/70",
  success: "bg-moss-100 text-moss-900",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-ember/10 text-ember",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

/** Stock-specific badge so every product table renders the same thresholds. */
export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge tone="danger">Out of stock</Badge>;
  if (stock <= 5) return <Badge tone="warning">Low stock · {stock}</Badge>;
  return <Badge tone="success">{stock} in stock</Badge>;
}
