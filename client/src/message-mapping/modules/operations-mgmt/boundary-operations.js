import * as d3 from 'd3';
import _ from 'lodash';
import Boundary from '../objects-mgmt/boundary';
import PopUtils from '../../common/utilities/popup.ult';
import ColorHash from 'color-hash';

import {
  generateObjectId,
  arrayMove,
  checkMinMaxValue,
  allowInputNumberOnly,
  autoScrollOnMousedrag,
  updateGraphBoundary,
} from '../../common/utilities/common.ult';

import {
  ID_SVG_OPERATIONS,
  BOUNDARY_ATTR_SIZE,
  REPEAT_RANGE
} from '../../const/index';

const HTML_BOUNDARY_INFO_ID = 'boundaryInfo';

class BoundaryOperations {
  constructor(props) {
    this.storeOperations = props.storeOperations;
    this.operationsMgmt = props.operationsMgmt;
    this.operationsDefined = props.operationsDefined;
    this.svgSelector = props.svgSelector;
    this.objectUtils = props.objectUtils;
    this.initialize();
    this.bindEventForPopupBoundary();
    this.colorHash = new ColorHash({lightness: 0.2});
  }

  initialize() {
    this.callbackDragBoundary = d3.drag()
      .on("start", this.startDrag(this))
      .on("drag", this.dragTo(this))
      .on("end", this.endDrag(this));

    this.defaultOptions = {
      svgSelector: this.svgSelector,
      containerClass: '_drag_boundary_operations',
      menuItemClass: '_menu_item_boundary_operations',
      callbackDragBoundary: this.callbackDragBoundary,
    };

    this.boundary = new Boundary();
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
    let {x, y, name, description, member, id, width, height, parent, mandatory, repeat, isImport} = sOptions;

    if (!id)
      id = generateObjectId('B');
    if (!width)
      width = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    if (!height)
      height = BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;

    let info = {
      x: x,
      y: y,
      name: name || "Boundary",
      description: description || "Boundary Description",
      member: member || [],
      id: id,
      width: width,
      height: height,
      parent: parent || null,
      mandatory: mandatory || false,
      repeat: repeat || 1,
      idSvg: ID_SVG_OPERATIONS,
      //Variable for control Boundary on interface
      ctrlSrcX: -1,
      ctrlSrcY: -1,
      ctrlSrcWidth: -1,
      ctrlSrcHeight: -1,
    };

    this.storeOperations.boundary.push(info);
    let originConfig = this.defaultOptions;
    let options = _.merge(originConfig, info);
    this.boundary.create(options, this.storeOperations.boundary);
  }

  startDrag(main) {
    return function (d) {
      if (!d.parent)
        main.operationsMgmt.reSizeBoundaryAsObjectDragged(d);

      // Storing start position to calculate the offset for moving members to new position
      d.ctrlSrcX = d.x;
      d.ctrlSrcY = d.y;
    }
  }

