import * as d3 from 'd3';
import {
  HTML_BOUNDARY_CONTAINER_CLASS,
  SCREEN_SIZES,
  BOUNDARY_ATTR_SIZE,
} from '../../const/index';

import PopUtils from '../../common/utilities/popup.ult';

class BoundaryMgmt {
  constructor(props){
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.objectUtils = props.objectUtils;

    // Init event drag for boundary
    this.dragRegister = d3.drag()
      .on("start", this.dragBoundaryStart)
      .on("drag", this.dragBoundary)
      .on("end", this.dragBoundaryEnd);
  }

  createBoundary(options = {}){
    let boundaryId = options.id ? options.id : this.objectUtils.generateObjectId('B');
    let memeber = options.member || [];
    let parent = options.parent || null;
    let boundaryInfo = {
      x: options.x,
      y: options.y,
      name: options.name || "Boundary",
      description: options.description || "Boundary Description",
      member: memeber,
      id: boundaryId,
      boundaryScope: this,
      parent: parent,
    };

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", boundaryId)
      .attr("class", "groupBoundary")
      .style("visibility", "visible")
      .style("cursor", "move");

    group.append("text")
      .attr("x", BOUNDARY_ATTR_SIZE.BOUND_WIDTH + 5)
      .attr("y", 15)
      .text("+");

    group.append("rect")
      .attr("x", BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
      .attr("class", `boundary_right ${boundaryId}Button`)
      .attr("data", boundaryId)
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", "#ad8fbb")
      .style("fill-opacity", ".5")
      .style("cursor", "pointer")
      .append("title")
      .text("Right click to select member visible");

    group.append("foreignObject")
      .attr("id", `${boundaryId}Content`)
      .attr("width", BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
      .attr("height", BOUNDARY_ATTR_SIZE.BOUND_HEIGHT)
      .style("border", "solid 1px #652a82")
      .style("font-size", "13px")
      .style("background", "#ffffff")
      .append("xhtml:div")
      .attr("class", "boundary_content")
      .html(`
          <div class="boundary_header">
            <p class="header_name header_boundary" style="width: 100%; height: ${BOUNDARY_ATTR_SIZE.HEADER_HEIGHT}px;">${boundaryInfo.name}</p>
          </div>
      `);

    boundaryInfo.width = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    boundaryInfo.height = BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;
    this.dataContainer.boundary.push(boundaryInfo);

    // Call event drag for all object vertex exit.
    this.initEventDrag();
  }

  initEventDrag(){
    // Call event drag for all boundary exit.
    this.svgSelector.selectAll(".groupBoundary").call(this.dragRegister).data(this.dataContainer.boundary);
  }

  dragBoundaryStart(d) {
    d3.select(this).classed("active", true);
    d3.event.sourceEvent.stopPropagation();
  }

  dragBoundary(d) {

    let boundaryScope = d.boundaryScope;
    // Update poition object in this.dataContainer.boundary
    d.x = d3.event.x
    d.y = d3.event.y;

    // Update position of child element
    // let vertexMembers = d.member.vertex;
    if(d.member.length > 0)
      boundaryScope.reorderPositionMember(d.id, {x: d3.event.x, y: d3.event.y});

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    });
  }

  dragBoundaryEnd(d) {
    d3.select(this).classed("active", false);
    return;


    let originInfo = d;
    // If boundary has parent then not check.
    if(originInfo.parent)
      return;

    let originScope = d.boundaryScope;
    // let boxVertex = d3.select(`#${vertexInfo.id}`).node().getBBox();
    let boxOrigin = originScope.objectUtils.getBBoxObjectById(originInfo.id);
    // Calculate box for vertex
    let xOrigin = originInfo.x;
    let yOrigin = originInfo.y
    let xOriginBox = xOrigin + boxOrigin.width;
    let yOriginBox = yOrigin + boxOrigin.height;

    d3.select("svg").selectAll(".groupBoundary").each((d, i, node) => {
      if(!d.parent && d.id != originInfo.id){
        // Calculate box for boundary
        let boundaryId = d.id;
        let boundaryScope = d.boundaryScope;
        let boundaryInfo = boundaryScope.objectUtils.getBoundaryInfoById(boundaryId);
        let xBoundary = boundaryInfo.x;
        let yBoundary = boundaryInfo.y;
        // let boxBoundary = d3.select(`#${boundaryInfo.id}`).node().getBBox();
        let boxBoundary = boundaryScope.objectUtils.getBBoxObjectById(boundaryId);
        let xBoundaryBox = xBoundary + boxBoundary.width;
        let yBoundaryBox = yBoundary + boxBoundary.height;

        // Check drop inside a boundary
        // if((xOrigin >= xBoundary) && (yOrigin >= yBoundary) && (xOriginBox <= xBoundaryBox) && (yOriginBox <= yBoundaryBox) ){
        if((yOrigin >= yBoundary) && (yOriginBox <= yBoundaryBox)){
        // boundaryInfo.member.vertex.push({id: vertexInfo.id, show: true});
          let member = {id: originInfo.id, type: "B", show: true};
          boundaryScope.addMemberToBoundary(boundaryId, member);
          originInfo.parent = boundaryId;
        }
      }
    });
  }

