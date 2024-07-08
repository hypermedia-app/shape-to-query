import type { BlankNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
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

    const { patterns: [pattern] } = this.expression.build({
      object,
      subject,
      variable: arg.variable,
      rootPatterns: [],
    }, new PatternBuilder())

    let select: sparqljs.SelectQuery
    const aliasReturnVar: sparqljs.VariableExpression = {
      expression: this.expression.rootIsFocusNode ? subject : object,
      variable: arg.focusNode,
    }

    if (pattern.type === 'query') {
      const variables = pattern.variables as unknown as sparqljs.Variable[]
      select = {
        ...pattern,
        variables: [...variables, aliasReturnVar],
      }
    } else {
      select = {
        type: 'query',
        queryType: 'SELECT',
        variables: [aliasReturnVar],
        where: [pattern],
        prefixes: {},
      }
    }

    return {
      whereClause: [{
        type: 'group',
        patterns: [select],
      }],
      constructClause: [],
    }
  }
}
