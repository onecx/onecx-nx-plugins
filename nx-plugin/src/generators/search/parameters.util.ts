import yargs = require('yargs');
import { prompt } from 'enquirer';

interface NameValue {
  name: string;
  value: unknown;
}

interface GeneratorParameterBasic {
  key: string;
  type: 'boolean' | 'text' | 'number' | 'select';
  required: boolean;
  default: unknown;
  prompt: string;
  choices?: NameValue[];
}

interface GeneratorParameterChoices extends GeneratorParameterBasic {
  type: 'select';
  choices: NameValue[];
}

type GeneratorParameter = GeneratorParameterBasic | GeneratorParameterChoices;

const PARAMETERS: GeneratorParameter[] = [
  {
    key: 'generateFeatureAPI',
    type: 'boolean',
    required: true,
    default: true,
    prompt:
      'Do you want to generate API-Endpoints & Components for the search?',
  },
];

/**
 * This method validates if parameters have been set through the command line interface.
 * If not, it checks whether they are required and if so, prompts the user for input.
 * If they are not required, the default values are used.
 * @returns dict with all parameters
 */
async function processParams() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { hideBin } = require('yargs/helpers');
  const argv = yargs(hideBin(process.argv)).argv;

  const parameterValues = {};
  const missingRequired: GeneratorParameter[] = [];

  for (const parameter of PARAMETERS) {
    if (argv[parameter.key] != null) {
      parameterValues[parameter.key] = argv[parameter.key];
    } else {
      if (parameter.required) {
        missingRequired.push(parameter);
      } else {
        parameterValues[parameter.key] = parameter.default;
      }
    }
  }

  const prompts = [];

  for (const parameter of missingRequired) {
    if (parameter.type == 'boolean') {
      prompts.push({
        type: 'confirm',
        name: parameter.key,
        message: parameter.prompt,
      });
    } else if (parameter.type == 'text') {
      prompts.push({
        type: 'text',
        name: parameter.key,
        message: parameter.prompt,
      });
    } else if (parameter.type == 'number') {
      prompts.push({
        type: 'number',
        name: parameter.key,
        message: parameter.prompt,
      });
    } else if (parameter.type == 'select') {
      prompts.push({
        type: 'select',
        name: parameter.key,
        message: parameter.prompt,
        choices: parameter.choices,
      });
    }
  }

  const response = await prompt(prompts);
  return Object.assign(parameterValues, response);
}

export default processParams;
