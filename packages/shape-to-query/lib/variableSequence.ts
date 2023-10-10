import { Term, Variable } from 'rdf-js'
import $rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import { toSparql } from 'clownface-shacl-path'

export interface VariableSequence {
  /**
   * Returns a new variable every time it is called
   */
  (): Variable

  /**
   * Returns a variable for a specific focus node (subject) and its property path. If called
   * multiple times with same arguments, will return the same variable
   */
  for(subject: Term, path: GraphPointer): Variable
}

export function createVariableSequence(prefix: string): VariableSequence {
  let i = 1
  const subjects: Map<Term, Map<string, Variable>> = $rdf.termMap()

  const seq = () => {
    return $rdf.variable(`${prefix}${i++}`)
  }

  seq.for = (subject: Term, path: GraphPointer) => {
    const properties: Map<string, Variable> = subjects.get(subject) || new Map()
    subjects.set(subject, properties)

    const pathSparql = toSparql(path).toString({ prologue: false })
    const variable = properties.get(pathSparql) || seq()
    properties.set(pathSparql, variable)

    return variable
  }

  return seq
}
