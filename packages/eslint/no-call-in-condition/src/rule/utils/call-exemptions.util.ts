import { ASTUtils, TSESTree } from '@typescript-eslint/utils';
import type {
  ParserServicesWithTypeInformation,
  TSESLint
} from '@typescript-eslint/utils';
import type { Signature } from 'typescript';

import { calleeName } from './condition-calls.util.ts';
import type { CallExemptions } from '../common/no-call-in-condition.type.ts';

const PREDICATE_HOLDERS = [
  TSESTree.AST_NODE_TYPES.ArrowFunctionExpression,
  TSESTree.AST_NODE_TYPES.FunctionDeclaration,
  TSESTree.AST_NODE_TYPES.FunctionExpression,
  TSESTree.AST_NODE_TYPES.TSDeclareFunction
] as const;

const isPredicateHolder = ASTUtils.isNodeOfTypes(PREDICATE_HOLDERS);

const hasPredicateReturn = (node: TSESTree.Node): boolean => {
  if (!isPredicateHolder(node)) return false;

  const returned = node.returnType?.typeAnnotation.type;

  return returned === TSESTree.AST_NODE_TYPES.TSTypePredicate;
};

const declaredFunction = (
  definition: TSESLint.Scope.Definition
): TSESTree.Node | undefined => {
  const { node } = definition;

  if (node.type !== TSESTree.AST_NODE_TYPES.VariableDeclarator) return node;

  return node.init ?? undefined;
};

const isThisSignalRead = (call: TSESTree.CallExpression): boolean => {
  if (call.arguments.length > 0) return false;

  const { callee } = call;

  if (callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression) return false;

  if (callee.computed) return false;

  return callee.object.type === TSESTree.AST_NODE_TYPES.ThisExpression;
};

const isScopePredicate = (
  callee: TSESTree.Node,
  scope: TSESLint.Scope.Scope
): boolean => {
  if (callee.type !== TSESTree.AST_NODE_TYPES.Identifier) return false;

  const variable = ASTUtils.findVariable(scope, callee);
  const definition = variable?.defs.at(0);

  if (!definition) return false;

  const declaration = declaredFunction(definition);

  if (!declaration) return false;

  return hasPredicateReturn(declaration);
};

const isCheckerPredicate = (
  callee: TSESTree.Expression,
  services: ParserServicesWithTypeInformation
): boolean => {
  const checker = services.program.getTypeChecker();
  const calleeType = services.getTypeAtLocation(callee);
  const signatures = calleeType.getCallSignatures();
  const isPredicateSignature = (signature: Signature): boolean => {
    const predicate = checker.getTypePredicateOfSignature(signature);

    return predicate !== undefined;
  };

  return signatures.some(isPredicateSignature);
};

const isAllowedName = (
  callee: TSESTree.Expression,
  allowed: RegExp[]
): boolean => {
  const name = calleeName(callee);

  if (name === undefined) return false;

  return allowed.some((pattern) => pattern.test(name));
};

export const isExemptCall = (
  call: TSESTree.CallExpression,
  exemptions: CallExemptions
): boolean => {
  const isSignalRead = isThisSignalRead(call);

  if (isSignalRead) return true;

  const { allowed, scope, services } = exemptions;
  const { callee } = call;
  const isDeclaredPredicate = isScopePredicate(callee, scope);

  if (isDeclaredPredicate) return true;

  if (services) return isCheckerPredicate(callee, services);

  return isAllowedName(callee, allowed);
};
