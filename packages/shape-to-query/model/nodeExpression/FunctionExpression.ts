import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { dashSparql } from '@tpluscode/rdf-ns-builders/loose'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { shrink } from '@zazuko/prefixes'
import { fromRdf } from 'rdf-literal'
import $rdf from 'rdf-ext'
import vocabulary from '../../vocabulary.js'
import { NodeExpression, Parameters } from './NodeExpression.js'
import { NodeExpressionFactory } from './index.js'

export abstract class FunctionExpression implements NodeExpression {
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
    const functionPtr = vocabulary.node(first.predicate)
    const argumentList = pointer.out(functionPtr).list()
    if (!argumentList) {
      throw new Error(`Object of ${shrink(functionPtr.term.value)} must be an RDF List`)
    }

    const symbol = functionPtr.out(dashSparql.symbol).term || functionPtr.term
    const parameters = functionPtr.out(sh.parameter).map(parameter => {
      const order = parameter.out(sh.order)
      return {
        order: isLiteral(order) ? fromRdf(order.term) : 0,
        datatype: parameter.out(sh.datatype).term,
      }
    })
      .sort((l, r) => l.order - r.order)
    const returnType = functionPtr.out(sh.returnType).term

    const expressionList = [...argumentList].map(createExpr)
    if (isGraphPointer(functionPtr.has(rdf.type, dashSparql.AdditiveExpression))) {
      return new AdditiveExpression(symbol.value, returnType, expressionList)
    }

    return new FunctionCallExpression(symbol, parameters, returnType, expressionList)
  }

  protected constructor(
    public symbol: Term,
    public readonly parameters: ReadonlyArray<{ datatype?: Term }>,
    public readonly returnType: Term | undefined,
    public args: NodeExpression[]) {
  }

  buildPatterns(args: Parameters) {
    const { expressions, patterns } = this.evaluateArguments(args)

    return sparql`${patterns}\nBIND(${this.boundExpression(expressions)} as ${args.object})`
  }

  buildInlineExpression(args: Parameters) {
    const { expressions, patterns } = this.evaluateArguments(args)
    return {
      patterns,
      inline: sparql`(${this.boundExpression(expressions)})`,
    }
  }

  protected abstract boundExpression(args: SparqlTemplateResult[]): SparqlTemplateResult

  private evaluateArguments(arg: Parameters) {
    return this.args.reduce((result, expr) => {
      if ('buildInlineExpression' in expr) {
        const { inline, patterns } = expr.buildInlineExpression(arg)
        return {
          expressions: [...result.expressions, inline],
          patterns: patterns ? sparql`${result.patterns}\n${patterns}` : result.patterns,
        }
      }

      const next = arg.variable()
      return {
        expressions: [...result.expressions, sparql`${next}`],
        patterns: sparql`${result.patterns}\n${expr.buildPatterns({ ...arg, object: next })}`,
      }
    }, {
      expressions: <SparqlTemplateResult[]>[],
      patterns: sparql``,
    })
  }
}

export class AdditiveExpression extends FunctionExpression {
  constructor(symbol: string, returnType: Term | undefined, args: NodeExpression[]) {
    super($rdf.literal(symbol), [], returnType, args)
    assertFunctionArguments(this, args)
  }

  protected boundExpression(args: SparqlTemplateResult[]): SparqlTemplateResult {
    const [first, ...rest] = args
    return rest.reduce((expr, arg) => {
      return sparql`${expr} ${this.symbol.value} ${arg}`
    }, sparql`${first}`)
  }
}

export class FunctionCallExpression extends FunctionExpression {
  constructor(symbol: Term, parameters: ReadonlyArray<{ datatype?: Term }>, returnType: Term | undefined, args: NodeExpression[]) {
    super(symbol, parameters, returnType, args)
    assertFunctionArguments(this, args)
  }

  protected boundExpression(args: SparqlTemplateResult[]): SparqlTemplateResult {
    const [first, ...rest] = args
    const argList = rest.reduce((list, arg) => sparql`${list}, ${arg}`, sparql`${first}`)
    const symbol = this.symbol.termType === 'Literal'
      ? this.symbol.value
      : this.symbol

    return sparql`${symbol}(${argList})`
  }
}

function assertFunctionArguments(func: FunctionExpression, args: NodeExpression[]) {
  if (func.parameters.length && args.length !== func.parameters.length) {
    throw new Error(`Function ${shrink(func.symbol.value)} requires ${func.parameters.length} parameters`)
  }

  // TODO: check argument types
}
