import MainMenu from './menu-context/main-menu';
import VertexMenu from './menu-context/vertex-menu';
import BoundaryMenu from './menu-context/boundary-menu';
import BoundaryMenuItems from './menu-context/boundary-menu-items';
import VertexOperations from './vertex-operations';
import BoundaryOperations from './boundary-operations';
import * as d3 from 'd3';

import {
  ID_CONTAINER_OPERATIONS,
  ID_SVG_OPERATIONS,
  VERTEX_GROUP_OPTION,
  CLASS_CONTAINER_VERTEX,
  CLASS_CONTAINER_BOUNDARY,
  CLASS_MENU_ITEM_BOUNDARY

} from '../../const/index';

class OperationsMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.storeOperations = props.storeOperations;
    this.objectUtils = props.objectUtils;
    this.mainMgmt = props.mainMgmt;
    this.operationsDefined = props.operationsDefined;

    this.initialize();
  }

  initialize() {
    this.svgSelector = d3.select(`#${ID_SVG_OPERATIONS}`);
    this.d3 = d3;
    this.isShowReduced = false;

    this.vertexOperations = new VertexOperations({
      storeOperations: this.storeOperations,
      operationsDefined: this.operationsDefined,
      svgSelector: this.svgSelector,
      operationsMgmt: this,
      objectUtils: this.objectUtils
    });

    this.boundaryOperations = new BoundaryOperations({
      storeOperations: this.storeOperations,
      operationsDefined: this.operationsDefined,
      svgSelector: this.svgSelector,
      operationsMgmt: this,
      objectUtils: this.objectUtils
    });

    this.initBBoxGroup();
    this.initScrollEvent();
  }

  initMenuContext() {
    new MainMenu({
      selector: `#${ID_SVG_OPERATIONS}`,
      parentContainer: `#${ID_CONTAINER_OPERATIONS}`,
      operationsMgmt: this,
      operationsDefined: this.operationsDefined
    });

    // Vertex menu
    new VertexMenu({
      selector: `.${this.vertexOperations.defaultOptions.containerClass}`,
      vertexOperations: this.vertexOperations,
      storeOperations: this.storeOperations
    });

    // Boundary menu
    new BoundaryMenu({
      selector: `.${this.boundaryOperations.defaultOptions.containerClass}`,
      boundaryOperations: this.boundaryOperations,
      storeOperations: this.storeOperations
    });

    // Boundary Menu Items
    new BoundaryMenuItems({
      selector: `.${this.boundaryOperations.defaultOptions.menuItemClass}`,
      boundaryOperations: this.boundaryOperations,
      objectUtils: this.objectUtils,
      storeOperations: this.storeOperations
    });
  }

  initScrollEvent(){
    $(`#${ID_SVG_OPERATIONS}`).parent().scroll(()=>{
      this.onScrollHandle(this);
    });
  }

  onScrollHandle(main){
    this.storeOperations.vertex.forEach(v => {
      this.mainMgmt.updatePathConnect(v, ID_SVG_OPERATIONS);
    });
  }

  /**
   * The box simulate new position of vertex or boundary dragged.
   */
  initBBoxGroup() {
    this.svgSelector.append("svg:g")
      .attr("transform", `translate(0.5, 0.5)`)
      .append("svg:rect")
      .attr("id", "dummyBBox")
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
    const {x, y, width, height} = data;
    d3.select('#dummyBBox').attr('x', x);
    d3.select('#dummyBBox').attr('y', y);
    d3.select('#dummyBBox').attr('width', width);
    d3.select('#dummyBBox').attr('height', height);
    d3.select('#dummyBBox').style("display", "block");
    d3.select(d3.select("#dummyBBox").node().parentNode).moveToFront();
  }

  hiddenBBoxGroup() {
    d3.select('#dummyBBox').style("display", "none");
  }

  getVertexTypesShowFull(data) {
    const group = data["VERTEX_GROUP"];
    const vertex = data["VERTEX"];
    let len = group.length;
    for (let i = 0; i < len; i++) {
      let groupType = group[i].groupType;
      let groupOption = group[i].option;
      let lenOpt = groupOption.length;
      for (let j = 0; j < lenOpt; j++) {
        let option = groupOption[j];
        let groupVertex = _.filter(vertex, (e) => {
            return e.groupType === groupType;
          }
        );
        let groupAction = [];
        groupVertex.forEach(e => {
          groupAction.push(e.vertexType);
        });
        this.operationsDefined.groupVertexOption[option] = groupAction;
      }
    }
  }

  createVertex(opt) {
    this.vertexOperations.create(opt);
  }

  createBoundary(opt) {
    this.boundaryOperations.create(opt);
  }

  deleteVertex(vertexId){
    this.vertexOperations.deleteVertex(vertexId);
  }
   // Set vertex position
   setVertexPosition(vertexId, position) {
    this.vertexOperations.setVertexPosition(vertexId, position);
  }

  /**
   * When a vertex|boundary move
   * Resize if any boundary with size smaller than vertex|boundary size
   */
  reSizeBoundaryAsObjectDragged(infos) {


    // Get box object
    const {height, width} = this.objectUtils.getBBoxObject(`#${infos.id}`);

    this.svgSelector.selectAll(`.${this.boundaryOperations.defaultOptions.containerClass}`).each((d, i, node) => {
      let curBoundary = _.find(this.storeOperations.boundary, {"id":d.id});

      if (d.id != infos.id && !curBoundary.parent) {
        let boundaryId = d.id;
        let bBox = this.objectUtils.getBBoxObject(`#${boundaryId}`);
        let boundaryInfo = _.find(this.storeOperations.boundary, {"id":boundaryId});
        if (height >= bBox.height){
          //2018.07.03 - Vinh Vo - save this height for restoring to origin size if the object not drag in/out this boundary
          boundaryInfo.ctrlSrcHeight = boundaryInfo.height;
          this.boundaryOperations.setHeightBoundary(boundaryId, height + 43);
        }

        if (width >= bBox.width){
          //2018.07.03 - Vinh Vo - save this height for restoring to origin size if the object not drag in/out this boundary
          boundaryInfo.ctrlSrcWidth = boundaryInfo.width;
          this.boundaryOperations.setWidthBoundary(boundaryId, width + 15);
        }
      }
    });
  }

  /**
   * Restore back the old size, dragingObject do not drag in/out these boundaries
   * @param {*} dragingObject
   */
  restoreSizeBoundary(dragingObject) {
    this.svgSelector.selectAll(`.${this.boundaryOperations.defaultOptions.containerClass}`).each((d, i, node) => {
      let boundaryId = d.id;

      let boundaryInfo = _.find(this.storeOperations.boundary, {"id":boundaryId});
      //do not restore for parent, it was resize by checkDragObjectOutsideBoundary() or checkDragObjectInsideBoundary()
      if (boundaryId != dragingObject.id && boundaryId != dragingObject.parent){
        if (boundaryInfo.ctrlSrcHeight != -1){
          this.boundaryOperations.setHeightBoundary(boundaryId, boundaryInfo.ctrlSrcHeight);
        }

        if(boundaryInfo.ctrlSrcWidth != -1){
          this.boundaryOperations.setWidthBoundary(boundaryId, boundaryInfo.ctrlSrcWidth);
        }
      }

      boundaryInfo.ctrlSrcHeight = -1;
      boundaryInfo.ctrlSrcWidth = -1;
    });
  }

  /**
   * Check drag outside boundary
   */
  checkDragObjectOutsideBoundary(srcInfos) {
    // Get box object
    const {id, parent} = srcInfos;
    let {height, width} = this.objectUtils.getBBoxObject(`#${id}`);
    let xSrc = srcInfos.x;
    let ySrc = srcInfos.y;
    let wBSrc = xSrc + width;
    let hBSrc = ySrc + height;

    // Parent
    const {x, y} = _.find(this.storeOperations.boundary, {"id":parent})
    let pBox = this.objectUtils.getBBoxObject(`#${parent}`);
    let xParent = x + pBox.width;
    let yParent = y + pBox.height;

    // Check drag outside a boundary
    // if ((xSrc < x) || (ySrc < y) || (wBSrc > xParent) || (hBSrc > yParent)) {
    //Change condition object out boundary parent
    if ((( wBSrc < x) || ( xParent < xSrc )) || ((hBSrc < y ) || ( yParent < ySrc ))) {
      this.boundaryOperations.removeMemberFromBoundary(parent, srcInfos.id);
      srcInfos.parent = null;
      return true;
    }
    return false;
  }

  /**
   * @param srcInfos Object drag
   * @param type type of object drag
   * Function using change index of object in boundary parent when drag in boundary
   */
  changeIndexInBoundaryForObject(srcInfos, type) {
    let {parent, id} = srcInfos;
    let {member} = _.find(this.storeOperations.boundary, {"id":parent});
    let indexOld = this.getIndexBy(member, "id", id);
    // let member = { id, type, show: true };
    let indexNew = this.getIndexFromPositionForObject(parent, srcInfos);
    this.boundaryOperations.changeIndexMemberToBoundary(parent, indexOld, indexNew);
    srcInfos.parent = parent;
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
        return i;
      }
    }
    return -1;
  }

  /**
   * Get index of object from drop position
   * @param boundaryId boundaryId tagert drop
   * @param srcInfos Object drap
   * Function using get index for insert to boundary
   */
  getIndexFromPositionForObject(boundaryId, srcInfos) {
    let {member} = _.find(this.storeOperations.boundary, {"id":boundaryId});
    let xSrc = srcInfos.x;
    let ySrc = srcInfos.y;
    let index = 0;
    let memberAvailable = _.filter(member, (e) => {
      return e.show === true
    });
    for (let mem of memberAvailable) {
      let {x, y} = this.getLocationForObject(mem);
      if (y > ySrc) {
        break;
      }
      if (mem.id === srcInfos.id) continue;
      index++;
    }
    return index;
  }

  /**
   * Get current location of object
   */
  getLocationForObject(member) {
    if (member.type === "B") {
      return _.find(this.storeOperations.boundary, {"id":member.id});
    }
    else {
      return _.find(this.storeOperations.vertex, {"id":member.id});
    }
  }

  // Check drag inside boundary
  checkDragObjectInsideBoundary(srcInfos, type) {
    // Get box object
    // Get box object
    const {height, width} = this.objectUtils.getBBoxObject(`#${srcInfos.id}`);
    let xSrc = srcInfos.x;
    let ySrc = srcInfos.y;
    let wBSrc = xSrc + width;
    // let hBSrc = ySrc + height;

    // Define method reverse
    let reverse = (input) => {
      let ret = new Array;
      for (let i = input.length - 1; i >= 0; i--) {
        ret.push(input[i]);
      }
      return ret;
    };

    // Cause: When multi boundary overlap that drags an object inside
    // then it will be added to => regulation add to the highest boundary
    let reverseBoundary = reverse(this.storeOperations.boundary);
    reverseBoundary.forEach((item) => {
      // The condition d.id != srcInfos.id used to check inside boundary
      // But it not affect to check inside vertex
      if (!item.parent && item.id != srcInfos.id && !srcInfos.parent) {
        // Calculate box for boundary
        let boundaryId = item.id;
        let xTar = item.x;
        let yTar = item.y;
        let bBoxTar = this.objectUtils.getBBoxObject(`#${item.id}`);
        let wBTar = xTar + bBoxTar.width;
        let hBTar = yTar + bBoxTar.height;

        if ((xSrc >= xTar) && (ySrc >= yTar) && (wBSrc <= wBTar) && (ySrc <= hBTar)) {
          let member = {id: srcInfos.id, type, show: true};
          let index = this.getIndexFromPositionForObject(boundaryId, srcInfos);
          this.boundaryOperations.addMemberToBoundaryWithIndex(boundaryId, member, index);
          srcInfos.parent = boundaryId;
        }
      }
    });
  }

   /**
   *
   * @param {*} vertexId
   * @param {*} offsetX
   * @param {*} offsetY
   */
  moveVertex(vertexId, offsetX, offsetY){
    this.vertexOperations.moveVertex(vertexId, offsetX, offsetY);
  }

  /**
   * Show full graph
   */
  showFull() {
    let edges = this.storeOperations.edge;
    this.isShowReduced = false;
    /** Vertex **/
    d3.selectAll('.drag_connect.reduced').remove();
    d3.selectAll('.property').classed("hide", false);
    d3.selectAll('.drag_connect').classed("hide", false);

    // Filter the vertex exit edge
    // let len = edges.length;
    // let vertices = [];
    // for (let i = 0; i < len; i++) {
    //   let edge = edges[i];
    //   vertices.push(edge.source.vertexId);
    //   vertices.push(edge.target.vertexId);
    // }

    // vertices = Array.from(new Set(vertices))
    // len = vertices.length;
    // Re-draw edge
    // for (let i = 0; i < len; i++) {
    //   let id = vertices[i];
    //   this.vertex.updatePathConnect(id);
    // }
    this.vertexOperations.resetSizeVertex(true);
    this.updateHeightBoundary();
  }

  /**
   * Show boundary, vertex reduced as policy
   * Show graph elements connected by edges only
   * Boundary: show vertices which have any edges only and boundaries
   * Vertex: The vertices in group SHOW_FULL_ALWAYS not effected by show reduced
   * The remain vertex then show header and connected properties only
   */
  showReduced() {
    this.isShowReduced = true;
    let edge = this.storeOperations.edge;
    let full = this.mainMgmt.operationsDefined.groupVertexOption['SHOW_FULL_ALWAYS'];
    let lstVer = [], lstProp = [];

    // Filter the vertex effected by show reduced
    lstVer = _.filter(this.storeOperations.vertex, (e) => {
      return full.indexOf(e.vertexType) < 0;
    });
    lstVer.forEach((vertex) => {
      d3.select(`#${vertex.id}`).selectAll('.drag_connect:not(.connect_header)').classed("hide", true);
      d3.select(`#${vertex.id}`).selectAll('.property').classed("hide", true);
    });

    // Get vertex and property can display
    // edge.forEach((edgeItem) => {
    //   lstProp.push({
    //     vert: edgeItem.source.vertexId,
    //     prop: edgeItem.source.prop
    //   }, {vert: edgeItem.target.vertexId, prop: edgeItem.target.prop});
    // });

    lstVer.forEach((vertexItem) => {
      let arrPropOfVertex = [];
      lstProp.forEach((propItem) => {
        if (propItem.vert === vertexItem.id) {
          if (arrPropOfVertex.indexOf(propItem.prop) === -1) {
            arrPropOfVertex.push(propItem.prop);
          }
        }
      });
      d3.select(`#${vertexItem.id}`).classed("hide", false); // Enable Vertex
      arrPropOfVertex.forEach((propItem) => {
        d3.select(`#${vertexItem.id}`).select(".property[prop='" + propItem + "']").classed("hide", false);
        d3.select(`#${vertexItem.id}`).select(".property[prop='" + propItem + "']").classed("hide", false);
      });
      this.vertexOperations.updatePathConnect(vertexItem); // Re-draw edge
      /* Update Circle */
      //this.vertex.updatePositionConnect(arrPropOfVertex, d3.select(`#${vertexItem.id}`), vertexItem.id);
    });

    this.vertexOperations.resetSizeVertex(false);
    this.updateHeightBoundary();
  }

  /**
   * Clear all element on graph
   * And reinit marker def
   */
  clearAll() {
    // Delete all element inside SVG
    this.isShowReduced = false;
    this.svgSelector.selectAll("*").remove();
    this.storeOperations.vertex = [];
    this.storeOperations.boundary = [];
    this.initBBoxGroup();
    this.mainMgmt.clearAllEdge();
    // setSizeGraph();
  }

  updateHeightBoundary() {
    // Get all boundary that without parent but have child
    let boundaries = _.filter(this.storeOperations.boundary, (g) => {
      return g.parent != null;
    });
    boundaries.forEach(boundary => {
      this.boundaryOperations.resizeParentBoundary(boundary.id);
    });
    boundaries = _.filter(this.storeOperations.boundary, (g) => {
      return g.parent == null && g.member.length > 0;
    });
    boundaries.forEach(boundary => {
      this.boundaryOperations.reorderPositionMember(boundary.id);
    });

    //setMinBoundaryGraph(this.storeOperations);
  }
}

export default OperationsMgmt;