  /**
   * Remove boundary element by id
   * @param boundaryId
   */
  removeBoundary(boundaryId) {
    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();

    // Reset child parent
    this.resetParentForChildBoundary(boundaryId);

    // Remove from data container
    let data = _.remove(this.dataContainer.boundary, (e) => {
      return e.id === boundaryId;
    });
  }

  /**
   * Delete boundary and all elements of it
   * Above vertex or boundary (Event child of boundary)
   * @param boundaryId
   */
  deleteAllBoundary(boundaryId) {
    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();

    // Remove child of boundary
    this.removeChildBoundary(boundaryId);

    // Remove from data container
    let data = _.remove(this.dataContainer.boundary, (e) => {
      return e.id === boundaryId;
    });
  }

  /**
   * Get boundary info by id
   * @param boundaryId
   * @returns {*}
   */
  getBoundaryInfoById(boundaryId) {
    return _.find(this.dataContainer.boundary, (e) => { return e.id === boundaryId; });
  }

  /**
   * Reorder and Calculator position for child element
   * @param boudaryId
   * @param position
   */
  reorderPositionMember(boundaryId, pos) {
    let orderObject = 0;
    let heightBeforeElements = 43;
    let marginTop = 5;

    // Get child of boundary
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId)
    if(!pos) {
      pos = {x: boundaryInfo.x, y: boundaryInfo.y};
    }
    let boundaryMembers = boundaryInfo.member;

    boundaryMembers.forEach(member => {
      let objectId = member.id;
      let boxObject = this.objectUtils.getBBoxObjectById(objectId);
      let position = {x: pos.x + 15, y: pos.y + heightBeforeElements + marginTop*orderObject }; // Vertex postion center of boudary
      if(member.type === "V"){
        let vertexInfo = this.objectUtils.getVertexInfoById(objectId);
        let vertexScope = vertexInfo.mainScope;
        vertexScope.setVertexPosition(objectId, position);
      } else {
        this.setBoundaryPosition(objectId, position);
      }

      orderObject ++;
      heightBeforeElements += boxObject.height;
    });

    let boundaryHeight = heightBeforeElements + marginTop*orderObject;
    this.setHeightBoundary(boundaryId, boundaryHeight)
  }

  /**
   * Set member visible or not
   * @param child
   */
  setVisibleMember(child) {
    console.log(child);
  }

  /**
   * Set height for boundary
   */
  setHeightBoundary(boundaryId, height) {
    // Use jquery to set height for boundary content
    $(`#${boundaryId}Content`).attr('height', height > 43 ? height : 180);
  }

  /**
   * Add memebr to boundary
   * @param boundaryId
   * @param child
   * Member format
   * {id: '', type: [V, B], show: true}
   */
  addMemberToBoundary (boundaryId, child) {
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    boundaryInfo.member.push(child);
    this.reorderPositionMember(boundaryId);
  }

  /**
   * Remove member from boundary
   * @param boundaryId
   * @param objectId
   */
  removeMemberFromBoundary (boundaryId, objectId) {
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);

    let data = _.remove(boundaryInfo.member, (e) => {
      return e.id === objectId;
    });
    this.reorderPositionVertex(boundaryId);
  }

  /**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param vertexId
   * @param position
   */
  setBoundaryPosition(boundaryId, position) {
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    boundaryInfo.x = position.x;
    boundaryInfo.y = position.y;
    // this.updatePoisitionPathConnnect(vertexId);

    d3.select(`#${boundaryId}`).attr("transform", (d,i) => {
      return "translate(" + [ position.x, position.y ] + ")"
    });

    this.reorderPositionMember(boundaryId, position)
  }

  /**
   * Reset parent for child boundary when it deleted
   * @param boundaryId
   */
  resetParentForChildBoundary(boundaryId) {
    // Get child of boundary
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId)
    let boundaryMembers = boundaryInfo.member;

    boundaryMembers.forEach(member => {
      let objectId = member.id;
      if(member.type === "V"){
        let vertexInfo = this.objectUtils.getVertexInfoById(objectId);
        vertexInfo.parent = null;
      } else {
        let boundaryInfo = this.objectUtils.getBoundaryInfoById(objectId)
        boundaryInfo.parent = null;
      }
    });
  }

  /**
   * Remove child boundary
   * @param boundaryId
   */
  removeChildBoundary(boundaryId) {
// Get child of boundary
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId)
    let boundaryMembers = boundaryInfo.member;

    boundaryMembers.forEach(member => {
      let objectId = member.id;
      if(member.type === "V"){
        let vertexInfo = this.objectUtils.getVertexInfoById(objectId);
        let vertexScope = vertexInfo.mainScope;
        // Remove all child vertex
        vertexScope.remove(objectId);
      } else {
        // Remove all child boundary
        this.deleteAllBoundary(objectId);
      }
    });
  }
};

export default BoundaryMgmt;
