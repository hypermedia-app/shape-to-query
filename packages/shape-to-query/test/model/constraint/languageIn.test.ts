import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import TermMap from '@rdfjs/term-map'
import { sh } from '@tpluscode/rdf-ns-builders'
import { LanguageInConstraintComponent } from '../../../model/constraint/languageIn.js'
import { variable } from '../../variable.js'
import { PropertyShape } from '../../../model/constraint/ConstraintComponent.js'

describe('model/constraint/languageIn', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    it('creates instance', () => {
      // given
      const shape: PropertyShape = new TermMap([
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

    it('throws when values are not literal', () => {
      // given
      const shape: PropertyShape = new TermMap([
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
  })
})
