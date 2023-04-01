import { Variable } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { dashSparql, rdf, sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import vocabulary from '../../vocabulary.js'
import { NodeExpression, Parameters } from './NodeExpression.js'
import { NodeExpressionFactory } from './index.js'

export class FunctionExpression implements NodeExpression {
  static match(pointer: GraphPointer) {
    const [first, ...rest] = [...pointer.dataset.match(pointer.term)]
    const isSingleSubject = first && rest.length === 0
    if (!isSingleSubject) {
      return false
    }

    const functionPtr = vocabulary.node(first.predicate).has(rdf.type, sh.Function)

    return isGraphPointer(functionPtr) && pointer.out(functionPtr).isList()
  }

  static fromPointer(pointer: GraphPointer, createExpr: NodeExpressionFactory) {
    const [first] = [...pointer.dataset.match(pointer.term)]
    const functionPtr = vocabulary.node(first.predicate).has(rdf.type, sh.Function)

    const args = [...pointer.out(functionPtr).list()].map(createExpr)
    const symbol = functionPtr.out(dashSparql.symbol).value

    return new FunctionExpression(symbol, args)
  }

  constructor(public symbol: string, public args: NodeExpression[]) {
  }

  buildPatterns({ subject, object, variable, rootPatterns }: Parameters) {
    const { args, patterns } = this.args.reduce((result, expr) => {
      const next = variable()
      return {
        args: [...result.args, next],
        patterns: sparql`${result.patterns}\n${expr.buildPatterns({ variable, rootPatterns, subject, object: next })}`,
      }
    }, {
      args: <Variable[]>[],
      patterns: sparql``,
    })

    const [first, ...rest] = args
    const argList = rest.reduce((list, arg) => sparql`${list}, ${arg}`, sparql`${first}`)
    return sparql`${patterns}\nBIND(${this.symbol}(${argList}) as ${object})`
  }
}
