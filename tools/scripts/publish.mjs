/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

import devkit from '@nx/devkit';
const { getOutputsForTargetAndConfiguration, readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// Executing publish script: node path/to/publish.mjs {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
const [, , name, version, tag = 'next'] = process.argv;

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
invariant(
  version && validVersion.test(version),
  `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`
);

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
);

// Collect the package names of all internal, publishable workspace libraries so
// their versions can be kept in lockstep when one depends on another
// (e.g. @onecx/angular-generator depends on @onecx/generator-utils).
const internalPackageNames = new Set();
for (const node of Object.values(graph.nodes)) {
  if (!node.data?.targets?.publish || !node.data?.root) {
    continue;
  }
  try {
    const pkg = JSON.parse(
      readFileSync(`${node.data.root}/package.json`).toString()
    );
    if (pkg.name) {
      internalPackageNames.add(pkg.name);
    }
  } catch {
  }
}

const outputPaths = getOutputsForTargetAndConfiguration(
  { project: name, target: 'build' },
  {},
  project
);
invariant(
  outputPaths.length === 1,
  `Expected one build output for publishable project "${name}", got ${outputPaths.length}.`
);

process.chdir(outputPaths[0]);

// Updating the version in "package.json" before publishing
try {
  const json = JSON.parse(readFileSync(`package.json`).toString());
  json.version = version;

  // Keep internal workspace dependencies pinned to the version being published
  for (const depType of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    if (!json[depType]) {
      continue;
    }
    for (const dep of Object.keys(json[depType])) {
      if (internalPackageNames.has(dep)) {
        json[depType][dep] = version;
      }
    }
  }

  writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading package.json file from library build output.`);
}

// Execute "npm publish" to publish
execSync(`npm publish --access public --tag ${tag}`);
