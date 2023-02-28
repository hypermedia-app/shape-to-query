import { NamedNode, Variable } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import $rdf from 'rdf-ext'
import { fromNode } from 'clownface-shacl-path'
import { isNamedNode } from 'is-graph-pointer'
import PathVisitor from './PathVisitor'
import { createVariableSequence, VariableSequence } from './variableSequence'
import { emptyPatterns, merge, ShapePatterns, toUnion, unique } from './shapePatterns'
import targets from './targets'
import { getNodeExpressionPatterns } from './nodeExpressions'
import { getConstraints } from './constraints'

const TRUE = $rdf.literal('true', xsd.boolean)

export interface Options {
  subjectVariable?: string
  objectVariablePrefix?: string
}

export type FocusNode = NamedNode | Variable

interface PropertyShapePatterns {
  shape: GraphPointer
  focusNode: FocusNode
  parentPatterns?: ShapePatterns
}

export class NodeShapeProcessor {
  private readonly visitor: PathVisitor
  public readonly variable: VariableSequence

  constructor(options: Options) {
    this.variable = createVariableSequence(options.objectVariablePrefix || 'resource')

    this.visitor = new PathVisitor(this.variable)
  }

  getPatterns(shape: GraphPointer, focusNode: FocusNode): ShapePatterns {
    let target: ShapePatterns = {
      constructClause: [],
      whereClause: '',
    }

    if (focusNode.termType === 'Variable') {
      const result = this.targetPatterns(shape, focusNode)
      if (result) {
        if ('termType' in result) {
          focusNode = result
        } else if (result) {
          target = result
        }
      }
    }
    const constraints = getConstraints({
      focusNode,
      shape,
      processor: this,
    })

    const resourcePatterns = []
    for (const propertyPatterns of this.deepPropertyShapePatterns({
      shape,
      focusNode,
    })) {
      resourcePatterns.push(propertyPatterns)
    }

    const constructClause = unique(
      target.constructClause,
      constraints.constructClause,
      ...resourcePatterns.map(p => p.constructClause),
    )

    return {
      constructClause,
      whereClause: sparql`
        ${target.whereClause}
        ${constraints.whereClause}
        ${toUnion(resourcePatterns)}
      `,
    }
  }

  private targetPatterns(shape: GraphPointer, focusNode: Variable): ShapePatterns | NamedNode | null {
    const targetPatternMap = [...targets].map(([term, target]) => [term, target({
      shape, focusNode, variable: this.variable,
    })]).filter((arg): arg is [NamedNode, ShapePatterns] => {
      return 'whereClause' in arg[1]
    })

    if (targetPatternMap.length === 0) {
      return null
    }

    if (targetPatternMap.length === 1) {
      const targetNode = shape.out(sh.targetNode)
      if (isNamedNode(targetNode)) {
        return targetNode.term
      }

      return targetPatternMap.shift()[1]
    }

    const targetPatterns = targetPatternMap.map(([, p]) => p)
    const constructClause = targetPatterns
      .flatMap(({ constructClause }) => constructClause)
    const whereClause = sparql`${toUnion(targetPatterns)}`
    return {
      constructClause,
      whereClause,
    }
  }

  private * deepPropertyShapePatterns({ shape, focusNode, parentPatterns = emptyPatterns }: PropertyShapePatterns): Generator<ShapePatterns> {
    const activeProperties = shape.out(sh.property)
      .filter(propShape => !propShape.has(sh.deactivated, TRUE).term)
      .toArray()

    for (const propertyShape of activeProperties) {
      const pathEnd = this.variable()
      const nodeExpression = propertyShape.out(sh.values)
      let patterns: ShapePatterns
      if (nodeExpression.terms.length) {
        patterns = getNodeExpressionPatterns({
          focusNode,
          variable: this.variable,
          shape: propertyShape,
          pathEnd,
        })
      } else {
        const path = propertyShape.out(sh.path)
        patterns = this.visitor.visit(fromNode(path), {
          pathStart: focusNode,
          pathEnd,
        })
      }

      const constraints = getConstraints({
        focusNode,
        shape: propertyShape,
        processor: this,
      })
      const combinedPatterns = merge(parentPatterns, patterns, constraints)

      yield combinedPatterns

      const shNodes = propertyShape.out(sh.node).toArray()
      for (const shNode of shNodes) {
        const deepPatterns = this.deepPropertyShapePatterns({
          shape: shNode,
          focusNode: pathEnd,
          parentPatterns: combinedPatterns,
        })
        for (const deepPattern of deepPatterns) {
          yield deepPattern
        }
      }
    }
  }
}
