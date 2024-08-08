import type { Term } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { ConstraintComponent, PropertyShape } from './ConstraintComponent.js'
import { AndConstraintComponent } from './and.js'
import { OrConstraintComponent } from './or.js'
import { NodeConstraintComponent } from './node.js'
import { InConstraintComponent } from './in.js'
import { HasValueConstraintComponent } from './hasValue.js'
import { PropertyConstraintComponent } from './property.js'
import { PatternConstraintComponent } from './pattern.js'
import { ExpressionConstraintComponent } from './expression.js'
import { ClassConstraintComponent } from './class.js'
import { NodeKindConstraintComponent } from './nodeKind.js'
import { LanguageInConstraintComponent } from './languageIn.js'
import { DatatypeConstraintComponent } from './datatype.js'
import { MinInclusiveConstraintComponent } from './minInclusive.js'
import { MaxInclusiveConstraintComponent } from './maxInclusive.js'
import { MinExclusiveConstraintComponent } from './minExclusive.js'
import { MaxExclusiveConstraintComponent } from './maxExclusive.js'

interface ConstraintComponentStatic {
  fromShape(shape: PropertyShape, factory: ModelFactory): ConstraintComponent[] | Generator<ConstraintComponent>
}

export const constraintComponents = $rdf.termMap<Term, ConstraintComponentStatic>([
  [sh.AndConstraintComponent, AndConstraintComponent],
  [sh.HasValueConstraintComponent, HasValueConstraintComponent],
  [sh.InConstraintComponent, InConstraintComponent],
  [sh.OrConstraintComponent, OrConstraintComponent],
  [sh.NodeConstraintComponent, NodeConstraintComponent],
  [sh.PropertyConstraintComponent, PropertyConstraintComponent],
  [sh.PatternConstraintComponent, PatternConstraintComponent],
  [sh.ExpressionConstraintComponent, ExpressionConstraintComponent],
  [sh.ClassConstraintComponent, ClassConstraintComponent],
  [sh.NodeKindConstraintComponent, NodeKindConstraintComponent],
  [sh.LanguageInConstraintComponent, LanguageInConstraintComponent],
  [sh.DatatypeConstraintComponent, DatatypeConstraintComponent],
  [sh.MinInclusiveConstraintComponent, MinInclusiveConstraintComponent],
  [sh.MaxInclusiveConstraintComponent, MaxInclusiveConstraintComponent],
  [sh.MinExclusiveConstraintComponent, MinExclusiveConstraintComponent],
  [sh.MaxExclusiveConstraintComponent, MaxExclusiveConstraintComponent],

])
