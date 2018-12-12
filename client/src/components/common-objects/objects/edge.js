import _ from 'lodash'
import * as d3 from 'd3'

import { LINE_TYPE } from '../../../common/const/index'
import { generateObjectId, createPath } from '../../../common/utilities/common.util'

class Edge {
	constructor(props) {
		this.dataContainer = props.edgeMgmt.dataContainer
		this.svgId = props.edgeMgmt.svgId
		this.selectorClass = props.edgeMgmt.selectorClass
		this.arrowId = props.edgeMgmt.arrowId
		this.edgeMgmt = props.edgeMgmt

		this.groupEdgePathId = props.edgeMgmt.groupEdgePathId
		this.edgePathId = props.edgeMgmt.edgePathId
		this.groupEdgePointId = props.edgeMgmt.groupEdgePointId
		this.pointStartId = props.edgeMgmt.pointStartId
		this.pointEndId = props.edgeMgmt.pointEndId
		this.dummyPathId = props.edgeMgmt.dummyPathId

		this.id
		this.source
		this.target
		this.lineType = LINE_TYPE.SOLID// "S" or "D" (Solid/Dash)
		this.useMarker = 'Y' // "Y" | "N"
		this.originNote = ''
		this.middleNote = ''
		this.destNote = ''

		this.initialize()
	}

	initialize() {
    
		this.limitTop = 0
		this.limitBottom = $(window).height()
		this.limitLeft = 0
		this.limitRight = $(window).width()
	}

	/**
   *
   * @param svgSelector => type: object, require: true, purpose: the place where the DOM append to
   * @param pathStr => type: string, require: true, purpose: use to draw edge from to
   * @param note => type: object, require: false, default: empty object, purpose: content start, middel, end note
   * @param id => tpe: string, require: true, identify for edge
   * @param callbackOnClick => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param callbackOnKeyDown => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param callbackOnFocusOut => type: function, require: false, default: anonymous function, purpose: call back drag connection
   * @param containerClass => type: string, require: false, purpose: the class used as selector for menu context on edge
   */
	create(sOptions) {

		const {id, source, target, style , note} = sOptions

		this.id = id || generateObjectId('E')
		this.source = source
		this.target = target

		if(style) {
			this.lineType = style.line || this.lineType
			this.useMarker = style.arrow || this.useMarker
		}
		if(note) {
			this.originNote = note.originNote
			this.middleNote = note.middleNote
			this.destNote = note.destNote
		}

		if(!this.dataContainer.edge) this.dataContainer.edge = []
		this.dataContainer.edge.push(this)

		let pathStr = createPath(this.source, this.target)

		//Edge group
		let group = d3.select(`#${this.svgId}`).append('g')
			.attr('transform', 'translate(0.5, 0.5)')
			.attr('class', `edge ${this.selectorClass}`)
			.attr('ref', this.id)
			.style('visibility', 'visible')
			.style('cursor', 'crosshair')
			.on('click', () => {
				this.edgeMgmt.handlerOnClickEdge(this)
			})
			.on('focus', () => {
				group.on('keydown', () => {
					//callbackOnKeyDown(this.id, d3.event);
					if (event.keyCode === 46 || event.keyCode === 8) {
						this.remove()
					}
				})
			})

		d3.select(`#${this.svgId}`).select('defs').append('marker')
			.attr('id', `arrow${this.id}`)
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 10)
			.attr('refY', 5)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', 'black')

		//hidden line, it has larger width for selecting easily
		group.append('path')
			.attr('d', pathStr)
			.attr('id', this.id)
			.attr('focusable', true)
			.attr('stroke', 'white')
			.attr('stroke-miterlimit', 10)
			.attr('pointer-events', 'stroke')
			.attr('visibility', 'hidden')
			.attr('stroke-width', 9)
			.attr('marker-end', `url(#arrow${this.id})`)

		group.append('path')
			.attr('d', pathStr)
			.attr('id', this.id)
			.attr('focusable', true)
			.attr('stroke', 'black')
			.attr('stroke-miterlimit', 10)
			.attr('focusable', true)
			.attr('marker-end', this.useMarker === 'Y' ? `url(#arrow${this.id})` : '')
			.attr('stroke-dasharray', this.lineType === LINE_TYPE.SOLID ? '0 0' : '3 3') // Make arrow at end path

