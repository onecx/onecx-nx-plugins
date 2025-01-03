import { Tree } from '@nx/devkit';
import ora = require('ora');

export interface GeneratorStepError {
  error: string;
  stopExecution: boolean;
}

export interface GeneratorStep<T> {
  process(tree: Tree, options: T): void | GeneratorStepError;
  getTitle(): string;
}

export class GeneratorProcessor<T> {
  private steps: GeneratorStep<T>[] = [];
  private errors: GeneratorStepError[] = [];

  addStep(step: GeneratorStep<T>) {
    this.steps.push(step);
  }

  async run(tree: Tree, options: T, ora?: ora.Ora, printErrors = false) {
    this.errors = [];
    for (const step of this.steps) {
      if (ora) {
        ora.text = step.getTitle();
      }
      let res = step.process(tree, options);
      if (res && (res as GeneratorStepError).error !== undefined) {
        let gsf = res as GeneratorStepError;
        this.errors.push(gsf);
        if (gsf.stopExecution) {
          break;
        }
      }
    }
    if (this.errors.length > 0 && printErrors) {
      this.printErrors(ora);
    }
  }

  getErrors(): GeneratorStepError[] {
    return this.errors;
  }

  hasStoppedExecution(): boolean {
    return this.errors.find((e) => e.stopExecution)?.stopExecution;
  }

  printErrors(ora?: ora.Ora) {
    if (ora) {
      ora.fail('Some errors occurred during generation:');
    } else {
      console.error('Some errors occurred during generation:');
    }
    this.errors.forEach((e) => {
      console.error(e.error);
    });
  }

  static async runBatch<T>(
    tree: Tree,
    options: T,
    steps: GeneratorStep<T>[],
    ora?: ora.Ora,
    printErrors = false
  ): Promise<GeneratorProcessor<T>> {
    let genProc = new GeneratorProcessor();
    steps.forEach((s) => genProc.addStep(s));
    await genProc.run(tree, options, ora, printErrors);
    return genProc;
  }
}
