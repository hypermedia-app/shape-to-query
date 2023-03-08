import { Term } from 'rdf-js'
import { GraphPointer, MultiPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import TermMap from '@rdfjs/term-map'
import { ConstraintComponent } from './ConstraintComponent'
import { AndConstraintComponent } from './and'
import { OrConstraintComponent } from './or'
import { NodeConstraintComponent } from './node'
import { InConstraintComponent } from './in'
import { HasValueConstraintComponent } from './hasValue'
import { PropertyConstraintComponent } from './property'

interface ConstraintComponentFromPointer {
  fromPointer(parameter: GraphPointer): ConstraintComponent
}

interface ConstraintComponentFromPointers {
  fromPointers(parameter: MultiPointer): ConstraintComponent
}

interface ConstraintComponentFromList {
  fromList(parameter: GraphPointer[]): ConstraintComponent
}

type ConstraintComponentStatic = ConstraintComponentFromPointer | ConstraintComponentFromPointers | ConstraintComponentFromList

export const constraintComponents = new TermMap<Term, ConstraintComponentStatic>([
  [sh.AndConstraintComponent, AndConstraintComponent],
  [sh.HasValueConstraintComponent, HasValueConstraintComponent],
  [sh.InConstraintComponent, InConstraintComponent],
  [sh.OrConstraintComponent, OrConstraintComponent],
  [sh.NodeConstraintComponent, NodeConstraintComponent],
  [sh.PropertyConstraintComponent, PropertyConstraintComponent],
])
