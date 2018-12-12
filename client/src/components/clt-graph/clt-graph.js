import * as d3 from 'd3'
import _ from 'lodash'
import ObjectUtils from '../../common/utilities/object.util'
import VertexMgmt from '../common-objects/objects/vertex-mgmt'
import BoundaryMgmt from '../common-objects/objects/boundary-mgmt'
import EdgeMgmt from '../common-objects/objects/edge-mgmt'
import MainMenu from '../common-objects/menu-context/main-menu'

import {
	comShowMessage,
	setSizeGraph,
	setMinBoundaryGraph,
} from '../../common/utilities/common.util'

import { 
	DEFAULT_CONFIG_GRAPH, VIEW_MODE,
} from '../../common/const/index'

class CltGraph {
	constructor(props) {
		this.selector = props.selector
		this.viewMode = {value: props.viewMode || VIEW_MODE.EDIT}
		
		this.mandatoryDataElementConfig = props.mandatoryDataElementConfig // The configuration for Data element validation
		if (!this.mandatoryDataElementConfig) {
			this.mandatoryDataElementConfig = { 
				mandatoryEvaluationFunc: (dataElement) => { return false },
				colorWarning: '#ff8100',
				colorAvailable: '#5aabff'
			}
		}

		this.selectorName = this.selector.selector.replace(/[\.\#]/,'')

		this.graphContainerId = `graphContainer_${this.selectorName}`
		this.graphSvgId = `graphSvg_${this.selectorName}`
		this.connectSvgId = `connectSvg_${this.selectorName}`

		this.isShowReduced = false

		this.initialize()
	}

	initialize() {

		this.objectUtils = new ObjectUtils()

		this.initSvgHtml()

		this.dataContainer = {
			vertex: [],
			boundary: [],
			edge: []
		}

		this.edgeMgmt = new EdgeMgmt({
			dataContainer    : this.dataContainer,
			svgId            : this.connectSvgId,
			vertexContainer  : [
				this.dataContainer
			]
		})

		this.vertexMgmt = new VertexMgmt({
			dataContainer : this.dataContainer,
			containerId : this.graphContainerId,
			svgId : this.graphSvgId,
			viewMode: this.viewMode,
			edgeMgmt : this.edgeMgmt,
			mandatoryDataElementConfig: this.mandatoryDataElementConfig
		})

		this.boundaryMgmt = new BoundaryMgmt({
			dataContainer: this.dataContainer,
			containerId: this.graphContainerId,
			svgId: this.graphSvgId,
			viewMode: this.viewMode,
			vertexMgmt: this.vertexMgmt,
			edgeMgmt: this.edgeMgmt
		})

		this.initCustomFunctionD3()
		this.objectUtils.initListenerContainerScroll(this.graphContainerId, this.edgeMgmt, [this.dataContainer])
		this.objectUtils.initListenerOnWindowResize(this.edgeMgmt, [this.dataContainer])
		this.initOnMouseUpBackground()
	}

	initSvgHtml() {
		let sHtml = 
    `<div id="${this.graphContainerId}" class="graphContainer" ref="${this.graphSvgId}">
        <svg id="${this.graphSvgId}" class="svg"></svg>
      </div>
      <svg id="${this.connectSvgId}" class="connect-svg"></svg>`

		this.selector.append(sHtml)
	}

	initCustomFunctionD3() {
		/**
     * Move DOM element to front of others
     */
		d3.selection.prototype.moveToFront = function () {
			return this.each(function () {
				this.parentNode.appendChild(this)
			})
		}

		/**
     * Move DOM element to back of others
     */
		d3.selection.prototype.moveToBack = function () {
			this.each(function () {
				this.parentNode.firstChild && this.parentNode.insertBefore(this, this.parentNode.firstChild)
			})
		}
	}

	initMenuContext() {
		new MainMenu({
			selector: `#${this.graphSvgId}`,
			containerId: `#${this.graphContainerId}`,
			parent: this,
			vertexDefinition: this.vertexMgmt.vertexDefinition,
			viewMode: this.viewMode
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

		setSizeGraph({ width: DEFAULT_CONFIG_GRAPH.MIN_WIDTH, height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.graphSvgId)
	}

	showReduced() {
		this.isShowReduced = true
		this.objectUtils.showReduced(this.dataContainer, this.edgeMgmt.dataContainer, this.vertexMgmt.vertexDefinition, this.graphSvgId)
	}

	showFull() {
		this.isShowReduced = false
		this.objectUtils.showFull(this.dataContainer, this.vertexMgmt.vertexDefinition, this.graphSvgId)
	}

	async drawObjects(data) {
		const { boundary: boundaries, vertex: vertices, position, edge } = data
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

		edge.forEach(e =>{ 
			this.edgeMgmt.create(e)
		})
    
		if (this.dataContainer.boundary && this.dataContainer.boundary.length > 0) {
			this.objectUtils.setAllChildrenToShow(this.dataContainer)
			if (this.dataContainer.boundary.length > 0)
				await this.dataContainer.boundary[0].updateHeightBoundary()
		}
	}

	async loadGraphData(graphData) {
		let resMessage = await this.validateGraphDataStructure(graphData)

		if(resMessage != 'ok') {
			comShowMessage('Format or data in Data Graph Structure is corrupted. You should check it!')

			if(resMessage == 'error')
				return
		}

		//clear data
		this.clearAll()
		this.edgeMgmt.clearAll()

		//Reload Vertex Define and draw graph
		const {vertexTypes} = graphData
		await this.vertexMgmt.processDataVertexTypeDefine(vertexTypes)
		await this.drawObjects(graphData)
		this.initMenuContext()
		
		this.validateConnectionByUsage()

		//Solve in case of save and import from different window size
		this.objectUtils.updatePathConnectOnWindowResize(this.edgeMgmt, [this.dataContainer])

		//Solve in case of save and import from different scroll position
		this.objectUtils.onContainerSvgScroll(this.svgId, this.edgeMgmt, [this.dataContainer])

		setMinBoundaryGraph(this.dataContainer,this.graphSvgId, this.viewMode.value)
	}

	save(fileName) {

		if (!fileName) {
			comShowMessage('Please input file name')
			return
		}

		this.getContentGraphAsJson().then(content => {
			if (!content) {
				comShowMessage('No content to export')
				return
			}
			// stringify with tabs inserted at each level
			let graph = JSON.stringify(content, null, '\t')
			let blob = new Blob([graph], {type: 'application/json', charset: 'utf-8'})

			if (navigator.msSaveBlob) {
				navigator.msSaveBlob(blob, fileName)
				return
			}

			let fileUrl = window.URL.createObjectURL(blob)
			let downLink = $('<a>')
			downLink.attr('download', `${fileName}.json`)
			downLink.attr('href', fileUrl)
			downLink.css('display', 'none')
			$('body').append(downLink)
			downLink[0].click()
			downLink.remove()
		}).catch(err => {
			comShowMessage(err)
		})
	}

	LoadVertexDefinition(vertexDefinitionData) {
		if (this.vertexMgmt.LoadVertexDefinition(vertexDefinitionData)) {
			this.initMenuContext()
		}
	}

	/**
   * Validate Graph Data Structure
   * with embedded vertex type
   * Validate content
   */
	async validateGraphDataStructure(data) {
		//Validate data exists
		if(data===undefined)
		{
			console.log('Data does not exist')
			return Promise.resolve('error')
		}

		// Validate struct data
		if (!data.vertex || !data.boundary || !data.position || !data.vertexTypes ||
      (Object.keys(data.vertexTypes).length === 0 && data.vertexTypes.constructor === Object)) {
			console.log('Data Graph Structure is corrupted. You should check it!')
			return Promise.resolve('error')
		}

		// Validate embedded vertex type with vertices
		let dataTypes = data.vertexTypes['VERTEX']
		let vertices = this.removeDuplicates(data.vertex, 'vertexType')
		let types = this.getListVertexType(dataTypes)
		for (let vertex of vertices) {

			let type = vertex.vertexType
			// If vertex type not exit in embedded vertex type
			if (types.indexOf(type) < 0) {
				console.log('[Graph Data Structure] Vertex type not exits in embedded vertex type')
				return Promise.resolve('warning')
			}

			// Validate data key between embedded vertex and vetex in graph.
			let dataSource = vertex.data
			let dataTarget = _.find(dataTypes, {'vertexType': type})
			let keySource = Object.keys(dataSource[0] || {})
			let keyTarget = Object.keys(dataTarget.data[0] || {})

			// Check length key
			if (this.checkLengthMisMatch(keySource, keyTarget)) {
				console.log('[Graph Data Structure] Data\'s length is different')
				return Promise.resolve('warning')
			}

			// Check mismatch key
			let flag = await this.checkKeyMisMatch(keySource, keyTarget)

			if (flag) {
				console.log('[Graph Data Structure] Key vertex at source not exit in target')
				return Promise.resolve('warning')
			}
		}

		return Promise.resolve('ok')
	}

	/**
   * Removing Duplicate Objects From An Array By Property
   * @param myArr
   * @param prop
   * @author: Dwayne
   * @reference: https://ilikekillnerds.com/2016/05/removing-duplicate-objects-array-property-name-javascript/
   */
	removeDuplicates(myArr, prop) {
		return myArr.filter((obj, pos, arr) => {
			return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
		})
	}

	/**
   * get list vertex type of graph
   * @param array data
   * @returns {*}
   */
	getListVertexType(data) {
		let types = []
		let len = data.length
		for (let i = 0; i < len; i++) {
			let type = data[i]
			types.push(type.vertexType)
		}

		return types
	}

	/**
   * Check length of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
	checkLengthMisMatch(src, tgt) {
		return src.length != tgt.length ? true : false
	}

	/**
   * Check key of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
	checkKeyMisMatch(src, tgt) {
		let misMatch = false
		src.forEach(key => {
			if (tgt.indexOf(key) < 0) {
				misMatch = true
			}
		})

		return Promise.resolve(misMatch)
	}

	getContentGraphAsJson() {
		let dataContent = {vertex: [], boundary: [],position: [], edge:[], vertexTypes: {}}

		if (this.isEmptyContainerData(this.dataContainer)) {
			return Promise.reject('There is no Input data. Please import!')
		} 

		// Process data to export
		// Need clone data cause case user export
		// later continue edit then lost parent scope
		// Purpose prevent reference data.

		//Vertex and Boundary data
		const cloneData = _.cloneDeep(this.dataContainer)
		cloneData.vertex.forEach(vertex => {
			let pos = new Object({
				'id': vertex.id,
				'x': vertex.x,
				'y': vertex.y
			})

			dataContent.vertex.push(this.getSaveDataVertex(vertex))
			dataContent.position.push(pos)
		})

		cloneData.boundary.forEach(boundary => {
			let pos = new Object({
				'id': boundary.id,
				'x': boundary.x,
				'y': boundary.y
			})

			dataContent.boundary.push(this.getSaveDataBoundary(boundary))
			dataContent.position.push(pos)
		})

		const cloneVertexDefine = _.cloneDeep(this.vertexMgmt.vertexDefinition)
		let vertexDefine = {}
		if(cloneVertexDefine.vertexGroup) {
			vertexDefine = {
				'VERTEX_GROUP': this.getSaveVertexGroup(cloneVertexDefine.vertexGroup),
				'VERTEX': cloneVertexDefine.vertex
			}
		}
		dataContent.vertexTypes = vertexDefine

		//Edges    
		cloneData.edge.forEach(edge => {
			dataContent.edge.push(this.getSaveDataEdge(edge))
		})

		return Promise.resolve(dataContent)
	}

	/**
   * Filter properties that need to save
   * @param {*} vertexGroup 
   */
	getSaveVertexGroup(vertexGroup) {
		let resObj = []

		vertexGroup.forEach(group => {
			let tmpGroup = {}

			tmpGroup.groupType = group.groupType
			tmpGroup.option = group.option
			tmpGroup.dataElementFormat = group.dataElementFormat
			tmpGroup.vertexPresentation = group.vertexPresentation

			resObj.push(tmpGroup)
		})
    
		return resObj
	}

	/**
   * Filter properties that need to save
   * @param {*} boundary 
   */
	getSaveDataBoundary(boundary) {
		return {
			name: boundary.name,
			description: boundary.description,
			member: boundary.member,
			id: boundary.id,
			width: boundary.width,
			height: boundary.height,
			parent: boundary.parent,
			mandatory: boundary.mandatory,
			repeat: boundary.repeat,
			svgId: boundary.svgId
		}
	}

	/**
   * Filter properties that need to save
   * @param {*} vertex 
   */
	getSaveDataVertex(vertex) {
		return {
			vertexType: vertex.vertexType,
			name: vertex.name,
			description: vertex.description,
			data: vertex.data,
			id: vertex.id,
			groupType: vertex.groupType,
			parent: vertex.parent,
			mandatory: vertex.mandatory,
			repeat: vertex.repeat,
			svgId: vertex.svgId
		}
	}

	/**
   * Filter properties that need to save
   * @param {*} edge 
   */
	getSaveDataEdge(edge) {
		return {
			id: edge.id,
			source: edge.source,
			target: edge.target,
			note: {
				originNote: edge.originNote,
				middleNote: edge.middleNote,
				destNote: edge.destNote
			},
			style:{
				line: edge.lineType,
				arrow: edge.useMarker
			}
		}
	}

	isEmptyContainerData(containerData) {
		return (containerData.vertex.length == 0 && containerData.boundary.length == 0)
	}

	/**
   * If loading from another svgId, then correct by curent svgId
   */
	edgeVerifySvgId(edges) {
		if (edges.length > 0) {
			let oldSvgId = edges[0].source.svgId
			let index = edges[0].source.svgId.indexOf('_')
			let oldSelectorName = oldSvgId.substring(index + 1, oldSvgId.length)

			if (oldSelectorName != this.selectorName) {
				edges.forEach(e => {
					e.source.svgId = e.source.svgId.replace(oldSelectorName, this.selectorName)
					e.target.svgId = e.target.svgId.replace(oldSelectorName, this.selectorName)
				})
			}
		}
	}

	setViewMode(viewMode = VIEW_MODE.EDIT) {
		this.viewMode.value = viewMode
	}

	initOnMouseUpBackground() {
		let selector = this.selector.prop('id')

		if (selector == '') {
			selector = `.${this.selector.prop('class')}`
		}else{
			selector = `#${selector}`
		}
    
		let tmpEdgeMgmt = this.edgeMgmt
		d3.select(selector).on('mouseup', function() {
			let mouse = d3.mouse(this)
			let elem = document.elementFromPoint(mouse[0], mouse[1])

			//disable selecting effect if edge is selecting
			if((!elem || !elem.tagName || elem.tagName != 'path') && tmpEdgeMgmt.isSelectingEdge()) {
				tmpEdgeMgmt.cancleSelectedPath()
			}
		})
	}
	
	/**
	 * 
	 */
	validateConnectionByUsage() {
		let lstRootBoundary = []
		this.dataContainer.boundary.forEach(b => {
			if (!b.parent) lstRootBoundary.push(b)
		})

		let lstNoneParentVertex = []
		this.dataContainer.vertex.forEach(v => {
			if (!v.parent) lstNoneParentVertex.push(v)
		})

		lstRootBoundary.forEach(b => {
			b.validateConnectionByUsage()
		})

		lstNoneParentVertex.forEach(item => {
			this.doValidateConnectionByUsage(item)
		})
	}
}
  
export default CltGraph
