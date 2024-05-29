import { Select, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import sinon from 'sinon'
import { NodeExpression, NodeExpressionResult } from '../../../model/nodeExpression/NodeExpression.js'

export function combinedNRE({ patterns, object }: NodeExpressionResult): SparqlTemplateResult {
  return sparql`SELECT ${object} WHERE { ${patterns} }`
}

interface FakePatternsImpl {
  (...args: Parameters<NodeExpression['build']>): Select | SparqlTemplateResult
}

interface FakeInlinePatterns {
  (...args: Parameters<NodeExpression['buildInlineExpression']>): ReturnType<NodeExpression['buildInlineExpression']>
}

interface FakeExpression extends NodeExpression {
  rootIsFocusNode: boolean
}

export function fakeExpression(patterns: Select | SparqlTemplateResult | FakePatternsImpl = sparql``, inlinePatterns?: FakeInlinePatterns): FakeExpression {
  const build = sinon.stub()
  if (typeof patterns === 'function') {
    build.callsFake(({ variable, object = variable(), ...args }, builder) => ({
      object,
      patterns: patterns({ object, variable, ...args }, builder),
    }))
  } else {
    build.returns(patterns)
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
