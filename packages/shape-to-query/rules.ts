import { RuleStatic } from './model/rule/Rule.js'
import TripleRule from './model/rule/TripleRule.js'
import { SPORule } from './model/rule/SPORule.js'

export const rules: RuleStatic[] = [
  TripleRule,
  SPORule,
]
