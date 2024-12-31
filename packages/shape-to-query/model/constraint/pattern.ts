import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { Literal } from '@rdfjs/types'
import { isLiteral } from 'is-graph-pointer'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent, { assertTerm } from './ConstraintComponent.js'

export class PatternConstraintComponent extends ConstraintComponent {
  private readonly args: ReadonlyArray<Literal>

  static * fromShape(shape: PropertyShape) {
    const patterns = shape.get(sh.pattern) || []
    const flags = shape.get(sh.flags)

    for (const pattern of patterns) {
      assertTerm(pattern)
      if (!isLiteral(pattern.pointer)) {
        throw new Error('Pattern must be a Literal')
      }
      if (flags) {
        for (const flag of flags) {
          assertTerm(flag)
          if (!isLiteral(flag.pointer)) {
            throw new Error('Flags must be a Literal')
          }

          yield new PatternConstraintComponent(pattern.pointer.term, flag.pointer.term)
        }
      } else {
        yield new PatternConstraintComponent(pattern.pointer.term)
      }
    }
  }

  constructor(public readonly pattern: Literal, public readonly flags?: Literal) {
    super(sh.PatternConstraintComponent)

    this.args = flags ? [pattern, flags] : [pattern]
  }

  buildPatterns({ valueNode }: Parameters): [sparqljs.FilterPattern] {
    return [{
      type: 'filter',
      expression: {
        type: 'operation',
        operator: 'regex',
        args: [valueNode, ...this.args],
      },
    }]
  }
}
