import { use, expect } from 'chai'
import $rdf from '@zazuko/env'
import { sh } from '@tpluscode/rdf-ns-builders'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { OrConstraintComponent } from '../../../model/constraint/or.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { parse } from '../../nodeFactory.js'
import type { NodeShape } from '../../../model/NodeShape.js'
import { emptyPatterns } from '../../../lib/shapePatterns.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'

describe('model/constraint/or', function () {
  use(jestSnapshotPlugin())

  before(function () { return import('../../sparql.js') })

  it('combines all inner constraints where in UNION', function () {
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

  it('omits the disjunction when one alternative has only a zero minimum', function () {
    const required = new ModelFactory().nodeShape(parse`<>
      ${sh.property} [ ${sh.path} <http://schema.org/email> ; ${sh.minCount} 1 ] .
    `)
    const optional = new ModelFactory().nodeShape(parse`<>
      ${sh.property} [ ${sh.path} <http://schema.org/email> ; ${sh.minCount} 0 ] .
    `)
    const constraint = new OrConstraintComponent([required, optional])

    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.variable('focus'),
      valueNode: $rdf.variable('value'),
      variable: createVariableSequence('resource'),
      rootPatterns: [],
    })

    expect(whereClause).to.be.empty
  })
})
