/* eslint-disable no-console */
import { html, css, LitElement } from 'lit'
import { query, property, customElement } from 'lit/decorators.js'
import '@rdfjs-elements/rdf-editor'
import '@rdfjs-elements/sparql-editor'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import { construct } from '@hydrofoil/shape-to-query'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { RdfEditor } from '@rdfjs-elements/rdf-editor/src/RdfEditor.js'
import { SlInput } from '@shoelace-style/shoelace'
import { isGraphPointer } from 'is-graph-pointer'
import { turtle } from '@tpluscode/rdf-string'

const initialShape = turtle`[
  a ${sh.NodeShape} ;
  ${sh.property} [
    ${sh.path} ${rdf.type} ; 
  ] ;
] .`.toString()

@customElement('shape-to-query')
export class App extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        margin: 0 auto ;
        width: 100% ;
      }

      rdf-editor {
        height: 500px;
      }
    `
  }

  @query('rdf-editor')
  private editor!: RdfEditor

  @query('#focus-node')
  private focusNode!: SlInput

  @property({ type: String })
  public query?: string

  get shape() {
    const dataset = $rdf.dataset([...this.editor.quads])
    return $rdf.clownface({ dataset }).has(rdf.type, sh.NodeShape)
  }

  render() {
    return html`
      <rdf-editor format="text/turtle" @parsing-failed="${console.error}" .value="${initialShape}"></rdf-editor>
      <sl-input id="focus-node"></sl-input>
      <sl-button variant="primary" @click="${this.generateQuery}">Generate</sl-button>
      <sparql-editor readonly .value="${this.query}"></sparql-editor>
    `
  }

  generateQuery() {
    if (!isGraphPointer(this.shape)) {
      return
    }

    if (this.focusNode.value) {
      this.query = construct(this.shape, {
        focusNode: $rdf.namedNode(this.focusNode.value),
      }).build()
    } else {
      this.query = construct(this.shape).build()
    }
  }
}
