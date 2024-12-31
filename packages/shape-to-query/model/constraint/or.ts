import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { NodeShape } from '../NodeShape.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent, { assertList } from './ConstraintComponent.js'

export class OrConstraintComponent extends ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
    super(sh.OrConstraintComponent)
  }

  static * fromShape(shape: PropertyShape, factory: ModelFactory) {
    const ors = shape.get(sh.or) || []

    for (const or of ors) {
      assertList(or)
      yield new OrConstraintComponent(or.list.map(p => factory.nodeShape(p)))
    }
  }

  buildPatterns(arg: Parameters): [sparqljs.UnionPattern] {
    let propExpr: sparqljs.BgpPattern | undefined
    if (arg.propertyPath) {
      propExpr = {
        type: 'bgp',
        triples: [{
          subject: arg.focusNode,
          predicate: arg.propertyPath,
          object: arg.valueNode,
        }],
      }
    }

    const inner = this.inner
      .map((i): sparqljs.GroupPattern => {
        const patterns = i.buildConstraints(arg)
        return {
          type: 'group',
          patterns: propExpr ? [propExpr, ...patterns] : patterns,
        }
      })
      .filter(gr => gr.patterns.length > 0)

    return [{
      type: 'union',
      patterns: inner,
    }]
  }
}
