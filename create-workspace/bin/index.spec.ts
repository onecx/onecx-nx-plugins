/** @jest-environment node */
import { createWorkspace } from 'create-nx-workspace';
import { execFileSync } from 'child_process';
import { main } from './index';

jest.mock('create-nx-workspace', () => ({
  createWorkspace: jest
    .fn()
    .mockResolvedValue({ directory: '/generated/orders' }),
}));
jest.mock('child_process', () => ({ execFileSync: jest.fn() }));

describe('workspace prefix forwarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['angular', 'ngrx', 'standalone-ngrx', 'react'])(
    'forwards omitted, empty, legacy and custom prefixes to the %s preset',
    async (flavor) => {
      for (const [args, expected] of [
        [[], undefined],
        [['--appPrefix='], ''],
        [['--appPrefix', ''], ''],
        [['--appPrefix', 'onecx'], 'onecx'],
        [['--appPrefix=acme'], 'acme'],
      ] as const) {
        await main([flavor, 'orders', ...args, '--no-interactive']);
        const plugin = flavor === 'react' ? 'react' : 'angular';
        expect(createWorkspace).toHaveBeenLastCalledWith(
          expect.stringContaining(`@onecx/${plugin}-generator@`),
          expect.objectContaining({
            name: 'orders',
            flavor,
            interactive: false,
            'non-interactive': true,
            ...(expected !== undefined ? { appPrefix: expected } : {}),
          })
        );
        if (expected === undefined) {
          expect(
            jest.mocked(createWorkspace).mock.lastCall?.[1]
          ).not.toHaveProperty('appPrefix');
        }
        expect(execFileSync).toHaveBeenLastCalledWith(
          'npm',
          ['run', 'prepare'],
          { cwd: '/generated/orders', stdio: 'inherit' }
        );
      }
    }
  );

  it.each([
    ['ngrx', 'orders', '--appPrefix'],
    ['ngrx', 'orders', '--appPrefix', '--no-interactive'],
  ])('rejects a missing prefix value: %j', async (...args) => {
    await expect(main(args)).rejects.toThrow(
      'Please provide a value for --appPrefix'
    );
    expect(createWorkspace).not.toHaveBeenCalled();
  });
});
