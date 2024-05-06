import * as path from 'node:path'
import * as url from 'node:url'
import StreamClient from 'sparql-http-client'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import $rdf from '@zazuko/env'
import { sh, schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { constructQuery } from '../lib/shapeToQuery.js'
import { parse } from './nodeFactory.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const client = new StreamClient({
  endpointUrl: 'http://localhost:3030/s2q/query',
})

before(async function () {
  this.timeout(100000)
  await compose.upAll({
    cwd: path.resolve(__dirname, '../..'),
  })
  await waitOn({
    resources: ['http://localhost:3030'],
  })
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
    const result = await $rdf.dataset().import(constructQuery(shape).execute(client))

    // then
    expect(result.size).to.equal(0)
  })
})
