import { sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { fromNode } from '../../model/fromNode'
import { parse } from '../nodeFactory'
import { ex } from '../namespace'
import { TargetNode } from '../../model/target'
import NodeShape from '../../model/NodeShape'

describe('model/fromNode', () => {
  it('creates one TargetNode for all values', async () => {
    // given
    const pointer = await parse`
      <> ${sh.targetNode} ${ex.Foo}, ${ex.Bar} .
    `

    // when
    const shape = <NodeShape>fromNode(pointer)

    // then
    const [target, ...more] = shape.targets
    expect(target).to.be.instanceof(TargetNode)
      .and.to.have.property('nodes').to.have.property('values').deep.contain.members([ex.Foo.value, ex.Bar.value])
    expect(more).to.be.empty
  })
})
