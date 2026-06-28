interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 500,
    transition: "all 120ms ease",
  },
  primary: { background: "#2563eb", color: "#fff" },
  secondary: { background: "#e5e7eb", color: "#1a1a1a" },
  ghost: { background: "transparent", color: "#2563eb", border: "1px solid #2563eb" },
  sm: { padding: "6px 12px", fontSize: 13 },
  md: { padding: "8px 16px", fontSize: 14 },
  lg: { padding: "12px 24px", fontSize: 16 },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};

export function Button({ children, variant = "primary", size = "md", disabled, onClick }: ButtonProps) {
  return (
    <button
      style={{
        ...styles.base,
        ...styles[variant],
        ...styles[size],
        ...(disabled ? styles.disabled : {}),
      }}
      disabled={disabled}
      onClick={onClick}
      data-ds-component="Button"
    >
      {children}
    </button>
  );
}
