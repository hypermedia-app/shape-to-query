import { NamedNode, Term, Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
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
  propertyPath?: SparqlTemplateResult
  rootPatterns: SparqlTemplateResult
}

export interface ConstraintComponent {
  readonly type: NamedNode
  buildPatterns(arg: Parameters): string | SparqlTemplateResult | SparqlTemplateResult[]
}

export default abstract class {
  protected constructor(public readonly type: NamedNode) {
  }

  buildPatterns(arg: Parameters): string | SparqlTemplateResult | SparqlTemplateResult[] {
    if (arg.propertyPath) {
      return this.buildPropertyShapePatterns(arg)
    }

    return this.buildNodeShapePatterns(arg)
  }

  buildNodeShapePatterns(arg: Parameters): string | SparqlTemplateResult | SparqlTemplateResult[] {
    return this.buildPropertyShapePatterns(arg)
  }

  abstract buildPropertyShapePatterns(arg: Parameters): string | SparqlTemplateResult | SparqlTemplateResult[]
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
