import { Term } from 'rdf-js'
import { AnyPointer, GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import $rdf from 'rdf-ext'
import { TRUE } from '../lib/rdf.js'
import { NodeExpression, nodeExpressions } from '../nodeExpressions.js'
import NodeShapeImpl, { NodeShape } from './NodeShape.js'
import * as target from './target/index.js'
import PS, { PropertyShape } from './PropertyShape.js'
import PVR, { PropertyValueRule } from './rule/PropertyValueRule.js'
import createConstraints from './constraint/factory.js'
import { Rule } from './rule/Rule.js'
import TripleRule from './rule/TripleRule.js'

interface TargetConstructor {
  new(...args: any[]): target.Target
}

export interface ModelFactory {
  nodeShape(pointer: GraphPointer): NodeShape
  targets(pointer: GraphPointer): target.Target[]
  propertyShape(pointer: GraphPointer): PropertyShape
  propertyRule(expression: GraphPointer, path: GraphPointer): PropertyValueRule
  tripleRule(rule: GraphPointer): Rule[]
  nodeExpression(pointer: AnyPointer): NodeExpression
}

export default class {
  nodeShape(pointer: GraphPointer): NodeShape {
    const properties = pointer
      .out(sh.property)
      .filter(p => !TRUE.equals(p.out(sh.deactivated).term))
      .map(x => this.propertyShape(x))

    const rules = pointer.out(sh.rule).toArray().flatMap(x => this.tripleRule(x))

    return new NodeShapeImpl(
      [...this.targets(pointer)],
      properties,
      [...createConstraints(pointer)],
      rules,
    )
  }

  targets(pointer: GraphPointer): target.Target[] {
    const targetMap = $rdf.termMap<Term, TargetConstructor>([
      [sh.targetNode, target.TargetNode],
      [sh.targetClass, target.TargetClass],
      [sh.targetSubjectsOf, target.TargetSubjectsOf],
      [sh.targetObjectsOf, target.TargetObjectsOf],
    ])

    const result: target.Target[] = []
    for (const [prop, Impl] of targetMap) {
      const nodes = pointer.out(prop)
      if (nodes.terms.length) {
        result.push(new Impl(nodes))
      }
    }

    return result
  }

  propertyShape(pointer: GraphPointer) {
    const path = pointer.out(sh.path)
    if (!isGraphPointer(path)) {
      throw new Error('Property Shape must have exactly one sh:path')
    }

    const rules = pointer.out(sh.values).map(x => this.propertyRule(x, path))
    if (rules.length && !isNamedNode(path)) {
      throw new Error('Rules can only be used with Predicate Path')
    }

    return new PS(path, {
      rules,
      constraints: [...createConstraints(pointer)],
    })
  }

  propertyRule(expression: GraphPointer, path: GraphPointer) {
    if (!isNamedNode(path)) {
      throw new Error('Property Shape with Property value rule must have an IRI path')
    }

    return new PVR(path.term, this.nodeExpression(expression))
  }

  tripleRule(rule: GraphPointer): Rule[] {
    if (TRUE.equals(rule.out(sh.deactivated).term)) {
      return []
    }

    const subject = rule.out(sh.subject)
    const predicate = rule.out(sh.predicate)
    const object = rule.out(sh.object)

    return [new TripleRule(
      this.nodeExpression(subject),
      this.nodeExpression(predicate),
      this.nodeExpression(object),
    )]
  }

  nodeExpression(pointer: AnyPointer): NodeExpression {
    if (!isGraphPointer(pointer)) {
      throw new Error('Expression must be a single RDF node')
    }

    const match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
    if (match) {
      return match.fromPointer(pointer, this)
    }

    throw new Error('Unsupported node expression')
  }
}
