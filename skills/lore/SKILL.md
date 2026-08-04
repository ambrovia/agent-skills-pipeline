---
name: lore
description: "Capture, scan, or index concise tribal knowledge about non-obvious cross-cutting decisions, constraints, workarounds, and gotchas. Use when rationale would otherwise be rediscovered; never use lore as a second requirements system."
argument-hint: "[file paths, 'scan' to find undocumented decisions, or 'index' to list all lore]"
persona: any
applies-to: [frontend, backend, application, framework, infra]
user-invocable: true
---

# Lore

Lore preserves non-obvious rationale close to affected code. It explains existing constraints; it does
not create requirements or duplicate architecture and project rules.

## Capture

For requested files, add `@lore` only when a cross-cutting decision, workaround, hazard, or trade-off
would otherwise be lost. Keep each annotation dated, tagged, and under six lines. Link to authoritative
detail instead of copying it. Replace superseded lore in place and remove contradictions. Do not annotate
obvious local behavior.

## Scan

Find candidate undocumented cross-cutting knowledge and present file/location, proposed annotation, and
evidence. Obtain user approval before modifying code.

## Index

List current lore by kind and location, including contradictions or stale entries. Do not edit.

Missing lore blocks a WP only when an approved non-obvious invariant would otherwise be lost after its
temporary artifacts leave active context.

## Target

$ARGUMENTS
