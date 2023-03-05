import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { AndConstraintComponent } from '../../../model/constraint/and'
import { createVariableSequence } from '../../../lib/variableSequence'
import { parse } from '../../nodeFactory'

describe('model/constraint/and', () => {
  before(() => import('../../sparql'))

  const variable = createVariableSequence('o')

  it('combines all inner constraints where', () => {
    // given
    const foo = {
      buildPatterns: ({ focusNode }) => ({
        constructClause: [$rdf.quad(focusNode, rdf.type, $rdf.namedNode('Foo'))],
        whereClause: 'foo constraint',
      }),
    }
    const bar = {
      buildPatterns: ({ focusNode }) => ({
        constructClause: [$rdf.quad(focusNode, rdf.type, $rdf.namedNode('Bar'))],
        whereClause: 'bar constraint',
      }),
    }
    const baz = {
      buildPatterns: ({ focusNode }) => ({
        constructClause: [$rdf.quad(focusNode, rdf.type, $rdf.namedNode('Baz'))],
        whereClause: 'baz constraint',
      }),
    }
    const constraint = new AndConstraintComponent([foo, bar, baz])

    // when
    const focusNode = $rdf.variable('this')
    const { whereClause, constructClause } = constraint.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(`
      foo constraint
      bar constraint
      baz constraint
    `)
    expect(sparql`${constructClause}`).to.equalPatterns(`
      ?this rdf:type <Foo> .
      ?this rdf:type <Bar> .
      ?this rdf:type <Baz> .
    `)
  })

  describe('fromPointer', () => {
    it('throws when parameter is not a list', async () => {
      // given
      const shape = await parse`
        <> ${sh.or} [] .
      `

      // then
      expect(() => {
        // when
        AndConstraintComponent.fromPointer(<GraphPointer>shape.out(sh.or))
      }).to.throw
    })
  })
})
