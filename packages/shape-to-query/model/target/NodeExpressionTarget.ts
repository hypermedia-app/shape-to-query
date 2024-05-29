import type { BlankNode } from '@rdfjs/types'
import { Select, SELECT, sparql } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import s2q from '../../ns.js'
import { ModelFactory } from '../ModelFactory.js'
import { NodeExpression, PatternBuilder } from '../nodeExpression/NodeExpression.js'
import { Parameters, Target } from './Target.js'

export class NodeExpressionTarget implements Target {
  static readonly type = s2q.NodeExpressionTarget
  private readonly expression: NodeExpression

  constructor(node: GraphPointer<BlankNode>, private readonly builder: ModelFactory) {
    this.expression = this.builder.nodeExpression(node.out(sh.expression))
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    const subject = arg.variable()
    const object = arg.variable()

    const { patterns } = this.expression.build({
      object,
      subject,
      variable: arg.variable,
      rootPatterns: sparql``,
    }, new PatternBuilder())

    let select: Select
    const aliasReturnVar = sparql`(${this.expression.rootIsFocusNode ? subject : object} as ${arg.focusNode})`

    if ('build' in patterns) {
      select = patterns.AND`${aliasReturnVar}`
    } else {
      select = SELECT`${aliasReturnVar}`.WHERE`${patterns}`
    }

    return {
      whereClause: sparql`${select}`,
      constructClause: [],
    }
  }
}
