# Onecx

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace has been generated by [Nx, a Smart, fast and extensible build system.](https://nx.dev)** ✨

## Generate code

If you happen to use Nx plugins, you can leverage code generators that might come with it.

Run `nx list` to get a list of available plugins and whether they have generators. Then run `nx list <plugin-name>` to see what generators are available.

Learn more about [Nx generators on the docs](https://nx.dev/plugin-features/use-code-generators).

## Running tasks

To execute tasks with Nx use the following syntax:

```
nx <target> <project> <...options>
```

You can also run multiple targets:

```
nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

Targets can be defined in the `package.json` or `projects.json`. Learn more [in the docs](https://nx.dev/core-features/run-tasks).

## Want better Editor Integration?

Have a look at the [Nx Console extensions](https://nx.dev/nx-console). It provides autocomplete support, a UI for exploring and running tasks & generators, and more! Available for VSCode, IntelliJ and comes with a LSP for Vim users.

## Ready to deploy?

Just run `nx build demoapp` to build the application. The build artifacts will be stored in the `dist/` directory, ready to be deployed.

## Set up CI!

Nx comes with local caching already built-in (check your `nx.json`). On CI you might want to go a step further.

- [Set up remote caching](https://nx.dev/core-features/share-your-cache)
- [Set up task distribution across multiple machines](https://nx.dev/nx-cloud/features/distribute-task-execution)
- [Learn more how to setup CI](https://nx.dev/recipes/ci)

## Connect with us!

- [Join the community](https://nx.dev/community)
- [Subscribe to the Nx Youtube Channel](https://www.youtube.com/@nxdevtools)
- [Follow us on Twitter](https://twitter.com/nxdevtools)


## Steps to reproduce how this generator was created

npx create-nx-workspace
npm install @nx/plugin@latest
nx g @nx/plugin:plugin nx-plugin

nx generate @nx/plugin:generator angular --project nx-plugin

nx g create-package create-workspace --project nx-plugin --e2eProject ''

npx nx local-registry

npx nx run-many --targets publish --ver 1.0.0 --tag latest --skip-nx-cache


## Local Development
To locally use a build generator you can use [Verdaccio](https://verdaccio.org/).

### Setup Verdaccio
To install & run Verdaccio in docker use:
```
docker pull verdaccio/verdaccio
docker run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio
```

Then add a local user to it: `npm adduser --registry http://localhost:4873/`

### Publish local library
First we need to modify to version in order to use our local version later on.
Navigate to `nx-plugin/package.json` and change `version` temporarily to something like `0.0.X-local`.
Now we have to build the plugin `npm run build`.

Next navigate to `/dist/nx-plugin/` and publish it: `npm publish --registry http://localhost:4873/`

Go to your web-browser and open `http://localhost:4873/` to validate if your image is shown there.

### Use local library
Now you can install the package in your local test project:
`npm i @onecx/nx-plugin:0.0.X-local --registry http://localhost:4873`
And then use it to, e.g. generate a feature:
```
nx g @onecx/nx-plugin:feature <feature_name>
```



## Generator Parameters / Options
In order to add a new parameter / option to the generator you need to do the following:

First, you have to add the option to the `schema.d.ts` file.
Example:
```
export interface SearchGeneratorSchema {
  featureName: string;
  generateFeatureAPI: boolean;
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
- `default`: a default value (if required == interactive and not provided via cli-parameter, default will be used)
- `prompt`: if not provided via cli-parameter and required is true, this will be prompted to the user 

All cli-parameters can be provided via `--<key> <value>`.