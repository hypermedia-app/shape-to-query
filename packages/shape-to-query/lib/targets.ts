import { NamedNode, Variable } from 'rdf-js'
import TermMap from '@rdfjs/term-map'
import { sh } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { sparql } from '@tpluscode/sparql-builder'
import { ShapePatterns } from './types'
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
    constructClause: '',
    whereClause: VALUES(...targetNodes),
  }
}

function targetClass({ shape, focusNode, variable }: TargetArgs): TargetNodePatterns {
  const targetTypes = shape.out(sh.targetClass).terms

  if (targetTypes.length === 0) {
    return {}
  }

  if (targetTypes.length === 1) {
    const constructClause = sparql`${focusNode} a ${targetTypes.shift()} .`
    return {
      constructClause,
      whereClause: constructClause,
    }
  }

  const targetType = variable()
  const values = targetTypes.map((term) => ({ [targetType.value]: term }))
  const constructClause = sparql`${focusNode} a ${targetType} .`
  return {
    constructClause,
    whereClause: sparql`
      ${constructClause}
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
    const constructClause = sparql`${focusNode} ${properties.shift()} ${propObject} .`
    return {
      constructClause,
      whereClause: constructClause,
    }
  }

  const propVariable = variable()
  const values = properties.map(term => ({ [propVariable.value]: term }))
  const constructClause = sparql`${focusNode} ${propVariable} ${propObject} .`
  return {
    constructClause,
    whereClause: sparql`
      ${constructClause}
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
    const constructClause = sparql`${propSubject} ${properties.shift()} ${focusNode} .`
    return {
      constructClause,
      whereClause: constructClause,
    }
  }

  const propVariable = variable()
  const values = properties.map(term => ({ [propVariable.value]: term }))
  const constructClause = sparql`${propSubject} ${propVariable} ${focusNode} .`
  return {
    constructClause,
    whereClause: sparql`
      ${constructClause}
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
