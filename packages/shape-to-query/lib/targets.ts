import { NamedNode, Variable, BaseQuad } from 'rdf-js'
import TermMap from '@rdfjs/term-map'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { sparql } from '@tpluscode/sparql-builder'
import { quad } from '@rdfjs/data-model'
import { ShapePatterns } from './shapePatterns'
import { VariableSequence } from './variableSequence'

type TargetNodePatterns = ShapePatterns | Record<string, never>

interface TargetArgs {
  shape: GraphPointer
  focusNode: Variable
  variable: VariableSequence
}

interface Target {
  (arg: TargetArgs): TargetNodePatterns
}

function targetNode({ shape, focusNode: { value } }: TargetArgs): TargetNodePatterns {
  const targetNodes = shape.out(sh.targetNode).map(({ term }) => ({ [value]: term }))
  if (!targetNodes.length) {
    return {}
  }

  return {
    constructClause: [],
    whereClause: VALUES(...targetNodes),
  }
}

function targetClass({ shape, focusNode, variable }: TargetArgs): TargetNodePatterns {
  const targetTypes = shape.out(sh.targetClass).terms

  if (targetTypes.length === 0) {
    return {}
  }

  if (targetTypes.length === 1) {
    const typeQuad = quad<BaseQuad>(focusNode, rdf.type, targetTypes.shift())
    return {
      constructClause: [typeQuad],
      whereClause: sparql`${typeQuad}`,
    }
  }

  const targetType = variable()
  const values = targetTypes.map((term) => ({ [targetType.value]: term }))
  const typeQuad = quad(focusNode, rdf.type, targetType)
  return {
    constructClause: [typeQuad],
    whereClause: sparql`
      ${typeQuad}
      ${VALUES(...values)}
    `,
  }
}

function targetSubjectsOf({ shape, focusNode, variable }: TargetArgs): TargetNodePatterns {
  const properties = shape.out(sh.targetSubjectsOf).terms

  if (!properties.length) {
    return {}
  }

  const propObject = variable()
  if (properties.length === 1) {
    const patternQuad = quad<BaseQuad>(focusNode, properties.shift(), propObject)
    return {
      constructClause: [patternQuad],
      whereClause: sparql`${patternQuad}`,
    }
  }

  const propVariable = variable()
  const values = properties.map(term => ({ [propVariable.value]: term }))
  const propPatternQuad = quad<BaseQuad>(focusNode, propVariable, propObject)
  return {
    constructClause: [propPatternQuad],
    whereClause: sparql`
      ${propPatternQuad}
      ${VALUES(...values)}
    `,
  }
}
function targetObjectsOf({ shape, focusNode, variable }: TargetArgs): TargetNodePatterns {
  const properties = shape.out(sh.targetObjectsOf).terms

  if (!properties.length) {
    return {}
  }

  const propSubject = variable()
  if (properties.length === 1) {
    const patternQuad = quad<BaseQuad>(propSubject, properties.shift(), focusNode)
    return {
      constructClause: [patternQuad],
      whereClause: sparql`${patternQuad}`,
    }
  }

  const propVariable = variable()
  const values = properties.map(term => ({ [propVariable.value]: term }))
  const patternQuad = quad<BaseQuad>(propSubject, propVariable, focusNode)
  return {
    constructClause: [patternQuad],
    whereClause: sparql`
      ${patternQuad}
      ${VALUES(...values)}
    `,
  }
}

export default new TermMap<NamedNode, Target>([
  [sh.targetNode, targetNode],
  [sh.targetClass, targetClass],
  [sh.targetSubjectsOf, targetSubjectsOf],
  [sh.targetObjectsOf, targetObjectsOf],
])
