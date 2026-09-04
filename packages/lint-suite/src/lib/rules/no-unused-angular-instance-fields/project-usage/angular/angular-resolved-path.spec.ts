import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../utils/project-analysis-case.spec.util.ts';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const nestedChainCase = projectValidCase(
  'accepts a nested member chain resolved on the component type',
  projectDirectory,
  'src/external-template.component.ts'
);
const nestedPropertyChainCase = projectValidCase(
  'accepts a directive member resolved through a nested property chain',
  projectDirectory,
  'src/export-as.directive.ts'
);

const valid = [nestedChainCase, nestedPropertyChainCase];

projectTester.run(ruleName, rule, { valid, invalid: [] });
