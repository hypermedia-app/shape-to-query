import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import $rdf from 'rdf-ext'
import { TRUE } from '../lib/rdf.js'
import NodeShapeImpl, { NodeShape } from './NodeShape.js'
import * as target from './target/index.js'
import PropertyShape from './PropertyShape.js'
import { PropertyValueRule } from './Rule.js'
import { fromNode as nodeExpression } from './nodeExpression/index.js'
import createConstraints from './constraint/factory.js'

function nodeShape(pointer: GraphPointer): NodeShape {
  const properties = pointer
    .out(sh.property)
    .filter(p => !TRUE.equals(p.out(sh.deactivated).term))
    .map(propertyShape)

  return new NodeShapeImpl(
    [...targets(pointer)],
    properties,
    [...createConstraints(pointer)],
  )
}

interface TargetConstructor {
  new(...args: any[]): target.Target
}

function * targets(pointer: GraphPointer): Generator<target.Target> {
  const targetMap = $rdf.termMap<Term, TargetConstructor>([
    [sh.targetNode, target.TargetNode],
    [sh.targetClass, target.TargetClass],
    [sh.targetSubjectsOf, target.TargetSubjectsOf],
    [sh.targetObjectsOf, target.TargetObjectsOf],
  ])

  for (const [prop, Impl] of targetMap) {
    const nodes = pointer.out(prop)
    if (nodes.terms.length) {
      yield new Impl(nodes)
    }
  }
}

export function propertyShape(pointer: GraphPointer) {
  const path = pointer.out(sh.path)
  if (!isGraphPointer(path)) {
    throw new Error('Property Shape must have exactly one sh:path')
  }

  const rules = pointer.out(sh.values).map(propertyRule(path))
  if (rules.length && !isNamedNode(path)) {
    throw new Error('Rules can only be used with Predicate Path')
  }

  return new PropertyShape(path, {
    rules,
    constraints: [...createConstraints(pointer)],
  })
}

function propertyRule(path: GraphPointer) {
  return (expression: GraphPointer) => {
    if (!isNamedNode(path)) {
      throw new Error('Property Shape with Property value rule must have an IRI path')
    }

    return new PropertyValueRule(path.term, nodeExpression(expression))
  }
}

export { nodeShape as fromNode }
