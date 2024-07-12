import * as fs from 'node:fs'
import * as path from 'node:path'
import chai, { expect } from 'chai'
import $rdf from '@zazuko/env'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import sparqljs from 'sparqljs'
import { globSync } from 'glob'
import { UnionRepeatedPatternsRemover } from '../../../../lib/optimizer/UnionRepeatedPatternsRemover.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('UselessUnionRemover', () => {
  chai.use(jestSnapshotPlugin())

  const parser = new sparqljs.Parser()
  const generator = new sparqljs.Generator()
  const processor = new UnionRepeatedPatternsRemover($rdf)

  function parseQuery(fileName: string) {
    return parser.parse(fs.readFileSync(path.resolve(__dirname, fileName)).toString())
  }

  function testCase(filePath: string) {
    const fileName = path.basename(filePath)

    it(fileName, () => {
      const query = parseQuery(filePath)
      const result = processor.process(query)
      expect(generator.stringify(result)).toMatchSnapshot()
    })
  }

  globSync(path.resolve(__dirname, '*.rq')).forEach(testCase)
})
