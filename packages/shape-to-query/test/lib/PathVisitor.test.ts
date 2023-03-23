import { foaf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { fromNode } from 'clownface-shacl-path'
import { expect } from 'chai'
import { GraphPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import { parse } from '../nodeFactory.js'
import PathVisitor from '../../lib/PathVisitor.js'
import { createVariableSequence, VariableSequence } from '../../lib/variableSequence.js'
import '../sparql.js'

describe('lib/PathVisitor', () => {
  let variable: VariableSequence
  let visitor: PathVisitor

  beforeEach(() => {
    variable = createVariableSequence('n')
    visitor = new PathVisitor(variable)
  })

  describe('predicate path', () => {
    iit('simple case', {
      shape: parse`
        <>
          ${sh.path} ${foaf.knows} ;
        .
      `,
      expectedWherePatterns: '?n1 foaf:knows ?n2 .',
    })
  })

  describe('sequence path', () => {
    iit('two predicates', {
      shape: parse`
        <>
          ${sh.path} ( ${foaf.knows} ${foaf.name} ) ;
        .
      `,
      expectedWherePatterns: '?in foaf:knows ?mid .\n?mid foaf:name ?out .',
    })
  })

  describe('inverse path', () => {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.inversePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: '?n2 foaf:knows ?n1 .',
    })
  })

  describe('zero-or-one path', () => {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.zeroOrOnePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: `
        {
          BIND(?n1 as ?n2)
        } UNION {
          ?n1 foaf:knows ?n4 .
          BIND (?n4 as ?n2)
        }
      `,
      expectedConstructPatterns: '?n1 foaf:knows ?n4 .',
    })
  })

  describe('alternative path', () => {
    iit('of two predicates', {
      shape: parse`
        <> ${sh.path} [ ${sh.alternativePath} ( ${foaf.knows} ${schema.knows} ) ] .
      `,
      expectedWherePatterns: `{
          ?n1 foaf:knows ?n3 .
          BIND(?n3 as ?n2)
        } UNION {
          ?n1 schema:knows ?n4 .
          BIND(?n4 as ?n2)
        }`,
      expectedConstructPatterns: `
        ?n1 foaf:knows ?n3 .
        ?n1 schema:knows ?n4 .`,
    })
  })

  describe('one-or-more path', () => {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.oneOrMorePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: `
        ?n1 foaf:knows* ?n3 .
        ?n3 foaf:knows ?n2 .
      `,
      expectedConstructPatterns: '?n3 foaf:knows ?n2 .',
    })
  })

  describe('zero-or-more path', () => {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.zeroOrMorePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: `
        {
          BIND (?n1 as ?n2)
        } UNION {
          ?n1 foaf:knows* ?n3 .
          ?n3 foaf:knows ?n2 .
        }
      `,
      expectedConstructPatterns: '?n3 foaf:knows ?n2 .',
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
        const path = fromNode(shapePtr.out(sh.path))
        const { whereClause, constructClause } = visitor.visit(path, {
          pathStart: variable(),
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
