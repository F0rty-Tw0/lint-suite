import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../utils/project-analysis-case.spec.util.ts';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const baseClassCase = projectValidCase(
  'accepts a base-class field read only by a subclass in another file',
  projectDirectory,
  'src/read-by-subclass.base.component.ts'
);
const subclassTemplateCase = projectValidCase(
  'accepts a subclass member read by its own template',
  projectDirectory,
  'src/read-by-subclass.child.component.ts'
);

const valid = [baseClassCase, subclassTemplateCase];

projectTester.run(ruleName, rule, { valid, invalid: [] });
