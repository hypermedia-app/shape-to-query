import vocabulary, { rdf, sh } from '@hydrofoil/shape-to-query/vocabulary.js'

vocabulary
  .namedNode('http://example.org/custom-function/palindrome')
  .addOut(rdf.type, sh.Function)
