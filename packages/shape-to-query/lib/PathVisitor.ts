import type { NamedNode, Variable } from '@rdfjs/types'
import * as Path from 'clownface-shacl-path'
import $rdf from '@zazuko/env/web.js'
import type sparqljs from 'sparqljs'
import { VariableSequence } from './variableSequence.js'
import { ShapePatterns, emptyPatterns, flatten } from './shapePatterns.js'

interface Context {
  pathStart: Variable | NamedNode
  pathEnd?: Variable | NamedNode
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
      const whereClause: sparqljs.Pattern[] = [
        ...inner.whereClause,
        {
          type: 'bind',
          variable: intermediatePath,
          expression: pathEnd,
        },
      ]

      if (result === emptyPatterns) {
        result = {
          whereClause: [{
            type: 'group',
            patterns: [...whereClause],
          }],
          constructClause: inner.constructClause,
        }
      } else {
        result = {
          whereClause: [{
            type: 'union',
            patterns: [{
              type: 'group',
              patterns: result.whereClause,
            }, {
              type: 'group',
              patterns: whereClause,
            }],
          }],
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
      whereClause: [{
        type: 'bgp',
        triples: [{
          subject: pathStart,
          predicate: path.term,
          object: pathEnd,
        }],
      }],
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
      whereClause: [{
        type: 'union',
        patterns: [{
          type: 'bind',
          variable: pathEnd as unknown as sparqljs.VariableTerm,
          expression: pathStart,
        }, {
          type: 'group',
          patterns: inner.whereClause,
        }],
      }],
      constructClause: inner.constructClause,
    }
  }

  visitZeroOrOnePath({ path }: Path.ZeroOrOnePath, { pathStart, pathEnd = this.variable() }: Context): ShapePatterns {
    const orMorePathVariable = this.variable()
    const inner: ShapePatterns = path.accept(this, { pathStart, pathEnd: orMorePathVariable })
    const whereClause: [sparqljs.UnionPattern] = [{
      type: 'union',
      patterns: [{
        type: 'bind', expression: pathStart, variable: pathEnd as sparqljs.VariableTerm,
      }, {
        type: 'group',
        patterns: [
          ...inner.whereClause,
          { type: 'bind', expression: orMorePathVariable, variable: pathEnd as sparqljs.VariableTerm },
        ],
      }],
    }]

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

    return {
      whereClause: [{
        type: 'bgp',
        triples: [{
          subject: pathStart,
          predicate: {
            type: 'path',
            pathType: '*',
            items: [path.term],
          },
          object: intermediateNode,
        }, {
          subject: intermediateNode,
          predicate: path.term,
          object: pathEnd,
        }],
      }],
      // whereClause: sparql`${pathStart} ${path.term}* ${intermediateNode} . \n${outPattern}`,
      constructClause: [$rdf.quad(intermediateNode, path.term, pathEnd)],
    }
  }
}
