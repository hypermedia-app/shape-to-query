import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { OrConstraintComponent } from '../../../model/constraint/or'
import { createVariableSequence } from '../../../lib/variableSequence'

describe('model/constraint/or', () => {
  before(() => import('../../sparql'))

  const variable = createVariableSequence('o')

  it('combines all inner constraints where in UNION', () => {
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
    const constraint = new OrConstraintComponent([foo, bar, baz])

    // when
    const focusNode = $rdf.variable('this')
    const { whereClause, constructClause } = constraint.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(`{
      foo constraint
    } UNION {
      bar constraint
    } UNION {
      baz constraint
    }`)
    expect(sparql`${constructClause}`).to.equalPatterns(`
      ?this rdf:type <Foo> .
      ?this rdf:type <Bar> .
      ?this rdf:type <Baz> .
    `)
  })
})
