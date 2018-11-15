import ColorHash from 'color-hash'
import _ from 'lodash'
import * as d3 from 'd3'

import {
	VERTEX_ATTR_SIZE,
	CONNECT_SIDE,
	TYPE_CONNECT,
	DATA_ELEMENT_TYPE,
	VERTEX_GROUP_TYPE
} from '../../../common/const/index'

import { 
	generateObjectId,
	setMinBoundaryGraph,
	checkModePermission,
	arrayMove,
	getKeyPrefix,
	htmlEncode,
	segmentName,
} from '../../../common/utilities/common.util'

const CONNECT_KEY = 'Connected'

class Vertex {
	constructor(props) {
		this.dataContainer = props.vertexMgmt.dataContainer
		this.containerId = props.vertexMgmt.containerId
		this.svgId = props.vertexMgmt.svgId
		this.selectorClass = props.vertexMgmt.selectorClass || 'defaul_vertex_class'
		this.vertexDefinition = props.vertexMgmt.vertexDefinition
		this.viewMode = props.vertexMgmt.viewMode
		this.connectSide = props.vertexMgmt.connectSide
		this.mandatoryDataElementConfig	= props.vertexMgmt.mandatoryDataElementConfig // The configuration for Data element validation
		this.vertexMgmt = props.vertexMgmt		
		

		this.id = null
		this.x = 0 //type: number, require: true, purpose: coordinate x
		this.y = 0 //type: number, require: true, purpose: coordinate y
		this.groupType = '' // Current is OPERATION or SEGMENT
		this.vertexType = '' // The details of group type
		this.name = '' //type: string, require: false, purpose: vertex name
		this.description = '' //type: string, require: false, purpose: content title when hover to vertex
		this.data = [] //type: array, require: false, default: empty array, purpose: define the content of vertex
		this.parent = null
		this.mandatory = false
		this.repeat = 1
		this.type
		this.show

		this.initialize()
	}

	initialize() {
		this.colorHash = new ColorHash({lightness: 0.7})
		this.colorHashConnection = new ColorHash({lightness: 0.8})
	}

