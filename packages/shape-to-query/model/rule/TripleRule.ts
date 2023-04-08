import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { NodeExpression } from '../nodeExpression/NodeExpression.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { Rule, Parameters } from './Rule.js'

export default class implements Rule {
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
