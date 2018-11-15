import MainMenu from '../../common-objects/menu-context/main-menu'
import VertexMgmt from '../../common-objects/objects/vertex-mgmt'
import BoundaryMgmt from '../../common-objects/objects/boundary-mgmt'
import ObjectUtils from '../../../common/utilities/object.util'

import {
	DEFAULT_CONFIG_GRAPH, VIEW_MODE, CONNECT_SIDE
} from '../../../common/const/index'

import {
	setSizeGraph
} from '../../../common/utilities/common.util'

class OperationsMgmt {
	constructor(props) {
		this.edgeMgmt = props.edgeMgmt
		this.dataContainer = props.dataContainer
		this.svgId = props.svgId
		this.containerId = props.containerId
		this.viewMode = {value: VIEW_MODE.OPERATIONS}
		this.parent = props.parent

		this.initialize()
	}

	initialize() {

		this.objectUtils = new ObjectUtils()

		this.vertexMgmt = new VertexMgmt({
			dataContainer : this.dataContainer,
			containerId : this.containerId,
			svgId : this.svgId,
			viewMode: this.viewMode,
			connectSide: CONNECT_SIDE.BOTH,
			edgeMgmt : this.edgeMgmt
		})

		this.boundaryMgmt = new BoundaryMgmt({
			dataContainer: this.dataContainer,
			containerId: this.containerId,
			svgId: this.svgId,
			viewMode: this.viewMode,
			vertexMgmt: this.vertexMgmt,
			edgeMgmt: this.edgeMgmt
		})
	}

	initMenuContext() {
		new MainMenu({
			selector: `#${this.svgId}`,
			containerId: `#${this.containerId}`,
			parent: this,
			vertexDefinition: this.vertexMgmt.vertexDefinition,
			viewMode: this.viewMode,
		})
	}

	createVertex(opt) {
		this.vertexMgmt.create(opt)
	}

	createBoundary(opt) {
		this.boundaryMgmt.create(opt)
	}

	/**
   * Clear all element on graph
   * And reinit marker def
   */
	clearAll() {
		this.vertexMgmt.clearAll()
		this.boundaryMgmt.clearAll()

		// Update warning color for Output Message
		this.parent.outputMgmt.validateConnectionByUsage()
		
		setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId)
	}

	async drawObjectsOnOperationsGraph(data) {
		const { boundary: boundaries, vertex: vertices, position } = data
		// Draw boundary
		boundaries.forEach(e => {
			let { x, y } = position.find(pos => {
				return pos.id === e.id
			})

			e.x = x
			e.y = y
			e.isImport = true
			this.boundaryMgmt.create(e)
		})
		// Draw vertex
		vertices.forEach(e => {
			const { x, y } = position.find(pos => {
				return pos.id === e.id
			})

			e.x = x
			e.y = y
			e.isImport = true

			this.vertexMgmt.create(e)
		})

		if (this.dataContainer.boundary && this.dataContainer.boundary.length > 0) {
			this.objectUtils.setAllChildrenToShow(this.dataContainer)
			if (this.dataContainer.boundary.length > 0)
				await this.dataContainer.boundary[0].updateHeightBoundary()
		}
	}

	LoadVertexDefinition(vertexDefinitionData) {
		return this.vertexMgmt.LoadVertexDefinition(vertexDefinitionData)
	}

	processDataVertexTypeDefine(vertexDefinitionData) {
		this.vertexMgmt.processDataVertexTypeDefine(vertexDefinitionData)
	}

	operationsAutoAlignment() {
		this.parent.operationsAutoAlignment()
	}
}

export default OperationsMgmt
