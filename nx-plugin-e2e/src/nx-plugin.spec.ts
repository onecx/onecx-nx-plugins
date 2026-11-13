import { execSync, ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { createRequire } from 'module';
import { createTestProject } from './test-project.utils';

const NON_INTERACTIVE_KEY = 'non-interactive';
const projectName = 'test-project';
const featureName = 'test-feature';
const featureNameCustom = 'test-custom-feature';
const resourceName = 'TestResource';

describe('nx-plugin', () => {
  let projectDirectory: string;
  const option: ExecSyncOptionsWithBufferEncoding = {
    stdio: 'inherit',
    env: process.env,
  };

  beforeAll(() => {
    projectDirectory = createTestProject('ngrx', projectName);

    const project = JSON.parse(
      readFileSync(join(projectDirectory, 'project.json'), 'utf-8')
    );
    expect(project.targets.build.executor).toBe('@nx/rspack:rspack');
    expect(project.targets.serve.executor).toBe('@nx/rspack:dev-server');
    expect(existsSync(join(projectDirectory, 'webpack.config.js'))).toBe(false);
    const installedGenerator = JSON.parse(
      readFileSync(
        join(
          projectDirectory,
          'node_modules/@onecx/angular-generator/package.json'
        ),
        'utf-8'
      )
    );
    expect(installedGenerator.name).toBe('@onecx/angular-generator');
    expect(installedGenerator.version).toBe('0.0.0-e2e');
  });

  afterAll(() => {
    // Cleanup the test project
    // rmSync(projectDirectory, {
    //   recursive: true,
    //   force: true,
    // });
    return;
    //Delete files to make it easier to compare with original
    rmSync(join(projectDirectory, 'node_modules'), {
      recursive: true,
      force: true,
    });
    rmSync(join(projectDirectory, 'dist'), {
      recursive: true,
      force: true,
    });
    rmSync(join(projectDirectory, '.angular'), {
      recursive: true,
      force: true,
    });
    rmSync(join(projectDirectory, '.nx'), {
      recursive: true,
      force: true,
    });
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls @onecx/angular-generator', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
    execSync(`nx run build --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    const project = JSON.parse(
      readFileSync(join(projectDirectory, 'project.json'), 'utf-8')
    );
    const outputDirectory = join(
      projectDirectory,
      project.targets.build.options.outputPath
    );
    const styleFiles = readdirSync(outputDirectory).filter((file) =>
      /^styles(?:\.[^.]+)?\.css$/.test(file)
    );
    expect(styleFiles.length).toBeGreaterThan(0);
    const styles = styleFiles
      .map((file) => readFileSync(join(outputDirectory, file), 'utf-8'))
      .join('\n');
    expect(styles).toMatch(/\.grid\s*\{/);
    expect(styles).toMatch(/\.pi-check:before\s*\{/);

    execSync(`nx run test --skip-nx-cache`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  it('should build the remote and expose Module Federation', () => {
    // The generated app builds with the Rspack build target and, because its rspack config
    // wires the ModuleFederationPlugin, the production build must emit the remote entry.
    const tcOption = { ...option, cwd: projectDirectory };
    execSync(`nx run build --skip-nx-cache`, tcOption);
    expect(
      existsSync(join(projectDirectory, 'dist', projectName, 'remoteEntry.js'))
    ).toBe(true);
  });

  it('should extract i18n messages', () => {
    // The generated extract-i18n target (kept on @angular/build:extract-i18n) must run and
    // write a translation bundle. The default output is `messages.xlf` at the app root.
    const tcOption = { ...option, cwd: projectDirectory };
    execSync(`nx run extract-i18n --skip-nx-cache`, tcOption);
    const xlfFile = join(projectDirectory, 'messages.xlf');
    expect(existsSync(xlfFile)).toBe(true);
    // A successful run writes a non-empty serialized XLIFF bundle.
    expect(readFileSync(xlfFile, 'utf-8').length).toBeGreaterThan(0);
  });

  it('should generate a Rspack-based build/serve setup', () => {
    // The generated app must build/serve with the Rspack executors instead of webpack.
    expect(existsSync(join(projectDirectory, 'rspack.config.js'))).toBe(true);
    expect(existsSync(join(projectDirectory, 'onecx-patch.loader.js'))).toBe(
      true
    );

    const project = JSON.parse(
      readFileSync(join(projectDirectory, 'project.json'), 'utf-8')
    );
    expect(project.targets.build.executor).toBe('@nx/rspack:rspack');
    expect(project.targets.build.options.rspackConfig).toBe('rspack.config.js');
    expect(project.targets.serve.executor).toBe('@nx/rspack:dev-server');
    expect(project.targets.serve.options.buildTarget).toBe(
      'test-project:build'
    );
    // The i18n extraction keeps its existing executor.
    expect(project.targets['extract-i18n'].executor).toBe(
      '@angular/build:extract-i18n'
    );

    // The rspack config must wire the OneCX patch-loader into module.rules (not a no-op).
    const rspackConfig = readFileSync(
      join(projectDirectory, 'rspack.config.js'),
      'utf-8'
    );
    expect(rspackConfig).toContain('@module-federation/enhanced/rspack');
    expect(rspackConfig).toContain("require('./onecx-patch.loader.js')");
    expect(rspackConfig).toContain('getOneCXRspackPatchLoaderRule');

    // Execute the generated patch-loader to prove it provides real protection (the
    // "bug fixed" DoD): it must rewrite primeng's runtime DOM creation into a call to the
    // `document.createElementFromPrimeNg` host hook, forwarding the ORIGINAL element
    // arguments. It must not synthesize a context object (`{this, arguments}`) because primeng
    // modules are strict-mode ESM, where a bare top-level `arguments` throws a ReferenceError
    // and `this`/`arguments` inside a method capture the enclosing scope, not the
    // `createElement` arguments. If the loader were a no-op the patched output would equal the
    // raw source and these assertions would fail.
    const patchLoader = createRequire(
      join(projectDirectory, 'onecx-patch.loader.js')
    )(join(projectDirectory, 'onecx-patch.loader.js'));
    const primengSource =
      'const el = document.createElement("div"); Theme.setLoadedStyleName("x");';
    const patched = patchLoader(primengSource);
    expect(patched).toContain('document.createElementFromPrimeNg("div")');
    expect(patched).toContain('(function(_){})');
    expect(patched).not.toContain('document.createElement("div")');
    expect(patched).not.toContain('Theme.setLoadedStyleName');
    expect(patched).not.toContain('Array.from(arguments)');
    // The rewritten modules call `document.createElementFromPrimeNg`, which must exist in a
    // freshly generated app or serving it crashes (the host is not present when the app runs
    // standalone). The generated polyfills ship a default that delegates back to the native
    // `document.createElement`, so the hook resolves and a shell host can still override it.
    const polyfills = readFileSync(
      join(projectDirectory, 'src', 'polyfills.ts'),
      'utf-8'
    );
    expect(polyfills).toContain('createElementFromPrimeNg');
  });

  beforeEach(() => {
    console.log('########################################################');
  });

  describe('use presettings', () => {
    it('should add a feature', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a feature ###########################');
      console.log(tcOption);

      execSync(
        `nx generate @onecx/angular-generator:feature ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache`, tcOption);
    });

    it('should add a search page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a search page #######################');

      execSync(
        `nx generate @onecx/angular-generator:search ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache`, tcOption);
    });

    it('should add a details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'editMode', value: 'true' },
        { key: 'allowDelete', value: 'true' },
      ]);
      console.log('### ==> should add a details page #######################');

      execSync(
        `nx generate @onecx/angular-generator:details ${featureName} --resource=${resourceName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a create-update dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log(
        '### ==> should add a create-update dialog #######################'
      );

      execSync(
        `nx generate @onecx/angular-generator:create-update ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a delete dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([]);
      console.log('### ==> should add a delete dialog #######################');

      execSync(
        `nx generate @onecx/angular-generator:delete ${featureName} --resource=${resourceName} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add an empty ngrx-page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        {
          key: 'pageName',
          value: 'Test',
        },
        {
          key: 'pageTitle',
          value: 'Page Title',
        },
      ]);
      console.log(
        '### ==> should add an empty ngrx-page #######################'
      );

      execSync(
        `nx generate @onecx/angular-generator:ngrx-page ${featureName} ${parameterString}`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
    });
  });

  describe('use custom names instead presettings', () => {
    it('should add a custom named feature', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
      ]);
      console.log('### ==> should add a custom named feature ################');

      execSync(
        `nx generate @onecx/angular-generator:feature ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache`, tcOption);
    });

    it('should add a custom named search page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'searchRequestName', value: 'CustomDataObjectSearchRequest' },
        { key: 'searchResponseName', value: 'CustomDataObjectSearchResponse' },
      ]);
      console.log('### ==> should add a custom named search page ############');

      execSync(
        `nx generate @onecx/angular-generator:search ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a custom named details page', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'editMode', value: 'true' },
        { key: 'allowDelete', value: 'true' },
        { key: 'updateRequestName', value: 'CustomDataObjectUpdateRequest' },
        { key: 'updateResponseName', value: 'CustomDataObjectUpdateResponse' },
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'getResponseName', value: 'CustomDataObjectGetResponse' },
      ]);
      console.log('### ==> should add a custom named details page ###########');

      execSync(
        `nx generate @onecx/angular-generator:details ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a custom named create-update dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'createRequestName', value: 'CustomDataObjectCreateRequest' },
        { key: 'createResponseName', value: 'CustomDataObjectCreateResponse' },
        { key: 'updateRequestName', value: 'CustomDataObjectUpdateRequest' },
        { key: 'updateResponseName', value: 'CustomDataObjectUpdateResponse' },
      ]);
      console.log('### ==> should add a custom named create-update dialog ##');

      execSync(
        `nx generate @onecx/angular-generator:create-update ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });

    it('should add a custom named delete dialog', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'resource', value: 'CustomDataObject' },
        { key: 'deleteRequestName', value: 'CustomDataObjectDeleteRequest' },
        { key: 'deleteResponseName', value: 'CustomDataObjectDeleteResponse' },
      ]);
      console.log('### ==> should add a custom named delete dialog ##########');

      execSync(
        `nx generate @onecx/angular-generator:delete ${featureNameCustom} ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });
  });

  describe('extras', () => {
    it('should add pre commit validation', () => {
      const tcOption = { ...option, cwd: projectDirectory };
      const parameterString = getParameterAsString([
        { key: 'enableEslint', value: true },
        { key: 'enableConventionalCommits', value: true },
        { key: 'enableDetectSecrets', value: true },
      ]);
      console.log('### ==> should add pre commit validation #################');

      execSync(
        `nx generate @onecx/angular-generator:pre-commit-validation ${parameterString} --verbose`,
        tcOption
      );
      execSync(`nx run build --skip-nx-cache`, tcOption);
      execSync(`nx run test --skip-nx-cache --coverage`, tcOption);
    });
  });
});

/**
 * Creates a string of CLI parameters from the given array of key-value pairs, adding a non-interactive parameter to ensure the generators run without blocking for user input.
 * @param parameters Array of key-value pairs representing CLI parameters
 * @returns A string of CLI parameters
 */
function getParameterAsString(parameters: { key: string; value: unknown }[]) {
  // As tests are non-interactive, not-added but required items will block the test
  const nonInteractiveParameter = {
    key: NON_INTERACTIVE_KEY,
    value: true,
  };
  return [nonInteractiveParameter, ...parameters]
    .map((o) => `--${o.key} ${o.value}`)
    .join(' ');
}
