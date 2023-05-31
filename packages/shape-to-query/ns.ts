import $rdf from 'rdf-ext'

type Terms = 'optional'
| 'SPORule'
| 'predicateFilter'
| 'objectFilter'

export default $rdf.namespace<Terms>('https://hypermedia.app/shape-to-query#')
