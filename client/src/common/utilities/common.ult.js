import * as d3 from 'd3'
import _ from 'lodash'

import {
	COMMON_DATA,
	AUTO_SCROLL_CONFIG,
	DEFAULT_CONFIG_GRAPH,
	VIEW_MODE
} from '../const/index'


/**
 * Read file format JSON and return
 * @param file
 * @returns {Promise}
 */
export function readDataFileJson(file) {
	return new Promise((resolve, reject) => {
		let fileReader = new FileReader()
		fileReader.onload = () => {
			try {
				let data = JSON.parse(fileReader.result)
				resolve(data)
			}
			catch (ex) {
				comShowMessage(`Read file error!\n${ex.message}`)
			}
		}

		if (file)
			fileReader.readAsText(file)
	})
}

/**
 * Show message alert
 * @param msg
 */
export function comShowMessage(msg = null) {
	if (!msg)
		return
	alert(msg)
}

/**
 * Get coordinate mouse when click on SVG
 * relation to parent
 * @param e
 * @param parent
 * @returns {{x: number, y: number}}
 */
export function getCoorMouseClickRelativeToParent(e, parent) {
	let container = $(`${parent}`)
	let x = Math.round(e.clientX + container.scrollLeft() - container.offset().left)
	let y = Math.round(e.clientY + container.scrollTop() - container.offset().top)
	return {x, y}
}

/**
 * Init id for object
 * @param type
 */
export function generateObjectId(type) {
	sleep(1)//Prevent duplicate Id
	const date = new Date()
	return `${type}${date.getTime()}`
}

export function checkIsMatchRegexNumber(val) {
	const regex = new RegExp('^(?=.)([+-]?([0-9]*)(\.([0-9]+))?)$')
	return regex.test(val)
}

/**
 * Allow only numeric (0-9) in HTML inputbox using jQuery.
 * Allow: backspace, delete, tab, escape, enter and .
 * Allow: Ctrl+A, Command+A
 */
export function allowInputNumberOnly(e) {
	// Allow: backspace, delete, tab, escape, enter, dot(.) and +
	if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190, 187, 189]) !== -1 ||
    // Allow: Ctrl+A, Command+A
    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
    // Allow: home, end, left, right, down, up
    (e.keyCode >= 35 && e.keyCode <= 40)) {
		// let it happen, don't do anything
		return
	}
	// Ensure that it is a number and stop the key press
	if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
		e.preventDefault()
	}
}

export function checkMinMaxValue(val, min = 0, max = 9999) {
	if (parseInt(val) < min || isNaN(parseInt(val)))
		return min
	else if (parseInt(val) > max)
		return max
	else return parseInt(val)
}

/**
 * Remove special character in selector query
 * @param id
 * @returns {string}
 */
export function replaceSpecialCharacter(id) {
	return id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&')
}

export function createPath(src, des) {
	return `M${src.x},${src.y} L${des.x},${des.y}`
}

//move element in array
export function arrayMove(x, from, to) {
	x.splice((to < 0 ? x.length + to : to), 0, x.splice(from, 1)[0])
}

export function setSizeGraph(options, svgId) {
	const offer = 200
	const {width, height} = options

	if (width) {
		COMMON_DATA.currentWidth = width + offer
		$(`#${svgId}`).css('min-width', COMMON_DATA.currentWidth)
	}

	if (height) {
		COMMON_DATA.currentHeight = height + offer
		$(`#${svgId}`).css('min-height', COMMON_DATA.currentHeight)
	}
}

export function sleep(millis)
{
	var date = new Date()
	var curDate = null
	do { curDate = new Date() }
	while(curDate - date < millis)
}

/**
 * Shink graph when object drag end.
 * @param {*} data 
 * @param {*} svgId 
 */
export function setMinBoundaryGraph(data, svgId, viewMode) {

	// Array store size
	let lstOffsetX = [DEFAULT_CONFIG_GRAPH.MIN_WIDTH]
	let lstOffsetY = [DEFAULT_CONFIG_GRAPH.MIN_HEIGHT]

	// Filter boundary without parent
	let boundaries = _.filter(data.boundary, (g) => {
		return g.parent == null
	})

	// Filter vertex without parent
	let vertices = _.filter(data.vertex, (g) => {
		return g.parent == null
	})


	boundaries.forEach(e => {
		let node = d3.select(`#${e.id}`).node()
		if (node) {
			let {width, height} = node.getBBox()
			lstOffsetX.push(width + e.x)
			lstOffsetY.push(height + e.y)
		}
	})

	vertices.forEach(e => {
		let node = d3.select(`#${e.id}`).node()
		if (node) {
			let {width, height} = node.getBBox()
			lstOffsetX.push(width + e.x)
			lstOffsetY.push(height + e.y)
		}
	})

	// Get max width, max height
	let width = Math.max.apply(null, lstOffsetX)
	let height = Math.max.apply(null, lstOffsetY)

	if(checkModePermission(viewMode, 'horizontalScroll')) {
		setSizeGraph({width, height},svgId)
	}else{
		setSizeGraph({width: undefined, height},svgId)
	}
}

/**
 * Auto scroll when drag vertex or boundary
 */
