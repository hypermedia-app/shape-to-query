import { NamedNode, Variable } from 'rdf-js'
import $rdf from 'rdf-ext'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { NodeExpression, PatternBuilder } from '../nodeExpression/NodeExpression.js'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
  objectNode: Variable
  builder: PatternBuilder
}

export interface PropertyValueRule {
  buildPatterns({ focusNode, objectNode, variable, rootPatterns }: Parameters): ShapePatterns
}

export default class implements PropertyValueRule {
  constructor(public readonly path: NamedNode, public readonly nodeExpression: NodeExpression) {
  }

  buildPatterns({ focusNode, objectNode, variable, rootPatterns, builder }: Parameters): ShapePatterns {
    const { patterns } = this.nodeExpression.buildPatterns({ subject: focusNode, variable, rootPatterns, builder })
    let whereClause: SparqlTemplateResult
    if ('build' in patterns) {
      whereClause = sparql`${patterns.WHERE`${rootPatterns}`}`
    } else {
      whereClause = sparql`{ ${rootPatterns}\n${patterns} }`
    }

    return {
      constructClause: [$rdf.quad(focusNode, this.path, objectNode)],
      whereClause,
    }
  }
}
