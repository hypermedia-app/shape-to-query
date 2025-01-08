/* eslint-disable camelcase */
import $rdf from '@zazuko/env/web.js'
import type { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { isGraphPointer } from 'is-graph-pointer'
import type { Pattern } from 'sparqljs'
import type { Term, Variable } from '@rdfjs/types'
import type { NodeExpression } from '../nodeExpression/NodeExpression.js'
import { PatternBuilder } from '../nodeExpression/NodeExpression.js'
import type { ShapePatterns } from '../../lib/shapePatterns.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { Rule, Parameters as BuildParameters } from './Rule.js'

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

  buildPatterns({ focusNode, variable, rootPatterns }: BuildParameters): ShapePatterns {
    const args = { subject: focusNode, variable, rootPatterns }
    const builder = new PatternBuilder()

    let constructSubject = getInlineTerm(this.subject, [args, builder], 'NamedNode', 'BlankNode')
    let constructPredicate = getInlineTerm(this.predicate, [args, builder], 'NamedNode')
    let constructObject = getInlineTerm(this.object, [args, builder], 'NamedNode', 'BlankNode', 'Literal')

    const whereClause: Pattern[] = []
    if (!constructSubject || !constructPredicate || !constructObject) {
      whereClause.push(...rootPatterns)
    }

    function buildExpression(expression: NodeExpression): Variable {
      const { patterns, object } = builder.build(expression, args)
      whereClause.push(...patterns)
      return object
    }

    constructSubject = constructSubject || buildExpression(this.subject)
    constructPredicate = constructPredicate || buildExpression(this.predicate)
    constructObject = constructObject || buildExpression(this.object)

    return {
      constructClause: [$rdf.quad(constructSubject, constructPredicate, constructObject)],
      whereClause: whereClause.map(pattern => {
        if (pattern.type === 'query') {
          return {
            type: 'group',
            patterns: [pattern],
          }
        }

        return pattern
      }),
    }
  }
}

type ArrayToUnion<T> = T extends (infer U)[] ? U : never
type LimitedTerm<T extends Term['termType']> = Term & { termType: ArrayToUnion<T> }

function getInlineTerm<T extends Term['termType']>(expression: NodeExpression, args: Parameters<NodeExpression['buildInlineExpression']>, ...termType: T[]): Variable | LimitedTerm<T> | undefined {
  const result = expression.buildInlineExpression?.(...args)
  if (result && !result.patterns && 'termType' in result.inline) {
    if (result.inline.termType === 'Variable') {
      return result.inline
    }

    if ((termType as string[]).includes(result.inline.termType)) {
      return result.inline as LimitedTerm<T>
    }
  }

  return undefined
}
