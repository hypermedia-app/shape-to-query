import { expect } from 'chai'
import rdf from '@zazuko/env/web.js'
import type { Quad } from '@rdfjs/types'
import type sparqljs from 'sparqljs'
import { AndConstraintComponent } from '../../../model/constraint/and.js'
import type { NodeShape } from '../../../model/NodeShape.js'
import { emptyPatterns } from '../../../lib/shapePatterns.js'
import { ex } from '../../namespace.js'

describe('model/constraint/and', () => {
  before(() => import('../../sparql.js'))

  it('combines all inner constraints where', () => {
    // given
    const fooPattern: sparqljs.BgpPattern =
      {
        type: 'bgp',
        triples: [rdf.quad<Quad>(ex.foo, ex.foo, ex.foo)],
      }
    const foo: NodeShape = {
      buildConstraints: () => [fooPattern],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const barPattern: sparqljs.BgpPattern = {
      type: 'bgp',
      triples: [rdf.quad<Quad>(ex.foo, ex.foo, ex.foo)],
    }
    const bar: NodeShape = {
      buildConstraints: () => [barPattern],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const bazPattern: sparqljs.BgpPattern = {
      type: 'bgp',
      triples: [rdf.quad<Quad>(ex.baz, ex.baz, ex.baz)],
    }
    const baz: NodeShape = {
      buildConstraints: () => [bazPattern],
      buildPatterns: () => emptyPatterns,
      properties: [],
    }
    const constraint = new AndConstraintComponent([foo, bar, baz])

    // when
    const whereClause = constraint.buildPatterns(<any>{})

    // then
    expect(whereClause).to.contain.ordered.members([
      fooPattern,
      barPattern,
      bazPattern,
    ])
  })
})
