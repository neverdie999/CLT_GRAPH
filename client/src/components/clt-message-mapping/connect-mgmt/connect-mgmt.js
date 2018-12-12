
import ObjectUtils from '../../../common/utilities/object.util'
import EdgeMgmt from '../../common-objects/objects/edge-mgmt'

class ConnectMgmt {
	constructor(props) {
		this.mainSelector = props.mainSelector
		this.svgId = props.svgId
		this.storeConnect = props.storeConnect
		this.storeInputMessage = props.storeInputMessage
		this.storeOperations = props.storeOperations
		this.storeOutputMessage = props.storeOutputMessage

		this.initialize()
	}

	initialize() {
		this.objectUtils = new ObjectUtils()

		this.edgeMgmt = new EdgeMgmt({
			dataContainer : this.storeConnect,
			svgId : this.svgId,
			vertexContainer : [
				this.storeInputMessage,
				this.storeOperations,
				this.storeOutputMessage
			]
		})
	}

	/**
   *
   * @param options
   * source: object, required {x: 1, y: 2, vertexId: 'V***', prop: 'spd'}
   * target: object, required {x: 1, y: 2, vertexId: 'V***', prop: 'spd'}
   * note: object, option {originNote: 'src', middleNote: 'to', destNote: 'des'}
   * style: object, option {line: 'solid', arrow: 'Y'} | line: solid, dash; arrow: Y, N
   * id: string, option E*********
   * Ex
   */
	createEdge(sOptions) {
		this.edgeMgmt.create(sOptions)
	}

	drawEdgeOnConnectGraph(data) { 
		data.forEach(e => { 
			this.createEdge(e) 
		}) 
	}

	clearAll() {
		this.edgeMgmt.clearAll()
	}

	/**
   * Remove edge connect to input graph
   */
	clearInputEdges() {
		this.edgeMgmt.removeAllEdgeConnectToTheseVertex(this.storeInputMessage.vertex)
	}

	/**
   * Remove edge connect to output graph
   */
	clearOutputEdges() {
		this.edgeMgmt.removeAllEdgeConnectToTheseVertex(this.storeOutputMessage.vertex)
	}
}

export default ConnectMgmt
