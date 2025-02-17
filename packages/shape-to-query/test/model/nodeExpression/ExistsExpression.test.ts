import sinon from 'sinon'
import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { schema } from '@tpluscode/rdf-ns-builders'
import rdf from '@zazuko/env/web.js'
import type { BindPattern, OperationExpression } from 'sparqljs'
import ModelFactory from '../../../model/ModelFactory.js'
import { blankNode } from '../../nodeFactory.js'
import { ExistsExpression } from '../../../model/nodeExpression/ExistsExpression.js'
import type { ShapePatterns } from '../../../index.js'
import { NodeShape, PropertyShape } from '../../../index.js'
import { variable } from '../../variable.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import type { BuildParameters } from '../../../model/Shape.js'

describe('model/nodeExpression/ExistsExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  const nodeShape = 'ns'
  const propertyShape = 'ps'

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeShape.returns(<any>nodeShape)
    factory.propertyShape.returns(<any>propertyShape)
  })

  describe('match', () => {
    it('returns false when sh:exists is missing', () => {
      // given
      const pointer = blankNode()

      // then
      expect(ExistsExpression.match(pointer)).to.be.false
    })

    it('returns true when has sh:exists', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.exists, blankNode())

      // then
      expect(ExistsExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', () => {
    it('throws when sh:exists is missing', () => {
      // given
      const pointer = blankNode()

      // then
      expect(() => {
        // when
        ExistsExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:count has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.exists, blankNode())
        .addOut(sh.exists, blankNode())

      // then
      expect(() => {
        // when
        ExistsExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('returns an instance of ExistsExpression with inner node shape', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.exists, blankNode())

      // when
      const expr = ExistsExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(ExistsExpression)
      expect(expr).to.have.property('shape').to.eq(nodeShape)
    })

    it('returns an instance of ExistsExpression with inner node property shape', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.exists, shape => shape.addOut(sh.path, schema.name))

      // when
      const expr = ExistsExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(ExistsExpression)
      expect(expr).to.have.property('shape').to.eq(propertyShape)
    })
  })

  describe('build', () => {
    context('with property shape', () => {
      it('binds an exists clause', () => {
        // given
        const shape = new PropertyShape(
          rdf.clownface().namedNode(schema.name),
        )
        const expression = new ExistsExpression(shape)
        const subject = rdf.variable('subject')
        const object = rdf.variable('value')

        // when
        const { patterns } = expression.build({
          variable,
          object,
          rootPatterns: [],
          subject,
        }, new PatternBuilder())

        // then
        expect(patterns[0]).to.containSubset(<BindPattern>{
          type: 'bind',
          variable: object,
          expression: <OperationExpression>{
            type: 'operation',
            operator: 'exists',
            args: [{
              type: 'group',
              patterns: [{
                type: 'bgp',
                triples: [{
                  subject,
                  predicate: schema.name,
                  object: {
                    termType: 'Variable',
                  },
                }],
              }],
            }],
          },
        })
      })
    })

    context('with node shape', () => {
      it('binds an exists clause', () => {
        // given
        const shape = sinon.createStubInstance(NodeShape, {
          buildPatterns: <any>sinon.stub().callsFake(({ focusNode }: BuildParameters): ShapePatterns => {
            return {
              constructClause: [],
              whereClause: [{
                type: 'bgp',
                triples: [{
                  subject: focusNode,
                  predicate: schema.name,
                  object: variable(),
                }],
              }],
            }
          }),
          buildConstraints: [],
        })

        const expression = new ExistsExpression(shape)
        const subject = rdf.variable('subject')
        const object = rdf.variable('value')

        // when
        const { patterns } = expression.build({
          variable,
          object,
          rootPatterns: [],
          subject,
        }, new PatternBuilder())

        // then
        expect(patterns[0]).to.containSubset(<BindPattern>{
          type: 'bind',
          variable: object,
          expression: <OperationExpression>{
            type: 'operation',
            operator: 'exists',
            args: [{
              type: 'group',
              patterns: [{
                type: 'bgp',
                triples: [{
                  subject,
                  predicate: schema.name,
                  object: {
                    termType: 'Variable',
                  },
                }],
              }],
            }],
          },
        })
      })
    })
  })

  describe('buildInlineExpression', () => {
    it('binds an exists clause', () => {
      // given
      const shape = new PropertyShape(
        rdf.clownface().namedNode(schema.name),
      )
      const expression = new ExistsExpression(shape)
      const subject = rdf.variable('subject')
      const object = rdf.variable('value')

      // when
      const { inline } = expression.buildInlineExpression({
        variable,
        object,
        rootPatterns: [],
        subject,
      })

      // then
      expect(inline).to.containSubset(<OperationExpression>{
        type: 'operation',
        operator: 'exists',
        args: [{
          type: 'group',
          patterns: [{
            type: 'bgp',
            triples: [{
              subject,
              predicate: schema.name,
              object: {
                termType: 'Variable',
              },
            }],
          }],
        }],
      })
    })
  })
})
