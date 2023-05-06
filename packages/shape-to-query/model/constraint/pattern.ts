import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { assertTerm, ConstraintComponent, Parameters, PropertyShape } from './ConstraintComponent.js'

export class PatternConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const patterns = shape.get(sh.pattern) || []
    const flags = shape.get(sh.flags)

    for (const pattern of patterns) {
      assertTerm(pattern)
      if (flags) {
        for (const flag of flags) {
          assertTerm(flag)
          yield new PatternConstraintComponent(pattern.pointer.value, flag.pointer.value)
        }
      } else {
        yield new PatternConstraintComponent(pattern.pointer.value)
      }
    }
  }

  constructor(public readonly pattern: string, public readonly flags?: string) {
    super(sh.PatternConstraintComponent)
  }

  buildPatterns({ valueNode }: Parameters) {
    const flags = this.flags ? `, "${this.flags}"` : ''

    return sparql`FILTER(REGEX(${valueNode}, "${this.pattern}"${flags}))`
  }
}
