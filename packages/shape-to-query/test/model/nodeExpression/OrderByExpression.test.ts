import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import sinon from 'sinon'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { OrderByExpression } from '../../../model/nodeExpression/OrderByExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { ex } from '../../namespace.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/OrderByExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
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

    it('returns true when sh:deactivated false', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.orderBy, blankNode())
        .addOut(sh.nodes, blankNode())
        .addOut(sh.deactivated, false)

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
      expect(factory.nodeExpression).to.have.been.calledWith(sinon.match(actual => actual.term.equals(nodes.term)))
      expect(factory.nodeExpression).to.have.been.calledWith(sinon.match(actual => actual.term.equals(orderBy.term)))
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

  describe('build', () => {
    it('creates an ordered subquery', () => {
      // given
      const orderBy = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: schema.datePublished,
          object,
        }],
      }])
      const nodes = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: schema.articleBody,
          object,
        }],
      }])
      const expr = new OrderByExpression($rdf.blankNode(), orderBy, nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?root ${schema.articleBody} ?foo .
        OPTIONAL { ?foo ${schema.datePublished} ?bar . }
      }
      ORDER BY ?bar`)
    })

    it('creates an ordered subquery with a root focus node', () => {
      // given
      const orderBy = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: schema.datePublished,
          object,
        }],
      }])
      const nodes = fakeExpression(({ subject }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: rdf.type,
          object: schema.Article,
        }],
      }])
      const expr = new OrderByExpression($rdf.blankNode(), orderBy, nodes)
      nodes.rootIsFocusNode = true

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root WHERE {
        ?root a ${schema.Article} .
        OPTIONAL { ?root ${schema.datePublished} ?bar . }
      }
      ORDER BY ?bar`)
    })

    it('creates descending order', () => {
      // given
      const orderBy = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: schema.datePublished,
          object,
        }],
      }])
      const nodes = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: schema.articleBody,
          object,
        }],
      }])
      const expr = new OrderByExpression($rdf.blankNode(), orderBy, nodes, true)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?root ${schema.articleBody} ?foo .
        OPTIONAL { ?foo ${schema.datePublished} ?bar . }
      }
      ORDER BY desc(?bar)`)
    })

    it('appends order to a root subquery expression', () => {
      // given
      const orderBy = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{
          subject,
          predicate: schema.datePublished,
          object,
        }],
      }])
      const nodes = fakeExpression(({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${subject} ${ex.read} ${object} . ${object} a ${schema.Article} .`)
      const expr = new OrderByExpression($rdf.blankNode(), orderBy, nodes, true)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?root ${ex.read} ?foo .
        ?foo a ${schema.Article} .
        OPTIONAL { ?foo ${schema.datePublished} ?bar . }
      }
      ORDER BY desc(?bar)`)
    })
  })
})
