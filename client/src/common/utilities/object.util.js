import * as d3 from 'd3'
import _ from 'lodash'
import {
	PADDING_POSITION_SVG,
	VERTEX_ATTR_SIZE,
	TYPE_CONNECT,
	COMMON_DATA,
	BOUNDARY_ATTR_SIZE
} from '../const/index'
import { setMinBoundaryGraph, checkModePermission } from './common.util'

class ObjectUtils {
	/**
   * Return position object limit in SVG container
   * @param event d3
   * @param svg
   * @param objectId
   * @returns {{x: number, y: number}}
   */
	setPositionObjectJustInSvg(event, object) {
		// Limit left
		let x = event.x < PADDING_POSITION_SVG.MIN_OFFSET_X ? PADDING_POSITION_SVG.MIN_OFFSET_X : event.x
		let y = event.y < PADDING_POSITION_SVG.MIN_OFFSET_Y ? PADDING_POSITION_SVG.MIN_OFFSET_Y : event.y
    
		// limit right
		if (!checkModePermission(object.viewMode.value, 'horizontalScroll')) {
			let limitWidth = $(`${object.svgId}`).width()
			let {width} = this.getBBoxObject(object.id)
			if (x + width > limitWidth)
				x = limitWidth - width
		}

		return {x, y}
	}

	/**
   * Get bbox object match with selector
   * @param selector
   * @returns {*}
   */
	getBBoxObject(selector) {
		let node = d3.select(`${selector}`)
		if (node)
			return node.node().getBBox()
		return null
	}

	/**
   * Get coordinate prop relative to parent
   * The order is important
   * @param info => require, type: object, purpose: current coordinate of vertex
   * @param prop => require, type: string, purpose: prop need to calculate coordinate.
   * @param type => option, type: string, purpose: determined start or end connect
   * @param svg => require, type: string, purpose: determined the area that object did draw on it.
   * @returns {{x: *, y: number}}
   */
	getCoordPropRelativeToParent(info, prop, type) {
		if (!type)
			type = TYPE_CONNECT.OUTPUT
		const {x, y, id, svgId: svg} = info
		let axisX = x
		let axisY = y
		// Area draw element svg
		let containerSvg = $(`#${svg}`)
		// Parent id container the object SVG
		let parent = $(`#${svg}`).parent().attr('id')
		let parentSvg = $(`#${parent}`)

		if (!prop)
			return {
				x: axisX + containerSvg.offset().left + VERTEX_ATTR_SIZE.GROUP_WIDTH / 2,
				y: axisY - parentSvg.scrollTop()
			}

		if (prop.indexOf('boundary_title') != -1) {

			axisY = axisY + BOUNDARY_ATTR_SIZE.HEADER_HEIGHT / 2

			return {
				x: type === TYPE_CONNECT.OUTPUT ? axisX + info.width + containerSvg.offset().left : axisX + containerSvg.offset().left,
				y: axisY - parentSvg.scrollTop()
			}
		}else if (prop.indexOf('title') != -1) {

			axisY = axisY + VERTEX_ATTR_SIZE.HEADER_HEIGHT / 2

			return {
				x: type === TYPE_CONNECT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH + containerSvg.offset().left : axisX + containerSvg.offset().left,
				y: axisY - parentSvg.scrollTop()
			}
		} else{
			// Get index prop in object
			let index = this.findIndexPropInVertex(id, prop)
			// Calculate coordinate of prop
			// Get coordinate
			axisY = axisY + VERTEX_ATTR_SIZE.HEADER_HEIGHT + index * VERTEX_ATTR_SIZE.PROP_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2
			return {
				x: type === TYPE_CONNECT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH + containerSvg.offset().left : axisX + containerSvg.offset().left,
				y: axisY - parentSvg.scrollTop()
			}
		}
	}

