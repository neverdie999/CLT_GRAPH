import * as d3 from 'd3'
import _ from 'lodash'
import ObjectUtils from '../../common/utilities/object.util'
import SegmentMgmt from '../common-objects/objects/segment-mgmt'
import EdgeMgmt from '../common-objects/objects/edge-mgmt'
import MainMenuSegment from '../common-objects/menu-context/main-menu-segment'

import {
	comShowMessage,
	setSizeGraph,
	setMinBoundaryGraph
} from '../../common/utilities/common.util'

import { 
	DEFAULT_CONFIG_GRAPH, VIEW_MODE, VERTEX_ATTR_SIZE, PADDING_POSITION_SVG, DATA_ELEMENT_TYPE,
} from '../../common/const/index'

class CltSegment {
	constructor(props) {
		this.selector = props.selector
		this.viewMode = {value: props.viewMode || VIEW_MODE.SEGMENT}

		this.selectorName = this.selector.selector.replace(/[\.\#]/,'')

		this.graphContainerId = `graphContainer_${this.selectorName}`
		this.graphSvgId = `graphSvg_${this.selectorName}`
		this.connectSvgId = `connectSvg_${this.selectorName}`

		this.isShowReduced = false
		
		this.mandatoryDataElementConfig = props.mandatoryDataElementConfig // The configuration for Data element validation
		if (!this.mandatoryDataElementConfig) {
			this.mandatoryDataElementConfig = { 
				mandatoryEvaluationFunc: (dataElement) => { return false },
				colorWarning: '#ff8100',
				colorAvailable: '#5aabff'
			}
		}

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

		this.segmentMgmt = new SegmentMgmt({
			dataContainer : this.dataContainer,
			containerId : this.graphContainerId,
			svgId : this.graphSvgId,
			viewMode: this.viewMode,
			edgeMgmt : this.edgeMgmt,
			mandatoryDataElementConfig: this.mandatoryDataElementConfig
		})

		this.initCustomFunctionD3()
		this.objectUtils.initListenerContainerScroll(this.graphContainerId, this.edgeMgmt, [this.dataContainer])
		this.objectUtils.initListenerOnWindowResize(this.edgeMgmt, [this.dataContainer])
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
		new MainMenuSegment({
			selector: `#${this.graphSvgId}`,
			containerId: `#${this.graphContainerId}`,
			parent: this,
			viewMode: this.viewMode,
			vertexDefinition: this.segmentMgmt.vertexDefinition
		})
	}

	/**
   * Clear all element on graph
   * And reinit marker def
   */
	clearAll() {
		this.segmentMgmt.clearAll()

		setSizeGraph({ width: DEFAULT_CONFIG_GRAPH.MIN_WIDTH, height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.graphSvgId)
	}

	showReduced() {
		this.isShowReduced = true
    
		this.dataContainer.vertex.forEach((vertex) => {
			d3.select(`#${vertex.id}`).selectAll('.property').classed('hide', true)
			d3.select(`#${vertex.id}`).select('foreignObject').attr('height', VERTEX_ATTR_SIZE.HEADER_HEIGHT)
		})
    
		this.sortByName()
	}

	showFull() {
		this.isShowReduced = false
    
		this.dataContainer.vertex.forEach((vertex) => {
			let arrProp = d3.select(`#${vertex.id}`).selectAll('.property').classed('hide', false)._groups[0]
			d3.select(`#${vertex.id}`).select('foreignObject').attr('height', VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * arrProp.length)
		})

		this.sortByName()
	}

	LoadVertexGroupDefinition(vertexDefinitionData) {
		if (this.dataContainer.vertex.length > 0 && !confirm('The current data will be cleared, do you want to continue ?')) {
			return
		}

		this.clearAll()

		if (this.segmentMgmt.LoadVertexGroupDefinition(vertexDefinitionData)) {
			this.initMenuContext()
		}
	}

	async drawObjects(data) {
		const { VERTEX: vertices } = data
		// Draw Segment

		let x = 5
		let y = 5
		vertices.forEach(e => {
			e.x = x
			e.y = y
			e.isImport = true

			this.segmentMgmt.create(e)
		})
	}

	async loadSegmentSpecEditor(segmentData) {

		if (!this.validateSegmentSpecStructure(segmentData)) {
			comShowMessage('Format or data in Segment Spec Structure is corrupted. You should check it!')
			return false
		}

		this.segmentMgmt.processDataVertexTypeDefine(segmentData)

		//clear data
		this.clearAll()

		await this.drawObjects(segmentData)
		await this.sortByName()

		this.initMenuContext()
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

	/**
	 * Define which css will be gotten from computedStyle to put into style property for export image
	 */
	getStylingList() {
		return [
			{el: '#export_image .vertex_content', properties: ['border-top', 'border-left', 'border-right', 'font-size', 'background']},
			{el: '#export_image .content_header_name', properties: ['height', 'border-bottom']},
			{el: '#export_image .content_header_name .header_name', properties: ['padding', 'margin', 'text-align', 'border-bottom', 'font-weight', 'font-size']},
			{el: '#export_image .vertex_data .property', properties: ['height', 'border-bottom', 'display', 'width', 'line-height']},
			{el: '#export_image .vertex_data .property .key', properties: ['width', 'text-align', 'margin-left', 'font-weight', 'font-size', 'white-space', 'overflow', 'text-overflow', 'max-width']},
			{el: '#export_image .vertex_data .property .data', properties: ['font-weight', 'font-size', 'width', 'margin-left', 'margin-right', 'text-align', 'border', 'white-space', 'overflow', 'text-overflow', 'max-width', ]},
			{el: '#export_image .vertex_data .property .has_left_connect', properties: ['margin-left', 'width', 'max-width']},
			{el: '#export_image .vertex_data .property .has_right_connect', properties: ['margin-right',	'width', 'max-width']},
		]
	}

	/**
	 * Apply css were defined from getStylingList function
	 * @param {*} elements 
	 */
	addInlineStyling(elements) {
		if(elements && elements.length) {
			elements.forEach(function(d) {
				d3.selectAll(d.el).each(function() {
					let element = this
					if (d.el == '.header_name') debugger
					if(d.properties && d.properties.length) {
						d.properties.forEach(function(prop) {
							let computedStyle = getComputedStyle(element, null)
							let value = computedStyle.getPropertyValue(prop)

							if (prop == 'height') {
								if (element.className == 'content_header_name')
									value = (parseInt(value.replace('px', ''))  - 2) + 'px'
								else
									value = (parseInt(value.replace('px', ''))  - 1) + 'px'
							}
								
							element.style[prop] = value
						})
					}
				 })
			})
		}
	}
	
	/**
	 * Save SVG to image
	 */
	saveToImage(fileName) {

		if (!fileName) {
			comShowMessage('Please input file name')
			return
		}
		
		// Show page loader 
		$('#loader').show()

		setTimeout(()=>{
			this.doSaveToImage(fileName)
		}, 300)
	}

	doSaveToImage(fileName) {
		const {width, height} = $(`#${this.graphSvgId}`).get(0).getBoundingClientRect()

		let html = d3.select(`#${this.graphSvgId}`)
			.node().outerHTML

		//Create dummy div for storing html that needed to be export
		d3.select('body')
			.append('div')
			.attr('id', 'export_image')
			.html(html)

		d3.select('#export_image svg')
			.attr('xmlns', 'http://www.w3.org/2000/svg')
			.attr('width', width)
			.attr('height', height)
			
		d3.selectAll('#export_image .vertex_content').attr('xmlns', 'http://www.w3.org/1999/xhtml')

		//Appy css was defined
		this.addInlineStyling(this.getStylingList())

		//Adding padding-left 2.5px for each first &nbsp; because it has an error while exporting with &nbsp;
		$('#export_image .vertex_data .property .key').each(function() {
			let innerHTML = this.innerHTML

			if (innerHTML != '') {
				let nCount = 0
				let arr = innerHTML.split('&nbsp;')

				for (let i = 0; i < arr.length; i++) {
					if (arr[i] == '') nCount++
					else break
				}

				if (nCount > 0) {
					$(this).css('padding-left', nCount * 2.5)
				}
			}
		})

		//Replace all &nbsp; by " "
		html = d3.select('#export_image').node().innerHTML
		html = html.replace(/&nbsp;/g, ' ')

		//Remove dummy div
		d3.select('#export_image').remove()

		// Create data and export image file
		let imgsrc = 'data:image/svg+xml;base64,'+ btoa(html)

		d3.select('body')
			.append('canvas')
			.attr('width', width)
			.attr('height', height)

		let canvas = $('canvas').get(0)
		let	context = canvas.getContext('2d')

		let image = new Image
		image.src = imgsrc
		image.onload = () => {

			context.drawImage(image, 0, 0)
	
			let a = document.createElement('a')
			a.download = `${fileName}.png`
			a.href = this.binaryblob()

			a.click()

			d3.select('canvas').remove()
			
			$('#loader').hide()
		}
	}

	binaryblob() {
		let byteString = atob(document.querySelector('canvas').toDataURL().replace(/^data:image\/(png|jpg);base64,/, ''))
		let ab = new ArrayBuffer(byteString.length)
		let ia = new Uint8Array(ab)
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i)
		}
		let dataView = new DataView(ab)
		let blob = new Blob([dataView], {type: 'image/png'})
		let DOMURL = self.URL || self.webkitURL || self
		let newurl = DOMURL.createObjectURL(blob)
	
		return newurl
	}

	getContentGraphAsJson() {
		let dataContent = {VERTEX_GROUP: [], VERTEX: []}

		if (this.isEmptyContainerData(this.dataContainer)) {
			return Promise.reject('There is no Input data. Please import!')
		} 

		const cloneVertexDefine = _.cloneDeep(this.segmentMgmt.vertexDefinition)

		if(cloneVertexDefine.vertexGroup) {
			dataContent.VERTEX_GROUP = this.getSaveVertexGroup(cloneVertexDefine.vertexGroup)
		}

		// Process data to export
		// Need clone data cause case user export
		// later continue edit then lost parent scope
		// Purpose prevent reference data.

		//Vertex and Boundary data
		const cloneData = _.cloneDeep(this.dataContainer)
		cloneData.vertex.forEach(vertex => {
			dataContent.VERTEX.push(this.getSaveDataVertex(vertex))
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
   * @param {*} vertex 
   */
	getSaveDataVertex(vertex) {
		let resObj = {}
		resObj.groupType = vertex.groupType
		resObj.vertexType = vertex.vertexType
		resObj.description = vertex.description
		resObj.data = []

		const arrPropNeedToSave = Object.keys(this.segmentMgmt.vertexGroup.dataElementFormat)

		vertex.data.forEach(e => {
			let elementDataObj = {}

			arrPropNeedToSave.forEach(prop => {
				elementDataObj[prop] = e[prop]
			})

			resObj.data.push(elementDataObj)
		})

		return resObj
	}

	isEmptyContainerData(containerData) {
		return (containerData.vertex.length == 0 && containerData.boundary.length == 0)
	}

	/**
   * Validate Vertex Group Define Structure
   */
	validateSegmentSpecStructure(data) {

		//Validate data exists
		if(data===undefined)
		{
			return false
		}

		if (!data.VERTEX_GROUP || !data.VERTEX) {
			return false
		}

		if (Object.keys(data).length > 2) {
			return false
		}

		return true
	}

	sortBySize() {
		let arrSort =  _.cloneDeep(this.dataContainer.vertex)

		// Sort descending by data lenght of vertex
		arrSort.sort(function (a,b) {
			return b.data.length - a.data.length
		})

		// get height for all vertex
		for (let i = 0; i < arrSort.length; i++) {
			const $vSelector = $(`#${arrSort[i].id}`)
			arrSort[i].height = $vSelector.get(0).getBoundingClientRect().height
		}
   
		const nMarginRight = 5
		const nMarginBottom = 5
		const $container = $(`#${this.graphContainerId}`)
		const {width: cntrW} = $container.get(0).getBoundingClientRect()
		let columnCount = parseInt((cntrW - ((parseInt(cntrW / VERTEX_ATTR_SIZE.GROUP_WIDTH) - 1) * nMarginRight)) / VERTEX_ATTR_SIZE.GROUP_WIDTH)
		if (columnCount < 1) columnCount = 1

		// Fist arrange
		let arrSort2 = []
		let arrLenght = []
		for (let i = 0; i < columnCount && i < arrSort.length; i++) {
			let arr = []
			arrSort[i].y = PADDING_POSITION_SVG.MIN_OFFSET_Y
			arr.push(arrSort[i])
			arrSort2.push(arr)
			arrLenght[i] = PADDING_POSITION_SVG.MIN_OFFSET_Y + arrSort[i].height
		}

		// Calculate for sorting
		if (arrSort.length > columnCount) {
			let nCount = columnCount
			while (nCount < arrSort.length) {
				// Find the column has the min height
				let indexOfMin = this.indexOfMinOf(arrLenght)

				arrSort[nCount].y = arrLenght[indexOfMin] + nMarginBottom
				arrSort2[indexOfMin].push(arrSort[nCount])
				arrLenght[indexOfMin] += arrSort[nCount].height + nMarginBottom

				nCount++
			}
		}

		// Arrange all vertex with arrSort2 was made
		let x = PADDING_POSITION_SVG.MIN_OFFSET_X

		for (let row = 0; row < arrSort2.length; row++) {
			for (let col = 0; col < arrSort2[row].length; col++) {
				const vertex = _.find(this.dataContainer.vertex, {'id': arrSort2[row][col].id})
				vertex.setPosition({x, y: arrSort2[row][col].y})
			}
			x += VERTEX_ATTR_SIZE.GROUP_WIDTH + nMarginRight
		}

		setMinBoundaryGraph(this.dataContainer, this.graphSvgId, this.viewMode.value)
	}

	sortByName() {
		let arrSort =  _.cloneDeep(this.dataContainer.vertex)

		arrSort.sort(function (a,b) {
			return (a.name.toUpperCase()).localeCompare((b.name.toUpperCase()))
		})

		// get height for all vertex
		for (let i = 0; i < arrSort.length; i++) {
			const $vSelector = $(`#${arrSort[i].id}`)
			arrSort[i].height = $vSelector.get(0).getBoundingClientRect().height
		}
   
		const nMarginRight = 5
		const nMarginBottom = 5
		const $container = $(`#${this.graphContainerId}`)
		const {width: cntrW} = $container.get(0).getBoundingClientRect()
		let columnCount = parseInt((cntrW - ((parseInt(cntrW / VERTEX_ATTR_SIZE.GROUP_WIDTH) - 1) * nMarginRight)) / VERTEX_ATTR_SIZE.GROUP_WIDTH)
		if (columnCount < 1) columnCount = 1

		// Fist arrange
		let arrSort2 = []
		let arrLenght = []
		for (let i = 0; i < columnCount && i < arrSort.length; i++) {
			let arr = []
			arrSort[i].y = PADDING_POSITION_SVG.MIN_OFFSET_Y
			arr.push(arrSort[i])
			arrSort2.push(arr)
			arrLenght[i] = PADDING_POSITION_SVG.MIN_OFFSET_Y + arrSort[i].height
		}

		// Calculate for sorting
		if (arrSort.length > columnCount) {
			let nCount = columnCount
			while (nCount < arrSort.length) {
				// Find the column has the min height
				let indexOfMax = this.indexOfMaxOf(arrLenght)
				const maxLength = arrLenght[indexOfMax]
				const y = arrLenght[indexOfMax] + nMarginBottom

				for (let i = 0; i < columnCount && nCount < arrSort.length; i++) {
					arrSort[nCount].y = y
					arrSort2[i].push(arrSort[nCount])

					arrLenght[i] = maxLength + nMarginBottom + arrSort[nCount].height

					nCount++
				}
			}
		}

		// Arrange all vertex with arrSort2 was made
		let x = PADDING_POSITION_SVG.MIN_OFFSET_X

		for (let row = 0; row < arrSort2.length; row++) {
			for (let col = 0; col < arrSort2[row].length; col++) {
				const vertex = _.find(this.dataContainer.vertex, {'id': arrSort2[row][col].id})
				vertex.setPosition({x, y: arrSort2[row][col].y})
			}
			x += VERTEX_ATTR_SIZE.GROUP_WIDTH + nMarginRight
		}

		setMinBoundaryGraph(this.dataContainer, this.graphSvgId, this.viewMode.value)
	}

	indexOfMinOf(arr) {
		if (arr.length == 0) return -1

		let min = arr[0]
		let index = 0

		for (let i = 1; i < arr.length; i++) {
			if (arr[i] < min) {
				min = arr[i]
				index = i
			}
		}

		return index
	}

	indexOfMaxOf(arr) {
		if (arr.length == 0) return -1

		let max = arr[0]
		let index = 0

		for (let i = 1; i < arr.length; i++) {
			if (arr[i] > max) {
				max = arr[i]
				index = i
			}
		}

		return index
	}
}
  
export default CltSegment
