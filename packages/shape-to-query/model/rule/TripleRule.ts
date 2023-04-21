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

    const subject = this.subject.buildPatterns({ subject: focusNode, variable, rootPatterns, builder })
    const predicate = this.predicate.buildPatterns({ subject: focusNode, variable, rootPatterns, builder })
    const object = this.object.buildPatterns({ subject: focusNode, variable, rootPatterns, builder })

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
