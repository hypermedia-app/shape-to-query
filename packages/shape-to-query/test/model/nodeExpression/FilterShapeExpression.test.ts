import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import { sparql } from '@tpluscode/sparql-builder'
import { blankNode } from '../../nodeFactory.js'
import { FilterShapeExpression } from '../../../model/nodeExpression/FilterShapeExpression.js'
import { variable } from '../../variable.js'
import { NodeShape } from '../../../model/NodeShape.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { FocusNodeExpression } from '../../../model/nodeExpression/FocusNodeExpression.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { combinedNRE, fakeExpression } from './helper.js'

describe('model/nodeExpression/FilterShapeExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
  })

  describe('match', () => {
    it('returns true when node has one sh:filterShape', () => {
      // given
      const expr = blankNode()
        .addOut(sh.filterShape, schema.knows)

      // then
      expect(FilterShapeExpression.match(expr)).to.be.true
    })

    it('returns false when node has multiple sh:filterShape', () => {
      // given
      const expr = blankNode()
        .addOut(sh.filterShape)
        .addOut(sh.filterShape)

      // then
      expect(FilterShapeExpression.match(expr)).to.be.false
    })

    it('returns false when node has zero sh:filterShape', () => {
      // given
      const expr = blankNode()

      // then
      expect(FilterShapeExpression.match(expr)).to.be.false
    })
  })

  describe('filterShape', () => {
    it('constructs without sh:nodes', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.filterShape)

      // when
      const expr = FilterShapeExpression.fromPointer(pointer, factory)

      // then
      expect(expr.nodes).to.be.instanceof(FocusNodeExpression)
    })

    it('constructs with sh:nodes', () => {
      // given
      const nodeShape = {}
      factory.nodeExpression.returns(<any>nodeShape)
      const nodes = blankNode('nodes')
      const pointer = blankNode()
        .addOut(sh.filterShape)
        .addOut(sh.nodes, nodes)

      // when
      const expr = FilterShapeExpression.fromPointer(pointer, factory)

      // then
      expect(factory.nodeExpression).to.have.been
        .calledWith(sinon.match(actual => actual.term.equals(nodes.term)))
      expect(expr.nodes).to.be.eq(nodeShape)
    })

    it('throws when sh:nodes has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.filterShape, blankNode())
        .addOut(sh.nodes, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        FilterShapeExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:filterShape has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.filterShape, blankNode())
        .addOut(sh.filterShape, blankNode())

      // then
      expect(() => {
        // when
        FilterShapeExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:path is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        FilterShapeExpression.fromPointer(pointer, factory)
      }).to.throw()
    })
  })

  describe('buildPatterns', () => {
    it('creates constraints for focus node subject', () => {
      // given
      const shape: NodeShape = {
        buildPatterns: () => <any>{},
        buildConstraints: ({ focusNode }) => sparql`${focusNode} a ${schema.Organization} .`,
      }
      const expr = new FilterShapeExpression($rdf.blankNode(), shape)

      // when
      const subject = $rdf.variable('this')
      const result = expr.build({
        subject,
        object: subject,
        variable,
        rootPatterns: undefined,
      }, new PatternBuilder())

      // then
      expect(combinedNRE(result)).to.equalPatterns(sparql`SELECT ?this WHERE {
        ?this a ${schema.Organization} .
      }`)
    })

    it('creates constraints for properties of focus node', () => {
      // given
      const shape: NodeShape = {
        buildPatterns: () => ({
          constructClause: [],
          whereClause: sparql``,
        }),
        buildConstraints: ({ focusNode, valueNode }) => sparql`${focusNode} path ${valueNode} .`,
      }
      const expr = new FilterShapeExpression($rdf.blankNode(), shape)

      // when
      const subject = $rdf.namedNode('this')
      const result = expr.build({
        subject,
        variable,
        rootPatterns: undefined,
      }, new PatternBuilder())

      // then
      expect(combinedNRE(result)).to.equalPatterns(`SELECT ?bar WHERE {
        <this> path ?bar .
      }`)
    })

    it('creates constraints for values selected by sh:nodes subject', () => {
      // given
      const shape: NodeShape = {
        buildPatterns: () => <any>{},
        buildConstraints: ({ focusNode, valueNode }) => sparql`${focusNode} path ${valueNode} .`,
      }
      const nodes = fakeExpression(({ subject, object }) => sparql`${subject} nodes ${object} .`)
      const expr = new FilterShapeExpression($rdf.blankNode(), shape, nodes)

      // when
      const subject = $rdf.namedNode('this')
      const object = $rdf.variable('value')
      const result = expr.build({
        subject,
        object,
        variable,
        rootPatterns: undefined,
      }, new PatternBuilder())

      // then
      expect(combinedNRE(result)).to.equalPatterns(`SELECT ?x WHERE {
        <this> nodes ?x .
        ?x path ?obj .
      }`)
    })
  })
})
