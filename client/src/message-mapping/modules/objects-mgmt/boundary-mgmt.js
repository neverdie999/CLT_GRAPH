import * as d3 from 'd3';
import _ from 'lodash';
import Boundary from './boundary';
import PopUtils from '../../common/utilities/popup.ult';
import ColorHash from 'color-hash';
import ObjectUtils from '../../common/utilities/object.ult';
import BoundaryMenu from './menu-context/boundary-menu';
import BoundaryMenuItems from './menu-context/boundary-menu-items';

import {
  checkMinMaxValue,
  allowInputNumberOnly,
  autoScrollOnMousedrag,
  updateGraphBoundary,
  setMinBoundaryGraph
} from '../../common/utilities/common.ult';

import {
  REPEAT_RANGE
} from '../../const/index';

const HTML_BOUNDARY_INFO_ID = 'boundaryInfo';

class BoundaryMgmt {
  constructor(props) {
    this.dataContainer            = props.dataContainer;
    this.containerId              = props.containerId;
    this.svgId                    = props.svgId;
    this.isEnableEdit             = props.isEnableEdit;
    this.vertexMgmt               = props.vertexMgmt;

    this.dummyBoxId               = `dummyBox_${this.svgId}`;
    this.selectorClass            = `_boundary_${this.svgId}`;
    this.visibleItemSelectorClass = `_menu_item_boundary_${this.svgId}`;

    this.initialize();
  }

  initialize() {
    this.colorHash = new ColorHash({lightness: 0.2});
    this.objectUtils = new ObjectUtils();

    this.initBBoxGroup();
    
    if(this.isEnableEdit){
      // Boundary menu
      new BoundaryMenu({
        selector: `.${this.selectorClass}`,
        boundaryMgmt: this,
        dataContainer: this.dataContainer
      });

      this.bindEventForPopupBoundary();
    }

    // Boundary Menu Items
    new BoundaryMenuItems({
      selector: `.${this.visibleItemSelectorClass}`,
      dataContainer: this.dataContainer
    });

    this.callbackDragBoundary = d3.drag()
      .on("start", this.startDrag(this))
      .on("drag", this.dragTo(this))
      .on("end", this.endDrag(this));
  }

  /**
   * Bind event and init data for controls on popup
   */
  bindEventForPopupBoundary() {
    $("#boundaryBtnConfirm").click(() => {
      this.confirmEditBoundaryInfo();
    });

    $("#boundaryBtnCancel").click(() => {
      this.closePopBoundaryInfo();
    });

    // Validate input number
    $("#maxBoundaryRepeat").keydown(function (e) {
      allowInputNumberOnly(e);
    });

    $("#isBoundaryMandatory").change(function () {
      if (this.checked && $("#maxBoundaryRepeat").val() < 1) {
        $("#maxBoundaryRepeat").val(1);
      }
    });

    $("#maxBoundaryRepeat").keydown(function (e) {
      allowInputNumberOnly(e);
    });

    $("#maxBoundaryRepeat").focusout(function () {
      let rtnVal = checkMinMaxValue(this.value, $('#isBoundaryMandatory').prop('checked') == true ? 1 : REPEAT_RANGE.MIN, REPEAT_RANGE.MAX);
      this.value = rtnVal;
    });
  }

  create(sOptions) {

    let newBoundary = new Boundary({
      boundaryMgmt: this
    });

    newBoundary.create(sOptions, this.callbackDragBoundary);
  }

  startDrag(main) {
    return function (d) {
      if (!d.parent)
        main.objectUtils.reSizeBoundaryWhenObjectDragged(d);

      // Storing start position to calculate the offset for moving members to new position
      d.ctrlSrcX = d.x;
      d.ctrlSrcY = d.y;
    }
  }

