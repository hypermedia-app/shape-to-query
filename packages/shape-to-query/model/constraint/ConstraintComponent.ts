import type { NamedNode, Term, Variable } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import type sparqljs from 'sparqljs'
import { VariableSequence } from '../../lib/variableSequence.js'
import { FocusNode } from '../../lib/FocusNode.js'

type List = { list: GraphPointer[] }
type Pointer = { pointer: GraphPointer }
type ListOrPointer = Pointer | List
export type PropertyShape = Map<Term, Array<ListOrPointer>>

export interface Parameters {
  focusNode: FocusNode
  valueNode: Variable
  variable: VariableSequence
  propertyPath?: sparqljs.PropertyPath | NamedNode
  rootPatterns: sparqljs.Pattern[]
}

export interface ConstraintComponent {
  readonly type: NamedNode
  buildPatterns(arg: Parameters): sparqljs.Pattern[]
}

export default abstract class {
  protected constructor(public readonly type: NamedNode) {
  }

  buildPatterns(arg: Parameters): sparqljs.Pattern[] {
    if (arg.propertyPath) {
      return this.buildPropertyShapePatterns(arg)
    }

    return this.buildNodeShapePatterns(arg)
  }

  buildNodeShapePatterns(arg: Parameters): sparqljs.Pattern[] {
    return this.buildPropertyShapePatterns(arg)
  }

  abstract buildPropertyShapePatterns(arg: Parameters): sparqljs.Pattern[]
}

export function assertList(arg: ListOrPointer): asserts arg is List {
  if (!('list' in arg)) {
    throw new Error('Value must be an RDF List')
  }
}

export function assertTerm(arg: ListOrPointer): asserts arg is Pointer {
  if (!('pointer' in arg)) {
    throw new Error('Value must not be a RDF List')
  }
}
