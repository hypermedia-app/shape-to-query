import type { NamedNode } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { PatternConstraintComponent } from '../../../model/constraint/pattern.js'
import { literal } from '../../nodeFactory.js'
import { variable } from '../../variable.js'

describe('model/constraint/pattern', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    it('returns nothing if property has no sh:pattern', () => {
      // given
      const shape = $rdf.termMap([
        [sh.flags, [{ pointer: literal('i') }]],
      ])

      // when
      const result = [...PatternConstraintComponent.fromShape(shape)]

      // then
      expect(result).to.be.empty
    })

    it('returns pattern without flags', () => {
      // given
      const shape = $rdf.termMap([
        [sh.pattern, [{ pointer: literal('^foo') }]],
      ])

      // when
      const [result] = [...PatternConstraintComponent.fromShape(shape)]

      // then
      expect(result.pattern).to.deep.eq($rdf.literal('^foo'))
      expect(result.flags).to.be.undefined
    })

    it('returns pattern with flags', () => {
      // given
      const shape = $rdf.termMap<NamedNode>([
        [sh.pattern, [{ pointer: literal('^foo') }]],
        [sh.flags, [{ pointer: literal('i') }]],
      ])

      // when
      const [result] = [...PatternConstraintComponent.fromShape(shape)]

      // then
      expect(result.pattern).to.deep.eq($rdf.literal('^foo'))
      expect(result.flags).to.deep.eq($rdf.literal('i'))
    })

    it('returns patterns as cartesian', () => {
      // given
      const shape = $rdf.termMap<NamedNode>([
        [sh.pattern, [{ pointer: literal('^foo') }, { pointer: literal('bar$') }]],
        [sh.flags, [{ pointer: literal('i') }]],
      ])

      // when
      const patterns = [...PatternConstraintComponent.fromShape(shape)]

      // then
      expect(patterns).to.have.length(2)
    })
  })

  describe('buildPatterns', () => {
    const focusNode = $rdf.variable('this')

    it('pattern only', () => {
      // given
      const pattern = new PatternConstraintComponent($rdf.literal('^(foo|bar)'))

      // when
      const valueNode = $rdf.variable('foo')
      const queryPatterns = pattern.buildPatterns({
        valueNode,
        variable,
        focusNode,
        rootPatterns: undefined,
      })

      // then
      expect(queryPatterns).to.deep.equal(
        // 'FILTER(REGEX(?foo, "^(foo|bar)"))'
        [{
          type: 'filter',
          expression: {
            type: 'operation',
            operator: 'regex',
            args: [
              $rdf.variable('foo'),
              $rdf.literal('^(foo|bar)'),
            ],
          },

        }],
      )
    })

    it('pattern and flags', () => {
      // given
      const pattern = new PatternConstraintComponent($rdf.literal('^(foo|bar)'), $rdf.literal('i'))

      // when
      const valueNode = $rdf.variable('foo')
      const queryPatterns = pattern.buildPatterns({
        valueNode,
        variable,
        focusNode,
        rootPatterns: undefined,
      })

      // then
      expect(queryPatterns).to.deep.equal(
        // 'FILTER(REGEX(?foo, "^(foo|bar)", "i"))'
        [{
          type: 'filter',
          expression: {
            type: 'operation',
            operator: 'regex',
            args: [
              $rdf.variable('foo'),
              $rdf.literal('^(foo|bar)'),
              $rdf.literal('i'),
            ],
          },
        }],
      )
    })
  })
})
