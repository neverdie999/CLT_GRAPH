import MainMenu from '../../common-objects/menu-context/main-menu'
import VertexMgmt from '../../common-objects/objects/vertex-mgmt'
import BoundaryMgmt from '../../common-objects/objects/boundary-mgmt'
import ObjectUtils from '../../../common/utilities/object.util'

import {
	CONNECT_SIDE,
	DEFAULT_CONFIG_GRAPH,
	VIEW_MODE,
} from '../../../common/const/index'

import { setSizeGraph } from '../../../common/utilities/common.util'

class OutputMgmt {
	constructor(props) {
		this.edgeMgmt = props.edgeMgmt
		this.dataContainer = props.dataContainer
		this.containerId = props.containerId
		this.svgId = props.svgId
		this.isShowReduced = false
		this.viewMode = {value: VIEW_MODE.OUTPUT_MESSAGE}

		this.mandatoryDataElementConfig = props.mandatoryDataElementConfig

		this.initialize()
	}

	initialize() {
		this.objectUtils = new ObjectUtils()

		this.defaultOptionsVertex = {
			connectSide: CONNECT_SIDE.LEFT,
		}

		this.vertexMgmt = new VertexMgmt({
			dataContainer : this.dataContainer,
			containerId : this.containerId,
			svgId : this.svgId,
			viewMode: this.viewMode,
			connectSide: CONNECT_SIDE.LEFT,
			edgeMgmt : this.edgeMgmt,
			mandatoryDataElementConfig: this.mandatoryDataElementConfig
		})

		this.boundaryMgmt = new BoundaryMgmt({
			dataContainer: this.dataContainer,
			containerId: this.containerId,
			svgId: this.svgId,
			viewMode: this.viewMode,
			vertexMgmt: this.vertexMgmt,
			edgeMgmt: this.edgeMgmt,
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

	async drawObjectsOnOutputGraph(data) {
		this.isShowReduced = false
    
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

		this.setCenterAlignmentGarph()
	}

	clearAll() {
		this.vertexMgmt.clearAll()
		this.boundaryMgmt.clearAll()

		setSizeGraph({ height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.svgId)
	}

	showReduced() {
		this.isShowReduced = true
		this.objectUtils.showReduced(this.dataContainer, this.edgeMgmt.dataContainer, this.vertexMgmt.vertexDefinition, this.svgId)
	}

	showFull() {
		this.isShowReduced = false
		this.objectUtils.showFull(this.dataContainer, this.vertexMgmt.vertexDefinition, this.svgId)
	}

	/**
   * set position graph by center align
   */
	setCenterAlignmentGarph() {
		const parentBoundary = _.find(this.dataContainer.boundary, {'parent': null})

		const rightScrollWidth = 10
		const marginTop = 10
		const marginLeft = 5
		const marginRight = 5

		let newX = marginLeft
		let newY = marginTop

		if (parentBoundary) {

			$('.right-svg').css('left', `calc(100% - ${parentBoundary.width + rightScrollWidth + marginLeft + marginRight}px)`)
			$('.right-svg').css('width', `${parentBoundary.width + rightScrollWidth + marginLeft + marginRight}px`)

			const inputRec = $('.left-svg')[0].getBoundingClientRect()
			const outputRec = $('.right-svg')[0].getBoundingClientRect()
			$('.middle-svg').css('width', `calc(100% - ${inputRec.width + outputRec.width}px)`)

			const containerRect = $(`#${parentBoundary.svgId}`)[0].parentNode.getBoundingClientRect()

			if ( containerRect.width - rightScrollWidth  - marginLeft - marginRight >= parentBoundary.width ) {
				newX = newX + ((containerRect.width - rightScrollWidth  - marginLeft - marginRight - parentBoundary.width) / 2)
			}

			const offsetX = newX - parentBoundary.x
			const offsetY = newY - parentBoundary.y

			if (offsetX != 0 || offsetY != 0) {
				parentBoundary.move(offsetX, offsetY)
			}
		}
	}

	processDataVertexTypeDefine(vertexDefinitionData) {
		this.vertexMgmt.processDataVertexTypeDefine(vertexDefinitionData)
	}
	
	/**
	 * 
	 */
	validateConnectionByUsage() {
		if (this.dataContainer.boundary.length > 0) {
			let parent = this.dataContainer.boundary[0].findAncestorOfMemberInNestedBoundary()

			return parent.validateConnectionByUsage()
		}

		return true
	}
}

export default OutputMgmt
