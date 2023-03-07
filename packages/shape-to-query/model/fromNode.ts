import { Term } from 'rdf-js'
import { GraphPointer, MultiPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isGraphPointer, isLiteral, isNamedNode } from 'is-graph-pointer'
import TermMap from '@rdfjs/term-map'
import { TRUE } from '../lib/rdf'
import NodeShapeImpl, { NodeShape } from './NodeShape'
import * as target from './target'
import PropertyShape from './PropertyShape'
import { PropertyValueRule } from './Rule'
import { FocusNodeExpression } from './nodeExpression/FocusNodeExpression'
import { ConstantTermExpression } from './nodeExpression/ConstantTermExpression'
import createConstraints from './constraint/factory'

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

function * targets(pointer: GraphPointer): Generator<target.Target> {
  const targetMap = new TermMap<Term, { new(ptr: MultiPointer): target.Target }>([
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

export function nodeExpression(pointer: GraphPointer) {
  if (pointer.term.equals(sh.this)) {
    return new FocusNodeExpression()
  }

  if (isLiteral(pointer) || isNamedNode(pointer)) {
    return new ConstantTermExpression(pointer.term)
  }

  throw new Error('Unsupported node expression')
}

export { nodeShape as fromNode }
