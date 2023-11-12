import { NamedNode } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import ModelFactory, { ModelFactoryOptions } from '../model/ModelFactory.js'
import { flatten, ShapePatterns } from './shapePatterns.js'
import { createVariableSequence } from './variableSequence.js'

export interface Options {
  focusNode?: NamedNode
  subjectVariable?: string
  objectVariablePrefix?: string
  modelFactoryOptions?: ModelFactoryOptions
}

export function shapeToPatterns(shape: GraphPointer, options: Options = {}): ShapePatterns {
  const factory = new ModelFactory(options.modelFactoryOptions)
  const nodeShape = factory.nodeShape(shape)
  const variable = createVariableSequence(options.objectVariablePrefix || 'resource')
  const focusNode = options.focusNode || variable()

  const properties = nodeShape.buildPatterns({
    focusNode,
    variable,
    rootPatterns: sparql``,
  })

  const constraints = {
    constructClause: [],
    whereClause: nodeShape.buildConstraints({
      focusNode,
      valueNode: variable(),
      variable,
      rootPatterns: sparql``,
    }),
  }

  return flatten(properties, constraints)
}
