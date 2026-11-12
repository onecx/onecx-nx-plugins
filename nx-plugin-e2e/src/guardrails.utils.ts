import { execFileSync, spawnSync } from 'child_process';
import { rmSync, writeFileSync } from 'fs';
import { join } from 'path';

export function assertGeneratedGuardrails(directory: string) {
  expect(
    execFileSync('git', ['config', '--get', 'core.hooksPath'], {
      cwd: directory,
      encoding: 'utf8',
    }).trim()
  ).toBe('.husky/_');
  for (const script of ['lint', 'prettier']) {
    execFileSync('npm', ['run', script], {
      cwd: directory,
      stdio: 'inherit',
      env: process.env,
    });
  }

  const invalidStyle = join(directory, 'src/guardrail-invalid.css');
  writeFileSync(invalidStyle, 'a { color: #gggggg; }\n');
  try {
    const result = spawnSync('npm', ['run', 'lint'], {
      cwd: directory,
      encoding: 'utf8',
      env: process.env,
    });
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('color-no-invalid-hex');
  } finally {
    rmSync(invalidStyle);
  }
}
