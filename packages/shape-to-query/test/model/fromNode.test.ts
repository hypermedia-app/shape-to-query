import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import { fromNode, propertyShape } from '../../model/fromNode.js'
import { parse } from '../nodeFactory.js'
import { ex } from '../namespace.js'
import { TargetNode } from '../../model/target/index.js'
import NodeShape from '../../model/NodeShape.js'
import PropertyShape from '../../model/PropertyShape.js'

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

    it('ignored deactivated rules', () => {
      // given
      const pointer = parse`
        <> ${sh.rule}
          [
            ${sh.subject} ${sh.this} ;
            ${sh.predicate} ${sh.this} ;
            ${sh.object} ${sh.this} ;
            ${sh.deactivated} true ;
          ] ,
          [
            ${sh.subject} ${sh.this} ;
            ${sh.predicate} ${sh.this} ;
            ${sh.object} ${sh.this} ;
            ${sh.deactivated} true ;
          ] .
      `

      // when
      const shape = <NodeShape>fromNode(pointer)

      // then
      expect(shape.rules).to.be.empty
    })

    it('creates with rules', () => {
      // given
      const pointer = parse`
        <> ${sh.rule}
          [
            ${sh.subject} ${sh.this} ;
            ${sh.predicate} ${sh.this} ;
            ${sh.object} ${sh.this} ;
          ] ,
          [
            ${sh.subject} ${sh.this} ;
            ${sh.predicate} ${sh.this} ;
            ${sh.object} ${sh.this} ;
          ] .
      `

      // when
      const shape = <NodeShape>fromNode(pointer)

      // then
      expect(shape.rules).to.have.length(2)
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

    it('creates with value rules', () => {
      // given
      const pointer = parse`
        <> 
          ${sh.path} ${ex.foo} ;
          ${sh.values} ${sh.this} ;
        .
      `

      // when
      const shape = <PropertyShape>propertyShape(pointer)

      // then
      expect(shape.rules).to.have.length(1)
    })
  })
})
