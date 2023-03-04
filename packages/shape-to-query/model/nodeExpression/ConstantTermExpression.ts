import { NamedNode, Literal } from 'rdf-js'
import { SparqlTemplateResult, sparql } from '@tpluscode/sparql-builder'
import { NodeExpression, Parameters } from './index'

export class ConstantTermExpression implements NodeExpression {
  constructor(public node: NamedNode | Literal) {
  }

  buildPatterns({ object }: Parameters): SparqlTemplateResult {
    return sparql`BIND(${this.node} as ${object})`
  }
}
