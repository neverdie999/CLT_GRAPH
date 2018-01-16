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

  async createBoundary(options = {}){
    let boundaryId = options.id ? options.id : this.objectUtils.generateObjectId('B');
    let memeber = options.member || [];
    let parent = options.parent || null;
    let height = options.height || BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;
    let width = options.width || BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    let boundaryInfo = {
      x: options.x,
      y: options.y,
      name: options.name || "Boundary",
      description: options.description || "Boundary Description",
      member: memeber,
      id: boundaryId,
      width: width,
      height: height,
      boundaryScope: this,
      parent: parent,
    };

    this.dataContainer.boundary.push(boundaryInfo);

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", boundaryId)
      .attr("class", "groupBoundary")
      .style("visibility", "visible")
      .style("cursor", "move");

    group.append("text")
      .attr("id", `${boundaryId}Text`)
      .attr("x", width + 5)
      .attr("y", 15)
      .text("+");

    group.append("rect")
      .attr("x", width)
      .attr("class", `boundary_right ${boundaryId}Button`)
      .attr("id", `${boundaryId}Button`)
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
      .attr("width", width)
      .attr("height", height)
      .style("border", "solid 1px #652a82")
      .style("font-size", "13px")
      .style("background", "#ffffff")
      .append("xhtml:div")
      .attr("class", "boundary_content")
      .html(`
          <div class="boundary_header">
            <p id="${boundaryId}Header" class="header_name header_boundary" style="width: 100%; height: ${BOUNDARY_ATTR_SIZE.HEADER_HEIGHT}px;">${boundaryInfo.name}</p>
          </div>
      `);

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
    d.x = d3.event.x;
    d.y = d3.event.y;


    // Update position of child element
    // let vertexMembers = d.member.vertex;
    if(d.member.length > 0)
      boundaryScope.reorderPositionMember(d.id, {x: d3.event.x, y: d3.event.y});

    // Resize boundary
    let originId = d.id;
    let originBox = boundaryScope.objectUtils.getBBoxObjectById(originId);
    let originWidth = originBox.width;
    let originHeight = originBox.height;

    d3.select("svg").selectAll(".groupBoundary").each((d, i, node) => {
      if(d.id != originId && !d.parent){
        let scope = d.boundaryScope;
        let boundaryId = d.id;
        let boxBoundary = scope.objectUtils.getBBoxObjectById(boundaryId);
        if(originHeight >= boxBoundary.height)
          scope.setHeightBoundary(boundaryId, originHeight + 43);
        if(originWidth >= boxBoundary.width)
          scope.setWidthBoundary(boundaryId, originWidth + 15);
      }
    });

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    });
  }

  dragBoundaryEnd(d) {
    d3.select(this).classed("active", false);
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
        if((xOrigin >= xBoundary) && (yOrigin >= yBoundary) && (xOriginBox <= xBoundaryBox) && (yOriginBox <= yBoundaryBox) ){
          let member = {id: originInfo.id, type: "B", show: true};
          boundaryScope.addMemberToBoundary(boundaryId, member);
          originInfo.parent = boundaryId;
        }
      }
    });

    originScope.objectUtils.resetSizeAllBoundary();
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
   * Copy boundary and all elements of it
   * Above vertex of boundary (Event child of boundary)
   * @param boundaryId
   */
  async copyAllBoundary(boundaryId) {
    let boundaryCloneId = this.objectUtils.generateObjectId("B");
    let boundaryClone = this.objectUtils.cloneBoundaryInfoById(boundaryId);
    let cloneMembers = boundaryClone.member.slice();
    boundaryClone.member = [];
    boundaryClone.id = boundaryCloneId;
    boundaryClone.x = boundaryClone.x + 5;
    boundaryClone.y = boundaryClone.y + 5;
    await this.createBoundary(boundaryClone);
    this.cloneChildBoundary(boundaryCloneId, cloneMembers);
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
    let heightBeforeElements = 42;
    let widthBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    let marginTop = 5;

    // Get child of boundary
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId)
    if(!pos) {
      pos = {x: boundaryInfo.x, y: boundaryInfo.y};
    }
    let boundaryMembers = boundaryInfo.member;

    boundaryMembers.forEach(member => {
      if(member.show){
        let objectId = member.id;
        let boxObject = this.objectUtils.getBBoxObjectById(objectId);
        let position = {x: pos.x + 5, y: pos.y + heightBeforeElements + marginTop*orderObject }; // Vertex postion center of boudary
        if(member.type === "V"){
          let vertexInfo = this.objectUtils.getVertexInfoById(objectId);
          let vertexScope = vertexInfo.mainScope;
          vertexScope.setVertexPosition(objectId, position);
        } else {
          this.setBoundaryPosition(objectId, position);
        }

        orderObject ++;
        heightBeforeElements += boxObject.height;
        if(boxObject.width > widthBoundary)
          widthBoundary = boxObject.width + (member.type === "B" ? 10: 0);
      }
    });

    let boundaryHeight = heightBeforeElements + marginTop*orderObject;
    this.setHeightBoundary(boundaryId, boundaryHeight);
    this.setWidthBoundary(boundaryId, widthBoundary);
  }

  /**
   * Selecte member show or hidden
   * @param child
   */
  selectMemberVisible(boundaryId, child, status) {
    d3.select(`#${child.id}`).classed('hidden-object', !status);
    // Update status member boundary
    let boundaryObj = this.objectUtils.getBoundaryInfoById(boundaryId);
    this.objectUtils.setBoundaryMemberStatus(boundaryId, child.id, status)
    if (child.type === "B")
      this.setObjectShowHide(child.id, status);

    this.reorderPositionMember(boundaryId);
    if (boundaryObj.parent)
      this.reorderPositionMember(boundaryObj.parent);
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
    let boundaryObj = this.objectUtils.getBoundaryInfoById(boundaryId);
    let members = boundaryObj.member;
    members.forEach(member => {
      this.objectUtils.setBoundaryMemberStatus(boundaryId, member.id, status)
      d3.select(`#${member.id}`).classed('hidden-object', !status);
      if(member.type === "B")
        this.setObjectShowHide(member.id, status);
    });
    this.reorderPositionMember(boundaryId);
  }

  /**
   * Set height boundary
   * @param boundaryId
   * @param height
   */
  setHeightBoundary(boundaryId, height) {
    // Set height for boundary
    if(height < BOUNDARY_ATTR_SIZE.BOUND_HEIGHT)
      height = BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;
    $(`#${boundaryId}Content`).attr('height', height);
    // Update data
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    boundaryInfo.height = height;
  }

  /**
   * Set height boundary
   * @param boundaryId
   * @param width
   */
  setWidthBoundary(boundaryId, width) {
    // Set width for boundary
    if(width < BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
      width = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    $(`#${boundaryId}Content`).attr('width', width);
    $(`#${boundaryId}Button`).attr('x', width);
    $(`#${boundaryId}Text`).attr('x', width + 5);
    // Update data
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    boundaryInfo.width = width;
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

  /**
   * Clone all child boundary, above child of child boundary
   * boundaryCloneId, cloneMembers
   */
  cloneChildBoundary(boundaryCloneId, cloneMembers = []) {
    cloneMembers.forEach(member => {
      let objectId = member.id;
      if (member.type === "V") {
        let vertexObj = this.objectUtils.cloneVertexInfoById(objectId);
        let vertexId = this.objectUtils.generateObjectId("V");
        vertexObj.id = vertexId;
        vertexObj.parent = boundaryCloneId;
        let child = {id: vertexId, type: "V", show: true};
        let scope = vertexObj.mainScope;
        scope.create(vertexObj);
        this.addMemberToBoundary(boundaryCloneId, child);
      } else {
        let boundaryObj = this.objectUtils.cloneBoundaryInfoById(objectId);
        let cloneId = boundaryObj.id;
        let members = boundaryObj.member.slice();
        let boundaryId = this.objectUtils.generateObjectId("B");
        boundaryObj.id = boundaryId;
        boundaryObj.parent = boundaryCloneId;
        boundaryObj.member = [];
        let child = {id: boundaryId, type: "B", show: true};
        this.createBoundary(boundaryObj);
        this.addMemberToBoundary(boundaryCloneId, child);
        this.cloneChildBoundary(boundaryId, members);
      }
    });
  }

  /**
   * Make controls to edit boundary info
   * @param boundaryId
   */
  makeEditBoundaryInfo (boundaryId) {
    const boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    let parent = d3.select('svg').select(`#${boundaryId}`);
    let scope = boundaryInfo.boundaryScope;
    let form = parent.append("foreignObject")
      .attr("id", `${boundaryId}Name`)
      .attr("y", 8)
      .attr("x", 5);
    let input = form
      .attr("width", boundaryInfo.width - 10)
      .attr("height", 20)
      .append("xhtml:form")
      .append("input")
      .attr("maxlength", 20)
      .attr("class", "input-header-boundary")
      .attr("value", function() {
        this.focus();
        return boundaryInfo.name;
      })
      .attr("style", `width: ${boundaryInfo.width - 10}px`)
      .on("blur", function() {
        let newName = input.node().value;
        if(newName){
          scope.setBoundaryName(boundaryId, newName);
        }

        parent.select(`#${boundaryId}Name`).remove();
      })
      .on("keypress", function() {
        // IE fix
        if (!d3.event)
          d3.event = window.event;

        var e = d3.event;
        if (e.keyCode == 13)
        {
          if (typeof(e.cancelBubble) !== 'undefined') // IE
            e.cancelBubble = true;
          if (e.stopPropagation)
            e.stopPropagation();
          e.preventDefault();

          let newName = input.node().value;
          if(newName){
            scope.setBoundaryName(boundaryId, newName);
          }

          parent.select(`#${boundaryId}Name`).remove();
        }
      });
  }

  /**
   * Set boundary info
   * @param boundaryId
   * @param boundaryId, info
   */
  setBoundaryName (boundaryId, name) {
    const boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
    boundaryInfo.name = name;
    d3.select(`#${boundaryId}Header`).text(name);
  }
};

export default BoundaryMgmt;
