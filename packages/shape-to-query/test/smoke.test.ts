import * as path from 'node:path'
import * as url from 'node:url'
import module from 'node:module'
import StreamClient from 'sparql-http-client'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import $rdf from '@zazuko/env-node'
import { sh, schema, hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import type { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import type { GroupPattern } from 'sparqljs'
import { constructQuery } from '../lib/shapeToQuery.js'
import { constraintComponents } from '../model/constraint/index.js'
import type { Parameters, PropertyShape } from '../model/constraint/ConstraintComponent.js'
import ConstraintComponent from '../model/constraint/ConstraintComponent.js'
import { parse } from './nodeFactory.js'
import { ex } from './namespace.js'

const require = module.createRequire(import.meta.url)

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const client = new StreamClient({
  endpointUrl: 'http://localhost:3030/s2q/query',
  storeUrl: 'http://localhost:3030/s2q/data',
})
const tbbt = $rdf.namespace('http://localhost:8080/data/person/')

before(async function () {
  this.timeout(100000)
  await compose.upAll({
    cwd: path.resolve(__dirname, '../..'),
  })
  await waitOn({
    resources: ['http://localhost:3030'],
  })
  // Fuseki's union default graph reads from named graphs.
  const graph = $rdf.namedNode('urn:shape-to-query:smoke:tbbt')
  await client.store.put($rdf.fromFile(require.resolve('tbbt-ld/dist/tbbt.nt')), { graph })
})

describe('@hydrofoil/shape-to-query', function () {
  it('works with sparql-http-client', async function () {
    // given
    const shape = parse`<>
        ${sh.targetClass} ${schema.Person} ;
        ${sh.property} [
          ${sh.path} (
            [ ${sh.zeroOrMorePath} ${schema.parent} ]
            ${schema.givenName}
          );
        ] .
      `

    // when
    const result = await $rdf.dataset().import(client.query.construct(constructQuery(shape)))

    // then
    expect(result).to.be.ok
  })

  it('selects the person who knows at least eight people with sh:minCount', async function () {
    const shape = parse`<>
      ${sh.targetClass} ${schema.Person} ;
      ${sh.property} [ ${sh.path} ${schema.knows} ; ${sh.minCount} 8 ] .
    `

    const result = await $rdf.dataset().import(client.query.construct(constructQuery(shape)))
    const people = $rdf.clownface({ dataset: result }).has(rdf.type, schema.Person)

    expect(people.values).to.deep.equal([tbbt('leonard-hofstadter').value])
    expect(people.out(schema.knows).terms).to.have.length(8)
  })

  it('selects people with zero or one family name or parent with sh:maxCount', async function () {
    const shape = parse`<>
      ${sh.targetClass} ${schema.Person} ;
      ${sh.property} [
        ${sh.path} [ ${sh.alternativePath} ( ${schema.familyName} ${schema.parent} ) ] ;
        ${sh.maxCount} 1
      ] .
    `

    const result = await $rdf.dataset().import(client.query.construct(constructQuery(shape)))
    const people = $rdf.clownface({ dataset: result }).has(rdf.type, schema.Person)

    expect(people.terms).to.have.length(8)
    expect(people.values).to.include(tbbt('penny').value)
    expect(people.values).to.include(tbbt('leonard-hofstadter').value)
    expect(people.values).not.to.include(tbbt('sheldon-cooper').value)
  })

  it('selects people who know exactly seven people with both cardinality bounds', async function () {
    const shape = parse`<>
      ${sh.targetClass} ${schema.Person} ;
      ${sh.property} [ ${sh.path} ${schema.knows} ; ${sh.minCount} 7 ; ${sh.maxCount} 7 ] .
    `

    const result = await $rdf.dataset().import(client.query.construct(constructQuery(shape)))
    const people = $rdf.clownface({ dataset: result }).has(rdf.type, schema.Person)

    expect(people.terms).to.have.length(7)
    expect(people.values).not.to.include(tbbt('mary-cooper').value)
    expect(people.values).not.to.include(tbbt('leonard-hofstadter').value)
  })

  context('constraint generates blank nodes', function () {
    before(function () {
      constraintComponents.set(ex.FreeTextSearchConstraintComponent, class TextSearch extends ConstraintComponent {
        static match(pointer: GraphPointer) {
          return isGraphPointer(pointer.out(hydra.freetextQuery))
        }

        static* fromShape(shape: PropertyShape) {
          const pattern = shape.get(hydra.freetextQuery) || []

          for (const patternElement of pattern) {
            if (!('pointer' in patternElement)) {
              continue
            }

            yield new TextSearch(patternElement.pointer.value)
          }
        }

        constructor(private readonly pattern: string) {
          super(ex.FreeTextSearchConstraintComponent)
        }

        buildPropertyShapePatterns(args: Parameters) {
          return [this.fusekiPatterns(args)]
        }

        fusekiPatterns({ focusNode, valueNode, propertyPath }: Parameters): GroupPattern {
          if (!propertyPath || !('value' in propertyPath)) {
            throw new Error('Property path must be a named node')
          }

          const patterns = $rdf.clownface()
            .node(focusNode)
            .addList($rdf.namedNode('http://jena.apache.org/text#query'), [propertyPath, $rdf.literal(this.pattern + '*')])
            .addOut(propertyPath, valueNode) // Second filtering to make sure the word starts with the given query

          return {
            type: 'group',
            patterns: [{
              type: 'bgp',
              triples: [...patterns.dataset],
            }, {
              type: 'filter',
              expression: {
                type: 'operation',
                operator: 'regex',
                args: [valueNode, $rdf.literal('^' + this.pattern), $rdf.literal('i')],
              },
            }],
          }
        }
      })
    })

    it('do not cause blank node scoping issue', async function () {
      // given
      const shape = await parse.file('full-text-search.ttl')

      // when
      const result = await $rdf.dataset().import(client.query.construct(constructQuery(shape)))

      // then
      expect(result).to.be.ok
    })
  })
})
