# OneCX Nx Plugins

This is the repository for OneCX UI App Generator. It is build with [Nx](https://www.npmjs.com/package/nx).

Learn more about [Nx generators](https://nx.dev/plugin-features/use-code-generators).

## Steps to reproduce how this generator was created

```
npx create-nx-workspace
npm install @nx/plugin@latest
nx g @nx/plugin:plugin nx-plugin
nx generate @nx/plugin:generator angular --project nx-plugin
nx g create-package create-workspace --project nx-plugin --e2eProject ''
npx nx local-registry
npx nx run-many --targets publish --ver 1.0.0 --tag latest --skip-nx-cache
```


## Local Development

To use the created generator locally, you can use [Verdaccio](https://verdaccio.org/) which provides a local registry for npm packages. +
This is primarily useful for changes within the `create_workspace` subproject. If you have only made changes to the `nx-plugin`, copying the build result to the target directory `node_modules` (see below) is simpler and recommended.

### Setup a local Verdaccio Registry

Open a new terminal session and install and start the Verdaccio server within it.

To install & run Verdaccio in Docker use:
```
docker pull verdaccio/verdaccio
docker run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio
```

Alternatively, the package can also be installed using `npm -g`
```
npm install -g verdaccio
```

Start with
```
verdaccio
```

Now Verdaccio local registry is running, see in web-browser `http://localhost:4873/` - should be empty.

Then add a local user with: `npm adduser --registry http://localhost:4873/` and login.

Use `admin` as user name, enter password/email as you want. Onece done you are logged in and ready to publish something.

### Publish Packages to local Registry

It is recommended to modify the version of the package so it is easier for usage this version later on.

Navigate to the package you want to use (e.g. in `./dist/nx-plugin`) and change the `version` in the `package.json` temporarily to something like `0.0.X-local`.

Build the generator locally with:
```
npm run build
```

Next navigate to the created package (e.g. in `./dist/nx-plugin`) and publish it: 
```
npm publish --registry http://localhost:4873/ --tag latest
```

Go to your web-browser and open `http://localhost:4873/` to validate if your image is shown there, with correct version.

### Unpublish Packages to local Registry

To avoid a conflict when republishing, you must unpublish the package beforehand.

Execute from directory where the package is: 
```
npm unpublish --registry http://localhost:4873/
```

You will see in web browser that your local version is gone (may replaced by the latest version).


### Use a Package from local Registry

Use the locally registered package for a generator step.
Here the example for **create-workspace**, replace the placeholders accordingly:
```
npm_config_registry=https://localhost:4873 npx @onecx/create-workspace@<version-label> ngrx <workspace-name>
```

### Alternative: Install the package

Install the package in your local project with:
```
npm i @onecx/nx-plugin:0.0.X-local --registry http://localhost:4873
```
And then you can use it, for example, to generate a feature:
```
nx g @onecx/nx-plugin:feature <feature-name>
```

### Alternative: Copy into node_modules
Copy the build library into your local project `node_modules` folder:
```
npm run build && cp -r dist/nx-plugin/* ../path/to/test-project/node_modules/@onecx/nx-plugin
```


## Generator Options & Parameters
In order to add a new parameter / option to the generator you need to do the following:

First, you have to add the option to the `schema.d.ts` file.
Example:
```
export interface SearchGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  newOption: string;
}
```

Next, you need to add the option to the parameters in your generator, when calling `processParams(PARAMETERS)`:
```
{
    key: 'newOption',
    type: 'string',
    required: true,
    default: 'default_value',
    prompt: 'Please provide a name for the element:',
},
```

When using `type: 'select'` you need to specify `choices` as well.

Now you can access `options.newOption` in all generator methods.
The properties for the parameter are:
- `key`: needs to be identical with the key in `SearchGeneratorSchema`
- `type`: text, boolean, number and select are supported for now
- `required`: always: needs to provided via cli-parameter or interactive (no default used), interactive: in CLI either via cli-parameter or default used and asked in interactive
- `default`: a default value (if required == interactive and not provided via cli-parameter, default will be used), can be static value or callback provided with current values set
- `prompt`: if not provided via cli-parameter and required is true, this will be prompted to the user
- `showInSummary`: if set to true, the respective option will be shown in a summary and can be edited again if required
- `showRules`: if set to true, the respective option will only be shown if all provided rules apply (see more in the section about rules)

### Show Rules
For each option, you can define rules that configure if an option is displayed or not. Each option has two attributes:
- `showIf(values)`: a callback that needs to return whether the respective option should be shown or not. Values or all inputs that were provided before

All cli-parameters can be provided via `--<key> <value>`.

### `safeReplace` - Safe Content Replacement
The `safeReplace` function enables safe and controlled text replacements within files in an Nx workspace. It ensures that modifications are applied correctly, prevents unintended duplicate replacements, and logs failures when they occur.

#### Function Signature
```typescript
function safeReplace(
  goal: string,
  file: string,
  find: string | RegExp | (string | RegExp)[],
  replaceWith: string | string[],
  tree: Tree
): void;
```

#### Parameters

| Parameter    | Type                                      | Description                                                                 |
|--------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `goal`       | `string`                                  | A description of the purpose of the replacement (e.g. "Adapt feature reducer"). |
| `file`       | `string`                                  | The path to the file where replacements should be performed.                |
| `find`       | `string` \| `RegExp` \| (`string` \| `RegExp`)[] | The pattern(s) to search for (can be a string, regex, or an array of strings/regexes). |
| `replaceWith`| `string` \| `string[]`                    | The replacement string(s) (can be a single string or an array).             |
| `tree`       | `Tree`                                    | The Nx Tree object representing the file system.                            |

#### Example Usage
```typescript
safeReplace(
  "Adapt feature reducer",
  "src/app/example/example.reducers.ts",
  [/^/, ">({"],
  [
    "import { ExampleDetailsReducer } from './pages/example-details/example-details.reducers';",
    ">({
      details: ExampleDetailsReducer,"
  ],
  tree
);
```

#### Using Regular Expressions
find: [/^/] → This regex matches the beginning of the file, allowing you to prepend content.

find: [/somePattern/] → Searches for a specific pattern in the file content.