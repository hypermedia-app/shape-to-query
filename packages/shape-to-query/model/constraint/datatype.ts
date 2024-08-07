import type { NamedNode, Variable } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent from './ConstraintComponent.js'

export class DatatypeConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const datatypes = shape.get(sh.datatype)

    if (datatypes) {
      for (const datatype of datatypes) {
        if (!('pointer' in datatype)) {
          continue
        }

        yield new DatatypeConstraintComponent(datatype.pointer.term as NamedNode)
      }
    }
  }

  constructor(private readonly datatype: NamedNode) {
    super(sh.DatatypeConstraintComponent)
  }

  buildNodeShapePatterns({ focusNode }: Parameters): sparqljs.Pattern[] {
    return [this.filter(focusNode)]
  }

  buildPropertyShapePatterns({ valueNode }: Parameters): [sparqljs.Pattern] {
    return [this.filter(valueNode)]
  }

  private filter(node: NamedNode | Variable): sparqljs.Pattern {
    const dt: sparqljs.OperationExpression = {
      type: 'operation',
      operator: 'datatype',
      args: [node],
    }

    return {
      type: 'filter',
      expression: {
        type: 'operation',
        operator: '=',
        args: [dt, this.datatype],
      },
    }
  }
}
