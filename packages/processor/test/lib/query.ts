import * as fs from 'node:fs'
import type { SparqlQuery } from 'sparqljs'
import { Parser, Generator } from 'sparqljs'

const parser = new Parser()
const generator = new Generator()

export function loadQuery(path: string) {
  const query = fs.readFileSync(new URL('../queries/' + path, import.meta.url).pathname, 'utf-8')

  return parser.parse(query)
}

export function stringifyQuery(query: SparqlQuery) {
  return generator.stringify(query)
}
