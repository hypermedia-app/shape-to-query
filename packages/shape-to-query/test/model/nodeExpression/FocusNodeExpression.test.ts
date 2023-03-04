import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { FocusNodeExpression } from '../../../model/nodeExpression/FocusNodeExpression'

describe('model/nodeExpression/FocusNodeExpression', () => {
  before(() => import('../../sparql'))

  it('binds const as subject', () => {
    // given
    const expr = new FocusNodeExpression()

    // when
    const patterns = expr.buildPatterns({
      subject: $rdf.variable('foo'),
      object: $rdf.variable('bar'),
    })

    // then
    expect(patterns).to.equalPatternsVerbatim('BIND(?foo as ?bar)')
  })
})
