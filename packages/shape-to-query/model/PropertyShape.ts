import { GraphPointer } from 'clownface'
import { fromNode } from 'clownface-shacl-path'
import { sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import { ShapePatterns } from '../lib/shapePatterns'
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
}

export default class implements PropertyShape {
  private readonly rules: ReadonlyArray<Rule>
  private readonly constraints: ReadonlyArray<ConstraintComponent>

  constructor(private readonly path: GraphPointer, { rules = [], constraints = [] }: Components = {}) {
    this.rules = rules
    this.constraints = constraints
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
      patterns = {
        constructClause: rulePatterns.flatMap(r => r.constructClause),
        whereClause: sparql`${UNION(...rulePatterns.map(r => r.whereClause))}`,
      }
    } else {
      patterns = visitor.visit(fromNode(this.path), {
        pathStart: focusNode,
        pathEnd,
      })
    }

    const deepPatterns = this.constraints
      .filter(c => c instanceof NodeConstraintComponent)
      .map((nodeConstraint): ShapePatterns => {
        const result = nodeConstraint.buildPatterns({ focusNode: pathEnd, variable })

        return {
          constructClause: result.constructClause,
          whereClause: sparql`
            ${patterns.whereClause}
            ${result.whereClause}
          `,
        }
      })

    if (deepPatterns.length) {
      return {
        constructClause: [
          ...patterns.constructClause,
          ...deepPatterns.flatMap(dp => dp.constructClause),
        ],
        whereClause: sparql`${UNION(
          patterns.whereClause,
          ...deepPatterns.map(dp => dp.whereClause),
        )}`,
      }
    }

    return patterns
  }
}
