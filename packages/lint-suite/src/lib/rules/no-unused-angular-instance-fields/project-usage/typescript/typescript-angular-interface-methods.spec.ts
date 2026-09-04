import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../utils/project-analysis-case.spec.util.ts';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const valueAccessorCase = projectValidCase(
  'accepts forms interface methods implemented for Angular to call',
  projectDirectory,
  'src/value-accessor.component.ts'
);

const valid = [valueAccessorCase];

projectTester.run(ruleName, rule, { valid, invalid: [] });
