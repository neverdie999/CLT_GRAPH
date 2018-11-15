import * as d3 from 'd3'
import _ from 'lodash'
import Boundary from './boundary'
import PopUtils from '../../../common/utilities/popup.util'
import ColorHash from 'color-hash'
import ObjectUtils from '../../../common/utilities/object.util'
import BoundaryMenu from '../menu-context/boundary-menu'
import BoundaryMenuItems from '../menu-context/boundary-menu-items'

import {
	checkMinMaxValue,
	allowInputNumberOnly,
	autoScrollOnMousedrag,
	updateSizeGraph,
	setMinBoundaryGraph,
	checkModePermission,
	segmentName
} from '../../../common/utilities/common.util'

import {
	REPEAT_RANGE, BOUNDARY_ATTR_SIZE
} from '../../../common/const/index'

const CONNECT_KEY = 'Connected'

class BoundaryMgmt {
	constructor(props) {
		this.dataContainer = props.dataContainer
		this.containerId = props.containerId
		this.svgId = props.svgId
		this.viewMode = props.viewMode
		this.vertexMgmt = props.vertexMgmt
		this.edgeMgmt = props.edgeMgmt

		this.initialize()
	}

	initialize() {
		this.colorHash = new ColorHash({lightness: 0.2})
		this.objectUtils = new ObjectUtils()

		this.dummyBoxId = `dummyBox_${this.svgId}`
		this.selectorClass = `_boundary_${this.svgId}`
		this.visibleItemSelectorClass = `_menu_item_boundary_${this.svgId}`

		this.editingBoundary = null

		this.initBBoxGroup()
    
		new BoundaryMenu({
			selector: `.${this.selectorClass}`,
			boundaryMgmt: this,
			dataContainer: this.dataContainer,
			viewMode: this.viewMode
		})

		this.initBoudaryPopupHtml()
		this.bindEventForPopupBoundary()

		// Boundary Menu Items
		if(checkModePermission(this.viewMode.value, 'isEnableItemVisibleMenu')) {
			new BoundaryMenuItems({
				selector: `.${this.visibleItemSelectorClass}`,
				dataContainer: this.dataContainer
			})
		}

		this.callbackDragBoundary = d3.drag()
			.on('start', this.startDrag(this))
			.on('drag', this.dragTo(this))
			.on('end', this.endDrag(this))
	}

	initBoudaryPopupHtml() {

		const repeatHtml = `
    <tr>
      <th>Max repeat</th>
      <td class="input-group full-width">
        <input type="number" class="form-control" id="maxBoundaryRepeat_${this.svgId}" name="maxBoundaryRepeat" min="0" max="9999">
        <label class="input-group-addon">
          <input type="checkbox" id="isBoundaryMandatory_${this.svgId}" name="isBoundaryMandatory">
        </label>
        <label class="input-group-addon" for="isBoundaryMandatory_${this.svgId}">Mandatory</label>
      </td>
    </tr>`

		let sHtml = 
    `<!-- Boundary Info Popup (S)-->
    <div id="boundaryInfo_${this.svgId}" class="modal fade" role="dialog" tabindex="-1">
      <div class="modal-dialog">
        <div class="web-dialog modal-content">
          <div class="dialog-title">
            <span class="title">Boundary Info</span>
          </div>
          <div class="dialog-wrapper">
            <form id="boundaryForm_${this.svgId}" action="#" method="post">
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
                        <input type="text" class="form-control" id="boundaryName_${this.svgId}" name="boundaryName">
                      </td>
                    </tr>
                    ${checkModePermission(this.viewMode.value, 'maxBoundaryRepeat') ? repeatHtml : ''}
                    <tr>
                      <th>Description</th>
                      <td class="full-width">
                        <textarea class="form-control" id="boundaryDesc_${this.svgId}" name="boundaryDesc" rows="4"></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </form>
            <div class="dialog-button-top">
              <div class="row text-right">
                <button id="boundaryBtnConfirm_${this.svgId}" class="btn-etc">Confirm</button>
                <button id="boundaryBtnCancel_${this.svgId}" class="btn-etc">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Boundary Info Popup (E)-->`

		$($(`#${this.svgId}`)[0].parentNode).append(sHtml)
	}

