import { BlankNode, Literal, NamedNode } from 'rdf-js'
import module from 'module'
import clownface, { AnyContext, AnyPointer, GraphPointer } from 'clownface'
import DatasetExt from 'rdf-ext/lib/Dataset'
import $rdf from 'rdf-ext'
import { turtle } from '@tpluscode/rdf-string'
import { Parser } from 'n3'
import addAll from 'rdf-dataset-ext/addAll.js'
import debug from 'debug'
import fromFile from 'rdf-utils-fs/fromFile.js'

const log = debug('turtle')

const parser = new Parser()

export function namedNode<Iri extends string = string>(term: Iri | NamedNode<Iri>): GraphPointer<NamedNode, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).namedNode(term)
}

export function blankNode(label?: string): GraphPointer<BlankNode, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).blankNode(label)
}

export function literal(value: string, dtOrLang?: string | NamedNode): GraphPointer<Literal, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).literal(value, dtOrLang)
}

interface ParseHelper {
  (...[strings, ...values]: Parameters<typeof turtle>): GraphPointer<NamedNode, DatasetExt>
  file(file: string): Promise<GraphPointer<NamedNode, DatasetExt>>
}

export const parse: ParseHelper = ((...[strings, ...values]: Parameters<typeof turtle>): GraphPointer<NamedNode, DatasetExt> => {
  const dataset = raw(strings, ...values)

  return clownface({ dataset }).namedNode('')
}) as any

const require = module.createRequire(import.meta.url)
parse.file = async (file: string) => {
  const fullPath = require.resolve(`./example/${file}`)
  const dataset = await $rdf.dataset().import(fromFile(fullPath))
  return clownface({ dataset }).namedNode('')
}

export function raw(...[strings, ...values]: Parameters<typeof turtle>): DatasetExt {
  const inputTurtle = turtle(strings, ...values).toString()
  log(inputTurtle)
  return $rdf.dataset(parser.parse(inputTurtle))
}

export function append(...[strings, ...values]: Parameters<typeof turtle>) {
  return {
    to(other: DatasetExt | AnyPointer<AnyContext, DatasetExt>) {
      const dataset = 'dataset' in other ? other.dataset : other
      addAll(dataset, raw(strings, ...values))
    },
  }
}
