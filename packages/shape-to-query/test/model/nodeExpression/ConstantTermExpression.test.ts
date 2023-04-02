import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { ConstantTermExpression } from '../../../model/nodeExpression/ConstantTermExpression.js'
import { blankNode, literal, namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'

describe('model/nodeExpression/ConstantTermExpression', () => {
  before(() => import('../../sparql.js'))

  describe('match', () => {
    it('return true when value is literal', () => {
      expect(ConstantTermExpression.match(literal('10'))).to.be.true
    })

    it('return true when value is named node', () => {
      expect(ConstantTermExpression.match(namedNode('foo'))).to.be.true
    })

    it('return false when value is sh:this', () => {
      expect(ConstantTermExpression.match(namedNode(sh.this))).to.be.false
    })

    it('return false when value is blank node', () => {
      expect(ConstantTermExpression.match(blankNode())).to.be.false
    })
  })

  describe('fromPointer', () => {
    it('throws when pointer is blank node', () => {
      expect(() => ConstantTermExpression.fromPointer(blankNode())).to.throw()
    })
  })

  describe('buildPatterns', () => {
    it('binds const as subject', () => {
      // given
      const expr = new ConstantTermExpression(schema.Person)

      // when
      const patterns = expr.buildPatterns({
        subject: $rdf.variable('foo'),
        object: $rdf.variable('bar'),
        variable,
      })

      // then
      expect(patterns).to.equalPatternsVerbatim('BIND(schema:Person as ?bar)')
    })
  })

  describe('buildInlineExpression', () => {
    it('returns subject', () => {
      // given
      const expr = new ConstantTermExpression(schema.Person)

      // when
      const { inline } = expr.buildInlineExpression({
        subject: $rdf.variable('foo'),
        object: $rdf.variable('bar'),
        variable,
        rootPatterns: sparql``,
      })

      // then
      expect(inline).to.equalPatternsVerbatim('schema:Person')
    })
  })
})
