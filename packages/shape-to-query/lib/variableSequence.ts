import { Variable } from 'rdf-js'
import $rdf from 'rdf-ext'

export interface VariableSequence {
  (): Variable
}

export function createVariableSequence(prefix: string): VariableSequence {
  let i = 1
  return () => {
    return $rdf.variable(`${prefix}${i++}`)
  }
}
