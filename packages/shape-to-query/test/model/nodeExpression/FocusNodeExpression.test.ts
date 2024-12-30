import { sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { FocusNodeExpression } from '../../../model/nodeExpression/FocusNodeExpression.js'
import { namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import { BIND } from '../../pattern.js'

describe('model/nodeExpression/FocusNodeExpression', () => {
  before(() => import('../../sparql.js'))

  describe('match', () => {
    it('return true when value is sh:this', () => {
      expect(FocusNodeExpression.match(namedNode(sh.this))).to.be.true
    })
  })

  describe('buildPatterns', () => {
    it('binds named node as subject', () => {
      // given
      const expr = new FocusNodeExpression()

      // when
      const result = expr.build({
        subject: $rdf.namedNode('foo'),
        object: $rdf.variable('bar'),
        variable,
        rootPatterns: undefined,
      })

      // then
      const bar = result.object
      expect(result.patterns).to.deep.equal([BIND($rdf.namedNode('foo')).as(bar)])
    })

    it('reuses subject as object', () => {
      // given
      const expr = new FocusNodeExpression()

      // when
      const result = expr.build({
        subject: $rdf.variable('foo'),
        object: $rdf.variable('bar'),
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(result.object).to.deep.equal($rdf.variable('foo'))
      expect(result.patterns).to.be.empty
    })
  })
})
