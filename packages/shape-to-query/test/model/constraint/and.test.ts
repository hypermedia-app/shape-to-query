import { expect } from 'chai'
import { AndConstraintComponent } from '../../../model/constraint/and.js'
import { NodeShape } from '../../../model/NodeShape.js'
import { emptyPatterns } from '../../../lib/shapePatterns.js'

describe('model/constraint/and', () => {
  before(() => import('../../sparql.js'))

  it('combines all inner constraints where', () => {
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
    const constraint = new AndConstraintComponent([foo, bar, baz])

    // when
    const whereClause = constraint.buildPatterns(<any>{})

    // then
    expect(whereClause).to.equalPatterns(`
      foo constraint
      bar constraint
      baz constraint
    `)
  })
})
