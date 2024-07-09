import { Tree } from '@nx/devkit';
import ora = require('ora');

export interface GeneratorStep<T> {
  process(tree: Tree, options: T): void;
  getName(): string;
}

export class GeneratorProcessor<T> {
  private steps: GeneratorStep<T>[] = [];

  addStep(step: GeneratorStep<T>) {
    this.steps.push(step);
  }

  run(tree: Tree, options: T, ora?: ora.Ora) {
    for (const step of this.steps) {
      if (ora) {
        ora.start(step.getName());
      }
      step.process(tree, options);      
    }
  }
}
