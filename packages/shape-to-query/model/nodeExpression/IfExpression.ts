import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type { GraphPointer } from 'clownface'
import type { Pattern } from 'sparqljs'
import type { ModelFactory } from '../ModelFactory.js'
import NodeExpressionBase from './NodeExpression.js'
import type { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'
import { getOne, getOneOrZero } from './util.js'

export class IfExpression extends NodeExpressionBase {
  constructor(private readonly ifExpr: NodeExpression, private readonly thenExpr: NodeExpression, private readonly elseExpr: NodeExpression) {
    super()
  }

  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) &&
      isGraphPointer(getOneOrZero(pointer, sh.if)) &&
      isGraphPointer(getOneOrZero(pointer, sh.then)) &&
      isGraphPointer(getOneOrZero(pointer, sh.else))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory) {
    const ifExpr = factory.nodeExpression(getOne(pointer, sh.if))
    const thenExpr = factory.nodeExpression(getOne(pointer, sh.then))
    const elseExpr = factory.nodeExpression(getOne(pointer, sh.else))

    return new IfExpression(ifExpr, thenExpr, elseExpr)
  }

  public get requiresFullContext(): boolean {
    return this.ifExpr.requiresFullContext ||
      (this.thenExpr?.requiresFullContext ?? false) ||
      (this.elseExpr?.requiresFullContext ?? false)
  }

  public get rootIsFocusNode(): boolean {
    return false
  }

  protected _buildPatterns({ object, ...args }: Required<Parameters>, builder: PatternBuilder): Pattern[] {
    const ifArgs = []
    const patterns: Pattern[] = []

    ;[this.ifExpr, this.thenExpr, this.elseExpr].forEach((expr) => {
      if ('buildInlineExpression' in expr) {
        const { inline, patterns = [] } = expr.buildInlineExpression(args, builder)
        ifArgs.push(inline)
        patterns.push(...patterns)
      } else {
        const result = expr.build(args, builder)
        ifArgs.push(result.object)
        patterns.push(...result.patterns)
      }
    })

    patterns.push({
      type: 'bind',
      variable: object,
      expression: {
        type: 'operation',
        operator: 'if',
        args: ifArgs,
      },
    })

    return patterns
  }

  pushPatterns() {}
}
