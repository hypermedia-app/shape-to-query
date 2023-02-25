import { foaf } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type { GraphPointer } from 'clownface'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import { namedNode } from '@rdfjs/data-model'
import { parse } from '../nodeFactory'
import { getNodeExpressionPatterns } from '../../lib/nodeExpressions'
import { createVariableSequence, VariableSequence } from '../../lib/variableSequence'
import '../sparql'

describe('lib/nodeExpressions', () => {
  let variable: VariableSequence

  beforeEach(() => {
    variable = createVariableSequence('n')
  })

  context('constant term expression', () => {
    iit('binds constant to property value', {
      shape: parse`
        <>
          ${sh.path} ${foaf.knows} ;
          ${sh.values} <John> ;
        .
      `,
      expectedWherePatterns: 'BIND (<John> as ?o)',
      expectedConstructPatterns: '<root> foaf:knows ?o .',
    })

    iit('merges multiple terms in UNION', {
      shape: parse`
        <>
          ${sh.path} ${foaf.knows} ;
          ${sh.values} <John>, <Jane> ;
        .
      `,
      expectedWherePatterns: '{ BIND (<John> as ?o) } UNION { BIND (<Jane> as ?o) }',
      expectedConstructPatterns: '<root> foaf:knows ?o .',
    })
  })

  interface Iit {
    shape: Promise<GraphPointer>
    expectedWherePatterns: string
    expectedConstructPatterns?: string
  }

  function iit(name: string, { shape, expectedWherePatterns, expectedConstructPatterns }: Iit) {
    context(name, () => {
      it('creates correct patterns', async () => {
        // given
        const shapePtr = await shape

        // when
        const { whereClause, constructClause } = getNodeExpressionPatterns({
          focusNode: namedNode('root'),
          variable,
          shape: shapePtr,
          pathEnd: variable(),
        })

        // then
        expect(whereClause).to.equalPatterns(expectedWherePatterns)
        if (expectedConstructPatterns) {
          expect(sparql`${constructClause}`).to.equalPatterns(expectedConstructPatterns)
        } else {
          expect(sparql`${constructClause}`).to.equalPatterns(whereClause)
        }
      })
    })
  }
})
