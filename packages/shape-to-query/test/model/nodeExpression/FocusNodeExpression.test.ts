import { sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { FocusNodeExpression } from '../../../model/nodeExpression/FocusNodeExpression'
import { namedNode } from '../../nodeFactory'

describe('model/nodeExpression/FocusNodeExpression', () => {
  before(() => import('../../sparql'))

  describe('match', () => {
    it('return true when value is sh:this', () => {
      expect(FocusNodeExpression.match(namedNode(sh.this))).to.be.true
    })
  })

  describe('buildPatterns', () => {
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
})
