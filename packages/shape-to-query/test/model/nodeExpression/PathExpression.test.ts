import { expect } from 'chai'
import { foaf, schema, sh } from '@tpluscode/rdf-ns-builders'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { PathExpression } from '../../../model/nodeExpression/PathExpression.js'
import { blankNode, namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'

describe('model/nodeExpression/PathExpression', () => {
  let factory: sinon.SinonSpy

  beforeEach(() => {
    factory = sinon.spy()
  })

  describe('match', () => {
    it('returns true when node has one sh:path', () => {
      // given
      const expr = blankNode()
        .addOut(sh.path, schema.knows)

      // then
      expect(PathExpression.match(expr)).to.be.true
    })

    it('returns false when node has no sh:path', () => {
      // given
      const expr = blankNode()

      // then
      expect(PathExpression.match(expr)).to.be.false
    })

    it('returns false when node has multiple sh:path', () => {
      // given
      const expr = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.path, foaf.knows)

      // then
      expect(PathExpression.match(expr)).to.be.false
    })

    it('returns false when node is not blank node', () => {
      // given
      const expr = namedNode('expr')
        .addOut(sh.path, schema.knows)

      // then
      expect(PathExpression.match(expr)).to.be.false
    })
  })

  describe('fromPointer', () => {
    it('constructs without sh:nodes', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.path, schema.knows)

      // when
      const expr = PathExpression.fromPointer(pointer, factory)

      // then
      expect(expr.nodes).to.be.undefined
    })

    it('creates node expression when it is a single value', () => {
      // given
      const nodes = blankNode('b0')
      const pointer = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.nodes, nodes)

      // when
      PathExpression.fromPointer(pointer, factory)

      // then
      expect(factory).to.have.been.calledWith(sinon.match(actual => actual.term.equals(nodes.term)))
    })

    it('throws when sh:nodes has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.nodes, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        PathExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:path has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.path, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        PathExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:path is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        PathExpression.fromPointer(pointer, factory)
      }).to.throw()
    })
  })

  describe('buildPatterns', () => {
    it('creates a single pattern from given path', () => {
      // given
      const expr = new PathExpression(sparql`schema:knows/schema:familyName`)

      // when
      const subject = sh.this
      const object = $rdf.variable('obj')
      const patterns = expr.buildPatterns({ subject, object, variable })

      // then
      expect(patterns).to.equalPatternsVerbatim('sh:this schema:knows/schema:familyName ?obj .')
    })

    it('joins path with nodes', () => {
      // given
      const nodes = {
        buildPatterns: ({ subject, object }) => sparql`${subject} schema:children ${object} .`,
      }
      const expr = new PathExpression(sparql`schema:name`, nodes)

      // when
      const subject = $rdf.namedNode('sub')
      const object = $rdf.variable('obj')
      const patterns = expr.buildPatterns({ subject, object, variable })

      // then
      expect(patterns).to.equalPatterns(`
        <sub> schema:children ?x .
        ?x schema:name ?obj .
      `)
    })
  })
})
