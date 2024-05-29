import module from 'module'
import type { NamedNode } from '@rdfjs/types'
import $rdf from '@zazuko/env-node'
import { Dataset } from '@zazuko/env/lib/Dataset.js'
import type { AnyContext, AnyPointer, GraphPointer } from 'clownface'
import { turtle } from '@tpluscode/rdf-string'
import { Parser } from 'n3'
import debug from 'debug'

const log = debug('turtle')

const parser = new Parser()

export function namedNode<Iri extends string = string>(term: Iri | NamedNode<Iri>) {
  return $rdf.clownface({ dataset: $rdf.dataset() }).namedNode(term)
}

export function blankNode(label?: string) {
  return $rdf.clownface({ dataset: $rdf.dataset() }).blankNode(label)
}

export function literal(value: string, dtOrLang?: string | NamedNode) {
  return $rdf.clownface({ dataset: $rdf.dataset() }).literal(value, dtOrLang)
}

interface ParseHelper {
  (...params: Parameters<typeof turtle>): GraphPointer<NamedNode, Dataset>
  file(file: string): Promise<GraphPointer<NamedNode>>
  any(...params: Parameters<typeof turtle>): AnyPointer<AnyContext, Dataset>
}

function parseWrapper<T extends AnyPointer>(getNode: (ptr: AnyPointer) => T) {
  return (...[strings, ...values]: Parameters<typeof turtle>) => {
    const dataset = raw(strings, ...values)
    return getNode($rdf.clownface({ dataset }))
  }
}

export const parse: ParseHelper = parseWrapper(ptr => ptr.namedNode('')) as any

parse.any = parseWrapper(ptr => ptr) as any

const require = module.createRequire(import.meta.url)
parse.file = async (file: string) => {
  const fullPath = require.resolve(`./example/${file}`)
  const dataset = await $rdf.dataset().import($rdf.fromFile(fullPath))
  return $rdf.clownface({ dataset }).namedNode('')
}

export function raw(...[strings, ...values]: Parameters<typeof turtle>): Dataset {
  const inputTurtle = turtle(strings, ...values).toString()
  log(inputTurtle)
  return $rdf.dataset(parser.parse(inputTurtle))
}

export function append(...[strings, ...values]: Parameters<typeof turtle>) {
  return {
    to(other: Dataset | AnyPointer<AnyContext, Dataset>) {
      const dataset = 'dataset' in other ? other.dataset : other
      dataset.addAll(raw(strings, ...values))
    },
  }
}
