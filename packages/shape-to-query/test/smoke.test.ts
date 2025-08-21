import * as path from 'node:path'
import * as url from 'node:url'
import module from 'module'
import StreamClient from 'sparql-http-client'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import $rdf from '@zazuko/env-node'
import { sh, schema, hydra } from '@tpluscode/rdf-ns-builders'
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

before(async function () {
  this.timeout(100000)
  await compose.upAll({
    cwd: path.resolve(__dirname, '../..'),
  })
  await waitOn({
    resources: ['http://localhost:3030'],
  })
  await client.store.post($rdf.fromFile(require.resolve('tbbt-ld/dist/tbbt.nt')))
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

  context('constraint generates blank nodes', function () {
    before(function () {
      constraintComponents.set(ex.FreeTextSearchConstraintComponent, class TextSearch extends ConstraintComponent {
        static match(pointer: GraphPointer) {
          return isGraphPointer(pointer.out(hydra.freetextQuery))
        }

        static * fromShape(shape: PropertyShape) {
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
