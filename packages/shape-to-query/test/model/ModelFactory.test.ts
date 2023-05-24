import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import ModelFactory from '../../model/ModelFactory.js'
import { blankNode, parse } from '../nodeFactory.js'
import { ex } from '../namespace.js'
import { TargetNode } from '../../model/target/index.js'
import NodeShape from '../../model/NodeShape.js'
import PropertyShape from '../../model/PropertyShape.js'

describe('model/ModelFactory', () => {
  let modelFactory: ModelFactory

  before(() => {
    modelFactory = new ModelFactory()
  })

  describe('nodeShape', () => {
    it('creates one TargetNode for all values', async () => {
      // given
      const pointer = await parse`
        <> ${sh.targetNode} ${ex.Foo}, ${ex.Bar} .
      `

      // when
      const shape = <NodeShape>modelFactory.nodeShape(pointer)

      // then
      const [target, ...more] = shape.targets
      expect(target).to.be.instanceof(TargetNode)
        .and.to.have.property('nodes')
        .to.have.property('values')
        .deep.contain.members([ex.Foo.value, ex.Bar.value])
      expect(more).to.be.empty
    })

    it('ignores deactivated rules', () => {
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
      const shape = <NodeShape>modelFactory.nodeShape(pointer)

      // then
      expect(shape.rules).to.be.empty
    })

    it('ignores deactivated shapes in logical constraints', () => {
      // given
      const pointer = parse`
        <> ${sh.and} ([ ${sh.deactivated} true ] [ ${sh.deactivated} true ]) .
        <> ${sh.or} ([ ${sh.deactivated} true ] [ ${sh.deactivated} true ]) .
        <> ${sh.xone} ([ ${sh.deactivated} true ] [ ${sh.deactivated} true ]) .
        <> ${sh.not} ([ ${sh.deactivated} true ] [ ${sh.deactivated} true ]) .
      `
      // when
      const shape = <NodeShape>modelFactory.nodeShape(pointer)

      // then
      for (const constraint of shape.constraints) {
        expect(constraint).to.have.property('inner').to.be.empty
      }
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
      const shape = <NodeShape>modelFactory.nodeShape(pointer)

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
        modelFactory.propertyShape(pointer)
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
        modelFactory.propertyShape(pointer)
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
        modelFactory.propertyShape(pointer)
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
      const shape = <PropertyShape>modelFactory.propertyShape(pointer)

      // then
      expect(shape.rules).to.have.length(1)
    })
  })

  describe('nodeExpression', () => {
    it('throws when expression is unrecognized', () => {
      expect(() => modelFactory.nodeExpression(blankNode())).to.throw(/Unsupported node expression/)
    })
  })
})
