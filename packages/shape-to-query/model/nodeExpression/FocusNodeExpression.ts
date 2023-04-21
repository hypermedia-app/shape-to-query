import { sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NodeExpression, Parameters } from './NodeExpression.js'

export class FocusNodeExpression implements NodeExpression {
  public readonly term = sh.this

  static match({ term }: GraphPointer) {
    return term.equals(sh.this)
  }

  static fromPointer() {
    return new FocusNodeExpression()
  }

  buildPatterns({ subject, variable }: Omit<Parameters, 'rootPatterns'>) {
    const object = variable()
    return {
      object,
      patterns: sparql`BIND (${subject} as ${object})`,
    }
  }

  buildInlineExpression(arg: Parameters) {
    return {
      inline: sparql`${arg.subject}`,
    }
  }
}
