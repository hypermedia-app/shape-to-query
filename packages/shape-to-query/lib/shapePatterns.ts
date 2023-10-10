import { BaseQuad } from 'rdf-js'
import $rdf from '@zazuko/env'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'

export interface ShapePatterns {
  whereClause: string | SparqlTemplateResult
  constructClause: BaseQuad[]
}

export const emptyPatterns: ShapePatterns = {
  whereClause: '',
  constructClause: [],
}

export function flatten(...patterns: ShapePatterns[]): ShapePatterns {
  if (patterns.every(sp => sp === emptyPatterns)) {
    return emptyPatterns
  }

  const whereClause = patterns.reduce((prev, next) => sparql`${prev}\n${next.whereClause}`, sparql``)

  return {
    whereClause,
    constructClause: unique(patterns.flatMap(p => p.constructClause)),
  }
}

function unique(...construct: BaseQuad[][]): BaseQuad[] {
  const set = $rdf.termSet(construct.flatMap(arr => arr))
  return [...set]
}

export function union(...patterns: ShapePatterns[]): ShapePatterns {
  const nonEmpty = patterns.filter(p => p !== emptyPatterns)

  if (nonEmpty.length === 0) {
    return emptyPatterns
  }

  return {
    constructClause: unique(nonEmpty.flatMap(p => p.constructClause)),
    whereClause: sparql`${UNION(...nonEmpty.map(({ whereClause }) => whereClause).filter(Boolean))}`,
  }
}
