import { foaf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { fromNode } from 'clownface-shacl-path'
import { expect } from 'chai'
import type { GraphPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import type { SparqlTemplateResult } from '@tpluscode/rdf-string'
import { parse } from '../nodeFactory.js'
import PathVisitor from '../../lib/PathVisitor.js'
import type { VariableSequence } from '../../lib/variableSequence.js'
import { createVariableSequence } from '../../lib/variableSequence.js'
import '../sparql.js'

describe('lib/PathVisitor', function () {
  let variable: VariableSequence
  let visitor: PathVisitor

  beforeEach(function () {
    variable = createVariableSequence('n')
    visitor = new PathVisitor(variable)
  })

  describe('predicate path', function () {
    iit('simple case', {
      shape: parse`
        <>
          ${sh.path} ${foaf.knows} ;
        .
      `,
      expectedWherePatterns: sparql`?n1 ${foaf.knows} ?n2 .`,
    })
  })

  describe('sequence path', function () {
    iit('two predicates', {
      shape: parse`
        <>
          ${sh.path} ( ${foaf.knows} ${foaf.name} ) ;
        .
      `,
      expectedWherePatterns: sparql`?in ${foaf.knows} ?mid .\n?mid ${foaf.name} ?out .`,
    })
  })

  describe('inverse path', function () {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.inversePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: sparql`?n2 ${foaf.knows} ?n1 .`,
    })
  })

  describe('zero-or-one path', function () {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.zeroOrOnePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: sparql`
        {
          BIND(?n1 AS ?n2)
        } UNION {
          ?n1 ${foaf.knows} ?n4 .
          BIND (?n4 AS ?n2)
        }
      `,
      expectedConstructPatterns: sparql`?n1 ${foaf.knows} ?n4 .`,
    })
  })

  describe('alternative path', function () {
    iit('of two predicates', {
      shape: parse`
        <> ${sh.path} [ ${sh.alternativePath} ( ${foaf.knows} ${schema.knows} ) ] .
      `,
      expectedWherePatterns: sparql`{
          ?n1 ${foaf.knows} ?n3 .
          BIND(?n3 AS ?n2)
        } UNION {
          ?n1 ${schema.knows} ?n4 .
          BIND(?n4 AS ?n2)
        }`,
      expectedConstructPatterns: sparql`
        ?n1 ${foaf.knows} ?n3 .
        ?n1 ${schema.knows} ?n4 .`,
    })
  })

  describe('one-or-more path', function () {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.oneOrMorePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: sparql`
        ?n1 (${foaf.knows}*) ?n3 .
        ?n3 ${foaf.knows} ?n2 .
      `,
      expectedConstructPatterns: sparql`?n3 ${foaf.knows} ?n2 .`,
    })
  })

  describe('zero-or-more path', function () {
    iit('of predicate path', {
      shape: parse`
        <> ${sh.path} [ ${sh.zeroOrMorePath} ${foaf.knows} ] .
      `,
      expectedWherePatterns: sparql`
        {
          BIND (?n1 AS ?n2)
        } UNION {
          ?n1 (${foaf.knows}*) ?n3 .
          ?n3 ${foaf.knows} ?n2 .
        }
      `,
      expectedConstructPatterns: sparql`?n3 ${foaf.knows} ?n2 .`,
    })
  })

  interface Iit {
    shape: GraphPointer
    expectedWherePatterns: SparqlTemplateResult
    expectedConstructPatterns?: SparqlTemplateResult
  }

  function iit(name: string, { shape, expectedWherePatterns, expectedConstructPatterns }: Iit) {
    context(name, function () {
      it('creates correct patterns', async function () {
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
