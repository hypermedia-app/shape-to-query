import type { NamedNode } from '@rdfjs/types'
import { sparql } from '@tpluscode/sparql-builder'
import type { MultiPointer } from 'clownface'
import $rdf from '@zazuko/env/web.js'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { isGraphPointer } from 'is-graph-pointer'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { Parameters, Target } from './Target.js'

export class TargetClass implements Target {
  static readonly property = sh.targetClass

  constructor(public readonly classes: MultiPointer<NamedNode>) {
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
