import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import { schema } from '@tpluscode/rdf-ns-builders'
import { fromNode, nodeExpression, propertyShape } from '../../model/fromNode'
import { literal, namedNode, parse } from '../nodeFactory'
import { ex } from '../namespace'
import { TargetNode } from '../../model/target'
import NodeShape from '../../model/NodeShape'
import * as Expr from '../../model/nodeExpression'

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
      }).to.throw
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
      }).to.throw
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
      }).to.throw
    })
  })

  describe('nodeExpression', () => {
    it('returns Focus Node expression when value is sh:this', () => {
      // given
      const pointer = namedNode(sh.this)

      // when
      const expr = nodeExpression(pointer)

      // then
      expect(expr).to.be.instanceof(Expr.FocusNodeExpression)
    })

    it('returns constant term expression when value is an IRI', () => {
      // given
      const pointer = namedNode(schema.Person)

      // when
      const expr = nodeExpression(pointer)

      // then
      expect(expr).to.be.instanceof(Expr.ConstantTermExpression)
    })

    it('returns constant term expression when value is a literal', () => {
      // given
      const pointer = literal('10')

      // when
      const expr = nodeExpression(pointer)

      // then
      expect(expr).to.be.instanceof(Expr.ConstantTermExpression)
    })
  })
})
