import { NamedNode, Variable } from 'rdf-js'
import $rdf from 'rdf-ext'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { NodeExpression } from '../nodeExpression/NodeExpression.js'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
  objectNode: Variable
}

export interface PropertyValueRule {
  buildPatterns({ focusNode, objectNode, variable, rootPatterns }: Parameters): ShapePatterns
}

export default class implements PropertyValueRule {
  constructor(public readonly path: NamedNode, public readonly nodeExpression: NodeExpression) {
  }

  buildPatterns({ focusNode, objectNode, variable, rootPatterns }: Parameters): ShapePatterns {
    const result = this.nodeExpression.buildPatterns({ subject: focusNode, object: objectNode, variable, rootPatterns })
    let whereClause: SparqlTemplateResult
    if ('build' in result) {
      whereClause = sparql`${result.WHERE`${rootPatterns}`}`
    } else {
      whereClause = sparql`{ ${rootPatterns}\n${result} }`
    }

    return {
      constructClause: [$rdf.quad(focusNode, this.path, objectNode)],
      whereClause,
    }
  }
}
