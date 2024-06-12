import yargs = require('yargs');
import { prompt } from 'enquirer';
import * as pc from 'picocolors';

// eslint-disable-next-line @typescript-eslint/no-var-requires

const NON_INTERACTIVE_KEY = 'non-interactive';
interface NameValue {
  name: string;
  value?: unknown;
}

interface ShowRule<T> {
  showIf: (values: T) => boolean;
}
interface GeneratorParameterBasic<T> {
  key: string;
  required: 'always' | 'interactive';
  default:
    | string
    | number
    | boolean
    | ((values: T) => string | number | boolean);
  initial?:
    | string
    | number
    | boolean
    | ((values: T) => string | number | boolean);
  prompt: string;
  showRules?: ShowRule<T>[];
  showInSummary?: boolean;
  choices?: NameValue[];
}

interface GeneratorParameterInput<T> extends GeneratorParameterBasic<T> {
  type: 'boolean' | 'text' | 'number';
}

interface GeneratorParameterChoices<T> extends GeneratorParameterBasic<T> {
  type: 'select';
  choices: NameValue[];
}

export type GeneratorParameter<T> =
  | GeneratorParameterInput<T>
  | GeneratorParameterChoices<T>;

/**
 * This method validates if parameters have been set through the command line interface.
 * If not, it checks whether they are required and if so, prompts the user for input.
 * If they are not required, the default values are used.
 * @returns dict with all parameters
 */
async function processParams<T>(
  parameters: GeneratorParameter<T>[],
  options: T
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { hideBin } = require('yargs/helpers');
  const argv = yargs(hideBin(process.argv)).argv;

  const parameterValues = Object.assign({}, options);
  const interactiveParameters: GeneratorParameter<T>[] = [];

  for (const parameter of parameters) {
    // Prefill with defaults
    if (typeof parameter.default == 'function') {
      parameterValues[parameter.key] = parameter.default(parameterValues);
    } else {
      parameterValues[parameter.key] = parameter.default;
    }
    // Check if provided by either CLI or continue with interactive
    if (argv[parameter.key] != null) {
      parameterValues[parameter.key] = argv[parameter.key];
    } else {
      if (
        parameter.required == 'always' ||
        (parameter.required == 'interactive' && !argv[NON_INTERACTIVE_KEY])
      ) {
        interactiveParameters.push(parameter);
      }
    }
  }

  let showSummary = false;
  for (const parameter of interactiveParameters) {
    // First filter interactive by rules
    if (parameter.showRules) {
      let show = true;
      for (const rule of parameter.showRules) {
        if (!rule.showIf(parameterValues)) {
          show = false;
          break;
        }
      }
      if (!show) continue;
    }
    let result = {};
    const defaultValue = parameterValues[parameter.key];
    if (parameter.type == 'boolean') {
      result = await prompt({
        type: 'confirm',
        name: parameter.key,
        message: parameter.prompt,
      });
    } else if (parameter.type == 'text') {
      result = await prompt({
        type: 'text',
        name: parameter.key,
        initial: defaultValue,
        message: parameter.prompt,
      });
    } else if (parameter.type == 'number') {
      result = await prompt({
        type: 'number',
        name: parameter.key,
        initial: defaultValue,
        message: parameter.prompt,
      });
    } else if (parameter.type == 'select') {
      result = await prompt({
        type: 'select',
        name: parameter.key,
        message: parameter.prompt,
        choices: parameter.choices,
      });
    }
    Object.assign(parameterValues, result);
    showSummary = showSummary || parameter.showInSummary;
  }

  if (showSummary) {
    let inputsFinal = false;
    while (!inputsFinal) {
      console.log(pc.bold(' *** Summary ***'));
      for (const parameter of parameters) {
        if (!parameter.showInSummary) continue;
        console.log(
          pc.bold(parameter.key) +
            ': ' +
            parameterValues[parameter.key]
        );
      }

      const confirm = await prompt({
        type: 'confirm',
        name: 'adapt',
        message: 'Do you need to adapt your inputs?',
      });
      if (!confirm['adapt']) {
        inputsFinal = false;
        break;
      }

      const result = await prompt({
        type: 'form',
        name: 'data',
        message: 'Edit your input:',
        choices: parameters
          .filter((p) => p.showInSummary)
          .map((p) => ({
            name: p.key,
            message: p.prompt,
            initial: parameterValues[p.key],
          })),
      });
      Object.assign(parameterValues, result['data']);
    }
  }

  return parameterValues as T;
}

export default processParams;
