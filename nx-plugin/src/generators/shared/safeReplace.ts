import { Tree } from '@nx/devkit';
import { GeneratorStepError } from './generator.utils';

interface ReplacementResult {
  success: boolean;
  errors?: string[];
  content?: string;
}

/**
 * Performs replacements in a given string content based on the provided patterns and replacements.
 *
 * @param content - The original content in which replacements will be performed.
 * @param find - The pattern(s) to search for. Can be a string, regex, or an array of strings/regexes.
 * @param replaceWith - The replacement string(s) for the pattern(s). Can be a string or an array of strings.
 * @returns A `ReplacementResult` object containing the success status, errors (if any), and the modified content.
 */
function performReplacements(
  content: string,
  find: string | RegExp | (string | RegExp)[],
  replaceWith: string | string[]
): ReplacementResult {
  let allReplacementsSuccessful = true;
  const replacementErrors: string[] = [];
  let newContent = content;

  const findArray = Array.isArray(find) ? find : [find];
  const replaceWithArray = Array.isArray(replaceWith)
    ? replaceWith
    : [replaceWith];

  for (let i = 0; i < findArray.length; i++) {
    const currentFind = findArray[i];
    const currentReplaceWith = replaceWithArray[i];

    try {
      if (typeof currentFind === 'string' || currentFind instanceof RegExp) {
        if (newContent.includes(currentReplaceWith)) {
          replacementErrors.push(
            `Text already exists in the document: ${currentReplaceWith}`
          );
        }

        if (
          typeof currentFind === 'string' &&
          !newContent.includes(currentFind)
        ) {
          replacementErrors.push(
            `Pattern not found: ${currentFind}. Attempted to replace with: ${currentReplaceWith}`
          );
        }

        if (currentFind instanceof RegExp && !currentFind.test(newContent)) {
          replacementErrors.push(
            `Pattern not found: ${currentFind}. Attempted to replace with: ${currentReplaceWith}`
          );
        }

        newContent = newContent.replace(currentFind, currentReplaceWith);
      }
    } catch (error) {
      allReplacementsSuccessful = false;
      replacementErrors.push(error.message);
    }
  }

  return {
    success: allReplacementsSuccessful,
    errors: replacementErrors.length > 0 ? replacementErrors : undefined,
    content: newContent,
  };
}

/**
 * Safely performs replacements in a file within an Nx workspace.
 * If replacements fail, it appends detailed error messages to the file and logs the errors to the console.
 *
 * @param goal - A description of the goal of the replacement (e.g., "Add new feature X").
 * @param file - The path to the file in which replacements should be performed.
 * @param find - The pattern(s) to search for. Can be a string, regex, or an array of strings/regexes.
 * @param replaceWith - The replacement string(s) for the pattern(s). Can be a string or an array of strings.
 * @param tree - The Nx `Tree` object representing the file system.
 * @throws {GeneratorStepError} If the file does not exist.
 */
export function safeReplace(
  goal: string,
  file: string,
  find: string | RegExp | (string | RegExp)[],
  replaceWith: string | string[],
  tree: Tree
): void {
  if (!tree.exists(file)) {
    throw new GeneratorStepError(`File not found: ${file}`);
  }

  const content = tree.read(file, 'utf8');

  const result = performReplacements(content, find, replaceWith);

  if (result.success) {
    tree.write(file, result.content!);
  } else {
    const comment = `// Generator Failure occurred!
// The goal of the generation was to: ${goal}
//
// The following replacements failed:
${result.errors!.map((error) => `// ${error}`).join('\n')}
//
// Please perform the replacements manually.
`;

    const newContent = `${comment}\n${result.content}`;
    tree.write(file, newContent);

    console.error(
      `Error: Some replacements could not be completed. Review the file for more information: ${file}`
    );
    console.error(`Errors: ${result.errors!.join('\n')}`);
  }
}
