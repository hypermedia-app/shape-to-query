import { expect } from 'chai'
import { OrConstraintComponent } from '../../../model/constraint/or.js'
import { NodeShape } from '../../../model/NodeShape.js'
import { emptyPatterns } from '../../../lib/shapePatterns.js'

describe('model/constraint/or', () => {
  before(() => import('../../sparql'))

  it('combines all inner constraints where in UNION', () => {
    // given
    const foo: NodeShape = {
      buildConstraints: () => 'foo constraint',
      buildPatterns: () => emptyPatterns,
    }
    const bar = {
      buildConstraints: () => 'bar constraint',
      buildPatterns: () => emptyPatterns,
    }
    const baz = {
      buildConstraints: () => 'baz constraint',
      buildPatterns: () => emptyPatterns,
    }
    const constraint = new OrConstraintComponent([foo, bar, baz])

    // when
    const whereClause = constraint.buildPatterns(<any>{})

    // then
    expect(whereClause).to.equalPatterns(`{
      foo constraint
    } UNION {
      bar constraint
    } UNION {
      baz constraint
    }`)
  })

  it('skips constraints which returned empty', () => {
    // given
    const foo: NodeShape = {
      buildConstraints: () => 'foo constraint',
      buildPatterns: () => emptyPatterns,
    }
    const bar = {
      buildConstraints: () => '',
      buildPatterns: () => emptyPatterns,
    }
    const baz = {
      buildConstraints: () => 'baz constraint',
      buildPatterns: () => emptyPatterns,
    }
    const constraint = new OrConstraintComponent([foo, bar, baz])

    // when
    const whereClause = constraint.buildPatterns(<any>{})

    // then
    expect(whereClause).to.equalPatterns(`{
      foo constraint
    } UNION {
      baz constraint
    }`)
  })
})
