import $rdf from '@zazuko/env/web.js'
import { foaf, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { TargetClass } from '../../../model/target/index.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'

describe('model/TargetClass', function () {
  before(function () { return import('../../sparql.js') })

  const variable = createVariableSequence('c')

  it("matches focus node's single rdf:type using pattern", function () {
    // given
    const classes = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.Person],
    )
    const target = new TargetClass(classes)
    const focusNode = $rdf.variable('foo')

    // when
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.deep.equal(
      // ?foo ${rdf.type} ${schema.Person} .
      [{
        type: 'bgp',
        triples: [$rdf.quad(focusNode, rdf.type, schema.Person)],
      }],
    )
    expect(constructClause).to.deep.equal([$rdf.quad(focusNode, rdf.type, schema.Person)])
  })

  it("matches focus node's single rdf:type using VALUES", function () {
    // given
    const classes = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.Person, foaf.Person],
    )
    const target = new TargetClass(classes)
    const focusNode = $rdf.variable('foo')

    // when
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    const targetClass = constructClause[0].object.value
    expect(whereClause).to.deep.equal(
      [{
        type: 'bgp',
        triples: [$rdf.quad(focusNode, rdf.type, $rdf.variable(targetClass))],
      }, {
        type: 'values',
        values: [{
          ['?' + targetClass]: schema.Person,
        }, {
          ['?' + targetClass]: foaf.Person,
        }],
      }],
    )
    expect(constructClause).to.deep.equal([$rdf.quad(focusNode, rdf.type, $rdf.variable(targetClass))])
  })
})
