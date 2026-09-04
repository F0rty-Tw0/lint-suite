import { fixtureDirectory } from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';
import { projectValidCase } from '../utils/project-analysis-case.spec.util.js';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const unionTypeCase = projectValidCase(
  'accepts a member read through a union of two component types',
  projectDirectory,
  'src/read-through-union.component.ts'
);
const literalKeyCase = projectValidCase(
  'accepts fields read by a literal and a literal-union element access key',
  projectDirectory,
  'src/read-by-element-access.component.ts'
);

const valid = [unionTypeCase, literalKeyCase];

projectTester.run(ruleName, rule, { valid, invalid: [] });
