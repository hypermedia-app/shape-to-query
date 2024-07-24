import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { SELECT } from '@tpluscode/sparql-builder'
import rdf from '@zazuko/env/web.js'
import type { Parameters } from '@hydrofoil/shape-to-query/nodeExpressions.js'
import { NodeExpressionBase } from '@hydrofoil/shape-to-query/nodeExpressions.js'
import sparqljs from 'sparqljs'

const ex = rdf.namespace('http://example.org/')

export class HydraCollectionMemberExpression extends NodeExpressionBase {
  static match(pointer) {
    return pointer.has(rdf.ns.rdf.type, ex.HydraCollectionMembersExpression).terms.length > 0
  }

  static fromPointer({ term }: GraphPointer) {
    return new HydraCollectionMemberExpression(term)
  }

  get requiresFullContext(): boolean {
    return false
  }

  get rootIsFocusNode(): boolean {
    return false
  }

  constructor(public readonly term: Term) {
    super()
  }

  _buildPatterns({ subject, variable, object }: Parameters): sparqljs.Pattern[] {
    const memberAssertion = variable()
    const ma1o = variable()
    const ma1p = variable()
    const ma2s = variable()
    const ma2p = variable()
    const ma3s = variable()
    const ma3o = variable()

    const query = SELECT.ALL.WHERE`
      ${subject} ((${rdf.ns.rdf.type}*)/${rdf.ns.hydra.memberAssertion}) ${memberAssertion} .
    
      optional { ${memberAssertion} ${rdf.ns.hydra.property} ${ma1p} ; ${rdf.ns.hydra.object} ${ma1o} . ${object} ${ma1p} ${ma1o} . }
      filter(!bound(${ma1p}) || (bound(${ma1p}) && bound(${object})))
    
      optional { ${memberAssertion} ${rdf.ns.hydra.property} ${ma2p} ; ${rdf.ns.hydra.subject} ${ma2s} . ${ma2s} ${ma2p} ${object} . }
      filter(!bound(${ma2p}) || (bound(${ma2p}) && bound(${object})))
    
      optional { ${memberAssertion} ${rdf.ns.hydra.subject} ${ma3s} ; ${rdf.ns.hydra.object} ${ma3o} . ${ma3s} ${object} ${ma3o} . }
      filter(!bound(${ma3s}) || (bound(${ma3s}) && bound(${object})))
    `.build()

    const algebra = new sparqljs.Parser().parse(query) as unknown as sparqljs.SelectQuery
    return algebra.where
  }
}