	/**
   * Find index of prop in vertex properties
   * @param vertexId
   * @param prop
   * @returns {number}
   */
	findIndexPropInVertex(vertexId, prop) {
		// Find index prop in object
		let arrayProp = d3.select(`#${vertexId}`).selectAll('.property:not(.hide)')
		let tmpArry = arrayProp._groups[0]
		let length = tmpArry.length
		for (let i = 0; i < length; i++) {
			let e = tmpArry[i]
			if (d3.select(e).attr('prop') === prop) {
				return i
			}
		}
		return null
	}

  
	/**
   * When a vertex|boundary move
   * Resize if any boundary with size smaller than vertex|boundary size
   */
	reSizeBoundaryWhenObjectDragged(obj) {
		// Get box object
		const {height, width} = this.getBBoxObject(`#${obj.id}`)

		obj.dataContainer.boundary.forEach(boundary => {
			if (boundary.id != obj.id && !boundary.parent) {
				let boundaryBox = this.getBBoxObject(`#${boundary.id}`)

				if (width >= boundaryBox.width) {
					//2018.07.03 - Vinh Vo - save this height for restoring to origin size if the object not drag in/out this boundary
					boundary.ctrlSrcWidth = boundary.width
					boundary.setWidth(width + 15)
					boundary.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(boundary)
				}
			}
		})
	}

	/**
   * Check drag outside boundary
   */
	checkDragObjectOutsideBoundary(obj) {

		// Get box object
		const {id, parent} = obj
		let {height, width} = this.getBBoxObject(`#${id}`)
		let xSrc = obj.x
		let ySrc = obj.y
		let wBSrc = xSrc + width
		let hBSrc = ySrc + height

		// Parent
		const {x, y} = _.find(obj.dataContainer.boundary,{'id':parent})
		let pBox = this.getBBoxObject(`#${parent}`)
		let xParent = x + pBox.width
		let yParent = y + pBox.height

		// Check drag outside a boundary
		if ((( wBSrc < x) || ( xParent < xSrc )) || ((hBSrc < y ) || ( yParent < ySrc ))) {
			let parentObj = _.find(obj.dataContainer.boundary,{'id': parent})
			parentObj.removeMemberFromBoundary(obj)
			obj.parent = null
      
			return true
		}

		return false
	}

	// Check drag inside boundary
	checkDragObjectInsideBoundary(obj, type) {

		let bIsInside = false
		// Get box object
		const {height, width} = this.getBBoxObject(`#${obj.id}`)
		let xSrc = obj.x
		let ySrc = obj.y
		let wBSrc = xSrc + width
		// let hBSrc = ySrc + height;

		// Define method reverse
		let reverse = (input) => {
			let ret = new Array
			for (let i = input.length - 1; i >= 0; i--) {
				ret.push(input[i])
			}
			return ret
		}

		// Cause: When multi boundary overlap that drags an object inside
		// then it will be added to => regulation add to the highest boundary
		let reverseBoundary = reverse(obj.dataContainer.boundary)
		reverseBoundary.forEach((item) => {
			if (!item.parent && item.id != obj.id && !obj.parent) {
				// Calculate box for boundary
				let xTar = item.x
				let yTar = item.y
				let bBoxTar = this.getBBoxObject(`#${item.id}`)
				let wBTar = xTar + bBoxTar.width
				let hBTar = yTar + bBoxTar.height

				if ((xSrc >= xTar) && (ySrc >= yTar) && (wBSrc <= wBTar) && (ySrc <= hBTar)) {
					let index = this.getIndexFromPositionForObject(item, obj)
					item.addMemberToBoundaryWithIndex( obj, index )
					obj.parent = item.id

					bIsInside = true
				}
			}
		})

		return bIsInside
	}

	/**
   * @param obj Object drag
   * Function using change index of object in boundary parent when drag in boundary
   */
	changeIndexInBoundaryForObject(obj) {
		const {parent} = obj
		let parentObj = _.find(obj.dataContainer.boundary, {'id': parent})
		let indexOld = this.getIndexBy(parentObj.member, 'id', obj.id)
		let indexNew = this.getIndexFromPositionForObject(parentObj, obj)
		parentObj.changeIndexMemberToBoundary(indexOld, indexNew)
		obj.parent = parent
	}

