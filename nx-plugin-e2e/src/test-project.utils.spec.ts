import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { assertGeneratedGuardrails } from './guardrails.utils';
import { createTestProject } from './test-project.utils';

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('./guardrails.utils', () => ({
  assertGeneratedGuardrails: jest.fn(),
}));
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  tmpdir: jest.fn(),
}));

describe('createTestProject', () => {
  let directory: string;
  const originalWorkingDir = process.env.WORKING_DIR;

  beforeEach(() => {
    directory = mkdtempSync(
      join(jest.requireActual<typeof import('os')>('os').tmpdir(), 'onecx-e2e-')
    );
    jest.mocked(tmpdir).mockReturnValue(directory);
    jest.mocked(execSync).mockReturnValue(Buffer.alloc(0));
  });

  afterEach(() => {
    if (originalWorkingDir === undefined) {
      delete process.env.WORKING_DIR;
    } else {
      process.env.WORKING_DIR = originalWorkingDir;
    }
    jest.clearAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  it.each([false, true])(
    'isolates repeated runs without deleting existing projects (WORKING_DIR: %s)',
    (useWorkingDir) => {
      const baseDirectory = useWorkingDir
        ? join(directory, 'custom', 'nested')
        : directory;
      if (useWorkingDir) {
        process.env.WORKING_DIR = baseDirectory;
      } else {
        delete process.env.WORKING_DIR;
      }
      const outputDirectory = join(baseDirectory, 'nx-plugin-out');
      const oldProject = join(outputDirectory, 'test-project');
      mkdirSync(oldProject, { recursive: true });
      writeFileSync(join(oldProject, 'keep.txt'), 'existing project');

      const firstProject = createTestProject('ngrx', 'test-project');
      mkdirSync(firstProject);
      writeFileSync(join(firstProject, 'keep.txt'), 'first run');
      const secondProject = createTestProject('ngrx', 'test-project');

      expect(secondProject).not.toBe(firstProject);
      for (const project of [firstProject, secondProject]) {
        expect(dirname(dirname(project))).toBe(outputDirectory);
        expect(existsSync(dirname(project))).toBe(true);
        expect(execSync).toHaveBeenCalledWith(
          'npx --yes @onecx/create-workspace@e2e ngrx test-project --nxCloud skip --no-interactive --verbose',
          {
            cwd: dirname(project),
            stdio: 'inherit',
            env: process.env,
          }
        );
        expect(assertGeneratedGuardrails).toHaveBeenCalledWith(project);
      }
      expect(readFileSync(join(oldProject, 'keep.txt'), 'utf8')).toBe(
        'existing project'
      );
      expect(readFileSync(join(firstProject, 'keep.txt'), 'utf8')).toBe(
        'first run'
      );
    }
  );

  it('propagates workspace creation failures', () => {
    process.env.WORKING_DIR = directory;
    jest.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('workspace creation failed');
    });

    expect(() => createTestProject('ngrx', 'test-project')).toThrow(
      'workspace creation failed'
    );
    expect(assertGeneratedGuardrails).not.toHaveBeenCalled();
  });
});
