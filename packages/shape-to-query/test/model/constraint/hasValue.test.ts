import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { ex } from '../../namespace.js'
import { HasValueConstraintComponent } from '../../../model/constraint/hasValue.js'
import { variable } from '../../variable.js'

describe('model/constraint/hasValue', function () {
  it('returns empty patterns when used in the root shape', function () {
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
    expect(whereClause).to.be.empty
  })

  it('generates equality filter for single term', function () {
    // given
    const constraint = new HasValueConstraintComponent([ex.foo])
    const valueNode = variable()

    // when
    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.namedNode('foo'),
      valueNode,
      variable,
      propertyPath: ex.path,
      rootPatterns: undefined,
    })

    // then
    expect(whereClause).to.deep.contain.all.members(
      // VALUES (${valueNode}) { (${ex.foo}) }
      [{
        type: 'values',
        values: [
          { [`?${valueNode.value}`]: ex.foo },
        ],
      }])
  })

  it('generates EXISTS filter for multiple terms', function () {
    // given
    const constraint = new HasValueConstraintComponent([ex.bar, ex.baz])

    // when
    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.namedNode('foo'),
      valueNode: variable(),
      variable,
      propertyPath: ex.path,
      rootPatterns: undefined,
    })

    // then
    expect(whereClause).to.deep.contain.all.members(
      // FILTER EXISTS { <foo> ${ex.path} ${ex.bar}, ${ex.baz} }
      [{
        type: 'filter',
        expression: {
          type: 'operation',
          operator: 'exists',
          args: [{
            type: 'bgp',
            triples: [
              { subject: $rdf.namedNode('foo'), predicate: ex.path, object: ex.bar },
              { subject: $rdf.namedNode('foo'), predicate: ex.path, object: ex.baz },
            ],
          }],
        },
      }])
  })
})