  dragTo(main) {
    return function (d) {
      autoScrollOnMousedrag(d.svgId, d.containerId);
      updateGraphBoundary(d);

      let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, `#${d.svgId}`, `#${d.id}`);
      d.x = x;
      d.y = y;

      let {width, height} = main.objectUtils.getBBoxObject(`#${d.id}`);
      let data = {x, y, width, height};
      main.updateAttrBBoxGroup(data);
    }
  }

  endDrag(main) {
    return function (d) {

      let offsetX = d.x - d.ctrlSrcX;
      let offsetY = d.y - d.ctrlSrcY;

      //If realy move
      if (offsetX != 0 || offsetY != 0) {
        // Transform group
        d3.select(this).attr("transform", "translate(" + [d.x, d.y] + ")");

        // Update position of child element
        if (d.member.length > 0)
          d.moveMember(offsetX, offsetY);

        if (d.parent) {
          //If object not out boundary parent , object change postion in boundary parent, so change index object
          if (main.objectUtils.checkDragObjectOutsideBoundary(d) == false) {
            main.objectUtils.changeIndexInBoundaryForObject(d, "B");
          }
        } else {
          main.objectUtils.checkDragObjectInsideBoundary(d, "B");
        }
      }

      main.hiddenBBoxGroup();
      main.objectUtils.restoreSizeBoundary(d);
      setMinBoundaryGraph(main.dataContainer, main.svgId);
    }
  }

  /**
   * The box simulate new position of vertex or boundary dragged.
   */
  initBBoxGroup() {
    d3.select(`#${this.svgId}`).append("svg:g")
      .attr("transform", `translate(0.5, 0.5)`)
      .append("svg:rect")
      .attr("id", `${this.dummyBoxId}`)
      .attr("class", "dummy-edge stroke-dasharray")
      // .attr("stroke-dasharray", "3 3")
      .attr("fill", "none");
  }

  /**
   * When dragging a vertex or boundary then update attribute for bbox
   * Update coordinate
   * Update size
   */
  updateAttrBBoxGroup(data) {
    const { x, y, width, height } = data;
    d3.select(`#${this.dummyBoxId}`).attr('x', x);
    d3.select(`#${this.dummyBoxId}`).attr('y', y);
    d3.select(`#${this.dummyBoxId}`).attr('width', width);
    d3.select(`#${this.dummyBoxId}`).attr('height', height);
    d3.select(`#${this.dummyBoxId}`).style("display", "block");
    d3.select(d3.select(`#${this.dummyBoxId}`).node().parentNode).moveToFront();
    }
  
  hiddenBBoxGroup() {
    d3.select(`#${this.dummyBoxId}`).style("display", "none");
  }

  /**
   * Make controls to edit boundary info
   * @param boundaryId
   */
  makeEditBoundaryInfo(boundaryId) {
    const boundaryInfo = _.find(this.dataContainer.boundary, {"id": boundaryId});
    this.originBoundary = boundaryInfo;
    // Append content to popup
    $(`#boundaryName`).val(boundaryInfo.name);
    $(`#boundaryDesc`).val(boundaryInfo.description);
    $(`#maxBoundaryRepeat`).val(boundaryInfo.repeat);
    $(`#isBoundaryMandatory`).prop('checked', boundaryInfo.mandatory);

    let options = {
      popupId: HTML_BOUNDARY_INFO_ID,
      position: 'center',
      width: 430
    }
    PopUtils.metSetShowPopup(options);
  }

  /**
   * Update data boundary change
   */
  confirmEditBoundaryInfo(boundaryId) {
    const id = this.originBoundary.id;
    let boundaryInfo = _.find(this.dataContainer.boundary, {"id": id});
    let name = $(`#boundaryName`).val();
    boundaryInfo.name = name;
    let description = $(`#boundaryDesc`).val();
    boundaryInfo.description = description;
    boundaryInfo.repeat = $(`#maxBoundaryRepeat`).val();
    boundaryInfo.mandatory = $(`#isBoundaryMandatory`).prop('checked');
    let header = d3.select(`#${id}Header`);
    header.text(name).attr('title', description);
    header.style("background-color", `${this.colorHash.hex(boundaryInfo.name)}`);
    d3.select(`#${id}Button`).style("fill", `${this.colorHash.hex(boundaryInfo.name)}`);
    d3.select(`#${id}Content`).style("border-color", `${this.colorHash.hex(boundaryInfo.name)}`);
    this.closePopBoundaryInfo();
  }

  /**
   * Close popup edit boundary info
   */
  closePopBoundaryInfo() {
    this.originBoundary = null;
    let options = {popupId: HTML_BOUNDARY_INFO_ID};
    PopUtils.metClosePopup(options);
  }

  clearAll(){
    d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`).remove();
    this.dataContainer.boundary = [];
  }
}

export default BoundaryMgmt
