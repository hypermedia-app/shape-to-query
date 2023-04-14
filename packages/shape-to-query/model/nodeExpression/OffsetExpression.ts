import { SELECT, Select } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { fromRdf } from 'rdf-literal'
import { ModelFactory } from '../ModelFactory.js'
import { getOne } from './util.js'
import { NodeExpression, Parameters } from './NodeExpression.js'

export class OffsetExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    return isLiteral(pointer.out(sh.offset), xsd.integer) && isGraphPointer(pointer.out(sh.nodes))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const offset = pointer.out(sh.offset)
    if (!isLiteral(offset) || !offset.term.datatype.equals(xsd.integer)) {
      throw new Error('sh:offset must be an xsd:integer')
    }

    return new OffsetExpression(fromRdf(offset.term, true), fromNode.nodeExpression(getOne(pointer, sh.nodes)))
  }

  constructor(private readonly offset: number, private readonly nodes: NodeExpression) {
  }

  buildPatterns(arg: Parameters): Select {
    const selectOrPatterns = this.nodes.buildPatterns(arg)
    let select: Select

    if ('build' in selectOrPatterns) {
      select = selectOrPatterns
    } else {
      select = SELECT`${arg.subject} ${arg.object}`.WHERE`${selectOrPatterns}`
    }

    return select.OFFSET(this.offset)
  }
}
