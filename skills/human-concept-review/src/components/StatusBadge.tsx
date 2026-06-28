interface StatusBadgeProps {
  status: "active" | "pending" | "error" | "done";
  label?: string;
}

const colors: Record<string, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#166534" },
  pending: { bg: "#fef3c7", text: "#92400e" },
  error: { bg: "#fce4e4", text: "#991b1b" },
  done: { bg: "#e0e7ff", text: "#3730a3" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const c = colors[status] ?? colors.active;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "system-ui, sans-serif",
        background: c.bg,
        color: c.text,
      }}
      data-ds-component="StatusBadge"
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text }} />
      {label ?? status}
    </span>
  );
}