	/**
   * Bind event and init data for controls on popup
   */
	bindEventForPopupBoundary() {

		const main = this

		if (checkModePermission(this.viewMode.value, 'boundaryBtnConfirm')) {
			$(`#boundaryBtnConfirm_${main.svgId}`).click(() => {
				this.confirmEditBoundaryInfo()
			})
		}

		$(`#boundaryBtnCancel_${main.svgId}`).click(() => {
			this.closePopBoundaryInfo()
		})

		// Validate input number
		if (checkModePermission(this.viewMode.value, 'maxBoundaryRepeat')) {
			$(`#maxBoundaryRepeat_${main.svgId}`).keydown(function (e) {
				allowInputNumberOnly(e)
			})

			$(`#maxBoundaryRepeat_${main.svgId}`).focusout(function () {
				let rtnVal = checkMinMaxValue(this.value, $(`#isBoundaryMandatory_${main.svgId}`).prop('checked') == true ? 1 : REPEAT_RANGE.MIN, REPEAT_RANGE.MAX)
				this.value = rtnVal
			})

			$(`#isBoundaryMandatory_${main.svgId}`).change(function () {
				if (this.checked && $(`#maxBoundaryRepeat_${main.svgId}`).val() < 1) {
					$(`#maxBoundaryRepeat_${main.svgId}`).val(1)
				}
			})
		}
		
		// Prevent refresh page after pressing enter on form control (Edit popup)
		$('form').submit(function() { return false })

		// Enable dragging for popup
		this.initDialogDragEvent()
	}

	create(sOptions) {

		let newBoundary = new Boundary({
			boundaryMgmt: this
		})

		newBoundary.create(sOptions, this.callbackDragBoundary, this.edgeMgmt.handleDragConnection)
	}

	startDrag(main) {
		return function (d) {
			if (main.vertexMgmt.edgeMgmt.isSelectingEdge())
				main.vertexMgmt.edgeMgmt.cancleSelectedPath()

			main.edgeMgmt.emphasizePathConnectForBoundary(d)

			if (!d.parent)
				main.objectUtils.reSizeBoundaryWhenObjectDragged(d)
      
			d.moveToFront()

			// Storing start position to calculate the offset for moving members to new position
			d.ctrlSrcX = d.x
			d.ctrlSrcY = d.y
		}
	}

