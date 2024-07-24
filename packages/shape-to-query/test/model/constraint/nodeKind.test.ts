import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import type sparqljs from 'sparqljs'
import type { Variable } from '@rdfjs/types'
import { shrink } from '@zazuko/prefixes'
import { variable } from '../../variable.js'
import type { NodeKind } from '../../../model/constraint/nodeKind.js'
import { NodeKindConstraintComponent } from '../../../model/constraint/nodeKind.js'
import { namedNode } from '../../nodeFactory.js'
import { ex } from '../../namespace.js'

describe('model/constraint/nodeKind', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    const nodeKinds: Array<[NodeKind, (valueNode: Variable) => sparqljs.Expression]> = [
      [sh.IRI, valueNode => ({ type: 'operation', operator: 'isiri', args: [valueNode] })],
      [sh.IRIOrLiteral, valueNode => ({
        type: 'operation',
        operator: '||',
        args: [
          { type: 'operation', operator: 'isiri', args: [valueNode] },
          { type: 'operation', operator: 'isliteral', args: [valueNode] },
        ],
      })],
      [sh.BlankNodeOrIRI, valueNode => ({
        type: 'operation',
        operator: '||',
        args: [
          { type: 'operation', operator: 'isblank', args: [valueNode] },
          { type: 'operation', operator: 'isiri', args: [valueNode] },
        ],
      })],
      [sh.Literal, valueNode => ({ type: 'operation', operator: 'isliteral', args: [valueNode] })],
      [sh.BlankNodeOrLiteral, valueNode => ({
        type: 'operation',
        operator: '||',
        args: [
          { type: 'operation', operator: 'isblank', args: [valueNode] },
          { type: 'operation', operator: 'isliteral', args: [valueNode] },
        ],
      })],
      [sh.BlankNode, valueNode => ({ type: 'operation', operator: 'isblank', args: [valueNode] })],
    ]

    for (const [nodeKind, filter] of nodeKinds) {
      it(`returns correct pattern for ${shrink(nodeKind.value)}`, () => {
        // given
        const shape = $rdf.termMap([
          [sh.nodeKind, [{ pointer: namedNode(nodeKind) }]],
        ])
        const [constraint] = [...NodeKindConstraintComponent.fromShape(shape)]
        const focusNode = variable()

        // when
        const patterns = constraint.buildPatterns({
          valueNode: variable(),
          rootPatterns: undefined,
          focusNode,
          variable,
        })

        // then
        expect(patterns).to.deep.equal([{
          type: 'filter',
          expression: filter(focusNode),
        }])
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
        const constraint = new NodeKindConstraintComponent(valueNode => [{
          type: 'functionCall',
          function: 'IsIRI',
          args: [valueNode],
        }])

        // when
        const patterns = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode: variable(),
          variable,
          rootPatterns: undefined,
        })

        // then
        expect(patterns).to.deep.equal(
          // 'FILTER(IsIRI(<this>))'
          [{
            type: 'filter',
            expression: [{
              type: 'functionCall',
              function: 'IsIRI',
              args: [$rdf.namedNode('this')],
            }],
          }],
        )
      })
    })

    context('property shape', () => {
      it('restricts focus node', () => {
        // given
        const constraint = new NodeKindConstraintComponent(valueNode => [{
          type: 'functionCall',
          function: 'IsIRI',
          args: [valueNode],
        }])
        const valueNode = variable()

        // when
        const patterns = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode,
          variable,
          rootPatterns: undefined,
          propertyPath: ex.path,
        })

        // then
        expect(patterns).to.deep.equal(
          // 'FILTER(IsIRI(?q1))'
          [{
            type: 'filter',
            expression: [{
              type: 'functionCall',
              function: 'IsIRI',
              args: [valueNode],
            }],
          }],
        )
      })
    })
  })
})
