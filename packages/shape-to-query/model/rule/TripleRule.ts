import $rdf from '@zazuko/env/web.js'
import type { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isGraphPointer } from 'is-graph-pointer'
import type { NodeExpression } from '../nodeExpression/NodeExpression.js'
import { PatternBuilder } from '../nodeExpression/NodeExpression.js'
import type { ShapePatterns } from '../../lib/shapePatterns.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { Rule, Parameters } from './Rule.js'

export default class TripleRule implements Rule {
  constructor(public subject: NodeExpression, public predicate: NodeExpression, public object: NodeExpression) {
  }

  static matches(pointer: GraphPointer) {
    return isGraphPointer(pointer.out(sh.subject)) &&
    isGraphPointer(pointer.out(sh.predicate)) &&
    isGraphPointer(pointer.out(sh.object))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    const subject = pointer.out(sh.subject)
    const predicate = pointer.out(sh.predicate)
    const object = pointer.out(sh.object)

    return new TripleRule(
      factory.nodeExpression(subject),
      factory.nodeExpression(predicate),
      factory.nodeExpression(object),
    )
  }

  buildPatterns({ focusNode, variable, rootPatterns }: Parameters): ShapePatterns {
    const builder = new PatternBuilder()

    const subject = builder.build(this.subject, { subject: focusNode, variable, rootPatterns })
    const predicate = builder.build(this.predicate, { subject: focusNode, variable, rootPatterns })
    const object = builder.build(this.object, { subject: focusNode, variable, rootPatterns })

    return {
      constructClause: [$rdf.quad(subject.object, predicate.object, object.object)],
      whereClause: [
        ...rootPatterns,
        ...subject.patterns,
        ...predicate.patterns,
        ...object.patterns,
      ],
    }
  }
}
