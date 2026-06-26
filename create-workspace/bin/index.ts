#!/usr/bin/env node

import { createWorkspace } from 'create-nx-workspace';
import { readFileSync, existsSync } from 'fs';

const SUPPORTED_FLAVORS = ['angular', 'react', 'ngrx', 'standalone-ngrx'];

const PLUGIN_MAP: Record<string, string> = {
  react: '@onecx/react-generator',
};

function resolvePlugin(flavor: string): string {
  return PLUGIN_MAP[flavor] ?? '@onecx/nx-plugin';
}

async function main() {
  const flavor = process.argv[2]; // TODO: use libraries like yargs or enquirer to set your workspace name
  if (!flavor) {
    throw new Error('Please provide a flavor for the workspace.');
  }
  if (!SUPPORTED_FLAVORS.includes(flavor)) {
    throw new Error(
      `Unknown flavor "${flavor}". Supported flavors: ${SUPPORTED_FLAVORS.join(
        ', '
      )}`
    );
  }
  const name = process.argv[3]; // TODO: use libraries like yargs or enquirer to set your workspace name
  if (!name) {
    throw new Error('Please provide a name for the workspace.');
  }

  const plugin = resolvePlugin(flavor);

  console.log(`Creating the workspace ${name} with the ${flavor} preset`);

  // This assumes the preset package and "create-workspace" are at the same version
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const presetVersion = require('../package.json').version;

  await createWorkspace(`${plugin}@${presetVersion}`, {
    flavor,
    name,
    nxCloud: 'skip',
    packageManager: 'npm',
    interactive: false,
    verbose: true,
  });

  console.log(
    `Successfully created the workspace ${name} with the ${flavor} preset`
  );
}

main().catch((e) => {
  console.error(e.message);

  const logFileMatch = (e.message as string).match(/Log file:\s*(\S+)/);
  if (logFileMatch) {
    const logPath = logFileMatch[1];
    if (existsSync(logPath)) {
      console.error('\n── Error details ─────────────────────────────');
      console.error(readFileSync(logPath, 'utf-8'));
      console.error('──────────────────────────────────────────────');
    }
  }

  process.exit(1);
});
