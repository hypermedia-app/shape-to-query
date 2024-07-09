/* eslint-disable no-console */
import { html, css, LitElement } from 'lit'
import { query, property, customElement } from 'lit/decorators.js'
import '@rdfjs-elements/rdf-editor'
import '@rdfjs-elements/sparql-editor'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import { constructQuery } from '@hydrofoil/shape-to-query'
import $rdf from '@zazuko/env/web.js'
import type { RdfEditor } from '@rdfjs-elements/rdf-editor/src/RdfEditor.js'
import type { SlInput } from '@shoelace-style/shoelace'
import { isGraphPointer } from 'is-graph-pointer'
import { turtle } from '@tpluscode/rdf-string'
import type { MultiPointer } from 'clownface'

const initialShape = turtle`[
  a ${$rdf.ns.sh.NodeShape} ;
  ${$rdf.ns.sh.property} [
    ${$rdf.ns.sh.path} ${$rdf.ns.rdf.type} ; 
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

  get shape(): MultiPointer {
    const dataset = $rdf.dataset([...this.editor.quads])
    return $rdf.clownface({ dataset }).has($rdf.ns.rdf.type, $rdf.ns.sh.NodeShape)
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

    const query = this.focusNode.value
      ? constructQuery(this.shape, {
        focusNode: $rdf.namedNode(this.focusNode.value),
      })
      : constructQuery(this.shape)

    this.query = query
  }
}
