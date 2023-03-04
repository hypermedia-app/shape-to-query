import { NamedNode } from 'rdf-js'
import { sparql } from '@tpluscode/sparql-builder'
import { MultiPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { isGraphPointer } from 'is-graph-pointer'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { ShapePatterns } from '../../lib/shapePatterns'
import { Target, Parameters } from './Target'

export class TargetClass extends Target {
  constructor(public readonly classes: MultiPointer<NamedNode>) {
    super()
  }

  buildPatterns({ focusNode, variable }: Parameters): ShapePatterns {
    if (isGraphPointer(this.classes)) {
      const typeQuad = $rdf.quad(focusNode, rdf.type, this.classes.term)
      return {
        constructClause: [typeQuad],
        whereClause: sparql`${typeQuad}`,
      }
    }

    const classVariable = variable()
    const typeQuad = $rdf.quad(focusNode, rdf.type, classVariable)
    const values = this.classes.terms.map(term => ({ [classVariable.value]: term }))
    return {
      constructClause: [typeQuad],
      whereClause: sparql`
        ${typeQuad}
        ${VALUES(...values)}
      `,
    }
  }
}
