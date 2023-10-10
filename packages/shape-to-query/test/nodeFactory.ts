import { DatasetCore, NamedNode } from 'rdf-js'
import module from 'module'
import $rdf from '@zazuko/env'
import { Dataset } from '@zazuko/env/lib/Dataset'
import type { AnyPointer, GraphPointer } from 'clownface'
import { turtle } from '@tpluscode/rdf-string'
import { Parser } from 'n3'
import addAll from 'rdf-dataset-ext/addAll.js'
import debug from 'debug'
import fromFile from 'rdf-utils-fs/fromFile.js'

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
  (...[strings, ...values]: Parameters<typeof turtle>): GraphPointer<NamedNode, Dataset>
  file(file: string): Promise<GraphPointer<NamedNode>>
}

export const parse: ParseHelper = ((...[strings, ...values]: Parameters<typeof turtle>) => {
  const dataset = raw(strings, ...values)

  return $rdf.clownface({ dataset }).namedNode('')
}) as any

const require = module.createRequire(import.meta.url)
parse.file = async (file: string) => {
  const fullPath = require.resolve(`./example/${file}`)
  const dataset = await $rdf.dataset().import(fromFile(fullPath))
  return $rdf.clownface({ dataset }).namedNode('')
}

export function raw(...[strings, ...values]: Parameters<typeof turtle>): Dataset {
  const inputTurtle = turtle(strings, ...values).toString()
  log(inputTurtle)
  return $rdf.dataset(parser.parse(inputTurtle))
}

export function append(...[strings, ...values]: Parameters<typeof turtle>) {
  return {
    to(other: DatasetCore | AnyPointer) {
      const dataset = 'dataset' in other ? other.dataset : other
      addAll(dataset, raw(strings, ...values))
    },
  }
}
