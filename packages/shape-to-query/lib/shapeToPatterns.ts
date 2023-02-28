import { NamedNode } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { ShapePatterns } from './shapePatterns'
import { NodeShapeProcessor, Options as BaseOptions } from './NodeShapeProcessor'

export interface Options extends BaseOptions {
  focusNode?: NamedNode
}

export function shapeToPatterns(shape: GraphPointer, options: Options = {}): ShapePatterns {
  const processor = new NodeShapeProcessor(options)
  return processor.getPatterns(shape, options.focusNode || processor.variable())
}
