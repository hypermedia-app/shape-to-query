import * as fs from 'node:fs'
import * as path from 'node:path'
import { use, expect } from 'chai'
import $rdf from '@zazuko/env'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import sparqljs from 'sparqljs'
import { globSync } from 'glob'
import { UnionRepeatedPatternsRemover } from '../../../lib/optimizer/UnionRepeatedPatternsRemover.js'
import { BlankNodeScopeFixer } from '../../../lib/optimizer/BlankNodeScopeFixer.js'

const implementations = [
  UnionRepeatedPatternsRemover,
  BlankNodeScopeFixer,
]

describe('Optimizers', () => {
  for (const Processor of implementations) {
    const __dirname = new URL(Processor.name, import.meta.url).pathname

    context(Processor.name, () => {
      use(jestSnapshotPlugin())

      const parser = new sparqljs.Parser()
      const generator = new sparqljs.Generator()

      function parseQuery(fileName: string) {
        return parser.parse(fs.readFileSync(path.resolve(__dirname, fileName)).toString())
      }

      function testCase(filePath: string) {
        const fileName = path.basename(filePath)

        it(fileName, () => {
          const query = parseQuery(filePath)
          const result = new Processor($rdf).process(query)
          expect(generator.stringify(result)).toMatchSnapshot()
        })
      }

      globSync(path.resolve(__dirname, '*.rq')).forEach(testCase)
    })
  }
})
