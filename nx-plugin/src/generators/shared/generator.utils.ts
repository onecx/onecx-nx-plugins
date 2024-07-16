import { Tree } from '@nx/devkit';
import ora = require('ora');

export interface GeneratorStep<T> {
  process(tree: Tree, options: T): void;
  getTitle(): string;
}

export class GeneratorProcessor<T> {
  private steps: GeneratorStep<T>[] = [];

  addStep(step: GeneratorStep<T>) {
    this.steps.push(step);
  }

  async run(tree: Tree, options: T, ora?: ora.Ora) {
    for (const step of this.steps) {
      if (ora) {
        ora.text = step.getTitle();
      }
      step.process(tree, options);
    }
  }
}
