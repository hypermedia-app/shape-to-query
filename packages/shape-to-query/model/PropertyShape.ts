import { GraphPointer } from 'clownface'
import { fromNode, ShaclPropertyPath, toSparql } from 'clownface-shacl-path'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { flatten, ShapePatterns, union } from '../lib/shapePatterns'
import PathVisitor from '../lib/PathVisitor'
import { Rule } from './Rule'
import { ConstraintComponent } from './constraint/ConstraintComponent'
import type { NodeConstraintComponent } from './constraint/node'
import Shape, { BuildParameters } from './Shape'

interface Components {
  rules?: Rule[]

  constraints?: ConstraintComponent[]
}

export interface PropertyShape {
  buildPatterns(arg: BuildParameters): ShapePatterns
  buildConstraints(arg: BuildParameters): string | SparqlTemplateResult
}

export default class extends Shape implements PropertyShape {
  private readonly rules: ReadonlyArray<Rule>
  private readonly path: ShaclPropertyPath

  constructor(private readonly _path: GraphPointer, { rules = [], constraints = [] }: Components = {}) {
    super(constraints)
    this.rules = rules
    this.path = fromNode(_path)
  }

  buildPatterns({ focusNode, variable }: BuildParameters): ShapePatterns {
    const pathEnd = variable()
    const visitor = new PathVisitor(variable)
    let patterns: ShapePatterns
    if (this.rules.length) {
      const objectNode = variable()
      const rulePatterns = this.rules.map(r => r.buildPatterns({
        focusNode,
        objectNode,
      }))
      patterns = union(...rulePatterns)
    } else {
      patterns = visitor.visit(this.path, {
        pathStart: focusNode,
        pathEnd,
      })
    }

    const logical = this.buildLogicalConstraints({ focusNode, variable })
    patterns = flatten(patterns, logical)

    const deepPatterns = this.constraints
      .filter((c): c is NodeConstraintComponent => c.type.equals(sh.NodeConstraintComponent))
      .map((nodeConstraint): ShapePatterns => {
        const result = nodeConstraint.shape.buildPatterns({ focusNode: pathEnd, variable })

        return {
          constructClause: result.constructClause,
          whereClause: sparql`
            ${patterns.whereClause}
            ${result.whereClause}
          `,
        }
      })

    if (deepPatterns.length) {
      return union(patterns, ...deepPatterns)
    }

    return patterns
  }

  buildConstraints({ focusNode, variable }: BuildParameters): string | SparqlTemplateResult {
    if (!this.constraints.length) {
      return ''
    }

    const valueNode = variable()

    const propertyPath = toSparql(this._path)
    const constraints = this.constraints.map(c => c.buildPatterns({
      focusNode,
      valueNode,
      propertyPath,
      variable,
    })).filter(Boolean)

    if (constraints.length === 0) {
      return ''
    }

    return sparql`
      ${focusNode} ${propertyPath} ${valueNode} .
      ${constraints}
    `
  }
}
