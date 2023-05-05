import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { ModelFactory } from '../ModelFactory.js'
import { ConstraintComponent } from './ConstraintComponent.js'
import { AndConstraintComponent } from './and.js'
import { OrConstraintComponent } from './or.js'
import { NodeConstraintComponent } from './node.js'
import { InConstraintComponent } from './in.js'
import { HasValueConstraintComponent } from './hasValue.js'
import { PropertyConstraintComponent } from './property.js'
import { PatternConstraintComponent } from './pattern.js'

interface ConstraintComponentStatic {
  fromShape(shape: GraphPointer, factory: ModelFactory): ConstraintComponent[] | Generator<ConstraintComponent>
}

export const constraintComponents = $rdf.termMap<Term, ConstraintComponentStatic>([
  [sh.AndConstraintComponent, AndConstraintComponent],
  [sh.HasValueConstraintComponent, HasValueConstraintComponent],
  [sh.InConstraintComponent, InConstraintComponent],
  [sh.OrConstraintComponent, OrConstraintComponent],
  [sh.NodeConstraintComponent, NodeConstraintComponent],
  [sh.PropertyConstraintComponent, PropertyConstraintComponent],
  [sh.PatternConstraintComponent, PatternConstraintComponent],
])
