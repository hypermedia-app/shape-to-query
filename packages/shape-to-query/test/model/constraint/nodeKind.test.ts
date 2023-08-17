import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { variable } from '../../variable.js'
import { NodeKind, NodeKindConstraintComponent } from '../../../model/constraint/nodeKind.js'
import { namedNode } from '../../nodeFactory.js'

describe('model/constraint/nodeKind', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    const nodeKinds: Array<[NodeKind, string]> = [
      [sh.IRI, 'IsIRI(?foo)'],
      [sh.IRIOrLiteral, 'IsIRI(?foo) || IsLiteral(?foo)'],
      [sh.BlankNodeOrIRI, 'IsBlank(?foo) || IsIRI(?foo)'],
      [sh.Literal, 'IsLiteral(?foo)'],
      [sh.BlankNodeOrLiteral, 'IsBlank(?foo) || IsLiteral(?foo)'],
      [sh.BlankNode, 'IsBlank(?foo)'],
    ]

    for (const [nodeKind, filter] of nodeKinds) {
      it(`returns correct pattern for ${nodeKind.value}`, () => {
        // given
        const shape = $rdf.termMap([
          [sh.nodeKind, [{ pointer: namedNode(nodeKind) }]],
        ])
        const [constraint] = [...NodeKindConstraintComponent.fromShape(shape)]

        // when
        const patterns = constraint.buildPatterns({
          valueNode: variable(),
          rootPatterns: undefined,
          focusNode: variable(),
          variable,
        })

        // then
        expect(patterns).to.equalPatterns(`FILTER(${filter})`)
      })
    }

    it('does not create a constraint when there is no sh:nodeKind', () => {
      // given
      const shape = $rdf.termMap()

      // when
      const constrains = [...NodeKindConstraintComponent.fromShape(shape)]

      // then
      expect(constrains).to.be.empty
    })

    it('does not create a constraint when sh:nodeKind is a list', () => {
      // given
      const shape = $rdf.termMap([
        [sh.nodeKind, [{ list: [] }]],
      ])

      // when
      const constrains = [...NodeKindConstraintComponent.fromShape(shape)]

      // then
      expect(constrains).to.be.empty
    })
  })

  describe('buildPatterns', () => {
    context('node shape', () => {
      it('restricts focus node', () => {
        // given
        const constraint = new NodeKindConstraintComponent(valueNode => sparql`IsIRI(${valueNode})`)

        // when
        const patterns = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode: variable(),
          variable,
          rootPatterns: undefined,
        })

        // then
        expect(patterns).to.equalPatterns('FILTER(IsIRI(<this>))')
      })
    })

    context('property shape', () => {
      it('restricts focus node', () => {
        // given
        const constraint = new NodeKindConstraintComponent(valueNode => sparql`IsIRI(${valueNode})`)

        // when
        const patterns = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode: variable(),
          variable,
          rootPatterns: undefined,
          propertyPath: sparql`path`,
        })

        // then
        expect(patterns).to.equalPatterns('FILTER(IsIRI(?q1))')
      })
    })
  })
})
