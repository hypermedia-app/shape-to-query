import { Term } from 'rdf-js'
import { sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import ConstraintComponent, { Parameters, PropertyShape } from './ConstraintComponent.js'

export class ClassConstraintComponent extends ConstraintComponent {
  constructor(public readonly clas: Term) {
    super(sh.ClassConstraintComponent)
  }

  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.class)

    if (values) {
      for (const value of values) {
        if ('pointer' in value) {
          yield new ClassConstraintComponent(value.pointer.term)
        }
      }
    }
  }

  buildPropertyShapePatterns({ valueNode }: Parameters) {
    return sparql`${valueNode} a ${this.clas} .`
  }

  buildNodeShapePatterns({ focusNode }: Parameters) {
    return sparql`${focusNode} a ${this.clas} .`
  }
}
