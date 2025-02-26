import { Tree } from "@nx/devkit";
import { GeneratorStepError } from "./generator.utils";

interface ReplacementResult {
  success: boolean;
  errors?: string[];
  content?: string;
}

function performReplacements(
  content: string,
  find: string | RegExp | (string | RegExp)[],
  replaceWith: string | string[]
): ReplacementResult {
  let allReplacementsSuccessful = true;
  const replacementErrors: string[] = [];
  let newContent = content;

  const findArray = Array.isArray(find) ? find : [find];
  const replaceWithArray = Array.isArray(replaceWith) ? replaceWith : [replaceWith];

  if (findArray.length !== replaceWithArray.length) {
    throw new GeneratorStepError(
      `The length of 'find' and 'replaceWith' must be the same`
    );
  }

  for (let i = 0; i < findArray.length; i++) {
    const currentFind = findArray[i];
    const currentReplaceWith = replaceWithArray[i];

    try {
      if (typeof currentFind === 'string' || currentFind instanceof RegExp) {
        if (newContent.includes(currentReplaceWith)) {
          throw new GeneratorStepError(`Text already exists in the document: ${currentReplaceWith}`);
        }

        if (typeof currentFind === 'string' && !newContent.includes(currentFind)) {
          throw new GeneratorStepError(`Pattern not found: ${currentFind}`);
        }

        if (currentFind instanceof RegExp && !currentFind.test(newContent)) {
          throw new GeneratorStepError(`Pattern not found: ${currentFind}`);
        }

        newContent = newContent.replace(currentFind, currentReplaceWith);
      } else {
        throw new GeneratorStepError(
          `Unsupported type for 'find': ${typeof currentFind}`
        );
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
  if (!content) {
    throw new GeneratorStepError(`File is empty: ${file}`);
  }

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

    console.error(`Some replacements failed in file: ${file}`);
    console.error(`Errors: ${result.errors!.join('\n')}`);
  }
}