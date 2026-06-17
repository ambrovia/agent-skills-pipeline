import type { AnnotationTarget } from "./types.js";

interface ReactFiberNode {
  type: unknown;
  return: ReactFiberNode | null;
}

function buildElementDescriptor(node: Element): string {
  const tag = node.tagName.toLowerCase();
  const classes = Array.from(node.classList)
    .slice(0, 3)
    .map((c) => `.${c}`)
    .join("");
  const text = node.textContent?.trim() ?? "";
  const shortText = text.length > 0 && text.length <= 30 ? ` "${text}"` : "";
  return `${tag}${classes}${shortText}`;
}

export function resolveComponentTarget(node: Element): AnnotationTarget {
  const dsComponent =
    node
      .closest("[data-ds-component]")
      ?.getAttribute("data-ds-component") ?? null;

  let component: string | null = null;

  const fiberKey = Object.keys(node).find((k) =>
    k.startsWith("__reactFiber$"),
  );
  if (fiberKey) {
    let fiber: ReactFiberNode | null = (node as Record<string, unknown>)[
      fiberKey
    ] as ReactFiberNode;
    while (fiber) {
      if (typeof fiber.type === "function") {
        const type = fiber.type as { displayName?: string; name?: string };
        const name = type.displayName || type.name;
        if (name) {
          component = name;
          break;
        }
      }
      fiber = fiber.return;
    }
  }

  if (!component) {
    component = dsComponent;
  }
  if (!component) {
    component = "unknown";
  }

  const element = buildElementDescriptor(node);

  return { component, dsComponent, element };
}
