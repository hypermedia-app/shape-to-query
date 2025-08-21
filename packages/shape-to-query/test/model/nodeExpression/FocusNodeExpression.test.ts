import { sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { FocusNodeExpression } from '../../../model/nodeExpression/FocusNodeExpression.js'
import { namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import { BIND } from '../../pattern.js'

describe('model/nodeExpression/FocusNodeExpression', function () {
  before(function () { return import('../../sparql.js') })

  describe('match', function () {
    it('return true when value is sh:this', function () {
      expect(FocusNodeExpression.match(namedNode(sh.this))).to.be.true
    })
  })

  describe('buildPatterns', function () {
    it('binds named node as subject', function () {
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

    it('reuses subject as object', function () {
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
