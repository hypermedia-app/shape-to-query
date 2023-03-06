import { GraphPointer } from 'clownface'
import { fromNode, ShaclPropertyPath, toSparql } from 'clownface-shacl-path'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { ShapePatterns, union } from '../lib/shapePatterns'
import { FocusNode } from '../lib/FocusNode'
import { VariableSequence } from '../lib/variableSequence'
import PathVisitor from '../lib/PathVisitor'
import { Rule } from './Rule'
import { ConstraintComponent } from './constraint/ConstraintComponent'
import { NodeConstraintComponent } from './constraint/node'

interface Components {
  rules?: Rule[]

  constraints?: ConstraintComponent[]
}

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
}

export interface PropertyShape {
  buildPatterns(arg: Parameters): ShapePatterns
  buildConstraints(arg: Parameters): SparqlTemplateResult
}

export default class implements PropertyShape {
  private readonly rules: ReadonlyArray<Rule>
  private readonly constraints: ReadonlyArray<ConstraintComponent>
  private readonly path: ShaclPropertyPath

  constructor(private readonly _path: GraphPointer, { rules = [], constraints = [] }: Components = {}) {
    this.rules = rules
    this.constraints = constraints
    this.path = fromNode(_path)
  }

  buildPatterns({ focusNode, variable }: Parameters): ShapePatterns {
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

    const deepPatterns = this.constraints
      .filter((c): c is NodeConstraintComponent => c instanceof NodeConstraintComponent)
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

  buildConstraints({ focusNode, variable }: Parameters): SparqlTemplateResult {
    if (!this.constraints.length) {
      return sparql``
    }

    const valueNode = variable()

    const propertyPath = toSparql(this._path)
    const constraints = this.constraints.map(c => c.buildPatterns({
      focusNode,
      valueNode,
      propertyPath,
      variable,
    }))

    return sparql`
      ${focusNode} ${propertyPath} ${valueNode} .
      ${constraints}
    `
  }
}
