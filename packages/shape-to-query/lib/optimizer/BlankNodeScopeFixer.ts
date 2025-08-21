import Processor from '@hydrofoil/sparql-processor'
import type { BlankNode, DataFactory } from '@rdfjs/types'
import type { GroupPattern, Pattern, UnionPattern } from 'sparqljs'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { TermMapFactory } from '@rdfjs/term-map/Factory.js'

/**
 * Ensures that blank nodes are renamed when necessary
 * to avoid using the same labels in different scopes
 */
export class BlankNodeScopeFixer extends Processor<Environment<TermMapFactory | DataFactory>> {
  constructor(
    factory: Environment<TermMapFactory | DataFactory>,
    private scopeCounter = 0,
    private blankNodes = factory.termMap()) {
    super(factory)
  }

  clone() {
    return new BlankNodeScopeFixer(this.factory, this.scopeCounter, this.blankNodes)
  }

  processGroup(group: GroupPattern): Pattern {
    this.incrementScope()
    return super.processGroup(group)
  }

  processUnion(union: UnionPattern): Pattern {
    const patterns = union.patterns.flatMap(pattern => {
      this.incrementScope()
      return this.processPattern(pattern)
    })

    return {
      ...union,
      patterns,
    }
  }

  processBlankNode(blankNode: BlankNode): BlankNode {
    if (!this.blankNodes.has(blankNode)) {
      this.blankNodes.set(blankNode, this.scopeCounter)
    }

    if (this.blankNodes.get(blankNode) === this.scopeCounter) {
      return blankNode
    }

    return this.factory.blankNode(`s${this.scopeCounter}_${blankNode.value}`)
  }

  private incrementScope() {
    this.scopeCounter++
  }
}
