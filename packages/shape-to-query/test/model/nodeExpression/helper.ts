import { Select, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
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

export function fakeExpression(patterns: Select | SparqlTemplateResult | FakePatternsImpl = sparql``, inlinePatterns?: FakeInlinePatterns): NodeExpression {
  const buildPatterns = sinon.stub()
  if (typeof patterns === 'function') {
    buildPatterns.callsFake(({ variable, object = variable(), ...args }, builder) => ({
      object,
      patterns: patterns({ object, variable, ...args }, builder),
    }))
  } else {
    buildPatterns.returns(patterns)
  }

  const fake: any = {
    term: $rdf.blankNode(),
    buildPatterns,
  }

  if (inlinePatterns) {
    fake.buildInlineExpression = sinon.stub().callsFake(inlinePatterns)
  }

  return fake
}
