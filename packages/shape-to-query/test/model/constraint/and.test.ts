import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { AndConstraintComponent } from '../../../model/constraint/and'
import { parse } from '../../nodeFactory'
import { NodeShape } from '../../../model/NodeShape'
import { emptyPatterns } from '../../../lib/shapePatterns'

describe('model/constraint/and', () => {
  before(() => import('../../sparql'))

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
