import _ from 'lodash'
import ColorHash from 'color-hash'
import * as d3 from 'd3'
import Vertex from './vertex'
import PopUtils from '../../../common/utilities/popup.util'
import ObjectUtils from '../../../common/utilities/object.util'
import SegmentMenu from '../menu-context/segment-menu'

import {
	VERTEX_FORMAT_TYPE,
	POPUP_CONFIG,
	CONNECT_SIDE,
	VIEW_MODE,

} from '../../../common/const/index'

import {
	allowInputNumberOnly,
	autoScrollOnMousedrag,
	updateSizeGraph,
	setMinBoundaryGraph,
	checkIsMatchRegexNumber,
	comShowMessage,
} from '../../../common/utilities/common.util'


const HTML_VERTEX_INFO_ID = 'vertexInfo'
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties'
const HTML_GROUP_BTN_DYNAMIC_DATASET = 'groupBtnDynamicDataSet'
const ATTR_DEL_CHECK_ALL = 'delCheckAll'
const ATTR_DEL_CHECK = 'delCheck'

class SegmentMgmt {
	constructor(props) {
		this.dataContainer = props.dataContainer // {[vertex array], [boundary array]} store all vertex and boundary for this SVG
		this.containerId = props.containerId
		this.svgId = props.svgId
		this.viewMode = {value: VIEW_MODE.SEGMENT}
		this.edgeMgmt = props.edgeMgmt
		this.connectSide = CONNECT_SIDE.NONE
		this.mandatoryDataElementConfig = props.mandatoryDataElementConfig

		this.vertexDefinition = {
			vertexGroup: [],  // Group vertex
			vertex:[]         // List of vertex type
		}

		this.initialize()
	}

	initialize() {
		this.colorHash = new ColorHash({lightness: 0.7})
		this.colorHashConnection = new ColorHash({lightness: 0.8})
		this.objectUtils = new ObjectUtils()

		this.selectorClass = `_vertex_${this.svgId}`
		this.currentVertex = null //vertex is being edited
		this.vertexGroup = null

		new SegmentMenu({
			selector: `.${this.selectorClass}`,
			parent: this,
			dataContainer: this.dataContainer,
			viewMode: this.viewMode
		})

		this.initVertexPopupHtml()
		this.bindEventForPopupVertex()

		this.handleDragVertex = d3.drag()
			.on('start', this.startDrag(this))
			.on('drag', this.dragTo(this))
			.on('end', this.endDrag(this))
	}

	initVertexPopupHtml() {

		let sHtml = `
    <!-- Vertex Info Popup (S) -->
    <div id="${HTML_VERTEX_INFO_ID}_${this.svgId}" class="modal fade" role="dialog" tabindex="-1">
      <div class="modal-dialog">
        <div class="web-dialog modal-content">
          <div class="dialog-title">
            <span class="title">Vertex Info</span>
          </div>

          <div class="dialog-wrapper">
            <form action="#" method="post">
              <div class="dialog-search form-inline">
                <table>
                  <colgroup>
                    <col width="80"/>
                    <col width="*"/>
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>
                        <input type="text" class="form-control" id="vertexName_${this.svgId}" name="vertexName">
                      </td>
                    </tr>
                    <tr>
                      <th>Description</th>
                      <td class="full-width">
                        <textarea class="form-control" id="vertexDesc_${this.svgId}" name="vertexDesc" rows="4"></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </form>
            <div class="dialog-button-top" id="${HTML_GROUP_BTN_DYNAMIC_DATASET}_${this.svgId}">
              <div class="row text-right">
                <button id="vertexBtnAdd_${this.svgId}" class="btn-etc">Add</button>
                <button id="vertexBtnDelete_${this.svgId}" class="btn-etc">Delete</button>
              </div>
            </div>
            <form id="vertexForm_${this.svgId}" action="#" method="post">
              <div class="dialog-search form-inline">
                <table class="vertex-properties" id="${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}" border="1"></table>
              </div>
            </form>
            <div class="dialog-button-top">
              <div class="row text-right">
                <button id="vertexBtnConfirm_${this.svgId}" class="btn-etc">Confirm</button>
                <button id="vertexBtnCancel_${this.svgId}" class="btn-etc">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Vertex Info Popup (E) -->`
		$($(`#${this.svgId}`)[0].parentNode).append(sHtml)
	}

