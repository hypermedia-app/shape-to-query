import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { blankNode } from '../../nodeFactory'
import { FilterShapeExpression } from '../../../model/nodeExpression/FilterShapeExpression'
import { variable } from '../../variable'
import { NodeShape } from '../../../model/NodeShape'
import { NodeExpression } from '../../../model/nodeExpression'

describe('model/nodeExpression/FilterShapeExpression', () => {
  let factory: sinon.SinonSpy

  beforeEach(() => {
    factory = sinon.spy()
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
      expect(expr.nodes).to.be.undefined
    })

    it('constructs with sh:nodes', () => {
      // given
      const nodeShape = {}
      const createShape = sinon.stub().returns(nodeShape)
      const nodes = blankNode('nodes')
      const pointer = blankNode()
        .addOut(sh.filterShape)
        .addOut(sh.nodes, nodes)

      // when
      const expr = FilterShapeExpression.fromPointer(pointer, factory, createShape)

      // then
      expect(createShape).to.have.been
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
        buildConstraints: ({ focusNode, valueNode }) => sparql`${focusNode} path ${valueNode} .`,
      }
      const expr = new FilterShapeExpression(shape)

      // when
      const subject = $rdf.namedNode('this')
      const object = $rdf.variable('value')
      const patterns = expr.buildPatterns({
        subject,
        object,
        variable,
      })

      // then
      expect(patterns).to.equalPatterns(`
        <this> path ?obj .
      `)
    })

    it('creates constraints for values selected by sh:nodes subject', () => {
      // given
      const shape: NodeShape = {
        buildPatterns: () => <any>{},
        buildConstraints: ({ focusNode, valueNode }) => sparql`${focusNode} path ${valueNode} .`,
      }
      const nodes: NodeExpression = {
        buildPatterns: ({ subject, object }) => sparql`${subject} nodes ${object} .`,
      }
      const expr = new FilterShapeExpression(shape, nodes)

      // when
      const subject = $rdf.namedNode('this')
      const object = $rdf.variable('value')
      const patterns = expr.buildPatterns({
        subject,
        object,
        variable,
      })

      // then
      expect(patterns).to.equalPatterns(`
        <this> nodes ?x .
        ?x path ?obj .
      `)
    })
  })
})
