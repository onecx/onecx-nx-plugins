#!/usr/bin/env node

import { createWorkspace } from 'create-nx-workspace';

async function main() {
  const flavor = process.argv[2]; // TODO: use libraries like yargs or enquirer to set your workspace name
  if (!flavor) {
    throw new Error('Please provide a flavor for the workspace');
  }
  const name = process.argv[3]; // TODO: use libraries like yargs or enquirer to set your workspace name
  if (!name) {
    throw new Error('Please provide a name for the workspace');
  }

  console.log(`Creating the workspace: ${name}`);

  // This assumes "@onecx/nx-plugin" and "create-workspace" are at the same version
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const presetVersion = require('../package.json').version;

  await createWorkspace(`@myonecx/nx-plugin@${presetVersion}`, {
    flavor,
    name,
    nxCloud: 'skip',
    packageManager: 'npm',
    verbose: true,
  });

  console.log(`Successfully created the workspace.`);
}

main();
