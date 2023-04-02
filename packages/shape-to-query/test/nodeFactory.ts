import { BlankNode, Literal, NamedNode } from 'rdf-js'
import clownface, { AnyContext, AnyPointer, GraphPointer } from 'clownface'
import DatasetExt from 'rdf-ext/lib/Dataset'
import $rdf from 'rdf-ext'
import { turtle } from '@tpluscode/rdf-string'
import { Parser } from 'n3'
import addAll from 'rdf-dataset-ext/addAll.js'
import debug from 'debug'

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

export async function parse(...[strings, ...values]: Parameters<typeof turtle>): Promise<GraphPointer<NamedNode, DatasetExt>> {
  const dataset = await raw(strings, ...values)

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
