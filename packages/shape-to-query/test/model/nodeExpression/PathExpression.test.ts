import { expect } from 'chai'
import { foaf, schema, sh } from '@tpluscode/rdf-ns-builders'
import sinon from 'sinon'
import $rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/sparql-builder'
import { PathExpression } from '../../../model/nodeExpression/PathExpression.js'
import { blankNode, namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { ex } from '../../namespace.js'
import { combinedNRE, fakeExpression } from './helper.js'

describe('model/nodeExpression/PathExpression', function () {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(function () { return import('../../sparql.js') })

  beforeEach(function () {
    factory = sinon.createStubInstance(ModelFactory)
  })

  describe('match', function () {
    it('returns true when node has one sh:path', function () {
      // given
      const expr = blankNode()
        .addOut(sh.path, schema.knows)

      // then
      expect(PathExpression.match(expr)).to.be.true
    })

    it('returns true when sh:deactivated fales', function () {
      // given
      const expr = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.deactivated, false)

      // then
      expect(PathExpression.match(expr)).to.be.true
    })

    it('returns false when node has no sh:path', function () {
      // given
      const expr = blankNode()

      // then
      expect(PathExpression.match(expr)).to.be.false
    })

    it('returns false when node has multiple sh:path', function () {
      // given
      const expr = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.path, foaf.knows)

      // then
      expect(PathExpression.match(expr)).to.be.false
    })

    it('returns false when node is not blank node', function () {
      // given
      const expr = namedNode('expr')
        .addOut(sh.path, schema.knows)

      // then
      expect(PathExpression.match(expr)).to.be.false
    })
  })

  describe('fromPointer', function () {
    it('constructs without sh:nodes', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.path, schema.knows)

      // when
      const expr = PathExpression.fromPointer(pointer, factory)

      // then
      expect(expr.nodes).to.be.undefined
    })

    it('creates node expression when it is a single value', function () {
      // given
      const nodes = blankNode('b0')
      const pointer = blankNode()
        .addOut(sh.path, schema.knows)
        .addOut(sh.nodes, nodes)

      // when
      PathExpression.fromPointer(pointer, factory)

      // then
      expect(factory.nodeExpression).to.have.been.calledWith(sinon.match(actual => actual.term.equals(nodes.term)))
    })

    it('throws when sh:nodes has multiple values', function () {
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

    it('throws when sh:path has multiple values', function () {
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

    it('throws when sh:path is missing', function () {
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

  describe('build', function () {
    it('creates a single pattern from given path', function () {
      // given
      const expr = new PathExpression($rdf.blankNode(), {
        type: 'path',
        pathType: '/',
        items: [schema.knows, schema.familyName],
      })

      // when
      const subject = sh.this
      const object = $rdf.variable('obj')
      const patterns = expr.build({ subject, object, variable, rootPatterns: undefined }, new PatternBuilder())

      // then
      expect(combinedNRE(patterns)).to.be.query(sparql`SELECT ?obj WHERE { ${sh.this} ${schema.knows}/${schema.familyName} ?obj . }`)
    })

    it('joins path with nodes', function () {
      // given
      const nodes = fakeExpression(({ subject, object }) => [{
        type: 'bgp',
        triples: [{ subject, predicate: schema.children, object }],
      }])
      const expr = new PathExpression($rdf.blankNode(), schema.name, nodes)

      // when
      const subject = ex.sub
      const object = $rdf.variable('obj')
      const patterns = expr.build({ subject, object, variable, rootPatterns: undefined }, new PatternBuilder())

      // then
      expect(combinedNRE(patterns)).to.be.query(sparql`SELECT ?obj WHERE {
        ${ex.sub} ${schema.children} ?x .
        ?x ${schema.name} ?obj .
      }`)
    })
  })
})
