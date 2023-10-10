import { Literal } from 'rdf-js'
import $rdf from '@zazuko/env'
import { xsd } from '@tpluscode/rdf-ns-builders/loose'

export const TRUE: Literal = $rdf.literal('true', xsd.boolean)
