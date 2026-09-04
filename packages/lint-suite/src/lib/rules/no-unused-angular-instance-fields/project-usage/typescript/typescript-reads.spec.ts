import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase,
  projectValidCase
} from '../utils/project-analysis-case.spec.util.ts';

const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);
const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const propertyAccessCase = projectValidCase(
  'accepts a field read by a property access in another project file',
  projectUsageDirectory,
  'project-property.component.ts'
);
const elementAccessCase = projectValidCase(
  'accepts a field read by an element access in another project file',
  projectUsageDirectory,
  'project-element.component.ts'
);

const projectUsageValid = [propertyAccessCase, elementAccessCase];

projectUsageTester.run(ruleName, rule, {
  valid: projectUsageValid,
  invalid: []
});

const optionalChainingCase = projectValidCase(
  'accepts members read through optional chaining and a non-null assertion',
  projectDirectory,
  'src/optional-chaining.component.ts'
);
const valueAccessorCase = projectValidCase(
  'accepts forms interface methods implemented for Angular to call',
  projectDirectory,
  'src/value-accessor.component.ts'
);

const projectValid = [optionalChainingCase, valueAccessorCase];

const assignedError = memberError('unusedField', 'assigned');
const writtenElsewhereCase = projectInvalidCase(
  'reports a field only assigned from another project file',
  projectDirectory,
  'src/written-elsewhere.component.ts',
  [assignedError]
);

const viaAnyError = memberError('unusedField', 'viaAny');
const anyCastCase = projectInvalidCase(
  'reports a field reached only through an any cast',
  projectDirectory,
  'src/any-cast.component.ts',
  [viaAnyError]
);

const projectInvalid = [writtenElsewhereCase, anyCastCase];

projectTester.run(ruleName, rule, {
  valid: projectValid,
  invalid: projectInvalid
});
