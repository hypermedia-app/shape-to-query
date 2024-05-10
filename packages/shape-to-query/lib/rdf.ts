import type { Literal } from '@rdfjs/types'
import $rdf from '@zazuko/env/web.js'
import { xsd } from '@tpluscode/rdf-ns-builders/loose'

export const TRUE: Literal = $rdf.literal('true', xsd.boolean)