	bindEventForPopupVertex() {
		const main = this
    
		$(`#vertexBtnConfirm_${main.svgId}`).click(() => {
			this.confirmEditVertexInfo()
		})

		$(`#vertexBtnAdd_${main.svgId}`).click(() => {
			this.addDataElement()
		})

		$(`#vertexBtnDelete_${main.svgId}`).click(() => {
			this.removeDataElement()
		})

		$(`#vertexBtnCancel_${main.svgId}`).click(() => {
			this.closePopVertexInfo()
			this.currentVertex = null
		})

		// Prevent refresh page after pressing enter on form control (Edit popup)
		$('form').submit(function() { return false })
		
		this.initDialogDragEvent()
	}

	create(sOptions) {
		let {vertexType} = sOptions

		if (!vertexType)
			return

		let newVertex = new Vertex({
			vertexMgmt: this
		})

		return newVertex.create(sOptions, this.handleDragVertex)
	}

	startDrag(main) {
		return function (d) {
			d.moveToFront()
		}
	}

	dragTo(main) {
		return function (d) {
			updateSizeGraph(d)
			autoScrollOnMousedrag(d.svgId, d.containerId, main.viewMode.value)
      
			// Prevent drag object outside the window
			let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, d)
			d.x = x
			d.y = y
			// Transform group
			d3.select(`#${d.id}`).attr('transform', 'translate(' + [d.x, d.y] + ')')
		}
	}

	endDrag(main) {
		return function (d) {
		}
	}

	/**
   * Make popup edit vertex info
   * @param vertex
   */
	makePopupEditVertex(vertex) {
		this.currentVertex = vertex
		// Use in function updateVertexInfo()
		let {name, description, data, groupType} = vertex

		// Get vertex group with group type
   
		this.vertexGroup = _.find(this.vertexDefinition.vertexGroup, {'groupType': groupType})
		
		this.currentVertex.groupType = groupType

		// Append content to popup
		$(`#vertexName_${this.svgId}`).val(name)
		$(`#vertexDesc_${this.svgId}`).val(description)

		// Generate properties vertex
		let columnTitle = Object.keys(this.vertexGroup.dataElementFormat)
		let cols = columnTitle.length
		let rows = data.length
		const dataType = this.vertexGroup.elementDataType

		let $table = $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}`).empty()
		let $contentHeader = $('<thead>')
		// Generate header table
		let $headerRow = $('<tr>')
		let $colGroup = $('<colgroup>')
		let $popWidth = 0
		for (let i = 0; i < cols; i++) {
			let $colHdr = $('<th>').text(this.capitalizeFirstLetter(columnTitle[i]))
			$colHdr.attr('class', 'col_header')
			$colHdr.appendTo($headerRow)

			// Init col in col group
			let prop = columnTitle[i]
			let type = dataType[prop]
			let value = this.vertexGroup.dataElementFormat[prop]
			let width = this.findLongestContent({data, prop, type, value})
			$popWidth += width
			let $colWidth = $('<col>').attr('width', width)
			$colWidth.appendTo($colGroup)
		}

		// Prepend col group del check
		let $colWidth = $('<col>').attr('width', POPUP_CONFIG.WIDTH_COL_DEL_CHECK)
		$colWidth.prependTo($colGroup)

		let $colHdr = this.initCellDelCheck({
			'className': 'col_header',
			'name': `${ATTR_DEL_CHECK_ALL}_${this.svgId}`,
			'checked': false,
			'colType': '<th>',
			'isCheckAll': true,
		})
		$colHdr.prependTo($headerRow)

		$colGroup.appendTo($table)
		$headerRow.appendTo($contentHeader)
		$contentHeader.appendTo($table)

		// Generate content table
		let $contentBody = $('<tbody>')
		for (let i = 0; i < rows; i++) {
			const dataRow = data[i]
			const $row = $('<tr>')
			for (let j = 0; j < cols; j++) {
				let prop = columnTitle[j]
				let type = dataType[prop]
				let val = dataRow[prop]
				let opt = []

				const $col = $('<td>')
				// Get option if type is array
				if (type === VERTEX_FORMAT_TYPE.ARRAY) {
					opt = this.vertexGroup.dataElementFormat[prop]
				} else if (type === VERTEX_FORMAT_TYPE.BOOLEAN) {
					$col.attr('class', 'checkbox_center')
				}

				let $control = this.generateControlByType({i, type, val, prop, opt, groupType})
				$control.appendTo($col)
				$col.appendTo($row)
			}

			// Append del check to row
			let $col = this.initCellDelCheck({
				'className': 'checkbox_center',
				'name': `${ATTR_DEL_CHECK}_${this.svgId}` ,
				'checked': false,
				'colType': '<td>'
			})
			$col.prependTo($row)

			$row.appendTo($contentBody)
		}

		$contentBody.appendTo($table)

		let options = {
			popupId: `${HTML_VERTEX_INFO_ID}_${this.svgId}`,
			position: 'center',
			width: $popWidth + POPUP_CONFIG.PADDING_CHAR + 45
		}

		PopUtils.metSetShowPopup(options)
		
		$(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}`).find('tbody').sortable()
	}

	/**
   * Generate control with options
   * @param options
   * @returns {*}
   */
	generateControlByType(options) {
		let $control = null
		let {i, type, val, prop, opt} = options
		let defaultVal = this.vertexGroup.dataElementFormat[prop]
		i = 0
		switch (type) {
		case VERTEX_FORMAT_TYPE.BOOLEAN:
			$control = $('<input>')
			$control.attr('type', 'checkbox')
			$control.attr('name', `${prop}`)
			$control.prop('checked', typeof(val) == 'boolean' ? val : defaultVal)
			$control.attr('value', val)
			break
		case VERTEX_FORMAT_TYPE.ARRAY:
			let firstOpt = opt[0]
			$control = $('<select>')
			$control.attr('name', `${prop}`)
			$control.attr('class', 'form-control')
			$.each(opt, (key, value) => {
				$control
					.append($('<option></option>')
						.attr('value', value || firstOpt)
						.prop('selected', value === (val || firstOpt))
						.text(value))
			})
			break
		case VERTEX_FORMAT_TYPE.NUMBER:
			$control = $('<input>')
			$control.attr('type', 'text')
			$control.attr('name', `${prop}`)
			$control.attr('value', !isNaN(val) ? val : defaultVal)
			$control.attr('class', 'form-control')
			$control
				.on('keydown', function (e) {
					allowInputNumberOnly(e)
				})
				.on('focusout', function (e) {
					if (this.value && !checkIsMatchRegexNumber(this.value)) {
						comShowMessage('Input invalid')
						this.value = ''
					} else {
						if (isNaN(this.value)) {
							comShowMessage('Input invalid')
							this.value = ''
						}
					}
				})
			break
		default:
			$control = $('<input>')
			$control.attr('type', 'text')
			$control.attr('autocomplete', 'off')
			$control.attr('name', `${prop}`)
			$control.attr('value', val != undefined ? val : defaultVal)
			$control.attr('class', 'form-control')
		}

		return $control
	}

	/**
   * Upper case first letter
   */
	capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1)
	}

	findLongestContent(configs) {
		let {data, prop, type, value} = configs
		let firstRow = data[0]
		let arr = []

		// If type is boolean or first undefined or firstRow is empty
		if ((type === VERTEX_FORMAT_TYPE.BOOLEAN) || !firstRow)
			return this.getLongestSpecialCase(prop, value)
		// prop.toString().length * POPUP_CONFIG.WIDTH_CHAR + POPUP_CONFIG.PADDING_CHAR;

		//  If object firstRow hasn't it own the specified property
		if (!firstRow.hasOwnProperty(prop)) {
			return this.getLongestSpecialCase(prop, value)
		}

		// From an array of objects, extract value of a property as array
		if (type === VERTEX_FORMAT_TYPE.ARRAY) {
			arr = value
		} else {
			arr = data.map(e => e[prop])
		}
		let longest = this.getLongestContentFromArry(arr)
		if (longest.toString().length < prop.toString().length)
			return prop.toString().length * POPUP_CONFIG.WIDTH_CHAR + POPUP_CONFIG.PADDING_CHAR

		return longest.toString().length * (type === VERTEX_FORMAT_TYPE.ARRAY ? POPUP_CONFIG.WIDTH_CHAR_UPPER : POPUP_CONFIG.WIDTH_CHAR) + POPUP_CONFIG.PADDING_CHAR
	}

	getLongestSpecialCase(prop, value) {
		let lengthProp = prop.toString().length
		let lengthDef = value.toString().length
		let type = typeof(value)
		// Has type is array
		if (type === 'object' && Array.isArray(value)) {
			type = VERTEX_FORMAT_TYPE.ARRAY
			lengthDef = this.getLongestContentFromArry(value).toString().length
		}

		return (lengthProp > lengthDef ? lengthProp * POPUP_CONFIG.WIDTH_CHAR :
			lengthDef * (type === VERTEX_FORMAT_TYPE.ARRAY ? POPUP_CONFIG.WIDTH_CHAR_UPPER : POPUP_CONFIG.WIDTH_CHAR ))
      + POPUP_CONFIG.PADDING_CHAR
	}

	getLongestContentFromArry(arr) {
		return arr.reduce((a, b) => {
			let firstTmp = a + ''
			let secondTmp = b + ''
			return firstTmp.length > secondTmp.length ? firstTmp : secondTmp
		})
	}

	addDataElement() {
		const groupType = this.currentVertex.groupType
		const columnTitle = Object.keys(this.vertexGroup.dataElementFormat)
		const cols = columnTitle.length
		const dataType = this.vertexGroup.elementDataType
		let $appendTo = $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId} > tbody`)

		const $row = $('<tr>')
		for (let j = 0; j < cols; j++) {
			let prop = columnTitle[j]
			let type = dataType[prop]
			// let val = dataRow[prop];
			let opt = []

			const $col = $('<td>')
			// Get option if type is array
			if (type === VERTEX_FORMAT_TYPE.ARRAY) {
				opt = this.vertexGroup.dataElementFormat[prop]
			} else if (type === VERTEX_FORMAT_TYPE.BOOLEAN) {
				$col.attr('class', 'checkbox_center')
			}

			let $control = this.generateControlByType({'i': j, type, prop, opt, groupType})
			$control.appendTo($col)
			$col.appendTo($row)
		}

		// Append del check to row
		let $col = this.initCellDelCheck({
			'className': 'checkbox_center',
			'name': `${ATTR_DEL_CHECK}_${this.svgId}`,
			'checked': false,
			'colType': '<td>'
		})
		$col.prependTo($row)

		$row.appendTo($appendTo)
	}

	removeDataElement() {
		$(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId} > tbody`).find(`input[name=${ATTR_DEL_CHECK}_${this.svgId}]`).each(function () {
			if ($(this).is(':checked')) {
				$(this).parents('tr').remove()
			}
		})

		// Uncheck all
		$(`#${ATTR_DEL_CHECK_ALL}_${this.svgId}`).prop('checked', false)
	}

	initCellDelCheck(options) {
		const {className, name, checked, colType, isCheckAll} = options
    
		let $col = $(colType)
		$col.attr('class', className)
		let $chk = $('<input>')
		$chk.attr('type', 'checkbox')
		if (isCheckAll) {
			$chk.attr('id', name)
		}
		$chk.prop('checked', checked)

		const main = this
		$chk.attr('name', name)
			.on('click', function () {
				if (isCheckAll)
					$(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}_${main.svgId}]`)
						.prop('checked', this.checked)
				else {
					$(`#${ATTR_DEL_CHECK_ALL}_${main.svgId}`).prop('checked',
						($(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}_${main.svgId}]:checked`).length ==
              $(this).closest('table').find(`tbody :checkbox[name=${ATTR_DEL_CHECK}_${main.svgId}]`).length))
				}
			})
		$chk.appendTo($col)

		return $col
	}

	/**
   * Close popup edit vertex info
   */
	closePopVertexInfo() {
		let options = {popupId: `${HTML_VERTEX_INFO_ID}_${this.svgId}`}
		PopUtils.metClosePopup(options)
	}

	/**
   * Get data vertex change
   */
	confirmEditVertexInfo() {

		if ($(`#vertexName_${this.svgId}`).val() === '') {
			comShowMessage('Please enter Name.')
			$(`#vertexName_${this.svgId}`).focus()
			return
		}
		
		if (!this.validateDataElementTable()) return

		// Get data on form
		this.currentVertex.name = this.currentVertex.vertexType = $(`#vertexName_${this.svgId}`).val()
		this.currentVertex.description = $(`#vertexDesc_${this.svgId}`).val()
		const groupType = this.currentVertex.groupType
		const dataType = this.vertexGroup.elementDataType
    
		let elements = []
		// Get data element
		$(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}`).find('tr').each(function () {
			let row = {}
			$(this).find('td input:text, td input:checkbox, td select').each(function () {
				let prop = $(this).attr('name')
				let type = dataType[prop]
				if (prop != `${ATTR_DEL_CHECK}_${this.svgId}`)
					row[prop] = type === VERTEX_FORMAT_TYPE.BOOLEAN ? ($(this).is(':checked') ? true : false) : this.value
			})
			elements.push(row)
		})

		// Remove first row (header table)
		elements.shift()

		this.currentVertex.data = elements
		this.currentVertex.groupType = groupType

		// let newVertex = null;
		// let updatedVertexId = this.currentVertex.id;
		if (this.currentVertex.id) {
			this.updateVertexInfo(this.currentVertex)
			this.currentVertex.validateConnectionByUsage()
		} else {
			//Create New
			this.create(this.currentVertex)
		}
		


		this.closePopVertexInfo()
	}

	/**
   * Update vertex info
   * Update value properties
   * Update name, type, ...
   * Update present (DOM)
   */
	updateVertexInfo(forms) {
		const {id} = forms

		d3.select(`#${id}`).selectAll('*').remove()
		this.reRenderContentInsideVertex(this.currentVertex)
	}

	async reRenderContentInsideVertex(vertex) {
		const {vertexType} = vertex

		if (!vertexType)
			return

		vertex.generateContent()

		setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value)
	}

	updatePathConnectForVertex(vertex) {
		this.edgeMgmt.updatePathConnectForVertex(vertex)
	}

	clearAll() {
		d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`).remove()
		this.dataContainer.vertex = []
	}

	LoadVertexGroupDefinition(vertexDefinitionData) {
		//Validate data struct
		if (!this.validateVertexGourpDefineStructure(vertexDefinitionData)) {
			comShowMessage('Format or data in Vertex Group Definition Structure is corrupted. You should check it!')
			return false
		}

		//Reload Vertex Define and init main menu
		this.processDataVertexTypeDefine(vertexDefinitionData)

		return true
	}

	getVertexFormatType(vertexGroup) {
		for (let i = 0; i < vertexGroup.length; i++) {
			this.vertexDefinition.vertexGroup.push(vertexGroup[i])
			const {dataElementFormat} = vertexGroup[i]
			let dataType = {}
			let header = Object.keys(dataElementFormat)
			let len = header.length
			for (let i = 0; i < len; i++) {
				let key = header[i]
				let value = dataElementFormat[key]
				let type = typeof(value)

				dataType[key] = VERTEX_FORMAT_TYPE.STRING // For string and other type
				if (type === 'boolean')
					dataType[key] = VERTEX_FORMAT_TYPE.BOOLEAN // For boolean

				if (type === 'object' && Array.isArray(value))
					dataType[key] = VERTEX_FORMAT_TYPE.ARRAY // For array

				if (type === 'number')
					dataType[key] = VERTEX_FORMAT_TYPE.NUMBER // For number
			}

			this.vertexDefinition.vertexGroup[i].elementDataType = dataType
		}
	}

	getVertexTypesShowFull(data, container) {
		const group = data['VERTEX_GROUP']
		const vertex = data['VERTEX']
		let len = group.length
		for (let i = 0; i < len; i++) {
			let groupType = group[i].groupType
			let groupOption = group[i].option
			let lenOpt = groupOption.length
			for (let j = 0; j < lenOpt; j++) {
				let option = groupOption[j]
				let groupVertex = _.filter(vertex, (e) => {
					return e.groupType === groupType
				}
				)
				let groupAction = []
				groupVertex.forEach(e => {
					groupAction.push(e.vertexType)
				})
				container.groupVertexOption[option] = groupAction
			}
		}
	}

	processDataVertexTypeDefine(data) {
		this.resetVertexDefinition()

		const {VERTEX_GROUP} = data
		this.getVertexFormatType(VERTEX_GROUP)
	}

	resetVertexDefinition() {
		this.vertexDefinition.vertexGroup = []
		this.vertexDefinition.vertex = []
	}

	/**
   * Validate Vertex Group Define Structure
   */
	validateVertexGourpDefineStructure(data) {

		//Validate data exists
		if(data===undefined)
		{
			return false
		}

		if (!data.VERTEX_GROUP) {
			return false
		}

		if (Object.keys(data).length > 1) {
			return false
		}

		return true
	}
	
	validateDataElementTable() {
		let $tr = $(`#${HTML_VERTEX_PROPERTIES_ID}_${this.svgId}`).find('tr')

		let rowCount = $tr.length

		if (rowCount <= 1) return true

		for(let i = 1; i < rowCount; i++) {
			let $name = $($tr[i]).find('td input:text[name=\'name\']')
			if ($name.val() == '') {
				comShowMessage('Enter name.')
				$name.focus()
				return false
			}
		}
		
		return true
	}
	
	/**
	 * Enable dragging for popup
	 */
	initDialogDragEvent() {
		let main = this
		$(`#${HTML_VERTEX_INFO_ID}_${main.svgId} .dialog-title`).css('cursor', 'move').on('mousedown', (e) => {
			let $drag = $(`#${HTML_VERTEX_INFO_ID}_${main.svgId} .modal-dialog`).addClass('draggable')
				
			let pos_y = $drag.offset().top - e.pageY,
				pos_x = $drag.offset().left - e.pageX,
				winH = window.innerHeight,
				winW = window.innerWidth,
				dlgW = $drag.get(0).getBoundingClientRect().width
				
			$(window).on('mousemove', function(e) {
				let x = e.pageX + pos_x
				let y = e.pageY + pos_y

				if (x < 10) x = 10
				else if (x + dlgW > winW - 10) x = winW - dlgW - 10

				if (y < 10) y = 10
				else if (y > winH - 10) y = winH - 10

				$(`#${HTML_VERTEX_INFO_ID}_${main.svgId} .draggable`).offset({
					top: y,
					left: x
				})
			})
			e.preventDefault() // disable selection
		})

		$(window).on('mouseup', function(e) {
			$(`#${HTML_VERTEX_INFO_ID}_${main.svgId} .draggable`).removeClass('draggable')
		})
	}
}

export default SegmentMgmt
