import type { Term, Variable } from 'rdf-js'
import * as Path from 'clownface-shacl-path'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { VariableSequence } from './variableSequence'

interface Context {
  pathStart: Term
  pathEnd?: Term
}

export default class extends Path.PathVisitor<SparqlTemplateResult, Context> {
  private _constructPatterns: SparqlTemplateResult[] = []

  constructor(private variable: VariableSequence) {
    super()
  }

  get constructPatterns(): SparqlTemplateResult {
    return sparql`${this._constructPatterns}`
  }

  visitAlternativePath({ paths }: Path.AlternativePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    const [first, ...rest] = paths
    const intermediatePaths: Variable[] = [this.variable()]

    return rest.reduce((union, path) => {
      const intermediatePath = this.variable()
      intermediatePaths.push(intermediatePath)

      return sparql`${union} UNION {
       ${path.accept(this, { pathStart, pathEnd: intermediatePath })}
      BIND(${intermediatePath} as ${pathEnd})
      }`
    }, sparql`{
      ${first.accept(this, { pathStart, pathEnd: intermediatePaths[0] })}
      BIND(${intermediatePaths[0]} as ${pathEnd})
    }`)
  }

  visitInversePath({ path }: Path.InversePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    return path.accept(this, { pathStart: pathEnd, pathEnd: pathStart })
  }

  visitOneOrMorePath(path: Path.OneOrMorePath, arg?: Context): SparqlTemplateResult {
    return this.greedyPath(path, arg)
  }

  visitPredicatePath(path: Path.PredicatePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    const pattern = sparql`${pathStart} ${path.term} ${pathEnd} .`
    this._constructPatterns.push(pattern)
    return pattern
  }

  visitSequencePath({ paths }: Path.SequencePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    let patterns = sparql``
    let segStart = pathStart
    let segEnd = this.variable()

    for (const [index, segment] of paths.entries()) {
      const isLast = index === paths.length - 1
      patterns = sparql`${patterns}\n${segment.accept(this, {
        pathStart: segStart,
        pathEnd: isLast ? pathEnd : segEnd,
      })}`

      segStart = segEnd
      segEnd = this.variable()
    }

    return patterns
  }

  visitZeroOrMorePath(path: Path.ZeroOrMorePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    return sparql`
    {
      BIND (${pathStart} as ${pathEnd})
    } UNION {
      ${this.greedyPath(path, { pathStart, pathEnd })}
    }
    `
  }

  visitZeroOrOnePath({ path }: Path.ZeroOrOnePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    const orMorePathVariable = this.variable()

    return sparql`{
      BIND(${pathStart} as ${pathEnd})
    } UNION {
      ${path.accept(this, { pathStart, pathEnd: orMorePathVariable })}
      BIND(${orMorePathVariable} as ${pathEnd})
    }
    `
  }

  private greedyPath({ path }: Path.ZeroOrMorePath | Path.OneOrMorePath, { pathStart, pathEnd = this.variable() }: Context): SparqlTemplateResult {
    if (!(path instanceof Path.PredicatePath)) {
      throw new Error('Only Predicate Path is supported as child of *OrMorePaths')
    }

    const intermediateNode = this.variable()
    const outPattern = sparql`${intermediateNode} ${path.term} ${pathEnd} .`

    this._constructPatterns.push(outPattern)
    return sparql`${pathStart} ${path.term}* ${intermediateNode} . \n${outPattern}`
  }
}
