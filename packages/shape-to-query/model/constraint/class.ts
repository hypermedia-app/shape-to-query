import type { NamedNode } from '@rdfjs/types'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import { isNamedNode } from 'is-graph-pointer'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent from './ConstraintComponent.js'

export class ClassConstraintComponent extends ConstraintComponent {
  constructor(public readonly clas: NamedNode) {
    super(sh.ClassConstraintComponent)
  }

  static * fromShape(shape: PropertyShape) {
    const values = shape.get(sh.class)

    if (values) {
      for (const value of values) {
        if ('pointer' in value) {
          if (!isNamedNode(value.pointer)) {
            throw new Error('sh:class value must be a NamedNode')
          }

          yield new ClassConstraintComponent(value.pointer.term)
        }
      }
    }
  }

  buildPropertyShapePatterns({ valueNode }: Parameters): [sparqljs.BgpPattern] {
    return [{
      type: 'bgp',
      triples: [{
        subject: valueNode,
        predicate: rdf.type,
        object: this.clas,
      }],
    }]
  }

  buildNodeShapePatterns({ focusNode }: Parameters): [sparqljs.BgpPattern] {
    return [{
      type: 'bgp',
      triples: [{
        subject: focusNode,
        predicate: rdf.type,
        object: this.clas,
      }],
    }]
  }
}
