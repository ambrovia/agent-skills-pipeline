interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  elevated?: boolean;
}

export function Card({ title, description, children, elevated }: CardProps) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        border: "1px solid #e0e0e0",
        background: elevated ? "#fff" : "#fafafa",
        boxShadow: elevated ? "0 2px 8px rgba(0,0,0,.06)" : "none",
        maxWidth: 360,
      }}
      data-ds-component="Card"
    >
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
      {description && (
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#666" }}>{description}</p>
      )}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}
