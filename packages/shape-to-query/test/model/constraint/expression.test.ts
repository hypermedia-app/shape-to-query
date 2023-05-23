import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import sinon from 'sinon'
import TermMap from '@rdfjs/term-map'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { variable } from '../../variable.js'
import { ExpressionConstraintComponent } from '../../../model/constraint/expression.js'
import { fakeExpression } from '../nodeExpression/helper.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { blankNode } from '../../nodeFactory.js'

describe('model/constraint/expression', () => {
  before(() => import('../../sparql.js'))

  describe('buildPatterns', () => {
    it('returns filter with inline expression', () => {
    // given
      const expr = fakeExpression(undefined, ({ subject, object }) => ({
        inline: sparql`${object} ${rdfs.subClassOf} ${schema.Person}`,
        patterns: sparql`${subject} a ${object} .`,
      }))
      const constraint = new ExpressionConstraintComponent(expr)

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode: variable(),
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause).to.equalPatterns('<foo> a ?type . FILTER(?type rdfs:subClassOf schema:Person)')
    })

    it('returns filter on result variable', () => {
      const expr = fakeExpression(args => sparql`SELECT ${args.object} WHERE { ${args.variable()} }`)
      const constraint = new ExpressionConstraintComponent(expr)

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode: variable(),
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause).to.equalPatterns(`SELECT ?foo WHERE { ?bar }
      FILTER(?foo)`)
    })
  })

  describe('fromShape', () => {
    let factory: sinon.SinonStubbedInstance<ModelFactory>

    beforeEach(() => {
      factory = sinon.createStubInstance(ModelFactory)
    })

    it('returns constraints for objects of sh:expression', () => {
      // given
      const shape = new TermMap([
        [sh.expression, [
          { pointer: blankNode() },
          { pointer: blankNode() },
          { pointer: blankNode() },
          { pointer: blankNode() },
        ]],
      ])

      // when
      const constraints = [...ExpressionConstraintComponent.fromShape(shape, factory)]

      // then
      expect(constraints).to.have.length(4)
      constraints.every(constraint =>
        expect(constraint).to.be.instanceof(ExpressionConstraintComponent),
      )
    })
  })
})
