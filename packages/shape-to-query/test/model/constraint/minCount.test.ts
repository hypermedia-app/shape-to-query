import { expect, use } from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import sparqljs from 'sparqljs'
import { sh, xsd } from '@tpluscode/rdf-ns-builders'
import { constructQuery, shapeToPatterns } from '../../../index.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { namedNode, parse } from '../../nodeFactory.js'

describe('model/constraint/minCount', function () {
  use(jestSnapshotPlugin())

  it('rejects a negative minimum', function () {
    const shape = parse`<>
      ${sh.property} [ ${sh.path} <http://schema.org/email> ; ${sh.minCount} -2 ] .
    `

    expect(() => shapeToPatterns(shape)).to.throw(`${sh.minCount.value} must be a nonnegative xsd:integer literal`)
  })

  it('omits the filter and retrieves the path optionally when the minimum is zero', function () {
    const shape = parse`<> ${sh.targetClass} <http://schema.org/Person> ;
      ${sh.property} [ ${sh.path} <http://schema.org/email> ; ${sh.minCount} 0 ] .
    `

    const query = constructQuery(shape)
    expect(query).to.include('OPTIONAL')
    expect(query).not.to.include('FILTER')
  })

  it('counts distinct path endpoints in one subquery for both bounds', function () {
    const shape = parse`
      @prefix ex: <http://example.com/ns#> .
      <> ${sh.targetClass} ex:Person ;
        ${sh.property} [
          ${sh.path} (ex:step ex:value) ;
          ${sh.minCount} 2 ;
          ${sh.maxCount} 2
        ] .
    `

    expect(constructQuery(shape)).toMatchSnapshot()
  })

  it('checks for invalid values without requiring the path in a fixed-focus ASK', function () {
    const shape = parse`
      @prefix ex: <http://example.com/ns#> .
      <> ${sh.property} [
        ${sh.path} ex:hasHikingGear ;
        ${sh.minCount} 0 ;
        ${sh.maxCount} 1 ;
        ${sh.datatype} ${xsd.boolean} ;
        ${sh.in} (false)
      ] .
    `
    const property = new ModelFactory().nodeShape(shape).properties[0]
    const where = property.buildConstraints({
      focusNode: namedNode('http://example.com/ns#Bob').term,
      variable: createVariableSequence('resource'),
      rootPatterns: [],
    })
    const query = new sparqljs.Generator().stringify({
      type: 'query',
      queryType: 'ASK',
      prefixes: {},
      where,
    })

    expect(query).toMatchSnapshot()
  })

  it('correlates nested cardinality filters with the value node', function () {
    const shape = parse`
      @prefix ex: <http://example.com/ns#> .
      <> ${sh.targetClass} ex:Person ;
        ${sh.property} [
          ${sh.path} ex:child ;
          ${sh.minCount} 0 ;
          ${sh.node} [
            ${sh.property} [ ${sh.path} ex:flag ; ${sh.minCount} 1 ; ${sh.maxCount} 1 ]
          ]
        ] .
    `

    expect(constructQuery(shape)).toMatchSnapshot()
  })
})
