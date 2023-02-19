import * as path from 'path'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import StreamClient from 'sparql-http-client'
import { fromFile } from 'rdf-utils-fs'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import { constructQuery } from '../lib/shapeToQuery'
import { parse, raw } from './nodeFactory'

const tbbt = namespace('http://localhost:8080/data/person/')

const client = new StreamClient({
  endpointUrl: 'http://localhost:3030/s2q/query',
  updateUrl: 'http://localhost:3030/s2q/update',
  storeUrl: 'http://localhost:3030/s2q/data',
})

describe('@hydrofoil/shape-to-query', () => {
  before(async function () {
    this.timeout(100000)
    await compose.upAll({
      cwd: path.resolve(__dirname, '../..'),
    })
    await waitOn({
      resources: ['http://localhost:3030'],
    })

    const tbbt = require.resolve('tbbt-ld/dist/tbbt.nq')
    await client.store.put(fromFile(tbbt))
  })

  context('executing queries', () => {
    it('sh:zeroOrMorePath includes self node', async () => {
      // given
      const shape = await parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.zeroOrMorePath} ${schema.parent} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('sheldon-cooper'),
        subjectVariable: 'person',
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
        ${tbbt('sheldon-cooper')} ${schema.parent} ${tbbt('mary-cooper')} .
        ${tbbt('mary-cooper')} ${schema.givenName} "Mary" .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })
  })
})
