import { BaseQuad } from 'rdf-js'
import $rdf from '@zazuko/env'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'

export interface ShapePatterns {
  whereClause: string | SparqlTemplateResult
  constructClause: BaseQuad[]
  childPatterns?: ShapePatterns[]
  /**
   * Patterns to inserted into a UNION block
   */
  unionPatterns?: string | SparqlTemplateResult
}

export const emptyPatterns: ShapePatterns = {
  whereClause: '',
  constructClause: [],
  childPatterns: [],
}

export function flatten(...patterns: ShapePatterns[]): ShapePatterns {
  if (patterns.every(sp => sp === emptyPatterns)) {
    return emptyPatterns
  }

  const whereClause = patterns.reduce((prev, next) => sparql`${prev}\n${next.whereClause}`, sparql``)
  const unionPatterns = patterns.reduce((prev, next) => !next.unionPatterns ? prev : sparql`${prev}\n${next.unionPatterns}`, sparql``)

  return {
    whereClause,
    unionPatterns,
    constructClause: unique(patterns.flatMap(p => p.constructClause)),
    childPatterns: patterns.flatMap(p => p.childPatterns || []),
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

  const unionedPatterns = nonEmpty.filter(({ whereClause }) => whereClause)

  if (unionedPatterns.length === 1) {
    return unionedPatterns[0]
  }

  const unionedBgps = unionedPatterns.map(({ unionPatterns, whereClause }, _, arr) =>
    arr.length > 1 && unionPatterns ? sparql`${unionPatterns}\n${whereClause}` : whereClause,
  )

  return {
    constructClause: unique(nonEmpty.flatMap(p => p.constructClause)),
    whereClause: sparql`${UNION(...unionedBgps)}`,
    childPatterns: nonEmpty.flatMap(p => p.childPatterns || []),
  }
}
