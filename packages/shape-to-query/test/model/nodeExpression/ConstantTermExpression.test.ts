import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/sparql-builder'
import { ConstantTermExpression } from '../../../model/nodeExpression/ConstantTermExpression.js'
import { blankNode, literal, namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import { BIND } from '../../pattern.js'

describe('model/nodeExpression/ConstantTermExpression', function () {
  before(function () { return import('../../sparql.js') })

  describe('match', function () {
    it('return true when value is literal', function () {
      expect(ConstantTermExpression.match(literal('10'))).to.be.true
    })

    it('return true when value is named node', function () {
      expect(ConstantTermExpression.match(namedNode('foo'))).to.be.true
    })

    it('return false when value is sh:this', function () {
      expect(ConstantTermExpression.match(namedNode(sh.this))).to.be.false
    })

    it('return false when value is blank node', function () {
      expect(ConstantTermExpression.match(blankNode())).to.be.false
    })
  })

  describe('fromPointer', function () {
    it('throws when pointer is blank node', function () {
      expect(() => ConstantTermExpression.fromPointer(blankNode())).to.throw()
    })
  })

  describe('buildPatterns', function () {
    const builder = <any>{}

    it('binds const as subject', function () {
      // given
      const expr = new ConstantTermExpression(schema.Person)

      // when
      const result = expr.build({
        subject: $rdf.variable('foo'),
        variable,
        rootPatterns: undefined,
      }, builder)

      // then
      expect(result.patterns).to.deep.equal([BIND(schema.Person).as(result.object)])
    })

    it('reuses object', function () {
      // given
      const expr = new ConstantTermExpression(schema.Person)

      // when
      const result = expr.build({
        subject: $rdf.variable('foo'),
        object: $rdf.variable('bar'),
        rootPatterns: undefined,
        variable,
      }, builder)

      // then
      expect(result.object).to.deep.eq($rdf.variable('bar'))
      expect(result.patterns).to.deep.equal([BIND(schema.Person).as(result.object)])
    })
  })

  describe('buildInlineExpression', function () {
    it('returns subject', function () {
      // given
      const expr = new ConstantTermExpression(schema.Person)

      // when
      const { inline } = expr.buildInlineExpression()

      // then
      expect(inline).to.equalPatternsVerbatim(sparql`${schema.Person}`)
    })
  })
})
