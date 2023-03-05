import { BaseQuad } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
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
  const whereClause = patterns.reduce((prev, next) => sparql`${prev}\n${next.whereClause}`, sparql``)

  return {
    whereClause,
    constructClause: unique(patterns.flatMap(p => p.constructClause)),
  }
}

function unique(...construct: BaseQuad[][]): BaseQuad[] {
  const set = new TermSet<BaseQuad>(construct.flatMap(arr => arr))
  return [...set]
}

export function union(...patterns: ShapePatterns[]): ShapePatterns {
  return {
    constructClause: unique(patterns.flatMap(p => p.constructClause)),
    whereClause: sparql`${UNION(...patterns.map(({ whereClause }) => whereClause))}`,
  }
}
