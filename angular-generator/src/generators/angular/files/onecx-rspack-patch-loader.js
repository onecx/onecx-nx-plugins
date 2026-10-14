'use strict';
// OneCX Rspack patch-loader.
//
// This is the Rspack replacement for the modify-source-webpack-plugin
// ModifySourcePlugin/ReplaceOperation that the shell application uses to patch
// primeng at bundle time so module-federation remotes interoperate. The
// angular-generator previously declared modify-source-webpack-plugin as a
// devDependency but never wired it into any template, so generated apps shipped
// with zero real patch protection. This loader is appended to module.rules in
// rspack.config.js, so generated apps get real patch protection out of the box.
//
// Rspack runs loaders with a webpack-style rule: `test` selects the module and
// `use` names the loader. The replacement pairs below are the ones the shell
// ticket (Candidate A) applies to primeng.
function onecxRspackPatchLoader(source) {
  if (this && typeof this.cacheable === 'function') {
    this.cacheable(true);
  }
  let output = String(source);
  // Delegate primeng's DOM creation so remotes can intercept/patch it.
  output = output.replace(
    /document\.createElement\(/g,
    'document.createElementFromPrimeNg({"this": this, "arguments": Array.from(arguments)},'
  );
  // Neutralize primeng's style-name side effect.
  output = output.replace(/Theme\.setLoadedStyleName/g, '(function(_){})');
  return output;
}

// The module rule the generated rspack.config.js appends to `module.rules`.
// Rspack honors RegExp/string `test` (not a function `test`), so use a RegExp
// scoped to primeng module paths. The loader resolves to this file itself.
onecxRspackPatchLoader.getOneCXRspackPatchLoaderRule = function getOneCXRspackPatchLoaderRule() {
  return {
    test: /primeng/,
    use: [{ loader: require.resolve(__filename) }],
  };
};

module.exports = onecxRspackPatchLoader;
