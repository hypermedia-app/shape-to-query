import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { sh } from '@tpluscode/rdf-ns-builders'
import { LanguageInConstraintComponent } from '../../../model/constraint/languageIn.js'
import { variable } from '../../variable.js'
import type { PropertyShape } from '../../../model/constraint/ConstraintComponent.js'
import { ex } from '../../namespace.js'

describe('model/constraint/languageIn', function () {
  before(function () { return import('../../sparql.js') })

  describe('fromShape', function () {
    it('creates instance', function () {
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
      expect(constraint.languages).to.deep.contain.all.members([$rdf.literal('de'), $rdf.literal('en')])
    })

    it('skips shape without sh:languageIn', function () {
      // given
      const shape: PropertyShape = $rdf.termMap()

      // when
      const [constraint] = LanguageInConstraintComponent.fromShape(shape)

      // then
      expect(constraint).to.be.undefined
    })

    it('throws when values are not literal', function () {
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

  describe('buildPatterns', function () {
    it('returns exact filter when single language', function () {
      // given
      const constraint = new LanguageInConstraintComponent([$rdf.literal('de')])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
        propertyPath: ex.prop,
      })

      // then
      expect(whereClause).to.deep.equal(
        // 'FILTER (lang(?x) = "de")'
        [{
          type: 'filter',
          expression: {
            type: 'operation',
            operator: '=',
            args: [
              {
                type: 'operation',
                operator: 'lang',
                args: [valueNode],
              },
              $rdf.literal('de'),
            ],
          },
        }],
      )
    })

    it('returns IN filter when multiple languages', function () {
      // given
      const constraint = new LanguageInConstraintComponent([$rdf.literal('de'), $rdf.literal('en')])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
        propertyPath: ex.prop,
      })

      // then
      expect(whereClause).to.deep.equal(
        // 'FILTER (lang(?x) IN ("de", "en"))'
        [{
          type: 'filter',
          expression: {
            type: 'operation',
            operator: 'in',
            args: [
              {
                type: 'operation',
                operator: 'lang',
                args: [valueNode],
              },
              [$rdf.literal('de'), $rdf.literal('en')],
            ],
          },
        }],
      )
    })

    it('returns nothing when shape is node shape focus node is IRI', function () {
      // given
      const constraint = new LanguageInConstraintComponent([$rdf.literal('de'), $rdf.literal('en')])
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

    it('returns filter when shape is node shape focus node is variable', function () {
      // given
      const constraint = new LanguageInConstraintComponent([$rdf.literal('de'), $rdf.literal('en')])
      const valueNode = $rdf.variable('x')

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.variable('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause).to.deep.equal(
        // 'FILTER (lang(?foo) IN ( "de", "en" ))'
        [{
          type: 'filter',
          expression: {
            type: 'operation',
            operator: 'in',
            args: [
              {
                type: 'operation',
                operator: 'lang',
                args: [$rdf.variable('foo')],
              },
              [$rdf.literal('de'), $rdf.literal('en')],
            ],
          },
        }],
      )
    })
  })
})