	/**
   * Get index of object from drop position
   * @param parentObj boundary tagert drop
   * @param obj Object drap
   * Function using get index for insert to boundary
   */
	getIndexFromPositionForObject(parentObj, obj) {
		let xSrc = obj.x
		let ySrc = obj.y
		let index = 0

		let memberAvailable = _.filter(parentObj.member, (e) => {
			return e.show === true
		})

		for (let mem of memberAvailable) {

			let memObj = null
			if(mem.type == 'V') {
				memObj = _.find(parentObj.dataContainer.vertex,{'id': mem.id})
			}else{
				memObj = _.find(parentObj.dataContainer.boundary,{'id': mem.id})
			}

			let {x, y} = memObj

			if (y > ySrc) {
				break
			}

			if (mem.id === obj.id) continue
			index++
		}

		return index
	}

	/**
   * Restore back the old size, dragingObject do not drag in/out these boundaries
   * @param {*} dragingObject
   */
	restoreSizeBoundary(dragingObject) {
		dragingObject.dataContainer.boundary.forEach(boundary => {
			//do not restore for parent, it was resize by checkDragObjectOutsideBoundary() or checkDragObjectInsideBoundary()
			if (boundary.id != dragingObject.id && (boundary.id != dragingObject.parent)) {
				if (boundary.ctrlSrcHeight != -1) {
					boundary.setHeight(boundary.ctrlSrcHeight)
				}

				if(boundary.ctrlSrcWidth != -1) {
					boundary.setWidth(boundary.ctrlSrcWidth)
					boundary.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(boundary)
				}
			}

			boundary.ctrlSrcHeight = -1
			boundary.ctrlSrcWidth = -1
		})
	}

