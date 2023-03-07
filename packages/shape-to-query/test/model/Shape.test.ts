import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import Shape from '../../model/Shape'
import { emptyPatterns } from '../../lib/shapePatterns'
import { createVariableSequence } from '../../lib/variableSequence'
import { ConstraintComponent } from '../../model/constraint/ConstraintComponent'

describe('lib/model/Shape', () => {
  before(() => import('../sparql'))

  const variable = createVariableSequence('s')

  describe('buildLogicalConstraints', () => {
    it('returns empty patterns when there are no constraints', () => {
      // given
      const shape = new Shape([])

      // when
      const focusNode = $rdf.namedNode('this')
      const constraints = shape.buildLogicalConstraints({ focusNode, variable })

      // then
      expect(constraints).to.eq(emptyPatterns)
    })

    it('returns empty when all inner shapes return empty', () => {
      // given
      const inner: ConstraintComponent[] = [{
        type: sh.NodeConstraintComponent,
        buildPatterns: () => '',
      }, {
        type: sh.NodeConstraintComponent,
        buildPatterns: () => '',
      }]
      const shape = new Shape(inner)

      // when
      const focusNode = $rdf.namedNode('this')
      const constraints = shape.buildLogicalConstraints({ focusNode, variable })

      // then
      expect(constraints).to.eq(emptyPatterns)
    })
  })
})
