'use strict';
/**
 * OneCX Rspack patch-loader.
 *
 * Rspack replacement for the `modify-source-webpack-plugin` ModifySourcePlugin/
 * ReplaceOperation the shell application uses to patch primeng at bundle time so
 * module-federation remotes interoperate. The angular-generator previously
 * declared `modify-source-webpack-plugin` as a devDependency but never wired it
 * into any template, so generated apps shipped with zero real patch protection.
 * This loader is appended to `module.rules` in rspack.config.js, so generated
 * apps get that real patch-plugin protection out of the box.
 *
 * Rspack runs loaders with a webpack-style rule: `test` selects the module and
 * `use` names the loader. The replacement pairs below are the ones the shell
 * ticket (Candidate A) applies to primeng.
 *
 * The `document.createElement` rewrite forwards primeng's *original* element arguments to the
 * `document.createElementFromPrimeNg` hook (a plain renamed call: `document.createElement(tag,
 * opts)` becomes `document.createElementFromPrimeNg(tag, opts)`). It must not synthesize a
 * context object (`{this, arguments}`) because primeng modules are strict-mode ESM, where a
 * bare top-level `arguments` throws a ReferenceError and a `this`/`arguments` inside a method
 * captures the enclosing scope, not the `createElement` arguments. The generated app ships a
 * default `document.createElementFromPrimeNg` (see `src/polyfills.ts`) that delegates the
 * forwarded arguments back to the native `document.createElement`; a shell host embedding this
 * remote overrides that global to intercept primeng's DOM creation.
 *
 * @param {string} source
 * @returns {string}
 */
function onecxPatchLoader(source) {
  if (this && typeof this.cacheable === 'function') {
    this.cacheable(true);
  }
  let output = String(source);
  // Delegate primeng's DOM creation so remotes can intercept/patch it.
  output = output.replace(
    /document\.createElement\(/g,
    'document.createElementFromPrimeNg('
  );
  // Neutralize primeng's style-name side effect.
  output = output.replace(/Theme\.setLoadedStyleName/g, '(function(_){})');
  return output;
}

// The module rule the generated rspack.config.js appends to `module.rules`.
// Rspack honors RegExp/string `test` (not a function `test`), so use a RegExp
// scoped to primeng module paths. The loader resolves to this file itself.
onecxPatchLoader.getOneCXRspackPatchLoaderRule = function getOneCXRspackPatchLoaderRule() {
  return {
    test: /primeng/,
    use: [{ loader: require.resolve(__filename) }],
  };
};

module.exports = onecxPatchLoader;
