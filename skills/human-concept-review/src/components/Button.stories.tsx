import { Button } from "./Button.js";

export default {
  title: "Button",
  group: "Foundation",
};

export function Primary() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function Secondary() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="secondary" size="sm">Small</Button>
      <Button variant="secondary">Medium</Button>
      <Button variant="secondary" size="lg">Large</Button>
    </div>
  );
}

export function Ghost() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="ghost">Ghost button</Button>
      <Button variant="ghost" disabled>Disabled ghost</Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button disabled>Primary disabled</Button>
      <Button variant="secondary" disabled>Secondary disabled</Button>
    </div>
  );
}