	dragTo(main) {
		return function (d) {
			updateSizeGraph(d)
			autoScrollOnMousedrag(d.svgId, d.containerId, main.viewMode.value)

			let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, d)
			//d.x = x;
			//d.y = y;

			let {width, height} = main.objectUtils.getBBoxObject(`#${d.id}`)
			let data = {x, y, width, height}
			main.updateAttrBBoxGroup(data)
		}
	}

	endDrag(main) {
		return function (d) {

			let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, d)
			d.x = x
			d.y = y

			let offsetX = d.x - d.ctrlSrcX
			let offsetY = d.y - d.ctrlSrcY

			//If realy move
			if (offsetX != 0 || offsetY != 0) {
				// Transform group
				d3.select(this).attr('transform', 'translate(' + [d.x, d.y] + ')')
				main.edgeMgmt.updatePathConnectForVertex(d)

				if (d.parent) {
					//If object not out boundary parent , object change postion in boundary parent, so change index object
					if (main.objectUtils.checkDragObjectOutsideBoundary(d)) {
						// Update position of child element
						if (d.member.length > 0)
							d.moveMember(offsetX, offsetY)
						
						d.validateConnectionByUsage()
            
					}else{
						main.objectUtils.changeIndexInBoundaryForObject(d, 'B')
					}
				} else {
					if (!main.objectUtils.checkDragObjectInsideBoundary(d, 'B')) {
						// Update position of child element
						if (d.member.length > 0)
							d.moveMember(offsetX, offsetY)
					} else {
						d.validateConnectionByUsage()
					}
				}
			}

			main.hiddenBBoxGroup()
			main.objectUtils.restoreSizeBoundary(d)
			setMinBoundaryGraph(main.dataContainer, main.svgId, main.viewMode.value)
		}
	}

	/**
   * The box simulate new position of vertex or boundary dragged.
   */
	initBBoxGroup() {
		d3.select(`#${this.svgId}`).append('svg:g')
			.attr('transform', 'translate(0.5, 0.5)')
			.append('svg:rect')
			.attr('id', `${this.dummyBoxId}`)
			.attr('width', BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
			.attr('height', BOUNDARY_ATTR_SIZE.BOUND_HEIGHT)
			.attr('class', 'dummy-edge stroke-dasharray')
		// .attr("stroke-dasharray", "3 3")
			.attr('fill', 'none')
	}

	/**
   * When dragging a vertex or boundary then update attribute for bbox
   * Update coordinate
   * Update size
   */
	updateAttrBBoxGroup(data) {
		const { x, y, width, height } = data
		d3.select(`#${this.dummyBoxId}`).attr('x', x)
		d3.select(`#${this.dummyBoxId}`).attr('y', y)
		d3.select(`#${this.dummyBoxId}`).attr('width', width)
		d3.select(`#${this.dummyBoxId}`).attr('height', height)
		d3.select(`#${this.dummyBoxId}`).style('display', 'block')
		d3.select(d3.select(`#${this.dummyBoxId}`).node().parentNode).moveToFront()
	}
  
	hiddenBBoxGroup() {
		d3.select(`#${this.dummyBoxId}`).style('display', 'none')
	}

	/**
   * Make controls to edit boundary info
   * @param boundaryId
   */
	makeEditBoundaryInfo(boundaryId) {
		const boundary = _.find(this.dataContainer.boundary, {'id': boundaryId})
		this.editingBoundary = boundary
		// Append content to popup
		$(`#boundaryName_${this.svgId}`).val(boundary.name)
		$(`#boundaryDesc_${this.svgId}`).val(boundary.description)

		if(checkModePermission(this.viewMode.value, 'maxBoundaryRepeat')) {
			$(`#maxBoundaryRepeat_${this.svgId}`).val(boundary.repeat)
			$(`#isBoundaryMandatory_${this.svgId}`).prop('checked', boundary.mandatory)
		}

		let options = {
			popupId: `boundaryInfo_${this.svgId}`,
			position: 'center',
			width: 430
		}
		PopUtils.metSetShowPopup(options)

		if(!checkModePermission(this.viewMode.value, 'boundaryBtnConfirm')) {
			$(`#boundaryBtnConfirm_${this.svgId}`).hide()
		}
	}

	/**
   * Update data boundary change
   */
	confirmEditBoundaryInfo() {
		let name = $(`#boundaryName_${this.svgId}`).val()
		this.editingBoundary.name = name    

		if(checkModePermission(this.viewMode.value, 'maxBoundaryRepeat')) {
			this.editingBoundary.repeat = $(`#maxBoundaryRepeat_${this.svgId}`).val()
			this.editingBoundary.mandatory = $(`#isBoundaryMandatory_${this.svgId}`).prop('checked')
		}

		let description = $(`#boundaryDesc_${this.svgId}`).val()
		this.editingBoundary.description = description

		let header = d3.select(`#${this.editingBoundary.id}Header`)
		header.text(segmentName(this.editingBoundary, this.viewMode.value)).attr('title', description)
		header.style('background-color', `${this.colorHash.hex(name)}`)

		d3.select(`#${this.editingBoundary.id}Content`).style('border-color', `${this.colorHash.hex(name)}`)

		d3.selectAll(`[prop='${this.editingBoundary.id}${CONNECT_KEY}boundary_title']`).style('fill', this.colorHash.hex(name))

		// Check mandatary for member
		this.editingBoundary.validateConnectionByUsage()

		this.closePopBoundaryInfo()
	}

	/**
   * Close popup edit boundary info
   */
	closePopBoundaryInfo() {
		this.editingBoundary = null
		let options = {popupId: `boundaryInfo_${this.svgId}`}
		PopUtils.metClosePopup(options)
	}

	clearAll() {
		d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`).remove()
		this.dataContainer.boundary = []
	}
	
	/**
	 * Enable dragging for popup
	 */
	initDialogDragEvent() {
		let main = this
		$(`#boundaryInfo_${main.svgId} .dialog-title`).css('cursor', 'move').on('mousedown', (e) => {
			let $drag = $(`#boundaryInfo_${main.svgId} .modal-dialog`).addClass('draggable')
				
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

				$(`#boundaryInfo_${main.svgId} .draggable`).offset({
					top: y,
					left: x
				})
			})
			e.preventDefault() // disable selection
		})

		$(window).on('mouseup', function(e) {
			$(`#boundaryInfo_${main.svgId} .draggable`).removeClass('draggable')
		})
	}
}

export default BoundaryMgmt