export function autoScrollOnMousedrag(svgId, containerId, viewMode) {
	// Auto scroll on mouse drag
	let svg = d3.select(`#${svgId}`).node()
	const $parent = $(`#${containerId}`)

	let h = $parent.height()
	let sT = $parent.scrollTop()

	let w = $parent.width()
	let sL = $parent.scrollLeft()

	let coordinates = d3.mouse(svg)
	let x = coordinates[0]
	let y = coordinates[1]

	if ((y + AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) > h + sT) { 
		$parent.scrollTop((y + AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) - h)
	} else if (y < AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL + sT) { 
		$parent.scrollTop(y - AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL)
	}

	if (checkModePermission(viewMode, 'horizontalScroll')) {
		if ((x + AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) > w + sL) { 
			$parent.scrollLeft((x + AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL) - w) 
		} else if (x < AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL + sL) { 
			$parent.scrollLeft(x - AUTO_SCROLL_CONFIG.LIMIT_TO_SCROLL)
		}
	}
}

export function updateSizeGraph(dragObj) {
	const {width, height} = d3.select(`#${dragObj.id}`).node().getBBox()
	let currentX = d3.event.x
	let currentY = d3.event.y
	let margin = 100

	if (checkModePermission(dragObj.viewMode.value, 'horizontalScroll')) {
		if ((currentX + width) > COMMON_DATA.currentWidth) {
			COMMON_DATA.currentWidth = currentX + width + margin
			$(`#${dragObj.svgId}`).css('min-width', COMMON_DATA.currentWidth)
		}
	}

	if ((currentY + height) > COMMON_DATA.currentHeight) {
		COMMON_DATA.currentHeight = currentY + height + margin
		$(`#${dragObj.svgId}`).css('min-height', COMMON_DATA.currentHeight)
	}
}

/**
 * Check with type is allowed in viewMode
 * @param {*} viewMode 
 * @param {*} type 
 */
export function checkModePermission(viewMode, type) {
	let data = {}

	data[VIEW_MODE.SHOW_ONLY] = [
		'showReduced',
		'editVertex', 'isEnableDragVertex', 'vertexRepeat', 'isVertexMandatory',
		'editBoundary', 'isEnableDragBoundary', 'isEnableItemVisibleMenu', 'maxBoundaryRepeat', 'isBoundaryMandatory',
		'nameSuffix', 'horizontalScroll', 'mandatoryCheck'
	]

	data[VIEW_MODE.EDIT] = [
		'createVertex', 'createBoundary', 'clearAll', 'showReduced',
		'editVertex', 'copyVertex', 'removeVertex', 'vertexBtnConfirm', 'vertexBtnAdd', 'vertexBtnDelete', 'isEnableDragVertex', 'vertexRepeat', 'isVertexMandatory',
		'editBoundary', 'removeBoundary', 'copyAllBoundary', 'deleteAllBoundary', 'boundaryBtnConfirm', 'isEnableDragBoundary', 'isEnableItemVisibleMenu',  'maxBoundaryRepeat', 'isBoundaryMandatory',
		'nameSuffix', 'horizontalScroll', 'mandatoryCheck'
	]

	data[VIEW_MODE.OPERATIONS] = [
		'createVertex', 'createBoundary', 'clearAll',
		'editVertex', 'copyVertex', 'removeVertex', 'vertexBtnConfirm', 'vertexBtnAdd', 'vertexBtnDelete', 'isEnableDragVertex',
		'editBoundary', 'removeBoundary', 'copyAllBoundary', 'deleteAllBoundary', 'boundaryBtnConfirm', 'isEnableDragBoundary', 'isEnableItemVisibleMenu',
		'horizontalScroll', 'autoAlignment'
	]

	data[VIEW_MODE.INPUT_MESSAGE] = [
		'showReduced',
		'editVertex', 'vertexRepeat', 'isVertexMandatory',
		'editBoundary', 'maxBoundaryRepeat', 'isBoundaryMandatory', 'isEnableItemVisibleMenu',
		'nameSuffix'
	]

	data[VIEW_MODE.OUTPUT_MESSAGE] = [
		'showReduced',
		'editVertex', 'vertexRepeat', 'isVertexMandatory',
		'editBoundary', 'maxBoundaryRepeat', 'isBoundaryMandatory', 'isEnableItemVisibleMenu',
		'nameSuffix', 'mandatoryCheck'
	]

	data[VIEW_MODE.SEGMENT] = [
		'createNew', 'find', 'showReduced',
		'editVertex', 'copyVertex', 'removeVertex', 'vertexBtnConfirm', 'vertexBtnAdd', 'vertexBtnDelete', 'isEnableDragVertex',
		'horizontalScroll', 'mandatoryCheck'
	]

	return data[viewMode].indexOf(type) != -1
}

/**
 * get prefix for key of data-element Vertex
 * @param {*} dataElement 
 * @param {*} vertexDefinition 
 * @param {*} groupType 
 */
export function getKeyPrefix(dataElement, vertexDefinition, groupType) {

	const keyPrefix = _.find(vertexDefinition.vertexGroup, {'groupType': groupType}).vertexPresentation.keyPrefix
	if (!keyPrefix) return ''

	let res = ''
	for (let propName in keyPrefix) {
		if (dataElement[propName]) {
			res += keyPrefix[propName][dataElement[propName]] ? keyPrefix[propName][dataElement[propName]] : ''
		}
	}

	return res
}

export function htmlEncode (s) {
	var translate = {
		' '  : '&nbsp;',
		'&'  : '&amp;',
		'\\' : '&quot;',
		'<'  : '&lt;',
		'>'  : '&gt;'  
	}

	let res = ''
	s.split('').forEach(e => {
		if (translate[e]) {
			res += translate[e]
		}else{
			res+= e
		}
	})

	return res
}

export function segmentName(segmentObject, viewMode) {
	if (checkModePermission(viewMode, 'nameSuffix')) {
		let usage = segmentObject.mandatory ? 'M' : 'C'
		return `${segmentObject.name} [${usage}${segmentObject.repeat}]`
		
	} else {
		return `${segmentObject.name}`
	}
}