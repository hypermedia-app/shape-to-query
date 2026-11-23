import { expect, use } from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { sh, xsd } from '@tpluscode/rdf-ns-builders'
import { constructQuery, shapeToPatterns } from '../../../index.js'
import { parse } from '../../nodeFactory.js'

describe('model/constraint/maxCount', function () {
  use(jestSnapshotPlugin())

  it('rejects a negative maximum', function () {
    const shape = parse`<>
      ${sh.property} [ ${sh.path} <http://schema.org/email> ; ${sh.maxCount} -1 ] .
    `

    expect(() => shapeToPatterns(shape)).to.throw(`${sh.maxCount.value} must be a nonnegative xsd:integer literal`)
  })

  it('uses an optional inverse path and rejects matches when the maximum is zero', function () {
    const shape = parse`
      @prefix ex: <http://example.com/ns#> .
      <> ${sh.targetClass} ex:Person ;
        ${sh.property} [
          ${sh.path} [ ${sh.inversePath} ex:owner ] ;
          ${sh.maxCount} 0
        ] .
    `

    expect(constructQuery(shape)).toMatchSnapshot()
  })

  it('checks the required value and applies the datatype constraint to every value', function () {
    const shape = parse`
      @prefix ex: <http://example.com/ns#> .
      <> ${sh.targetClass} ex:Person ;
        ${sh.property} [
          ${sh.path} ex:flag ;
          ${sh.maxCount} 3 ;
          ${sh.datatype} ${xsd.boolean} ;
          ${sh.hasValue} false
        ] .
    `

    expect(constructQuery(shape)).toMatchSnapshot()
  })
})