	/**
   * Create vertex with options
   * @param x => type: number, require: true, purpose: coordinate x
   * @param y => type: number, require: true, purpose: coordinate y
   * @param name => type: string, require: false, purpose: vertex name
   * @param description => type: string, require: false, purpose: content title when hover to vertex
   * @param id => type: string, require: true, purpose: identify for vertex
   * @param data => type: array, require: false, default: empty array, purpose: define the content of vertex
   * @param connectSide => type: string, require: false, the default value is an anonymous function not handle anything.
   * @param presentation => type: object, require: true if @param[data] defined
   * and selector for menu context on vertex
   * @param callbackDragVertex => type: function, require: false, default: anonymous function, purpose: call back drag vertex
   * @param callbackDragConnection => type: function, require: false, default: anonymous function, purpose: call back drag connection
   */
	create(sOptions = {}, callbackDragVertex = ()=>{}, callbackDragConnection = ()=>{}) {

		let {id, x, y, groupType, vertexType, name, description, data, parent, mandatory, repeat, isMenu, isImport} = sOptions

		if (isMenu) {
			let vertexTypeInfo = _.cloneDeep(_.find(this.vertexDefinition.vertex, {'vertexType': vertexType}))
			data = vertexTypeInfo.data
			description = vertexTypeInfo.description
			groupType = vertexTypeInfo.groupType
		}

		this.id = id || generateObjectId('V')
		this.x = x || 0
		this.y = y || 0
		this.groupType = groupType
		this.vertexType = vertexType
		this.name = name || vertexType
		this.description = description || 'Description'
		this.data = data || []
		this.parent = parent || null
		this.mandatory = mandatory || false
		this.repeat = repeat || 1
		this.type = 'V'
		this.show = true

		if ( !this.dataContainer.vertex ) this.dataContainer.vertex = []
		this.dataContainer.vertex.push(this)

		let group = d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`)
			.data(this.dataContainer.vertex)
			.enter().append('g')
			.attr('transform', `translate(${this.x}, ${this.y})`)
			.attr('id', this.id)
			.attr('class', `${this.selectorClass}`)

		// If isEnableDragVertex => emphasizePathConnectForVertex will be call at StartDrag
		// else => have to bind emphasizePathConnectForVertex for click event
		if(checkModePermission(this.viewMode.value, 'isEnableDragVertex')) {
			group.call(callbackDragVertex)
		}else{
			$(`#${this.id}`).click( () => {
				this.vertexMgmt.edgeMgmt.emphasizePathConnectForVertex(this)
			})
		}
    
		this.generateContent(callbackDragConnection)

		if(!isImport) 
			setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value)

		// Check mandatory for data element
		this.validateConnectionByUsage()
		
		return this
	}
	
	generateContent(callbackDragConnection = ()=>{}) {
		let htmlContent = ''
		let presentation = _.find(this.vertexDefinition.vertexGroup, {'groupType':this.groupType}).vertexPresentation
		let countData = this.data.length
		let hasLeftConnector = (this.connectSide == CONNECT_SIDE.LEFT || this.connectSide == CONNECT_SIDE.BOTH) ? ' has_left_connect' : ''
		let hasRightConnector = (this.connectSide == CONNECT_SIDE.RIGHT || this.connectSide == CONNECT_SIDE.BOTH) ? ' has_right_connect' : ''
		for (let i = 0; i < countData; i++) {
			let item = this.data[i]
			htmlContent += `
        <div class="property" prop="${this.id}${CONNECT_KEY}${i}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key${hasLeftConnector}" id="${this.id}${presentation.key}${i}" title="${item[presentation.keyTooltip] || 'No data to show'}">${htmlEncode(getKeyPrefix(item, this.vertexDefinition, this.groupType))}${item[presentation.key] || ''}</label>
          <label class="data${hasRightConnector}" id="${this.id}${presentation.value}${i}" title="${item[presentation.valueTooltip] || 'No data to show'}">${item[presentation.value] || ''}</label>
        </div>`
		}

		let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * countData
		
		let group = d3.select(`#${this.id}`)
		group.append('foreignObject')
			.attr('width', VERTEX_ATTR_SIZE.GROUP_WIDTH)
			.attr('height', vertexHeight)
			.append('xhtml:div')
			.attr('class', 'vertex_content')
			.html(`
			<div class="content_header_name" style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px;
									background-color: ${this.colorHash.hex(this.name)};
									cursor: move; pointer-events: all">
				<p class="header_name" id="${this.id}Name" title="${this.description}">${segmentName(this, this.viewMode.value)}</p>
			</div>
					
        <div class="vertex_data">
          ${htmlContent}
        </div>
      `)
    
		//Rect connect title INPUT
		if (this.connectSide === CONNECT_SIDE.BOTH || this.connectSide === CONNECT_SIDE.LEFT) {
			group.append('rect')
				.attr('class', `drag_connect connect_header drag_connect_${this.svgId}`)
				.attr('type', TYPE_CONNECT.INPUT)
				.attr('prop', `${this.id}${CONNECT_KEY}title`)
				.attr('pointer-events', 'all')
				.attr('width', 12)
				.attr('height', VERTEX_ATTR_SIZE.HEADER_HEIGHT - 1)
				.attr('x', 1)
				.attr('y', 1)
				.attr('fill', this.colorHash.hex(this.name))
				.call(callbackDragConnection)
		}

		//Rect connect title OUTPUT
		if (this.connectSide === CONNECT_SIDE.BOTH || this.connectSide === CONNECT_SIDE.RIGHT) {
			group.append('rect')
				.attr('class', `drag_connect connect_header drag_connect_${this.svgId}`)
				.attr('type', TYPE_CONNECT.OUTPUT)
				.attr('prop', `${this.id}${CONNECT_KEY}title`)
				.attr('pointer-events', 'all')
				.attr('width', 12)
				.attr('height', VERTEX_ATTR_SIZE.HEADER_HEIGHT - 1)
				.attr('x', VERTEX_ATTR_SIZE.GROUP_WIDTH - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2))
				.attr('y', 1)
				.attr('fill', this.colorHash.hex(this.name))
				.call(callbackDragConnection)
		}

		for (let i = 0; i < countData; i++) {
			// Input
			if (this.connectSide === CONNECT_SIDE.BOTH || this.connectSide === CONNECT_SIDE.LEFT) {
				let connect = group.append('rect')
					.attr('class', `drag_connect drag_connect_${this.svgId}`)
					.attr('type', TYPE_CONNECT.INPUT)
					.attr('prop', `${this.id}${CONNECT_KEY}${i}`)
					.attr('pointer-events', 'all')
					.attr('width', 12)
					.attr('height', 25)
					.attr('x', 1)
					.attr('y', VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
					.attr('fill', this.colorHashConnection.hex(this.name))
					.call(callbackDragConnection)
			}

			// Output
			if (this.connectSide === CONNECT_SIDE.BOTH || this.connectSide === CONNECT_SIDE.RIGHT) {
				let connect =  group.append('rect')
					.attr('class', `drag_connect drag_connect_${this.svgId}`)
					.attr('type', TYPE_CONNECT.OUTPUT)
					.attr('prop', `${this.id}${CONNECT_KEY}${i}`)
					.attr('pointer-events', 'all')
					.attr('width', 12)
					.attr('height', 25)
					.attr('x', VERTEX_ATTR_SIZE.GROUP_WIDTH - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2))
					.attr('y', VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
					.attr('fill', this.colorHashConnection.hex(this.name))
					.call(callbackDragConnection)
			}
		}
	}

	/**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param position
   */
	setPosition(position) {
		let {x, y} = position
		this.x = x
		this.y = y
		this.updatePathConnect()

		d3.select(`#${this.id}`).attr('transform','translate(' + [x, y] + ')')
	}

	/**
   * Copy vertex selected
   */
	copy() {
		let {x, y, name, description, vertexType, data, repeat, mandatory, groupType} = _.cloneDeep(this)
		x = x + VERTEX_ATTR_SIZE.SPACE_COPY
		y = y + VERTEX_ATTR_SIZE.SPACE_COPY

		this.vertexMgmt.create({x, y, name, description, vertexType, data, repeat, mandatory, groupType})
	}

	/**
   * Remove vertex
   */
	remove() {
		// Remove all edge relate to vertex
		this.vertexMgmt.edgeMgmt.removeAllEdgeConnectToVertex(this)

		if (this.parent) {
			let parentObj = _.find(this.dataContainer.boundary, {'id': this.parent})
			parentObj.removeMemberFromBoundary(this)
		}
      
		// Remove from DOM
		d3.select(`#${this.id}`).remove()

		// Remove from data container
		let vertexInfo = _.remove(this.dataContainer.vertex, (e) => {
			return e.id === this.id
		})

		setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value)
	}
  
	/**
   * The function called from boundary via mainMgmt
   * In case that delete all boundary parent of vertex
   * Different between this func and remove func is, in this case we don't care the parent, because it was deleted 
   */
	delete() {
		// Remove all edge relate to vertex
		this.vertexMgmt.edgeMgmt.removeAllEdgeConnectToVertex(this)

		// Remove from DOM
		d3.select(`#${this.id}`).remove()
		// Remove from data container
		_.remove(this.dataContainer.vertex, (e) => {
			return e.id === this.id
		})
	}  

	/**
   * Move to new position with parent offset(called when moving the boundary that contain this vertex)
   * @param {*} offsetX
   * @param {*} offsetY
   */
	move(offsetX, offsetY) {
		this.x = this.x + offsetX
		this.y = this.y + offsetY
		d3.select(`#${this.id}`).attr('transform', 'translate(' + [this.x, this.y] + ')')

		this.updatePathConnect()
	}

	updatePathConnect() {
		this.vertexMgmt.updatePathConnectForVertex(this)
	}

	moveToFront() {
		d3.select(`#${this.id}`).moveToFront()

		if (this.dataContainer.vertex.length > 1) {
			let curIndex = _.findIndex(this.dataContainer.vertex, {'id': this.id})

			arrayMove(this.dataContainer.vertex, curIndex, this.dataContainer.vertex.length - 1)
		}
	}

	/**
   * 
   * @param {*} prop 
   * @param {*} type 
   */
	markedConnectorByProp(prop, type) {
		d3.select(`[prop="${prop}"][type=${type}]`).classed('marked_connector', true)
	}

	/**
   * Checked connected and marked connector for vertex
   */
	markedAllConnector() {

		let lstMarkedInput = []
		let lstMarkedOutput = []

		lstMarkedOutput = this.vertexMgmt.edgeMgmt.dataContainer.edge.filter(e => {
			return  e.source.prop.indexOf('title') == -1 && e.source.vertexId == this.id
		})

		lstMarkedInput = this.vertexMgmt.edgeMgmt.dataContainer.edge.filter(e => {
			return e.target.prop.indexOf('title') == -1 && e.target.vertexId == this.id
		})

		lstMarkedInput.forEach(e => {
			d3.select(`[prop="${e.target.prop}"][type="I"]`).classed('marked_connector', true)
		})

		lstMarkedOutput.forEach(e => {
			d3.select(`[prop="${e.source.prop}"][type="O"]`).classed('marked_connector', true)
		})
	}

	/**
   * Calculate for scroll left and scroll top to show this vertex to user (Find feature of SegmentSetEditor)
   */
	showToUser() {
		const $container = $(`#${this.containerId}`)
		const $vertex = $(`#${this.id}`)

		const {width: cntrW, height: cntrH} = $container.get(0).getBoundingClientRect()
		const cntrLeft = $container.scrollLeft()
		const cntrTop = $container.scrollTop()
		const {width: vtxW, height: vtxH} = $vertex.get(0).getBoundingClientRect()

		//Horizontal
		if (this.x < cntrLeft) {
			$container.scrollLeft(this.x - 5)
		}else if (this.x + vtxW > cntrLeft + cntrW) {
			$container.scrollLeft(this.x - (cntrW - vtxW) + 15)
		}

		//Vertical
		if (this.y < cntrTop) {
			$container.scrollTop(this.y - 5)
		}else if (this.y + vtxH > cntrTop + cntrH) {
			if (vtxH > cntrH - 15) {
				$container.scrollTop(this.y - 5)
			} else {
				$container.scrollTop(this.y - (cntrH - vtxH) + 15)
			}
		}

		//Show this vertex on the Top
		this.moveToFront()

		//Highlight the title background-color
		const $vtxTitle = $(`#${this.id}`).find('.content_header_name')
		const $headerConnectors = $(`#${this.id}`).find('.connect_header')
		const colorByName = this.colorHash.hex(this.name)
		for (let i = 0; i < 3; i++) {
			setTimeout(function() {
				$vtxTitle.css('background-color', 'white')
				for (let i = 0; i < $headerConnectors.length; i++) {
					$($headerConnectors[i]).attr('fill', 'white')
				}
			},i*400)
			setTimeout(function() {
				$vtxTitle.css('background-color', `${colorByName}`)
				for (let i = 0; i < $headerConnectors.length; i++) {
					$($headerConnectors[i]).attr('fill', `${colorByName}`)
				}
			}, 200 + i*400)
		}
	}

	/**
	 * Checking and filling warning color for mandatory Data element that have no connection
	 */
	validateConnectionByUsage() {

		if (!checkModePermission(this.viewMode.value, 'mandatoryCheck')) return true

		if (this.groupType === VERTEX_GROUP_TYPE.OPERATION) return true
		
		let bFlag = true
		const {mandatoryEvaluationFunc, colorWarning, colorAvailable} = this.mandatoryDataElementConfig
		
		let dataElement = _.cloneDeep(this.data)
		this.getConnectionStatus(dataElement)

		// Checking if any parent is conditional
		let parentId = this.parent
		let parentObj = null
		let bHasConditionalParent = false
		while(parentId) {
			parentObj = _.find(this.dataContainer.boundary, {'id': parentId})
			if (!parentObj.mandatory) {
				bHasConditionalParent = true
				break
			}
			
			parentId = parentObj.parent
		}

		let bHasAllMandatoryParent = !bHasConditionalParent // For reading source code easily

		if (this.parent) {
			bHasAllMandatoryParent &= this.mandatory
		} else {
			bHasAllMandatoryParent = this.mandatory
		}

		for (let i = 0; i < dataElement.length; i++) {

			if (dataElement[i].type == DATA_ELEMENT_TYPE.COMPOSITE) continue

			if (mandatoryEvaluationFunc(dataElement[i])) {
				if (dataElement[i].hasConnection) {
					$(`#${this.id} .property[prop='${this.id}${CONNECT_KEY}${i}']`).css('background-color', colorAvailable)

				} else {

					let isMandatoryComposite = false
					if (dataElement[i].type == DATA_ELEMENT_TYPE.COMPONENT) {
						const parentComposite = this.findComposite(i)
						isMandatoryComposite = mandatoryEvaluationFunc(parentComposite);
						bHasAllMandatoryParent &= isMandatoryComposite
					}

					if (bHasAllMandatoryParent) {
						// GRP[M] - SGM[M] - DE[M]
						if (bFlag) bFlag = false
						$(`#${this.id} .property[prop='${this.id}${CONNECT_KEY}${i}']`).css('background-color', colorWarning)
	
					} else if (this.hasAnyConnectionToOtherDataElement(dataElement, i, isMandatoryComposite)) {
						// GRP[M] - SGM[C] - DE[M]
						// GRP[C] - SGM[M] - DE[M]
						// GRP[C] - SGM[C] - DE[M]
						if (bFlag) bFlag = false
						$(`#${this.id} .property[prop='${this.id}${CONNECT_KEY}${i}']`).css('background-color', colorWarning)

					} else {
						$(`#${this.id} .property[prop='${this.id}${CONNECT_KEY}${i}']`).css('background-color', colorAvailable)
					}
				}
			}
		}

		return bFlag
	}

	/**
	 * Checking if any connection to each data element
	 * @param {*} vertexId 
	 * @param {*} dataElement 
	 */
	getConnectionStatus(dataElement) {
		for (let i = 0; i < this.vertexMgmt.edgeMgmt.dataContainer.edge.length; i++) {
			let edge = this.vertexMgmt.edgeMgmt.dataContainer.edge[i]
			for (let indexOfDataElement = 0; indexOfDataElement < dataElement.length; indexOfDataElement++) {
				if (parseInt(edge.target.prop.replace(`${this.id}${CONNECT_KEY}`, '')) == indexOfDataElement) {
					dataElement[indexOfDataElement].hasConnection = true
				}
			}
		}
	}

	/**
	 * 
	 * @param {*} dataElement 
	 * @param {*} idxCurDataElement 
	 * @param {*} isMandatoryComposite if idxCurDataElement is a COMPONENT then this param will be use
	 */
	hasAnyConnectionToOtherDataElement(dataElement, idxCurDataElement, isMandatoryComposite) {
		// In case of SIMPLE => checking connection for all others
		if (dataElement[idxCurDataElement].type === DATA_ELEMENT_TYPE.SIMPLE) {
			for (let i = 0; i < dataElement.length; i++) {
				if (i != idxCurDataElement && dataElement[i].type !== DATA_ELEMENT_TYPE.COMPOSITE && dataElement[i].hasConnection) return true
			}
		} else if (dataElement[idxCurDataElement].type === DATA_ELEMENT_TYPE.COMPONENT) {
			// In case of COMPONENT and its COMPOSITE is mandatory => same with SIMPLE
			if (isMandatoryComposite) {
				for (let i = 0; i < dataElement.length; i++) {
					if (i != idxCurDataElement && dataElement[i].type !== DATA_ELEMENT_TYPE.COMPOSITE && dataElement[i].hasConnection) return true
				}
			} else {
				// In case of COMPONENT and its COMPOSITE is CONDITIONAL => checking connection for others COMPONENT in the same COMPOSITE
				let firstComponentIndex = idxCurDataElement
				let lastComponentIndex = idxCurDataElement
	
				while (firstComponentIndex - 1 >= 0 && dataElement[firstComponentIndex - 1].type === DATA_ELEMENT_TYPE.COMPONENT) {
					firstComponentIndex--
					if (dataElement[firstComponentIndex].hasConnection) return true
				}
	
				while (lastComponentIndex + 1 < dataElement.length && dataElement[lastComponentIndex + 1].type === DATA_ELEMENT_TYPE.COMPONENT) {
					lastComponentIndex++
					if (dataElement[lastComponentIndex].hasConnection) return true
				}
			} 
		}
			
		return false
	}

	/**
	 * Find Composite of Component at Component position
	 * @param {*} componentIndex 
	 */
	findComposite(componentIndex) {
		for (let i = componentIndex - 1; i >= 0; i--) {
			if (this.data[i].type === DATA_ELEMENT_TYPE.COMPOSITE) return this.data[i]
		}
	}
}

export default Vertex
