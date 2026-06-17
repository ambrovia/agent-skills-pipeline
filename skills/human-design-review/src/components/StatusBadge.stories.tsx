import { StatusBadge } from "./StatusBadge.js";

export default {
  title: "StatusBadge",
  group: "Primitives",
};

export function AllStatuses() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <StatusBadge status="active" />
      <StatusBadge status="pending" />
      <StatusBadge status="error" />
      <StatusBadge status="done" />
    </div>
  );
}

export function CustomLabels() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <StatusBadge status="active" label="Online" />
      <StatusBadge status="pending" label="In review" />
      <StatusBadge status="error" label="Failed" />
      <StatusBadge status="done" label="Shipped" />
    </div>
  );
}
