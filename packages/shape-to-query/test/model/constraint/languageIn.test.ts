import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { LanguageInConstraintComponent } from '../../../model/constraint/languageIn.js'
import { variable } from '../../variable.js'
import { PropertyShape } from '../../../model/constraint/ConstraintComponent.js'

describe('model/constraint/languageIn', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    it('creates instance', () => {
      // given
      const shape: PropertyShape = $rdf.termMap([
        [sh.languageIn, [{
          list: [
            $rdf.clownface().literal('de'),
            $rdf.clownface().literal('en'),
          ],
        }]],
      ])

      // when
      const [constraint] = LanguageInConstraintComponent.fromShape(shape)

      // then
      expect(constraint.languages).to.contain.all.members(['de', 'en'])
    })

    it('skips shape without sh:languageIn', () => {
      // given
      const shape: PropertyShape = $rdf.termMap()

      // when
      const [constraint] = LanguageInConstraintComponent.fromShape(shape)

      // then
      expect(constraint).to.be.undefined
    })

    it('throws when values are not literal', () => {
      // given
      const shape: PropertyShape = $rdf.termMap([
        [sh.languageIn, [{
          list: [
            $rdf.clownface().namedNode('de'),
            $rdf.clownface().literal('en'),
          ],
        }]],
      ])

      // then
      expect(() => {
        return [...LanguageInConstraintComponent.fromShape(shape)]
      }).to.throw()
    })
  })

  describe('buildPatterns', () => {
    it('returns exact filter when single language', () => {
      // given
      const constraint = new LanguageInConstraintComponent(['de'])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
        propertyPath: sparql``,
      })

      // then
      expect(whereClause).to.equalPatternsVerbatim('FILTER (lang(?x) = "de")')
    })

    it('returns IN filter when multiple languages', () => {
      // given
      const constraint = new LanguageInConstraintComponent(['de', 'en'])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
        propertyPath: sparql``,
      })

      // then
      expect(whereClause).to.equalPatternsVerbatim('FILTER (lang(?x) IN ("de", "en"))')
    })

    it('returns nothing when shape is node shape focus node is IRI', () => {
      // given
      const constraint = new LanguageInConstraintComponent(['de', 'en'])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause.toString()).to.be.empty
    })

    it('returns filter when shape is node shape focus node is variable', () => {
      // given
      const constraint = new LanguageInConstraintComponent(['de', 'en'])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.variable('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause).to.equalPatternsVerbatim('FILTER (lang(?foo) IN ( "de", "en" ))')
    })
  })
})
