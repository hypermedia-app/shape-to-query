import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import sinon from 'sinon'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { OrderByExpression } from '../../../model/nodeExpression/OrderByExpression'
import { blankNode } from '../../nodeFactory'
import { variable } from '../../variable'

describe('model/nodeExpression/OrderByExpression', () => {
  let factory: sinon.SinonSpy

  beforeEach(() => {
    factory = sinon.spy()
  })

  describe('match', () => {
    it('returns false when sh:orderBy is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(OrderByExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:nodes is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.orderBy, blankNode())

      // then
      expect(OrderByExpression.match(pointer)).to.be.false
    })

    it('returns true when sh:nodes and sh:orderBy are given', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.orderBy, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(OrderByExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', () => {
    it('throws when there is no sh:nodes', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.orderBy, blankNode())

      // then
      expect(() => {
        // when
        OrderByExpression.fromPointer(pointer, factory)
      }).to.throw
    })

    it('throws when there is no sh:orderBy', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        OrderByExpression.fromPointer(pointer, factory)
      }).to.throw
    })

    it('calls factory to construct sh:nodes and sh:orderBy', () => {
      // given
      const nodes = blankNode('nodes')
      const orderBy = blankNode('orderBy')
      const pointer = blankNode()
        .addOut(sh.nodes, nodes)
        .addOut(sh.orderBy, orderBy)

      // when
      OrderByExpression.fromPointer(pointer, factory)

      // then
      expect(factory).to.have.been.calledWith(sinon.match(actual => actual.term.equals(nodes.term)))
      expect(factory).to.have.been.calledWith(sinon.match(actual => actual.term.equals(orderBy.term)))
    })

    it('sets descending when sh:desc === true', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, null)
        .addOut(sh.orderBy, null)
        .addOut(sh.desc, true)

      // when
      const expr = OrderByExpression.fromPointer(pointer, factory)

      // then
      expect(expr.descending).to.be.true
    })

    it('sets descending when sh:desc is not defined', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, null)
        .addOut(sh.orderBy, null)

      // when
      const expr = OrderByExpression.fromPointer(pointer, factory)

      // then
      expect(expr.descending).to.be.false
    })
  })

  describe('buildPatterns', () => {
    it('creates an ordered subquery', () => {
      // given
      const orderBy = {
        buildPatterns: ({ subject, object }) => sparql`${subject} order-by ${object} .`,
      }
      const nodes = {
        buildPatterns: ({ object }) => sparql`${object} a ${schema.Article} .`,
      }
      const expr = new OrderByExpression(orderBy, nodes)

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
        OPTIONAL { ?foo order-by ?bar . }
      }
      ORDER BY ?bar`)
    })

    it('creates descending order', () => {
      // given
      const orderBy = {
        buildPatterns: ({ subject, object }) => sparql`${subject} order-by ${object} .`,
      }
      const nodes = {
        buildPatterns: ({ object }) => sparql`${object} a ${schema.Article} .`,
      }
      const expr = new OrderByExpression(orderBy, nodes, true)

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
        OPTIONAL { ?foo order-by ?bar . }
      }
      ORDER BY desc(?bar)`)
    })

    it('appends order to a root subquery expression', () => {
      // given
      const orderBy = {
        buildPatterns: ({ subject, object }) => sparql`${subject} order-by ${object} .`,
      }
      const nodes = {
        buildPatterns: ({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${object} a ${schema.Article} .`,
      }
      const expr = new OrderByExpression(orderBy, nodes, true)

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
        OPTIONAL { ?foo order-by ?bar . }
      }
      ORDER BY desc(?bar)`)
    })
  })
})