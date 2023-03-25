import { schema } from '@tpluscode/rdf-ns-builders'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { PropertyValueRule } from '../../model/Rule'
import { variable } from '../variable'

describe('model/Rule', () => {
  describe('PropertyValueRule', () => {
    it('appends root patterns to a subquery', () => {
      // given
      const expr = {
        buildPatterns: ({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${subject} a ${object} .`,
      }
      const rule = new PropertyValueRule(schema.knows, expr)

      // when
      const { whereClause } = rule.buildPatterns({
        variable,
        rootPatterns: sparql`a b c .`,
        focusNode: $rdf.namedNode('foo'),
        objectNode: variable(),
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
      const expr = {
        buildPatterns: () => sparql``,
      }
      const rule = new PropertyValueRule(schema.knows, expr)

      // when
      const { constructClause } = rule.buildPatterns({
        variable,
        rootPatterns: sparql`a b c .`,
        focusNode: $rdf.namedNode('foo'),
        objectNode: variable(),
      })

      // then
      expect(sparql`${constructClause}`).to.equalPatterns('<foo> schema:knows ?bar .')
    })
  })
})
