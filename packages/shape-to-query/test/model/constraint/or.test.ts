import { use, expect } from 'chai'
import $rdf from '@zazuko/env'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { OrConstraintComponent } from '../../../model/constraint/or.js'
import type { NodeShape } from '../../../model/NodeShape.js'
import { emptyPatterns } from '../../../lib/shapePatterns.js'

describe('model/constraint/or', () => {
  use(jestSnapshotPlugin())
  before(() => import('../../sparql.js'))

  it('combines all inner constraints where in UNION', () => {
    // given
    const foo: NodeShape = {
      buildConstraints: () => [{
        type: 'bgp',
        triples: [{
          subject: $rdf.variable('s'),
          predicate: $rdf.variable('p'),
          object: $rdf.variable('o'),
        }],
      }],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const bar: NodeShape = {
      buildConstraints: () => [{
        type: 'bgp',
        triples: [{
          subject: $rdf.variable('a'),
          predicate: $rdf.variable('b'),
          object: $rdf.variable('c'),
        }],
      }],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const baz: NodeShape = {
      buildConstraints: () => [{
        type: 'bgp',
        triples: [{
          subject: $rdf.variable('x'),
          predicate: $rdf.variable('y'),
          object: $rdf.variable('z'),
        }],
      }],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const constraint = new OrConstraintComponent([foo, bar, baz])

    // when
    const whereClause = constraint.buildPatterns(<any>{})

    // then
    expect(whereClause).toMatchSnapshot()
  })

  it('skips constraints which returned empty', () => {
    // given
    const foo: NodeShape = {
      buildConstraints: () => [{
        type: 'bgp',
        triples: [{
          subject: $rdf.variable('s'),
          predicate: $rdf.variable('p'),
          object: $rdf.variable('o'),
        }],
      }],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const bar: NodeShape = {
      buildConstraints: () => [],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const baz: NodeShape = {
      buildConstraints: () => [{
        type: 'bgp',
        triples: [{
          subject: $rdf.variable('x'),
          predicate: $rdf.variable('y'),
          object: $rdf.variable('z'),
        }],
      }],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const constraint = new OrConstraintComponent([foo, bar, baz])

    // when
    const whereClause = constraint.buildPatterns(<any>{})

    // then
    expect(whereClause).toMatchSnapshot()
  })
})
