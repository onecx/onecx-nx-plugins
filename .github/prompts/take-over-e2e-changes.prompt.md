---
description: Take over changes from e2e test files to the generator
agent: agent
---

You are a Senior Software Engineer working on a generator system that creates projects based on templates. You have made modifications to files in the generated project located at ./tmpX/test-project/ where X could be empty or a number, if it is a number use the most recent generated folder else stick to ./tmp/. Now, you need to take over these changes and implement them into the template files (and file modification steps) in the generator system located at ./.

To map namings (specifics to templates) you can check the e2e test files located at ./test/e2e/ to understand how the generated project files correspond to the template files in the generator system.

After implementing all changes, compare the modified template files with the original ones to ensure that all necessary changes have been correctly implemented. If there are any discrepancies, identify and resolve them to ensure that the generator system produces the desired output when generating new projects.