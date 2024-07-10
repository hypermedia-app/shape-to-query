import type { Quad } from '@rdfjs/types'
import $rdf from '@zazuko/env/web.js'
import type sparqljs from 'sparqljs'

export interface ShapePatterns {
  whereClause: sparqljs.Pattern[]
  constructClause: Quad[]
  childPatterns?: ShapePatterns[]
}

export const emptyPatterns: ShapePatterns = {
  whereClause: [],
  constructClause: [],
  childPatterns: [],
}

export function flatten(...patterns: ShapePatterns[]): ShapePatterns {
  if (patterns.every(sp => sp === emptyPatterns)) {
    return emptyPatterns
  }

  const whereClause = patterns.flatMap(p => p.whereClause)

  return {
    whereClause,
    constructClause: unique(patterns.flatMap(p => p.constructClause)),
    childPatterns: patterns.flatMap(p => p.childPatterns || []),
  }
}

function unique(...construct: Quad[][]): Quad[] {
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
    let whereClause = unionedPatterns[0].whereClause
    if (whereClause.length === 1 && whereClause[0].type === 'group' && whereClause[0].patterns[0].type !== 'query') {
      whereClause = whereClause[0].patterns
    }

    return {
      ...unionedPatterns[0],
      whereClause,
    }
  }

  const unionedBgps = unionedPatterns.flatMap(({ whereClause }, _, arr) =>
    arr.length > 1 ? [...whereClause] : whereClause,
  )

  return {
    constructClause: unique(nonEmpty.flatMap(p => p.constructClause)),
    whereClause: [{
      type: 'union',
      patterns: unionedBgps,
    }],
    childPatterns: nonEmpty.flatMap(p => p.childPatterns || []),
  }
}
