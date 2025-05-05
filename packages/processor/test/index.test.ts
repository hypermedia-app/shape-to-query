import * as url from 'node:url'
import path from 'node:path'
import rdf from '@zazuko/env/web.js'
import { glob } from 'glob'
import { expect } from 'chai'
import QueryProcessor from '../index.js'
import { loadQuery, stringifyQuery } from './lib/query.js'

const cwd = url.fileURLToPath(new URL('.', import.meta.url))

describe('@hydrofoil/sparql-processor', () => {
  describe('QueryProcessor', () => {
    context('no-op processing', () => {
      glob.sync('queries/*.{rq,ru}', { cwd }).forEach((file) => {
        const name = path.basename(file)

        it(`does not modify the query (${name})`, () => {
          const processor = new (class extends QueryProcessor {})(rdf)

          const processed = processor.process(loadQuery(name))

          expect(stringifyQuery(processed))
            .to.deep.equal(stringifyQuery(loadQuery(name)))
        })
      })
    })
  })
})
