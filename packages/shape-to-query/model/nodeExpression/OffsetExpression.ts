import { Term } from 'rdf-js'
import { SELECT, Select } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { fromRdf } from 'rdf-literal'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import NodeExpressionBase, { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'

export class OffsetExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer) {
    return isLiteral(pointer.out(sh.offset), xsd.integer) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const offset = pointer.out(sh.offset)
    if (!isLiteral(offset) || !offset.term.datatype.equals(xsd.integer)) {
      throw new Error('sh:offset must be an xsd:integer')
    }

    return new OffsetExpression(pointer.term, fromRdf(offset.term, true), fromNode.nodeExpression(getOne(pointer, sh.nodes)))
  }

  constructor(public readonly term: Term, private readonly offset: number, private readonly nodes: NodeExpression) {
    super()
  }

  _buildPatterns(arg: Parameters, builder: PatternBuilder) {
    const selectOrPatterns = builder.build(this.nodes, arg)
    let select: Select

    if ('build' in selectOrPatterns.patterns) {
      select = selectOrPatterns.patterns
    } else {
      select = SELECT`${arg.subject} ${selectOrPatterns.object}`.WHERE`${selectOrPatterns.patterns}`
    }

    return select.OFFSET(this.offset)
  }
}
