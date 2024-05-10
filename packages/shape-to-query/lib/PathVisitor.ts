import type { Term } from '@rdfjs/types'
import * as Path from 'clownface-shacl-path'
import $rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/sparql-builder'
import { VariableSequence } from './variableSequence.js'
import { ShapePatterns, emptyPatterns, flatten } from './shapePatterns.js'

interface Context {
  pathStart: Term
  pathEnd?: Term
}

export default class extends Path.PathVisitor<ShapePatterns, Context> {
  constructor(private variable: VariableSequence) {
    super()
  }

  visitAlternativePath({ paths }: Path.AlternativePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    let result = emptyPatterns

    for (const path of paths) {
      const intermediatePath = this.variable()
      const inner = path.accept(this, { pathStart, pathEnd: intermediatePath })
      const whereClause = sparql`${inner.whereClause}\nBIND(${intermediatePath} as ${pathEnd})`

      if (result === emptyPatterns) {
        result = {
          whereClause: sparql`{ ${whereClause} }`,
          constructClause: inner.constructClause,
        }
      } else {
        result = {
          whereClause: sparql`${result.whereClause} UNION { ${whereClause} }`,
          constructClause: [...result.constructClause, ...inner.constructClause],
        }
      }
    }

    return result
  }

  visitInversePath({ path }: Path.InversePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    return path.accept(this, { pathStart: pathEnd, pathEnd: pathStart })
  }

  visitOneOrMorePath(path: Path.OneOrMorePath, arg?: Context): ShapePatterns {
    return this.greedyPath(path, arg)
  }

  visitPredicatePath(path: Path.PredicatePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    return {
      whereClause: sparql`${pathStart} ${path.term} ${pathEnd} .`,
      constructClause: [$rdf.quad(pathStart, path.term, pathEnd)],
    }
  }

  visitSequencePath({ paths }: Path.SequencePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    let segStart = pathStart
    let segEnd = this.variable()

    let result: ShapePatterns = emptyPatterns

    for (const [index, segment] of paths.entries()) {
      const isLast = index === paths.length - 1
      result = flatten(result, segment.accept(this, {
        pathStart: segStart,
        pathEnd: isLast ? pathEnd : segEnd,
      }))

      segStart = segEnd
      segEnd = this.variable()
    }

    return result
  }

  visitZeroOrMorePath(path: Path.ZeroOrMorePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    const inner = this.greedyPath(path, { pathStart, pathEnd })

    return {
      whereClause: sparql`
      {
        BIND (${pathStart} as ${pathEnd})
      } UNION {
        ${inner.whereClause}
      }
      `,
      constructClause: inner.constructClause,
    }
  }

  visitZeroOrOnePath({ path }: Path.ZeroOrOnePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    const orMorePathVariable = this.variable()
    const inner: ShapePatterns = path.accept(this, { pathStart, pathEnd: orMorePathVariable })
    const whereClause = sparql`{
        BIND(${pathStart} as ${pathEnd})
      } UNION {
        ${inner.whereClause}
        BIND(${orMorePathVariable} as ${pathEnd})
      }`

    return {
      whereClause,
      constructClause: inner.constructClause,
    }
  }

  private greedyPath({ path }: Path.ZeroOrMorePath | Path.OneOrMorePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    if (!(path instanceof Path.PredicatePath)) {
      throw new Error('Only Predicate Path is supported as child of *OrMorePaths')
    }

    const intermediateNode = this.variable()
    const outPattern = sparql`${intermediateNode} ${path.term} ${pathEnd} .`

    return {
      whereClause: sparql`${pathStart} ${path.term}* ${intermediateNode} . \n${outPattern}`,
      constructClause: [$rdf.quad(intermediateNode, path.term, pathEnd)],
    }
  }
}
