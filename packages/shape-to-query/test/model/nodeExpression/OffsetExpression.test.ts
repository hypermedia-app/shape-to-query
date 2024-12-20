import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import sinon from 'sinon'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import type { Quad } from '@rdfjs/types'
import { OffsetExpression } from '../../../model/nodeExpression/OffsetExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/OffsetExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.returns(<any>{})
  })

  describe('match', () => {
    it('returns false when sh:offset is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(OffsetExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:nodes is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, 5)

      // then
      expect(OffsetExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:offset is not a number', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, '5')
        .addOut(sh.nodes, blankNode())

      // then
      expect(OffsetExpression.match(pointer)).to.be.false
    })

    it('returns true when sh:nodes and sh:offset are given', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, 5)
        .addOut(sh.nodes, blankNode())

      // then
      expect(OffsetExpression.match(pointer)).to.be.true
    })

    it('returns true when sh:deactivated false', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, 5)
        .addOut(sh.nodes, blankNode())
        .addOut(sh.deactivated, false)

      // then
      expect(OffsetExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', () => {
    it('throws when offset is not a number', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, '5')
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        OffsetExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when offset is not a literal', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        OffsetExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('return an instance of OffsetExpression', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.offset, 5)
        .addOut(sh.nodes, blankNode())

      // when
      const expr = OffsetExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(OffsetExpression)
      expect(expr).to.have.property('offset', 5)
      expect(expr).to.have.property('nodes').to.be.ok
    })
  })

  describe('build', () => {
    it('creates a subselect with offset', () => {
      // given
      const offset = 10
      const nodes = fakeExpression(({ object }) => [{
        type: 'bgp',
        triples: [$rdf.quad<Quad>(object, rdf.type, schema.Article)],
      }])
      const expr = new OffsetExpression($rdf.blankNode(), offset, nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?foo a ${schema.Article} .
      }
      OFFSET 10`)
    })

    it('sets offset on inner subselect', () => {
      // given
      const offset = 10
      const nodes = fakeExpression(({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${object} a ${schema.Article} .`)
      const expr = new OffsetExpression($rdf.blankNode(), offset, nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?foo a ${schema.Article} .
      }
      OFFSET 10`)
    })
  })
})
