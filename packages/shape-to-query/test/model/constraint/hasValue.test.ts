import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { sparql } from '@tpluscode/sparql-builder'
import { ex } from '../../namespace.js'
import { HasValueConstraintComponent } from '../../../model/constraint/hasValue.js'
import { variable } from '../../variable.js'

describe('model/constraint/hasValue', () => {
  it('returns empty patterns when used in the root shape', () => {
    // given
    const constraint = new HasValueConstraintComponent([ex.foo, ex.bar])

    // when
    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.namedNode('foo'),
      valueNode: variable(),
      variable,
      rootPatterns: undefined,
    })

    // then
    expect(whereClause).to.eq('')
  })

  it('generates equality filter for single term', () => {
    // given
    const constraint = new HasValueConstraintComponent([ex.foo])

    // when
    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.namedNode('foo'),
      valueNode: variable(),
      variable,
      propertyPath: sparql`path`,
      rootPatterns: undefined,
    })

    // then
    expect(whereClause).to.equalPatterns(sparql`
      FILTER EXISTS { <foo> path ${ex.foo} }
    `)
  })

  it('generates EXISTS filter for multiple terms', () => {
    // given
    const constraint = new HasValueConstraintComponent([ex.bar, ex.baz])

    // when
    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.namedNode('foo'),
      valueNode: variable(),
      variable,
      propertyPath: sparql`path`,
      rootPatterns: undefined,
    })

    // then
    expect(whereClause).to.equalPatterns(sparql`
      FILTER EXISTS { <foo> path ${ex.bar}, ${ex.baz} }
    `)
  })
})
