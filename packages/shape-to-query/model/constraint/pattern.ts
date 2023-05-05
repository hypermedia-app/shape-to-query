import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import { ConstraintComponent, Parameters } from './ConstraintComponent.js'

export class PatternConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: GraphPointer) {
    const pattern = shape.out(sh.pattern)
    const flags = shape.out(sh.flags).value
    if (isGraphPointer(pattern)) {
      yield new PatternConstraintComponent(pattern.value, flags)
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