		let origin = group.append('text')
			.style('font-size', '12px')
			.attr('x', 5)   // Move the text from the start angle of the arc
			.attr('dy', -5) // Move the text down
		let middle = group.append('text')
			.style('font-size', '12px')
			.attr('dy', -5) // Move the text down
		let dest = group.append('text')
			.style('font-size', '12px')
			.attr('x', -5)   // Move the text from the start angle of the arc
			.attr('dy', -5) // Move the text down

		origin.append('textPath')
			.style('text-anchor', 'start')
			.attr('fill', '#000000')
			.attr('id', `originNote${this.id}`)
			.attr('xlink:href', `#${this.id}`)
			.attr('startOffset', '0%')
			.text(this.originNote)

		middle.append('textPath')
			.style('text-anchor', 'middle')
			.attr('fill', '#000000')
			.attr('id', `middleNote${this.id}`)
			.attr('xlink:href', `#${this.id}`)
			.attr('startOffset', '50%')
			.text(this.middleNote)

		dest.append('textPath')
			.style('text-anchor', 'end')
			.attr('fill', '#000000')
			.attr('id', `destNote${this.id}`)
			.attr('xlink:href', `#${this.id}`)
			.attr('startOffset', '100%')
			.text(this.destNote)

		//Marked connector as connected
		if (this.source.prop.indexOf('title') == -1) {
			d3.select(`[prop="${this.source.prop}"][type="O"]`).classed('marked_connector', true)
		}
		if (this.target.prop.indexOf('title') == -1) {
			d3.select(`[prop="${this.target.prop}"][type="I"]`).classed('marked_connector', true)
		}
	}

	/**
   * Remove edge by id
   * @param edgeId
   */
	remove() {
		// Remove from DOM
		let selected = d3.select(`#${this.id}`)
		if (selected) {
			selected.node().parentNode.remove()
			// Mutates array edge
			_.remove(this.dataContainer.edge, (e) => {
				return e.id === this.id
			})
		}

		d3.select(`#arrow${this.id}`).remove()

		if (this.edgeMgmt.isSelectingEdge())
			this.edgeMgmt.cancleSelectedPath()

		//Unmarked connector
		// For source connection
		if (this.source.prop.indexOf('title') == -1) {
			let isSrcExist = false
			this.dataContainer.edge.forEach(e => {
				if (e.source.prop == this.source.prop) {
					isSrcExist = true
				}
			})

			if (!isSrcExist) {
				let vertices = []
				this.edgeMgmt.vertexContainer.forEach(e=>{
					vertices = vertices.concat(e.vertex)
				})
        
				const propNode = $(`rect[prop=${this.source.prop}][type='O']`)[0]
				//In case of updated vertex and poperties lost => propNode will not exist
				if (propNode) {
					d3.select(`rect[prop=${this.source.prop}][type='O']`).classed('marked_connector',false)
				}
			}
		}
		
		// For target connection
		if (this.target.prop.indexOf('title') == -1) {
			let isTagExist = false
			this.dataContainer.edge.forEach(e => {
				if (e.target.prop == this.target.prop) {
					isTagExist = true
				}
			})

			if (!isTagExist) {
				let vertices = []
				this.edgeMgmt.vertexContainer.forEach(e=>{
					vertices = vertices.concat(e.vertex)
				})
        
				const propNode = $(`rect[prop=${this.target.prop}][type='I']`)[0]
				//In case of updated vertex and poperties lost => propNode will not exist
				if (propNode) {
					d3.select(`rect[prop=${this.target.prop}][type='I']`).classed('marked_connector',false)

					// mandatory Data elelment checking for target vertex (case of output message of message mapping GUI)
					const vertexId = $(propNode.parentNode).attr('id')
					const vertex = _.find(vertices, {'id':vertexId})
					vertex.validateConnectionByUsage()
				}
			}
		}
		
		
	}

	/**
   * Update attribute d of path (connect)
   * @param id
   * @param options: object
   */
	updatePathConnect(sOptions = {}) {
		_.merge(this, sOptions)
		const {source, target} = this
		let pathStr = createPath(source, target)
		// Get DOM and update attribute
		d3.selectAll(`#${this.id}`).attr('d', pathStr)
	}
	
	updateMarkedConnector(sOptions = {}) {
		
		if (Object.keys(sOptions)[0] == 'source') {
			// Unmarked old connector
			if (this.source.prop.indexOf('title') == -1) {
				let isExist = _.find(this.dataContainer.edge, (e) => {
					return e.id != this.id && e.source.vertexId == this.source.vertexId && e.source.prop == this.source.prop
				})

				// If there is no any connection to this connector then unmark it
				if (!isExist) {
					d3.select(`[prop="${this.source.prop}"][type="O"]`).classed('marked_connector', false)
				}
			}

			//Marked new connector
			if (sOptions.source.prop.indexOf('title') == -1) {
				d3.select(`[prop="${sOptions.source.prop}"][type="O"]`).classed('marked_connector', true)
			}
		} else {
			// Unmarked old connector
			if (this.target.prop.indexOf('title') == -1) {
				let isExist = _.find(this.dataContainer.edge, (e) => {
					return e.id != this.id && e.target.vertexId == this.target.vertexId && e.target.prop == this.target.prop
				})

				// If there is no any connection to this connector then unmark it
				if (!isExist) {
					d3.select(`[prop="${this.target.prop}"][type="I"]`).classed('marked_connector', false)
				}
			}

			//Marked new connector
			if (sOptions.target.prop.indexOf('title') == -1) {
				d3.select(`[prop="${sOptions.target.prop}"][type="I"]`).classed('marked_connector', true)
			}
		}
	}

	setStatusEdgeOnCurrentView() {
		const {id, source: {x: xSrc, y: ySrc, svgId: svgSrc}, target: {x: xDes, y: yDes, svgId: svgDes}} = this

		let srcContainerRect = $(`#${svgSrc}`)[0].parentNode.getBoundingClientRect()
		let desContainerRect = $(`#${svgDes}`)[0].parentNode.getBoundingClientRect()

		let srcOffsetRight = 0 // thickness of vertical scrollbar
		let srcOffsetBottom = 0 // thickness of horizontal scrollbar
		let desOffsetRight = 0 // thickness of vertical scrollbar
		let desOffsetBottom = 0 // thickness of horizontal scrollbar

		if ($(`#${svgSrc}`)[0].parentNode.scrollHeight  > $($(`#${svgSrc}`)[0].parentNode).height()) srcOffsetRight = 10
		if ($(`#${svgSrc}`)[0].parentNode.scrollWidth   > $($(`#${svgSrc}`)[0].parentNode).width()) srcOffsetBottom = 10
		if ($(`#${svgDes}`)[0].parentNode.scrollHeight  > $($(`#${svgDes}`)[0].parentNode).height()) desOffsetRight = 10
		if ($(`#${svgDes}`)[0].parentNode.scrollWidth   > $($(`#${svgDes}`)[0].parentNode).width()) desOffsetBottom = 10

		const node = d3.select(`#${id}`)
		if (   xSrc < srcContainerRect.left || xSrc > srcContainerRect.right - srcOffsetRight 
        || ySrc < srcContainerRect.top  || ySrc > srcContainerRect.bottom - srcOffsetBottom
        || xDes < desContainerRect.left || xDes > desContainerRect.right - desOffsetRight 
        || yDes < desContainerRect.top  || yDes > desContainerRect.bottom - desOffsetBottom
		) {
			if (node.node()) {
				d3.select(node.node().parentNode).classed('hide-edge-on-parent-scroll', true)
			}
		} else {
			if (node.node()) {
				d3.select(node.node().parentNode).classed('hide-edge-on-parent-scroll', false)
			}
		}
	}

	/**
   * Set text note on edge
   * @param value changed value
   * @param targetNote originNote | middleNote | destNote
   */
	setNote(value, targetNote) {
		this[targetNote] = value

		// Update note on view
		d3.select(`#${targetNote}${this.id}`)
			.text(value)
	}

	/**
   * Set style path connect solid, dash
   * @param type
   */
	setLineType(type) {
		this.lineType = type
		let path = d3.selectAll(`#${this.id}`).filter((d, i) => {
			return i == 1
		})
		path.style('stroke-dasharray', type === LINE_TYPE.SOLID ? '0 0' : '3 3')
	}

	/**
   * Set use arrow marker
   * @param flag
   */
	setUseMarker(flag) {
		this.useMarker = flag
		d3.selectAll(`#${this.id}`).attr('marker-end', flag === 'Y' ? `url(#arrow${this.id})` : '')
	}

	/**
   * emphasize edge for selected Object (Vertex, Boundary)
   */
	emphasize() {
		let path = d3.selectAll(`#${this.id}`).filter((d, i) => {
			return i == 1
		})

		path.classed('emphasizePath', true)
		d3.select(`#arrow${this.id}`).select('path').classed('emphasizeArrow', true)
	}
}

export default Edge
