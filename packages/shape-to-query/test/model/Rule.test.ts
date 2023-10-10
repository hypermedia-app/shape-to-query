import { schema } from '@tpluscode/rdf-ns-builders'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import { expect } from 'chai'
import $rdf from '@zazuko/env'
import PropertyValueRule from '../../model/rule/PropertyValueRule.js'
import TripleRule from '../../model/rule/TripleRule.js'
import { variable } from '../variable.js'
import { PatternBuilder } from '../../model/nodeExpression/NodeExpression.js'
import { fakeExpression } from './nodeExpression/helper.js'

describe('model/Rule', () => {
  before(() => import('../sparql.js'))

  describe('PropertyValueRule', () => {
    it('appends root patterns to a subquery', () => {
      // given
      const expr = fakeExpression(({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${subject} a ${object} .`)
      const rule = new PropertyValueRule(schema.knows, expr)

      // when
      const { whereClause } = rule.buildPatterns({
        variable,
        rootPatterns: sparql`a b c .`,
        focusNode: $rdf.namedNode('foo'),
        objectNode: variable(),
        builder: new PatternBuilder(),
      })

      // then
      expect(whereClause).to.equalPatterns(`{
        SELECT <foo> ?bar WHERE {
          <foo> a ?bar .
          a b c .
        }
      }`)
    })

    it('bind path to construct', () => {
      // given
      const expr = fakeExpression(() => sparql``)
      const rule = new PropertyValueRule(schema.knows, expr)

      // when
      const { constructClause } = rule.buildPatterns({
        variable,
        rootPatterns: sparql`a b c .`,
        focusNode: $rdf.namedNode('foo'),
        objectNode: variable(),
        builder: new PatternBuilder(),
      })

      // then
      expect(sparql`${constructClause}`).to.equalPatterns('<foo> schema:knows ?bar .')
    })
  })

  describe('TripleRule', () => {
    describe('buildPatterns', () => {
      it('constructs the result of subject/predicate/object', () => {
        // given
        const subject = fakeExpression(({ object }) => sparql`BIND(S as ${object})`)
        const predicate = fakeExpression(({ object }) => sparql`BIND(P as ${object})`)
        const object = fakeExpression(({ object }) => sparql`BIND(O as ${object})`)
        const rule = new TripleRule(subject, predicate, object)

        // when
        const patterns = rule.buildPatterns({
          variable,
          rootPatterns: undefined,
          focusNode: $rdf.namedNode('foo'),
        })

        // then
        expect(sparql`${patterns.constructClause}\n${patterns.whereClause}`)
          .to.equalPatterns(`
            ?s ?p ?o .
            BIND(S as ?s)
            BIND(P as ?p)
            BIND(O as ?o)
          `)
      })
    })
  })
})
