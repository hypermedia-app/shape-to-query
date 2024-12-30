import * as path from 'node:path'
import * as url from 'node:url'
import module from 'module'
import StreamClient from 'sparql-http-client'
import * as compose from 'docker-compose/dist/v2.js'
import waitOn from 'wait-on'
import $rdf from '@zazuko/env-node'
import { sh, schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { constructQuery } from '../lib/shapeToQuery.js'
import { parse } from './nodeFactory.js'

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

describe('@hydrofoil/shape-to-query', () => {
  it('works with sparql-http-client', async () => {
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
    expect(result.size).to.equal(19)
  })
})
