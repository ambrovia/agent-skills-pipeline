#!/usr/bin/env node

import { readFileSync } from 'node:fs';

export function extractTaskDag(source) {
  for (const match of source.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }
    if (parsed && parsed.technicalTaskDag) return parsed.technicalTaskDag;
  }
  throw new Error('architecture must contain a ```json block with technicalTaskDag');
}

function stringArray(value, field, errors) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${field} must be an array of non-empty strings`);
  }
}

export function validateTaskDag(dag) {
  const errors = [];
  if (!dag || typeof dag !== 'object' || Array.isArray(dag)) return ['technicalTaskDag must be an object'];
  if (dag.version !== 1) errors.push('version must be 1');
  if (!Array.isArray(dag.leaves) || dag.leaves.length === 0) return [...errors, 'leaves must be a non-empty array'];

  const ids = new Set();
  const owners = new Map();
  for (const [index, leaf] of dag.leaves.entries()) {
    const at = `leaves[${index}]`;
    if (!leaf || typeof leaf !== 'object' || Array.isArray(leaf)) {
      errors.push(`${at} must be an object`);
      continue;
    }
    if (typeof leaf.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(leaf.id)) {
      errors.push(`${at}.id must match ^[a-z][a-z0-9-]*$`);
    } else if (ids.has(leaf.id)) {
      errors.push(`duplicate leaf id: ${leaf.id}`);
    } else {
      ids.add(leaf.id);
    }
    if (typeof leaf.title !== 'string' || !leaf.title.trim()) errors.push(`${at}.title must be non-empty`);
    if (!['implementation', 'mechanical'].includes(leaf.kind)) errors.push(`${at}.kind must be implementation or mechanical`);
    stringArray(leaf.dependsOn, `${at}.dependsOn`, errors);
    stringArray(leaf.owns, `${at}.owns`, errors);
    stringArray(leaf.consumes, `${at}.consumes`, errors);
    stringArray(leaf.acceptanceCriteria, `${at}.acceptanceCriteria`, errors);
    if (typeof leaf.verify !== 'string' || !leaf.verify.trim()) errors.push(`${at}.verify must be non-empty`);
    if (typeof leaf.parallel !== 'boolean') errors.push(`${at}.parallel must be boolean`);
    if (leaf.parallel && (typeof leaf.independence !== 'string' || !leaf.independence.trim())) {
      errors.push(`${at}.independence is required when parallel is true`);
    }
    if (!leaf.context || typeof leaf.context !== 'object' || Array.isArray(leaf.context)) {
      errors.push(`${at}.context must be an object`);
    } else {
      stringArray(leaf.context.files, `${at}.context.files`, errors);
      stringArray(leaf.context.sections, `${at}.context.sections`, errors);
    }
    if (Array.isArray(leaf.owns)) {
      for (const surface of leaf.owns) {
        if (owners.has(surface)) errors.push(`surface ${surface} is owned by both ${owners.get(surface)} and ${leaf.id}`);
        else owners.set(surface, leaf.id);
      }
    }
  }

  const byId = new Map(dag.leaves.filter((leaf) => leaf && typeof leaf.id === 'string').map((leaf) => [leaf.id, leaf]));
  for (const leaf of dag.leaves) {
    if (!leaf || !Array.isArray(leaf.dependsOn)) continue;
    for (const dependency of leaf.dependsOn) {
      if (!byId.has(dependency)) errors.push(`${leaf.id} depends on unknown leaf ${dependency}`);
      if (dependency === leaf.id) errors.push(`${leaf.id} cannot depend on itself`);
    }
    if (Array.isArray(leaf.consumes)) {
      for (const surface of leaf.consumes) {
        const owner = owners.get(surface);
        if (owner && owner !== leaf.id && !leaf.dependsOn.includes(owner)) {
          errors.push(`${leaf.id} consumes ${surface} from ${owner} without depending on it`);
        }
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) {
      errors.push(`dependency cycle includes ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn || []) if (byId.has(dependency)) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return [...new Set(errors)];
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: validate-task-dag.mjs <architecture.md|dag.json>');
    process.exit(2);
  }
  try {
    const source = readFileSync(path, 'utf8');
    const parsed = path.endsWith('.json') ? JSON.parse(source) : extractTaskDag(source);
    const dag = parsed.technicalTaskDag || parsed;
    const errors = validateTaskDag(dag);
    if (errors.length) {
      for (const error of errors) console.error(`task-dag: ${error}`);
      process.exit(1);
    }
    console.log(`task-dag valid: ${dag.leaves.length} leaf/leaves`);
  } catch (error) {
    console.error(`task-dag: ${error.message}`);
    process.exit(1);
  }
}
