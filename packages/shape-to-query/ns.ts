import $rdf from '@zazuko/env/web.js'
import type { NamespaceBuilder } from '@rdfjs/namespace'

type Terms = 'optional'
| 'SPORule'
| 'predicateFilter'
| 'objectFilter'

const ns: NamespaceBuilder<Terms> = $rdf.namespace('https://hypermedia.app/shape-to-query#')

export default ns
