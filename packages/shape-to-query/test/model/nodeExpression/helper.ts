import type { Select } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import sinon from 'sinon'
import sparqljs from 'sparqljs'
import type { NodeExpression, NodeExpressionResult } from '../../../model/nodeExpression/NodeExpression.js'

const parser = new sparqljs.Parser()

export function combinedNRE({ patterns, object }: NodeExpressionResult): sparqljs.SelectQuery {
  return {
    type: 'query',
    prefixes: {},
    queryType: 'SELECT',
    variables: [object],
    where: patterns,
  }
}

interface FakePatternsImpl {
  (...args: Parameters<NodeExpression['build']>): Select | sparqljs.Pattern[]
}

interface FakeInlinePatterns {
  (...args: Parameters<NodeExpression['buildInlineExpression']>): ReturnType<NodeExpression['buildInlineExpression']>
}

interface FakeExpression extends NodeExpression {
  rootIsFocusNode: boolean
}

export function fakeExpression(patterns: Select | sparqljs.Pattern[] | FakePatternsImpl = [], inlinePatterns?: FakeInlinePatterns): FakeExpression {
  const build = sinon.stub()
  if (typeof patterns === 'function') {
    build.callsFake(({ variable, object = variable(), ...args }, builder) => ({
      object,
      patterns: queryToPatterns(patterns({ object, variable, ...args }, builder)),
    }))
  } else {
    build.returns(queryToPatterns(patterns))
  }

  const fake: any = {
    term: $rdf.blankNode(),
    build,
    rootIsFocusNode: false,
  }

  if (inlinePatterns) {
    fake.buildInlineExpression = sinon.stub().callsFake(inlinePatterns)
  }

  return fake
}

function queryToPatterns(patterns: Select | sparqljs.Pattern[]): sparqljs.Pattern[] {
  if (Array.isArray(patterns)) {
    return patterns
  }

  return [parser.parse(patterns.build()) as sparqljs.SelectQuery]
}
