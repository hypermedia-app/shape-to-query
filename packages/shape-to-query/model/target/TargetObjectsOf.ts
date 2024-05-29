import type { NamedNode } from '@rdfjs/types'
import $rdf from '@zazuko/env/web.js'
import type { MultiPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { Target, Parameters } from './Target.js'

export class TargetObjectsOf implements Target {
  static readonly property = sh.targetObjectsOf

  constructor(public readonly properties: MultiPointer<NamedNode>) {
  }

  buildPatterns({ focusNode, variable }: Parameters): ShapePatterns {
    const propObject = variable()
    if (isGraphPointer(this.properties)) {
      const patternQuad = $rdf.quad(propObject, this.properties.term, focusNode)
      return {
        constructClause: [patternQuad],
        whereClause: sparql`${patternQuad}`,
      }
    }

    const propVariable = variable()
    const values = this.properties.map(({ term }) => ({ [propVariable.value]: term }))
    const propPatternQuad = $rdf.quad(propObject, propVariable, focusNode)
    return {
      constructClause: [propPatternQuad],
      whereClause: sparql`
        ${propPatternQuad}
        ${VALUES(...values)}
      `,
    }
  }
}
