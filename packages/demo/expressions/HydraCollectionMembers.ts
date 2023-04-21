import { Term } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import namespace from '@rdfjs/namespace'
import { NodeExpression, Parameters } from '@hydrofoil/shape-to-query/nodeExpressions.js'

const ex = namespace('http://example.org/')

export class HydraCollectionMemberExpression implements NodeExpression {
  static match(pointer) {
    return pointer.has(rdf.type, ex.HydraCollectionMembersExpression).terms.length > 0
  }

  static fromPointer({ term }: GraphPointer) {
    return new HydraCollectionMemberExpression(term)
  }

  constructor(public readonly term: Term) {
  }

  buildPatterns({ subject, variable, object }: Parameters) {
    const memberAssertion = variable()
    const ma1o = variable()
    const ma1p = variable()
    const ma2s = variable()
    const ma2p = variable()
    const ma3s = variable()
    const ma3o = variable()

    return sparql`
      ${subject} ((${rdf.type}*)/${hydra.memberAssertion}) ${memberAssertion} .
    
      optional { ${memberAssertion} ${hydra.property} ${ma1p} ; ${hydra.object} ${ma1o} . ${object} ${ma1p} ${ma1o} . }
      filter(!bound(${ma1p}) || (bound(${ma1p}) && bound(${object})))
    
      optional { ${memberAssertion} ${hydra.property} ${ma2p} ; ${hydra.subject} ${ma2s} . ${ma2s} ${ma2p} ${object} . }
      filter(!bound(${ma2p}) || (bound(${ma2p}) && bound(${object})))
    
      optional { ${memberAssertion} ${hydra.subject} ${ma3s} ; ${hydra.object} ${ma3o} . ${ma3s} ${object} ${ma3o} . }
      filter(!bound(${ma3s}) || (bound(${ma3s}) && bound(${object})))
    `
  }
}
