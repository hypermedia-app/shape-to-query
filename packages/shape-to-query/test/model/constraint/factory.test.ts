import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import createConstraints from '../../../model/constraint/factory.js'
import { parse } from '../../nodeFactory.js'
import ModelFactory from '../../../model/ModelFactory.js'

describe('model/constraint/factory', () => {
  it('skips deactivated constraints', async () => {
    // given
    const shape = await parse`
      <>
        ${sh.node} [ ${sh.deactivated} true ] ;
        ${sh.property} [ ${sh.deactivated} true ] ;
      .
    `

    // when
    const constraints = [...createConstraints(shape, new ModelFactory())]

    // then
    expect(constraints).to.be.empty
  })

  it('throws when a "fromList" constraint would be initialised from a non-list', async () => {
    // given
    const shape = await parse`
      <>
        ${sh.in} "not a list" ;
      .
    `

    // then
    expect(() => /* when */ [...createConstraints(shape, new ModelFactory())]).to.throw()
  })
})
