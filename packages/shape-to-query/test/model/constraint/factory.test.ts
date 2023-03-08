import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import createConstraints from '../../../model/constraint/factory'
import { parse } from '../../nodeFactory'

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
    const constraints = [...createConstraints(shape)]

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
    expect(() => /* when */ createConstraints(shape)).to.throw
  })
})
