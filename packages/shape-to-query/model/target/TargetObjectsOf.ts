import { NamedNode } from 'rdf-js'
import $rdf from '@zazuko/env'
import type { MultiPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { isGraphPointer } from 'is-graph-pointer'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { Target, Parameters } from './Target.js'

export class TargetObjectsOf extends Target {
  constructor(public readonly properties: MultiPointer<NamedNode>) {
    super()
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
