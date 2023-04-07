import { NamedNode, Variable } from 'rdf-js'
import $rdf from 'rdf-ext'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../lib/FocusNode.js'
import { ShapePatterns } from '../lib/shapePatterns.js'
import { VariableSequence } from '../lib/variableSequence.js'
import { NodeExpression } from './nodeExpression/NodeExpression.js'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export class PropertyValueRule {
  constructor(public readonly path: NamedNode, public readonly nodeExpression: NodeExpression) {
  }

  buildPatterns({ focusNode, objectNode, variable, rootPatterns }: Parameters & { objectNode: Variable }): ShapePatterns {
    const result = this.nodeExpression.buildPatterns({ subject: focusNode, object: objectNode, variable, rootPatterns })
    let whereClause: SparqlTemplateResult
    if ('build' in result) {
      whereClause = sparql`${result.WHERE`${rootPatterns}`}`
    } else {
      whereClause = sparql`${result}`
    }

    return {
      constructClause: [$rdf.quad(focusNode, this.path, objectNode)],
      whereClause,
    }
  }
}

export class TripleRule {
  constructor(public subject: NodeExpression, public predicate: NodeExpression, public object: NodeExpression) {
  }

  buildPatterns({ focusNode, variable, rootPatterns }: Parameters): ShapePatterns {
    const subject = variable()
    const predicate = variable()
    const object = variable()

    return {
      constructClause: [$rdf.quad(subject, predicate, object)],
      whereClause: sparql`
        ${this.subject.buildPatterns({ subject: focusNode, object: subject, variable, rootPatterns })}
        ${this.predicate.buildPatterns({ subject: focusNode, object: predicate, variable, rootPatterns })}
        ${this.object.buildPatterns({ subject: focusNode, object, variable, rootPatterns })}
      `,
    }
  }
}
