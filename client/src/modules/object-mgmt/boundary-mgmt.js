import * as d3 from 'd3';
import {
  HTML_BOUNDARY_CONTAINER_CLASS,
  SCREEN_SIZES,
  BOUNDARY_ATTR_SIZE,
} from '../../const/index';

import PopUtils from '../../common/utilities/popup.ult';

const headerBoundaryHeight = 38;
const groupBoundaryWidth = 180;
const groupBoundaryHeight = 200;

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
    let memberIsVertex = options.member ? options.member.vertex : [];
    let memberIsBoundary = options.member ? options.member.boundary : [];
    let boundaryInfo = {
      x: options.x,
      y: options.y,
      name: options.name || "Boundary",
      description: options.description || "Boundary Description",
      member: {vertex: memberIsVertex , boundary: memberIsBoundary},
      id: boundaryId,
      boundaryScope: this
    };

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", boundaryId)
      .attr("class", "groupBoundary")
      .style("visibility", "visible")
      .style("cursor", "move");

    group.append("text")
      .attr("class", "boundary_right")
      .attr("x", 185)
      .attr("y", 20)
      .attr("id", boundaryId)
      .style("cursor", "pointer")
      .text("+")
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
          <div class="boundary_header" style="width: ${BOUNDARY_ATTR_SIZE.BOUND_WIDTH + 20}px;">
            <p class="header_name header_boundary" style="width: ${BOUNDARY_ATTR_SIZE.BOUND_WIDTH - 2}px; height: ${BOUNDARY_ATTR_SIZE.HEADER_HEIGHT}px;">${boundaryInfo.name}</p>
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
    boundaryScope.reorderPositionVertex(d.id, {x: d3.event.x, y: d3.event.y});

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    });
  }

  dragBoundaryEnd(d) {
    d3.select(this).classed("active", false);
  }

  /**
   * Remove boundary element by id
   * @param boundaryId
   */
  removeBoundary(boundaryId) {
    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();
    // Remove from data container
    let data = _.remove(this.dataContainer.boundary, (e) => {
      return e.id === boundaryId;
    });
  }

  /**
   * Remove boundary and all elements of it
   * Above vertex or boundary (Event child of boundary)
   * @param boundaryId
   */
  removeAllBoundary(boundaryId) {
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
  reorderPositionVertex(boundaryId, pos) {
    let orderVertex = 0;
    let heightBeforeElements = 43;
    let marginTop = 5;

    // Get child of boundary
    let boundaryInfo = this.getBoundaryInfoById(boundaryId)
    if(!pos) {

      pos = {x: boundaryInfo.x, y: boundaryInfo.y};
    }
    let vetexMembers = boundaryInfo.member.vertex;

    vetexMembers.forEach(vertex => {
      let boxVertex = d3.select(`#${vertex.id}`).node().getBBox();
      let vertexInfo = this.objectUtils.getVertexInfoById(vertex.id);
      let vertexScope = vertexInfo.mainScope;

      let position = {x: pos.x + 15, y: pos.y + heightBeforeElements + marginTop*orderVertex }; // Vertex postion center of boudary
      vertexScope.setVertexPosition(vertex.id, position);

      orderVertex ++;
      heightBeforeElements += boxVertex.height;
    });

    $(`#${boundaryId}Content`).attr('height', heightBeforeElements + marginTop*orderVertex > 43 ? heightBeforeElements + marginTop*orderVertex: 180);
    // $(`#${boundaryId}Content`).attr("class", 'hight_light');
    // this.calHeightBoundary(boundaryId);
  }

  /**
   * Set vertex member visible or not
   * @param vertexId
   */
  setVisibleVertex(vertexId) {
    console.log(vertexId);
  }

  /**
   * Set boundary and elmenent inside visible or not
   * @param boundaryId
   */
  setVisibleBoundary(boundaryId) {
    console.log(boundaryId);
  }

  /**
   * Calculate and set height for boundary
   */
  calHeightBoundary(boundaryId) {
    // Use jquery to set height for boundary content
    $(`#${boundaryId}Content`).attr('height', 300);
  }

  addVertexMemberToBoundary (boundaryId, vertexId) {
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    boundaryInfo.member.vertex.push({id: vertexId, show: true});
    this.reorderPositionVertex(boundaryId);
  }

  removeVertexMemberFromBoundary (boundaryId, vertexId) {
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);

    let data = _.remove(boundaryInfo.member.vertex, (e) => {
      return e === vertexId;
    });
    this.reorderPositionVertex(boundaryId);
    console.log(data);
  }
};

export default BoundaryMgmt;
