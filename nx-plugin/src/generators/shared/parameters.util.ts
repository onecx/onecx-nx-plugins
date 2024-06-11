import yargs = require('yargs');
import { prompt } from 'enquirer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = require('chalk');

const NON_INTERACTIVE_KEY = 'non-interactive';
interface NameValue {
  name: string;
  value: unknown;
}

interface ShowRule {
  key: string;
  showIf: (value: unknown) => boolean;
}
interface GeneratorParameterBasic {
  key: string;
  required: 'always' | 'interactive';
  default: unknown;
  prompt: string;
  showRules?: ShowRule[];
  showInSummary?: boolean;
  choices?: NameValue[];
}

interface GeneratorParameterInput extends GeneratorParameterBasic {
  type: 'boolean' | 'text' | 'number' ;
}

interface GeneratorParameterChoices extends GeneratorParameterBasic {
  type: 'select';
  choices: NameValue[];
}

export type GeneratorParameter =
  | GeneratorParameterInput
  | GeneratorParameterChoices;

/**
 * This method validates if parameters have been set through the command line interface.
 * If not, it checks whether they are required and if so, prompts the user for input.
 * If they are not required, the default values are used.
 * @returns dict with all parameters
 */
async function processParams(parameters: GeneratorParameter[]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { hideBin } = require('yargs/helpers');
  const argv = yargs(hideBin(process.argv)).argv;

  const parameterValues = {};
  const interactiveParameters: GeneratorParameter[] = [];

  for (const parameter of parameters) {
    if (argv[parameter.key] != null) {
      parameterValues[parameter.key] = argv[parameter.key];
    } else {
      if (
        parameter.required == 'always' ||
        (parameter.required == 'interactive' && !argv[NON_INTERACTIVE_KEY])
      ) {
        interactiveParameters.push(parameter);
      } else {
        parameterValues[parameter.key] = parameter.default;
      }
    }
  }

  let showSummary = false;
  for (const parameter of interactiveParameters) {
    // First filter interactive by rules
    if (parameter.showRules) {
      let show = true;
      for (const rule of parameter.showRules) {
        if (!rule.showIf(parameterValues[rule.key])) {
          show = false;
          return;
        }
      }
      if (!show) continue;
    }
    let result = {};
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
        message: parameter.prompt,
      });
    } else if (parameter.type == 'number') {
      result = await prompt({
        type: 'number',
        name: parameter.key,
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
      console.log(chalk.bold(' *** Summary ***'));
      for (const parameter of parameters) {
        if (!parameter.showInSummary) continue;
        console.log(
          chalk.bold(parameter.key) +
            ': ' +
            chalk.bgGray(parameterValues[parameter.key])
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

  return parameterValues;
}

export default processParams;