	/**
   * @param arr Array object
   * @param name key compare
   * @param value value compare
   * @return i (index of object match condition)
   */
	getIndexBy(arr, name, value) {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i][name] == value) {
				return i
			}
		}
		return -1
	}

	/** 
   * @param dataContainer from import 
   * Set all children of this boundary to show
   */
	setAllChildrenToShow(dataContainer) {
		// Set all children of this boundary to show  
		let arrBoundary = dataContainer.boundary
		arrBoundary.forEach(boundary => {
			let members = boundary.member
			members.forEach(member => {
				member.show = true
			})
		})
	}

	/**
   * Handle show/hide edge while scroll
   * @param {*} containerId Id of container div
   * @param {*} edgeMgmt 
   * @param {*} arrDataContainer each SVG area has a dataContainer, this array store all dataContainer of those SVG. Purpur
   */
	initListenerContainerScroll(containerId, edgeMgmt, arrDataContainer) {
		$(`#${containerId}`).on('scroll', (e) => {
			let svgId = $(e.target).attr('ref')
			this.onContainerSvgScroll(svgId, edgeMgmt, arrDataContainer)
		})
	}

	onContainerSvgScroll(pSvgId, edgeMgmt, arrDataContainer) {

		if (edgeMgmt.isSelectingEdge()) {
			edgeMgmt.cancleSelectedPath()
		}

		let vertices = []
		for (var i = 0; i < arrDataContainer.length; i++) {
			vertices = vertices.concat(arrDataContainer[i].vertex)
			vertices = vertices.concat(arrDataContainer[i].boundary)
		}
    
		// Find edge start from this SVG
		const srcEdges = _.filter(edgeMgmt.dataContainer.edge, (e) => {
			return e.source.svgId === pSvgId
		})
    
		// Find edge end at this SVG
		const desEdges = _.filter(edgeMgmt.dataContainer.edge, (e) => {
			return e.target.svgId === pSvgId
		})

		srcEdges.forEach(e => {
			const {source: {vertexId: id, prop}} = e
			let obj = _.find(vertices, {'id': id})
			let {x: propX, y: propY} = this.getCoordPropRelativeToParent(obj, prop, TYPE_CONNECT.OUTPUT)
			e.source.x = propX
			e.source.y = propY
			let options = {source: e.source}
			e.updatePathConnect(options)
			e.setStatusEdgeOnCurrentView()
		})

		desEdges.forEach(e => {
			const {target: {vertexId: id, prop}} = e
			let obj = _.find(vertices, {'id': id})
			let {x: propX, y: propY} = this.getCoordPropRelativeToParent(obj, prop, TYPE_CONNECT.INPUT)
			e.target.x = propX
			e.target.y = propY
			let options = {target: e.target}
			e.updatePathConnect(options)
			e.setStatusEdgeOnCurrentView()
		})
	}

	initListenerOnWindowResize(edgeMgmt, arrDataContainer) {
		$(window).resize(() => {
      
			if(edgeMgmt.isSelectingEdge()) {
				edgeMgmt.cancleSelectedPath()
			}

			this.updatePathConnectOnWindowResize(edgeMgmt, arrDataContainer)
		})
	}

	updatePathConnectOnWindowResize(edgeMgmt, arrDataContainer) {
		const edges = edgeMgmt.dataContainer.edge
		let vertices = []
		for (var i = 0; i < arrDataContainer.length; i++) {
			vertices = vertices.concat(arrDataContainer[i].vertex)
			vertices = vertices.concat(arrDataContainer[i].boundary)
		}

		edges.forEach(e => {
			const {source: {vertexId: idSrc, prop: propSrc}, target: {vertexId: idDes, prop: propDes}} = e
			let srcObj = _.find(vertices, {'id': idSrc})
			let {x: newSX, y: newSY} = this.getCoordPropRelativeToParent(srcObj, propSrc, TYPE_CONNECT.OUTPUT)
			e.source.x = newSX
			e.source.y = newSY

			let desObj = _.find(vertices, {'id': idDes})
			let {x: newDX, y: newDY} = this.getCoordPropRelativeToParent(desObj, propDes, TYPE_CONNECT.INPUT)
			e.target.x = newDX
			e.target.y = newDY

			let options = {source: e.source, target: e.target}
			e.updatePathConnect(options)
			e.setStatusEdgeOnCurrentView()
		})
	}

	/**
   * Show boundary, vertex reduced as policy
   * Show graph elements connected by edges only
   * Boundary: show vertices which have any edges only and boundaries
   * Vertex: The vertices in group SHOW_FULL_ALWAYS not effected by show reduced
   * The remain vertex then show header and connected properties only
   */
	async showReduced(dataContainer, edgeDataContainer, vertexDefinition, svgId, viewMode) {
		let edge = edgeDataContainer.edge
		let lstVer = [], lstProp = []

		let arrShowFullAlwayGroup = []
		vertexDefinition.vertexGroup.forEach(e => {
			if (e.option.indexOf('SHOW_FULL_ALWAYS') != -1) {
				arrShowFullAlwayGroup.push(e.groupType)
			}
		})

		// Filter the vertex effected by show reduced
		lstVer = _.filter(dataContainer.vertex, (e) => {
			return arrShowFullAlwayGroup.indexOf(e.groupType) < 0
		})
    
		lstVer.forEach((vertex) => {
			d3.select(`#${vertex.id}`).selectAll('.drag_connect:not(.connect_header)').classed('hide', true)
			d3.select(`#${vertex.id}`).selectAll('.property').classed('hide', true)
		})

		// Get vertex and property can display
		edge.forEach((edgeItem) => {
			lstProp.push({
				vert: edgeItem.source.vertexId,
				prop: edgeItem.source.prop
			},{
				vert: edgeItem.target.vertexId,
				prop: edgeItem.target.prop
			})
		})

		lstVer.forEach((vertexItem) => {
			let arrPropOfVertex = []
			lstProp.forEach((propItem) => {
				if (propItem.vert === vertexItem.id) {
					if (arrPropOfVertex.indexOf(propItem.prop) === -1 && propItem.prop.indexOf('title') == -1) {
						arrPropOfVertex.push(propItem.prop)
					}
				}
			})
			//d3.select(`#${vertexItem.id}`).classed("hide", false); // Enable Vertex
			arrPropOfVertex.forEach((propItem) => {
				d3.select(`#${vertexItem.id}`).selectAll('[prop=\'' + propItem + '\']').classed('hide', false)
				d3.select(`#${vertexItem.id}`).selectAll(':not(.property)[prop=\'' + propItem + '\']').classed('reduced', true)
			})
      
			vertexItem.updatePathConnect() // Re-draw edge
			/* Update posittion of "rect" */
			this.updatePositionRectConnect(arrPropOfVertex, vertexItem)
		})

		this.resetSizeVertex(dataContainer, false)
		if (dataContainer.boundary.length > 0)
			await dataContainer.boundary[0].updateHeightBoundary()
    
		setMinBoundaryGraph(dataContainer, svgId, viewMode)
	}

	/**
   * Show full graph
   */
	async showFull(dataContainer, vertexDefinition, svgId, viewMode) {

		let arrShowFullAlwayGroup = []
		vertexDefinition.vertexGroup.forEach(e => {
			if (e.option.indexOf('SHOW_FULL_ALWAYS') != -1) {
				arrShowFullAlwayGroup.push(e.groupType)
			}
		})

		let lstVer = []
		// Filter the vertex effected by show reduced
		lstVer = _.filter(dataContainer.vertex, (e) => {
			return arrShowFullAlwayGroup.indexOf(e.groupType) < 0
		})
    
		lstVer.forEach((vertex) => {
			d3.select(`#${vertex.id}`).selectAll('.drag_connect:not(.connect_header)').classed('hide', false)
			d3.select(`#${vertex.id}`).selectAll('.property').classed('hide', false)
		})
    
		lstVer.forEach((vertexItem) => {
			let arrPropOfVertex = [] //list of properties that have edge connected
			let bFlag = false // If this vertex has edge connected then this flag will be active

			d3.select(`#${vertexItem.id}`).selectAll('.reduced')._groups[0].forEach(e => {
				arrPropOfVertex.push($(e).attr('prop'))
				bFlag = true
			})

			if(bFlag) {
				d3.select(`#${vertexItem.id}`).selectAll('.reduced').classed('reduced', false)

				vertexItem.updatePathConnect() // Re-draw edge

				/* Update posittion of "rect" */
				this.updatePositionRectConnect(arrPropOfVertex, vertexItem)
			}
		})
    
		this.resetSizeVertex(dataContainer, true)
		if (dataContainer.boundary.length > 0)
			await dataContainer.boundary[0].updateHeightBoundary()

		setMinBoundaryGraph(dataContainer, svgId, viewMode)
	}

	/**
   * Calculate height vertex base on properties connectted
   * @param id
   * @param isShowFull used in case vertex just have header.
   * @returns {number}
   */
	resetSizeVertex(dataContainer, isShowFull = false) {
		let vertexes = dataContainer.vertex
		vertexes.forEach(vertex => {
			let exitConnect = false
			let vertexId = vertex.id
			// Get all prop that not hide
			let arrProp = d3.select(`#${vertexId}`).selectAll('.property:not(.hide)')
			let tmpArry = arrProp._groups[0]
			// When not any edge connect to properties of vertex,
			// Check exit edge connect to vertex
			if (tmpArry.length < 1)
				exitConnect = vertex.vertexMgmt.edgeMgmt.checkExitEdgeConnectToVertex(vertexId)

			let element = $(`#${vertexId} .vertex_content`)
			element.parent()
				.attr('height', tmpArry.length ?
					VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * tmpArry.length : isShowFull ?
						VERTEX_ATTR_SIZE.HEADER_HEIGHT : exitConnect ? VERTEX_ATTR_SIZE.HEADER_HEIGHT : VERTEX_ATTR_SIZE.HEADER_HEIGHT)
		})
	}

	/**
   * Update position of "rect" connect on vertex
   * @param arrProp
   * @param vertex
   */
	updatePositionRectConnect(arrProp, vertex) {
		for (var i = 0; i < arrProp.length; i++) {
			let prop = arrProp[i]
			if (prop != null) {
				//get new index of this property in vertex after hiding all properties have no edge connected for updatting new position of "rect"
				let newIndexOfPropInVertex = this.findIndexPropInVertex(vertex.id, prop)
				let newY = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * newIndexOfPropInVertex + 1

				//update position of "rect"
				d3.select(`#${vertex.id}`).selectAll(`:not(.property)[prop=${prop}]`).attr('y', newY)
			}
		}
	}

  
}

export default ObjectUtils
