import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { variable } from '../../variable.js'
import { DatatypeConstraintComponent } from '../../../model/constraint/datatype.js'
import { ex } from '../../namespace.js'

describe('model/constraint/datatype', function () {
  before(function () { return import('../../sparql.js') })

  describe('fromShape', function () {
    it('does not create a constraint when there is no sh:datatype', function () {
      // given
      const shape = $rdf.termMap()

      // when
      const constrains = [...DatatypeConstraintComponent.fromShape(shape)]

      // then
      expect(constrains).to.be.empty
    })
  })

  describe('buildPatterns', function () {
    context('node shape', function () {
      it('creates correct pattern', function () {
        // given
        const constraint = new DatatypeConstraintComponent(xsd.string)
        const focusNode = variable()
        const valueNode = focusNode

        // when
        const patterns = constraint.buildPatterns({
          focusNode,
          valueNode,
          variable,
          rootPatterns: undefined,
        })

        // then

        expect(patterns).to.deep.equal(
          // 'FILTER (datatype(?x) = xsd:string)'
          [{
            type: 'filter',
            expression: {
              type: 'operation',
              operator: '=',
              args: [
                {
                  type: 'operation',
                  operator: 'datatype',
                  args: [valueNode],
                },
                $rdf.namedNode('http://www.w3.org/2001/XMLSchema#string'),
              ],
            },
          }],
        )
      })
    })

    context('property shape', function () {
      it('restricts focus node', function () {
        // given
        const constraint = new DatatypeConstraintComponent(xsd.string)
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
          // 'FILTER (datatype(?x) = xsd:string)'
          [{
            type: 'filter',
            expression: {
              type: 'operation',
              operator: '=',
              args: [
                {
                  type: 'operation',
                  operator: 'datatype',
                  args: [valueNode],
                },
                $rdf.namedNode('http://www.w3.org/2001/XMLSchema#string'),
              ],
            },
          }],
        )
      })
    })
  })
})
