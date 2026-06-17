import { Button } from "./Button.js";
import { Card } from "./Card.js";

export default {
  title: "Card",
  group: "Foundation",
  uses: ["Button"],
};

export function Default() {
  return <Card title="Simple card" description="A card with just text content." />;
}

export function WithAction() {
  return (
    <Card title="Confirm action" description="Are you sure you want to proceed?">
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm">Confirm</Button>
        <Button variant="ghost" size="sm">Cancel</Button>
      </div>
    </Card>
  );
}

export function Elevated() {
  return (
    <Card title="Elevated card" description="This card has a shadow." elevated />
  );
}