  dragTo(main) {
    return function (d) {
      autoScrollOnMousedrag(d);
      updateGraphBoundary(d);

      let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, `#${ID_SVG_OPERATIONS}`, `#${d.id}`);
      d.x = x;
      d.y = y;

      let {width, height} = main.objectUtils.getBBoxObject(`#${d.id}`);
      let data = {x, y, width, height};
      main.operationsMgmt.updateAttrBBoxGroup(data);
    }
  }

  endDrag(main) {
    return function (d) {
      // let {x, y} = main.objectUtils.setPositionObjectJustInSvg(d3.event, `#${ID_SVG_OPERATIONS}`, `#${d.id}`);
      // d.x = x;
      // d.y = y;

      let offsetX = d.x - d.ctrlSrcX;
      let offsetY = d.y - d.ctrlSrcY;

      //If realy move
      if (offsetX != 0 || offsetY != 0) {
        // Transform group
        d3.select(this).attr("transform", "translate(" + [d.x, d.y] + ")");

        // Update position of child element
        if (d.member.length > 0)
          main.moveMember(d.id, offsetX, offsetY);

        if (d.parent) {
          //If object not out boundary parent , object change postion in boundary parent, so change index object
          if (main.operationsMgmt.checkDragObjectOutsideBoundary(d) == false) {
            main.operationsMgmt.changeIndexInBoundaryForObject(d, "B");
          }
        } else {
          main.operationsMgmt.checkDragObjectInsideBoundary(d, "B");
        }
      }

      main.operationsMgmt.hiddenBBoxGroup();
      main.operationsMgmt.restoreSizeBoundary(d);
      //setMinBoundaryGraph(self.dataContainer);
    }
  }

  /**
   * Make controls to edit boundary info
   * @param boundaryId
   */
  makeEditBoundaryInfo(boundaryId) {
    const boundaryInfo = _.find(this.storeOperations.boundary, {"id": boundaryId});
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
  confirmEditBoundaryInfo() {
    const id = this.originBoundary.id;
    let boundaryInfo = _.find(this.storeOperations.boundary, {"id": id});
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

  /**
   * Remove boundary element by id
   * @param boundaryId
   */
  removeBoundary(boundaryId) {
    const {parent, member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    // Set visible all child
    member.forEach(mem => {
      this.selectMemberVisible(boundaryId, mem, true);
    });

    if (parent)
      this.removeMemberFromBoundary(parent, boundaryId);
    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();

    // Reset child parent
    this.resetParentForChildBoundary(boundaryId);

    // Remove from data container
    _.remove(this.storeOperations.boundary, (e) => {
      return e.id === boundaryId;
    });
    // setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Delete boundary and all elements of it
   * Above vertex or boundary (Event child of boundary)
   * @param boundaryId
   */
  deleteAllBoundary(boundaryId) {
    let {parent} = _.find(this.storeOperations.boundary, {"id": boundaryId});

    // Case that delete child boundary nested in boundary
    if (!d3.select(`#${parent}`).empty())
      this.removeMemberFromBoundary(parent, boundaryId);

    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();
    // Remove child of boundary
    this.removeChildElementsBoundary(boundaryId);
    // Remove from data container
    _.remove(this.storeOperations.boundary, (e) => {
      return e.id === boundaryId;
    });
    //setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Copy boundary and all elements of it
   * Above vertex of boundary (Event child of boundary)
   * @param boundaryId
   */
  async copyAllBoundary(boundaryId) {
    let cBoundaryId = generateObjectId("B");
    let cBoundary = _.cloneDeep(_.find(this.storeOperations.boundary, {"id": boundaryId}));
    let cMembers = cBoundary.member.slice();
    cBoundary.member = [];
    cBoundary.id = cBoundaryId;
    cBoundary.x = cBoundary.x + 5;
    cBoundary.y = cBoundary.y + 5;
    cBoundary.parent = null;
    await this.create(cBoundary);
    this.cloneChildElementsBoundary(cBoundaryId, cMembers);
    this.reorderPositionMember(cBoundaryId);
    this.resizeParentBoundary(cBoundaryId);
  }

  /**
   * Selecte member show or hidden
   * @param child
   */
  async selectMemberVisible(boundaryId, child, status) {
    const {id: idChild, type} = child;

    d3.select(`#${idChild}`).classed('hidden-object', !status);
    // Update status member boundary

    this.setBoundaryMemberStatus(boundaryId, idChild, status);
    if (type === "V")
    // Set show|hide for edge related
      this.operationsMgmt.mainMgmt.hideEdgeOnBoundaryMemberVisibleClick(idChild, status);

    if (type === "B")
    // TO-DO: Need improve this code
      this.setObjectShowHide(idChild, status);

    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);

    let {parent} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    if (parent) {
      let ancestor = await this.findAncestorOfMemberInNestedBoundary(parent);
      this.resizeParentBoundary(ancestor);
      this.reorderPositionMember(ancestor);
    }
    //setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Update status for child boundary
   * child match with childId
   * @param boundaryId
   * @param childId
   * @param status
   */
  setBoundaryMemberStatus(boundaryId, childId, status) {
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    let select = _.find(member, (e) => {
      return e.id === childId;
    });
    if (select) {
      select.show = status;
    }
  }

  /**
   * When unslect/select a boundary (in nested boundary) then set it hidden/show
   * and set all child hidden/show
   * and resize boundary
   * @param object
   * @param status
   */
  setObjectShowHide(boundaryId, status) {
    d3.select(`#${boundaryId}`).classed('hidden-object', !status);
    // Loop child
    let boundaryObj = _.find(this.storeOperations.boundary, {"id": boundaryId});
    let members = boundaryObj.member;
    members.forEach(member => {
      this.setBoundaryMemberStatus(boundaryId, member.id, status);
      d3.select(`#${member.id}`).classed('hidden-object', !status);
      if (member.type === "B")
        this.setObjectShowHide(member.id, status);
    });
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    // Get vertices relative to parent boundary
    let vertices = _.filter(this.storeOperations.vertex, e => {
      return e.parent === boundaryId;
    });

    vertices.forEach((e) => {
      this.operationsMgmt.mainMgmt.hideEdgeOnBoundaryMemberVisibleClick(e.id, status);
    });
  }

  /**
   * Resize (height, width) of parent boundary
   * When add or remove elements
   * @param boundaryId
   */
  resizeParentBoundary(boundaryId) {
    let orderObject = 0;
    let hBeforeElements = 42;
    let wBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    let marginTop = 3;
    let {parent, member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    let boundaryMembers = member;

    boundaryMembers.forEach(member => {
      if (member.show) {
        let objectId = member.id;
        const {width, height} = this.objectUtils.getBBoxObject(`#${objectId}`);
        orderObject++;
        hBeforeElements += height;
        if (width >= wBoundary)
          wBoundary = width + (member.type === "B" ? 10 : 0);
      }
    });

    let hBoundary = hBeforeElements + marginTop * orderObject;
    this.setHeightBoundary(boundaryId, hBoundary);
    this.setWidthBoundary(boundaryId, wBoundary);
    if (parent)
      this.resizeParentBoundary(parent);
  }

  /**
   * Set height boundary
   * @param boundaryId
   * @param height
   */
  setHeightBoundary(boundaryId, height) {
    // Set height for boundary
    if (height < BOUNDARY_ATTR_SIZE.BOUND_HEIGHT)
      height = BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;
    $(`#${boundaryId}Content`).attr('height', height);
    // Update data
    let boundaryInfo = _.find(this.storeOperations.boundary, {"id": boundaryId});
    boundaryInfo.height = height;
  }

  /**
   * Set height boundary
   * @param boundaryId
   * @param width
   */
  setWidthBoundary(boundaryId, width) {
    // Set width for boundary
    if (width < BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
      width = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    $(`#${boundaryId}Content`).attr('width', width);
    // $(`#${boundaryId}Button`).attr('x', width);
    // $(`#${boundaryId}Text`).attr('x', width + 5);
    $(`#${boundaryId}Button`).attr('x', width - 25);
    $(`#${boundaryId}Text`).attr('x', width - 20);
    // Update data
    let boundaryInfo = _.find(this.storeOperations.boundary, {"id": boundaryId});
    boundaryInfo.width = width;
  }

  /**
   * Reorder and Calculator position for child element
   * @param boudaryId
   * @param position
   */
  reorderPositionMember(boundaryId, pos) {
    let orderObject = 0;
    let hBeforeElements = 42;
    let wBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    let marginTop = 3;

    // Get child of boundary
    const {x, y, member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    if (!pos) {
      pos = {x: x, y: y};
    }
    let boundaryMembers = member;

    boundaryMembers.forEach(member => {
      if (member.show) {
        let objectId = member.id;
        const {width, height} = this.objectUtils.getBBoxObject(`#${objectId}`);
        // Vertex position center of boundary
        let position = {x: pos.x + 5, y: pos.y + hBeforeElements + marginTop * orderObject};
        if (member.type === "V") {
          this.operationsMgmt.setVertexPosition(objectId, position);
        } else {
          this.setBoundaryPosition(objectId, position);
        }

        orderObject++;
        hBeforeElements += height;
        if (width >= wBoundary)
          wBoundary = width + (member.type === "B" ? 10 : 0);
      }
    });

    let hBoundary = hBeforeElements + marginTop * orderObject;
    this.setHeightBoundary(boundaryId, hBoundary);
    this.setWidthBoundary(boundaryId, wBoundary);
  }

  /**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param vertexId
   * @param position
   */
  setBoundaryPosition(boundaryId, position) {
    let boundaryInfo = _.find(this.storeOperations.boundary, {"id": boundaryId});
    boundaryInfo.x = position.x;
    boundaryInfo.y = position.y;

    d3.select(`#${boundaryId}`).attr("transform", "translate(" + [position.x, position.y] + ")");

    this.reorderPositionMember(boundaryId, position);
  }

  /**
   * Remove member from boundary
   * @param boundaryId
   * @param objectId
   */
  async removeMemberFromBoundary(boundaryId, objectId) {
    const {member, parent} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    _.remove(member, (e) => {
      return e.id === objectId;
    });
    // Resize parent and child of parent
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);

    // Resize ancestor of parent
    if (parent) {
      let ancestor = await this.findAncestorOfMemberInNestedBoundary(boundaryId);
      this.resizeParentBoundary(ancestor);
      this.reorderPositionMember(ancestor);
    }
  }

  /**
   * Reset parent for child boundary when it deleted
   * @param boundaryId
   */
  resetParentForChildBoundary(boundaryId) {
    // Get child of boundary
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    member.forEach(mem => {
      let objectId = mem.id;
      if (mem.type === "V") {
        let info = _.find(this.storeOperations.vertex, {"id": objectId});
        info.parent = null;
      } else {
        let info = _.find(this.storeOperations.boundary, {"id": objectId});
        info.parent = null;
      }
    });
  }

  /**
   * Remove child boundary
   * @param boundaryId
   */
  removeChildElementsBoundary(boundaryId) {
    // Get child of boundary
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});

    member.forEach(mem => {
      let objectId = mem.id;
      if (mem.type === "V") {
        this.operationsMgmt.deleteVertex(objectId);
      } else {
        // Remove all child boundary
        this.deleteAllBoundary(objectId);
      }
    });
  }

  /**
   * Clone all child boundary, above child of child boundary
   * boundaryCloneId, cloneMembers
   */
  cloneChildElementsBoundary(cloneId, cMembers = []) {
    for (let i = 0; i < cMembers.length; i++) {
      const member = cMembers[i];
      let objectId = member.id;
      if (member.type === "V") {
        let cVertex = _.cloneDeep(_.find(this.storeOperations.vertex, {"id": objectId}));
        let cVertexId = generateObjectId("V");
        cVertex.id = cVertexId;
        cVertex.parent = cloneId;
        let child = {id: cVertexId, type: "V", show: true};
        this.operationsMgmt.vertexOperations.create(cVertex);
        this.addMemberToBoundary(cloneId, child);
      } else {
        let cBoundary = _.cloneDeep(_.find(this.storeOperations.boundary, {"id": objectId}));
        let members = cBoundary.member.slice();
        let cBoundaryId = generateObjectId("B");
        cBoundary.id = cBoundaryId;
        cBoundary.parent = cloneId;
        cBoundary.member = [];
        let child = {id: cBoundaryId, type: "B", show: true};
        this.create(cBoundary);
        this.addMemberToBoundary(cloneId, child);
        if (members.length > 0)
          this.cloneChildElementsBoundary(cBoundaryId, members);
      }
    }
  }

  /**
   * Add memebr to boundary
   * @param boundaryId
   * @param child
   * Member format
   * {id: '', type: [V, B], show: true}
   */
  addMemberToBoundary(boundaryId, child) {
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    member.push(child);
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    //setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Add memebr to boundary
   * @param boundaryId
   * @param child
   * Member format
   * {id: '', type: [V, B], show: true}
   */
  changeIndexMemberToBoundary(boundaryId, indexOld, indexNew) {
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    arrayMove(member, indexOld, indexNew);
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    //setMinBoundaryGraph(this.storeOperations);
  }

  /**
   * Add member to boundary To index
   * @param boundaryId
   * @param child
   * @param index
   */
  addMemberToBoundaryWithIndex(boundaryId, child, index) {
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});
    member.splice(index, 0, child);
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    //setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Move all member of boundary with specified offset
   * @param {*} boundaryId
   * @param {*} offsetX
   * @param {*} offsetY
   */
  moveMember(boundaryId, offsetX, offsetY) {

    // Get child of boundary
    const {member} = _.find(this.storeOperations.boundary, {"id": boundaryId});

    let boundaryMembers = member;

    boundaryMembers.forEach(member => {
      if (member.show) {
        // Vertex position center of boundary
        if (member.type === "V") {
          this.operationsMgmt.moveVertex(member.id, offsetX, offsetY);
        } else {
          this.moveBoundary(member.id, offsetX, offsetY);
        }
      }
    });
  }

  /**
   * Move boundary with specified offset
   * @param {*} boundaryId
   * @param {*} offsetX
   * @param {*} offsetY
   */
  moveBoundary(boundaryId, offsetX, offsetY) {

    let boundaryInfo = _.find(this.storeOperations.boundary, {"id": boundaryId});
    boundaryInfo.x = boundaryInfo.x + offsetX;
    boundaryInfo.y = boundaryInfo.y + offsetY;

    d3.select(`#${boundaryId}`).attr("transform", "translate(" + [boundaryInfo.x, boundaryInfo.y] + ")");

    this.moveMember(boundaryId, offsetX, offsetY);
  }

  async findAncestorOfMemberInNestedBoundary(id) {
    const {parent} = _.find(this.storeOperations.boundary, {"id": id});
    if (!parent)
      return Promise.resolve(id);

    return this.findAncestorOfMemberInNestedBoundary(parent);
  }
}

export default BoundaryOperations
