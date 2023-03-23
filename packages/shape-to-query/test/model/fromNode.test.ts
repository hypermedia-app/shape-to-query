import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import { fromNode, propertyShape } from '../../model/fromNode.js'
import { parse } from '../nodeFactory.js'
import { ex } from '../namespace.js'
import { TargetNode } from '../../model/target'
import NodeShape from '../../model/NodeShape.js'

describe('model/fromNode', () => {
  describe('nodeShape', () => {
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
        .and.to.have.property('nodes')
        .to.have.property('values')
        .deep.contain.members([ex.Foo.value, ex.Bar.value])
      expect(more).to.be.empty
    })
  })

  describe('propertyShape', () => {
    it('throws when property has no path', async () => {
      // given
      const pointer = await parse`
        <> a ${sh.PropertyShape} .
      `

      // then
      expect(() => {
        // when
        propertyShape(pointer)
      }).to.throw()
    })

    it('throws when property has multiple paths', async () => {
      // given
      const pointer = await parse`
        <> ${sh.path} [], [] .
      `

      // then
      expect(() => {
        // when
        propertyShape(pointer)
      }).to.throw()
    })

    it('throws when property has rule and non-iri path', async () => {
      // given
      const pointer = await parse`
        <> ${sh.path} [] ; ${sh.values} ${sh.this}.
      `

      // then
      expect(() => {
        // when
        propertyShape(pointer)
      }).to.throw()
    })
  })
})
