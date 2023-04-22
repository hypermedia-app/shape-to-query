import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { NodeExpression, PatternBuilder } from '../nodeExpression/NodeExpression.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { Rule, Parameters } from './Rule.js'

export default class implements Rule {
  constructor(public subject: NodeExpression, public predicate: NodeExpression, public object: NodeExpression) {
  }

  buildPatterns({ focusNode, variable, rootPatterns }: Parameters): ShapePatterns {
    const builder = new PatternBuilder()

    const subject = builder.build(this.subject, { subject: focusNode, variable, rootPatterns })
    const predicate = builder.build(this.predicate, { subject: focusNode, variable, rootPatterns })
    const object = builder.build(this.object, { subject: focusNode, variable, rootPatterns })

    return {
      constructClause: [$rdf.quad(subject.object, predicate.object, object.object)],
      whereClause: sparql`
        ${rootPatterns}
        ${subject.patterns}
        ${predicate.patterns}
        ${object.patterns}
      `,
    }
  }
}
