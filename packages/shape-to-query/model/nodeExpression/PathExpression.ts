import type { NamedNode, Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { toAlgebra } from 'clownface-shacl-path'
import type sparqljs from 'sparqljs'
import type { ModelFactory } from '../ModelFactory.js'
import { getOne, getOneOrZero } from './util.js'
import type { NodeExpression, Parameters, PatternBuilder } from './NodeExpression.js'
import NodeExpressionBase from './NodeExpression.js'

export class PathExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer) {
    return isBlankNode(pointer) && isGraphPointer(pointer.out(sh.path))
  }

  static fromPointer(pointer: GraphPointer, fromNode: ModelFactory) {
    const path = getOne(pointer, sh.path)
    const nodes = getOneOrZero(pointer, sh.nodes)

    if (nodes) {
      return new PathExpression(pointer.term, toAlgebra(path), fromNode.nodeExpression(nodes))
    }

    return new PathExpression(pointer.term, toAlgebra(path))
  }

  public get requiresFullContext(): boolean {
    return this.nodes?.requiresFullContext ?? false
  }

  public get rootIsFocusNode() {
    return false
  }

  constructor(public readonly term: Term, public readonly path: sparqljs.PropertyPath | NamedNode, public readonly nodes?: NodeExpression) {
    super()
  }

  _buildPatterns({ subject, object, variable, rootPatterns }: Parameters, builder: PatternBuilder): sparqljs.Pattern[] | sparqljs.BgpPattern {
    if (this.nodes) {
      const inner = builder.build(this.nodes, { subject, variable, rootPatterns })
      const joined = inner.object
      return [
        ...inner.patterns,
        {
          type: 'bgp',
          triples: [{
            subject: joined,
            predicate: this.path,
            object,
          }],
        },
      ]
    }

    return {
      type: 'bgp',
      triples: [{
        subject,
        predicate: this.path,
        object,
      }],
    }
  }
}
