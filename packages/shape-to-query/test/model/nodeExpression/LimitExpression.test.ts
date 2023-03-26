import { schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { sparql } from '@tpluscode/rdf-string'
import { expect } from 'chai'
import sinon from 'sinon'
import { SELECT } from '@tpluscode/sparql-builder'
import { LimitExpression } from '../../../model/nodeExpression/LimitExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'

describe('model/nodeExpression/LimitExpression', () => {
  let factory: sinon.SinonSpy

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.stub().returns({})
  })

  describe('match', () => {
    it('returns false when sh:limit is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(LimitExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:nodes is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 10)

      // then
      expect(LimitExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:limit is not an integer', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, '10')
        .addOut(sh.nodes, blankNode())

      // then
      expect(LimitExpression.match(pointer)).to.be.false
    })

    it('returns true when sh:nodes and sh:limit are given', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 10)
        .addOut(sh.nodes, blankNode())

      // then
      expect(LimitExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', () => {
    it('throws when limit is not a number', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, '5')
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        LimitExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when limit is not a literal', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        LimitExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('return an instance of LimitExpression', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 15)
        .addOut(sh.nodes, blankNode())

      // when
      const expr = LimitExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(LimitExpression)
      expect(expr).to.have.property('limit', 15)
      expect(expr).to.have.property('nodes').to.be.ok
    })
  })

  describe('buildPatterns', () => {
    it('creates a limited subselect', () => {
      // given
      const limit = 10
      const nodes = {
        buildPatterns: ({ object }) => sparql`${object} a ${schema.Article} .`,
      }
      const expr = new LimitExpression(limit, nodes)

      // when
      const subselect = expr.buildPatterns({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: sparql``,
      })

      // then
      expect(subselect._getTemplateResult()).to.equalPatterns(`SELECT ?root ?foo WHERE {
        ?foo a schema:Article .
      }
      LIMIT 10`)
    })

    it('sets limit on inner subselect', () => {
      // given
      const limit = 10
      const nodes = {
        buildPatterns: ({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${object} a ${schema.Article} .`,
      }
      const expr = new LimitExpression(limit, nodes)

      // when
      const subselect = expr.buildPatterns({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: sparql``,
      })

      // then
      expect(subselect._getTemplateResult()).to.equalPatterns(`SELECT ?root ?foo WHERE {
        ?foo a schema:Article .
      }
      LIMIT 10`)
    })
  })
})
