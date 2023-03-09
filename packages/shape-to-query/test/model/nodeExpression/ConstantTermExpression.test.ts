import { schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { ConstantTermExpression } from '../../../model/nodeExpression/ConstantTermExpression'

describe('model/nodeExpression/ConstantTermExpression', () => {
  before(() => import('../../sparql'))

  it('binds const as subject', () => {
    // given
    const expr = new ConstantTermExpression(schema.Person)

    // when
    const patterns = expr.buildPatterns({
      subject: $rdf.variable('foo'),
      object: $rdf.variable('bar'),
    })

    // then
    expect(patterns).to.equalPatternsVerbatim('BIND(schema:Person as ?bar)')
  })
})
