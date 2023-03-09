import { Literal } from 'rdf-js'
import $rdf from 'rdf-ext'
import { xsd } from '@tpluscode/rdf-ns-builders/loose'

export const TRUE: Literal = $rdf.literal('true', xsd.boolean)
