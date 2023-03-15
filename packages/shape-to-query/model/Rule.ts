import { NamedNode, Variable } from 'rdf-js'
import $rdf from 'rdf-ext'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../lib/FocusNode'
import { ShapePatterns } from '../lib/shapePatterns'
import { VariableSequence } from '../lib/variableSequence'
import { NodeExpression } from './nodeExpression/NodeExpression'

interface Parameters {
  focusNode: FocusNode
  objectNode: Variable
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export interface Rule {
  buildPatterns(arg: Parameters): ShapePatterns
}

export class PropertyValueRule implements Rule {
  constructor(public readonly path: NamedNode, public readonly nodeExpression: NodeExpression) {
  }

  buildPatterns({ focusNode, objectNode, variable, rootPatterns }: Parameters): ShapePatterns {
    const result = this.nodeExpression.buildPatterns({ subject: focusNode, object: objectNode, variable, rootPatterns })
    let whereClause: SparqlTemplateResult
    if ('build' in result) {
      whereClause = sparql`{ ${result.WHERE`${rootPatterns}`} }`
    } else {
      whereClause = result
    }

    return {
      constructClause: [$rdf.quad(focusNode, this.path, objectNode)],
      whereClause,
    }
  }
}
