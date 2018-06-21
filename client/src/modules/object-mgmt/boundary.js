import * as d3 from 'd3';
import {
  HTML_BOUNDARY_CONTAINER_CLASS,
  BOUNDARY_ATTR_SIZE,
  HTML_VERTEX_CONTAINER_CLASS,
  DEFAULT_CONFIG_GRAPH,
  REPEAT_RANGE,
  COMMON_DATA,
} from '../../const/index';

import PopUtils from '../../common/utilities/popup.ult';
import {
  generateObjectId,
  cancleSelectedPath,
  autoScrollOnMousedrag,
  updateGraphBoundary,
  setMinBoundaryGraph,
  allowInputNumberOnly,
  checkMinMaxValue,
  arrayMove,
} from '../../common/utilities/common.ult';
import ColorHash from 'color-hash';

const HTML_BOUNDARY_INFO_ID = 'boundaryInfo';

class Boundary {
  constructor(props) {
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.objectUtils = props.objectUtils;
    this.mainMgmt = props.mainMgmt;

    this.handlerDragBoundary = d3.drag()
      .on("start", this.dragBoundaryStart(this))
      .on("drag", this.dragBoundary(this))
      .on("end", this.dragBoundaryEnd(this));

    this.bindEventForPopupBoundary();
    this.colorHash = new ColorHash({lightness: 0.2});
  }

  async createBoundary(options = {}) {
    let {x, y, name, description, member, id, width, height, parent, mandatory, repeat, isImport} = options;
    if (!id)
      id = generateObjectId('B');
    if (!width)
      width = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    if (!height)
      height = BOUNDARY_ATTR_SIZE.BOUND_HEIGHT

    let boundaryInfo = {
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
      repeat: repeat || 1
    };

    this.dataContainer.boundary.push(boundaryInfo);
    let group = this.svgSelector.selectAll(`.${HTML_BOUNDARY_CONTAINER_CLASS}`)
      .data(this.dataContainer.boundary)
      .enter()
      .append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", id)
      .attr("class", `${HTML_BOUNDARY_CONTAINER_CLASS}`)
      .style("cursor", "move")
      .call(this.handlerDragBoundary);

    group.append("text")
      .attr("id", `${id}Text`)
      .attr("x", width + 5)
      .attr("y", 15)
      .text("+");

    group.append("rect")
      .attr("x", width)
      .attr("class", `boundary_right ${id}Button`)
      .attr("id", `${id}Button`)
      .attr("data", id)
      .style("fill", this.colorHash.hex(boundaryInfo.name))
      .append("title")
      .text("Right click to select visible member");

    group.append("foreignObject")
      .attr("id", `${id}Content`)
      .attr("width", width)
      .attr("height", height)
      .style("border", "solid 1px")
      .style("border-color", this.colorHash.hex(boundaryInfo.name))
      .style("font-size", "13px")
      .style("background", "none")
      .style("pointer-events", "none")
      .append("xhtml:div")
      .attr("class", "boundary_content")
      .html(`
          <div class="boundary_header" style="pointer-events: all">
            <p id="${id}Header" class="header_name header_boundary" style="width: 100%;
             height: ${BOUNDARY_ATTR_SIZE.HEADER_HEIGHT}px;
             background-color: ${this.colorHash.hex(boundaryInfo.name)}" 
             title="${boundaryInfo.description}">${boundaryInfo.name}</p>
          </div>
      `);

    if (!isImport)
      setMinBoundaryGraph(this.dataContainer);
  }

  dragBoundaryStart(self) {
    return function (d) {
      if (COMMON_DATA.isUpdateEdge)
        cancleSelectedPath();
      if (!d.parent)
        self.mainMgmt.reSizeBoundaryAsObjectDragged(d);
    }
  }

  dragBoundary(self) {
    return function (d) {
      autoScrollOnMousedrag(d);
      updateGraphBoundary(d);

      // Prevent drag object outside the window
      d.x = d3.event.x < DEFAULT_CONFIG_GRAPH.MIN_OFFSET_X ? DEFAULT_CONFIG_GRAPH.MIN_OFFSET_X : d3.event.x;
      d.y = d3.event.y < DEFAULT_CONFIG_GRAPH.MIN_OFFSET_Y ? DEFAULT_CONFIG_GRAPH.MIN_OFFSET_Y : d3.event.y;
      // Transform group
      // d3.select(this).attr("transform", (d, i) => {
      //   return "translate(" + [d.x, d.y] + ")"
      // });

      // Update position of child element
      // if (d.member.length > 0)
      //   self.reorderPositionMember(d.id, {x: d.x, y: d.y});

      let {width, height} = self.objectUtils.getBBoxObject(d.id);
      let data = {x: d.x, y: d.y, width, height, type: "B"};
      self.mainMgmt.updateAttrBBoxGroup(data);
    }
  }

  dragBoundaryEnd(self) {
    return function (d) {
      d.x = d3.event.x < DEFAULT_CONFIG_GRAPH.MIN_OFFSET_X ? DEFAULT_CONFIG_GRAPH.MIN_OFFSET_X : d3.event.x;
      d.y = d3.event.y < DEFAULT_CONFIG_GRAPH.MIN_OFFSET_Y ? DEFAULT_CONFIG_GRAPH.MIN_OFFSET_Y : d3.event.y;
      // Transform group
      d3.select(this).attr("transform", (d, i) => {
        return "translate(" + [d.x, d.y] + ")"
      });
      // Update position of child element
      // Check drag outside window
      if (d.member.length > 0)
        self.reorderPositionMember(d.id, {x: d.x, y: d.y});

      self.mainMgmt.hiddenBBoxGroup();

      if (d.parent) {
        //If object not out boundary parent , object change postion in boundary parent, so change index object
        if (self.mainMgmt.checkDragObjectOutsideBoundary(d) == false) {
          self.mainMgmt.changeIndexInBoundaryForObject(d, "B");
        }
      } else {
        self.mainMgmt.checkDragObjectInsideBoundary(d, "B");
      }
      self.mainMgmt.resetSizeBoundary();
      setMinBoundaryGraph(self.dataContainer);
    }
  }

  /**
   * Remove boundary element by id
   * @param boundaryId
   */
  removeBoundary(boundaryId) {
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);

    //set visible all child
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId);
    member.forEach(mem => {
      this.selectMemberVisible(boundaryId, mem, true);
    });

    //this.selectMemberVisible(boundaryId, child, false);
    if (boundaryInfo.parent)
      this.removeMemberFromBoundary(boundaryInfo.parent, boundaryId);
    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();

    // Reset child parent
    this.resetParentForChildBoundary(boundaryId);

    // Remove from data container
    let data = _.remove(this.dataContainer.boundary, (e) => {
      return e.id === boundaryId;
    });
    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Delete boundary and all elements of it
   * Above vertex or boundary (Event child of boundary)
   * @param boundaryId
   */
  deleteAllBoundary(boundaryId) {
    let {parent} = this.objectUtils.getBoundaryInfoById(boundaryId);

    // Case that delete child boundary nested in boundary
    if (!d3.select(`#${parent}`).empty())
      this.removeMemberFromBoundary(parent, boundaryId);

    // Remove from DOM
    d3.select(`#${boundaryId}`).remove();
    // Remove child of boundary
    this.removeChildElementsBoundary(boundaryId);
    // Remove from data container
    let data = _.remove(this.dataContainer.boundary, (e) => {
      return e.id === boundaryId;
    });
    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Copy boundary and all elements of it
   * Above vertex of boundary (Event child of boundary)
   * @param boundaryId
   */
  async copyAllBoundary(boundaryId) {
    let cBoundaryId = generateObjectId("B");
    let cBoundary = this.objectUtils.cloneBoundaryInfo(boundaryId);
    let cMembers = cBoundary.member.slice();
    cBoundary.member = [];
    cBoundary.id = cBoundaryId;
    cBoundary.x = cBoundary.x + 5;
    cBoundary.y = cBoundary.y + 5;
    cBoundary.parent = null;
    await this.createBoundary(cBoundary);
    this.cloneChildElementsBoundary(cBoundaryId, cMembers);
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
    let marginTop = 5;

    // Get child of boundary
    const {x, y, member} = this.objectUtils.getBoundaryInfoById(boundaryId)
    if (!pos) {
      pos = {x: x, y: y};
    }
    let boundaryMembers = member;

    boundaryMembers.forEach(member => {
      if (member.show) {
        let objectId = member.id;
        const {width, height} = this.objectUtils.getBBoxObject(objectId);
        // Vertex position center of boundary
        let position = {x: pos.x + 5, y: pos.y + hBeforeElements + marginTop * orderObject};
        if (member.type === "V") {
          this.mainMgmt.setVertexPosition(objectId, position);
        } else {
          this.setBoundaryPosition(objectId, position);
        }

        orderObject++;
        hBeforeElements += height;
        if (width > wBoundary)
          wBoundary = width + (member.type === "B" ? 10 : 0);
      }
    });

    let hBoundary = hBeforeElements + marginTop * orderObject;
    this.setHeightBoundary(boundaryId, hBoundary);
    this.setWidthBoundary(boundaryId, wBoundary);
  }

  /**
   * Selecte member show or hidden
   * @param child
   */
  selectMemberVisible(boundaryId, child, status) {
    d3.select(`#${child.id}`).classed('hidden-object', !status);
    // Update status member boundary
    let boundaryObj = this.objectUtils.getBoundaryInfoById(boundaryId);
    this.objectUtils.setBoundaryMemberStatus(boundaryId, child.id, status);
    let edge = this.dataContainer.edge;
    if (child.type === "V") {
      // set Show|hide for edge
      edge.forEach((edgeItem) => {
        if (edgeItem.target.vertexId === child.id || edgeItem.source.vertexId === child.id) {
          // d3.select(`#${edgeItem.id}`).classed("hide", !status);
          let parentNode = d3.select(`#${edgeItem.id}`).node().parentNode;
          d3.select(parentNode).classed("hide", !status); // Set class for parent container edge
        }
      });
    }

    if (child.type === "B") {
      // TO-DO: Need improve this code
      this.setObjectShowHide(child.id, status);
      // set Show|hide for edge
      let arrVertex = [];
      let lstVertexAll = this.dataContainer.vertex;
      lstVertexAll.forEach((vertexItem) => {
        if (vertexItem.parent && vertexItem.parent === child.id) {
          arrVertex.push(vertexItem.id);
        }
      });
      edge.forEach((edgeItem) => {
        if (arrVertex.indexOf(edgeItem.target.vertexId) !== -1 || arrVertex.indexOf(edgeItem.source.vertexId) !== -1) {
          // d3.select(`#${edgeItem.id}`).classed("hide", !status);
          let parentNode = d3.select(`#${edgeItem.id}`).node().parentNode;
          d3.select(parentNode).classed("hide", !status); // Set class for parent container edge
        }
      });
    }

    this.reorderPositionMember(boundaryId);
    if (boundaryObj.parent) {
      this.resizeParentBoundary(boundaryObj.parent);
      this.reorderPositionMember(boundaryObj.parent);
    }
    setMinBoundaryGraph(this.dataContainer);
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
      if (member.type === "B")
        this.setObjectShowHide(member.id, status);
    });
    // this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
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
    let marginTop = 5;
    let {parent, member} = this.objectUtils.getBoundaryInfoById(boundaryId);
    let boundaryMembers = member;

    boundaryMembers.forEach(member => {
      if (member.show) {
        let objectId = member.id;
        const {width, height} = this.objectUtils.getBBoxObject(objectId);
        orderObject++;
        hBeforeElements += height;
        if (width > wBoundary)
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
    if (width < BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
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
  addMemberToBoundary(boundaryId, child) {
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId);
    member.push(child);
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Add memebr to boundary
   * @param boundaryId
   * @param child
   * Member format
   * {id: '', type: [V, B], show: true}
   */
  changeIndexMemberToBoundary(boundaryId, indexOld, indexNew) {
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId);
    arrayMove(member, indexOld, indexNew);
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Add member to boundary To index
   * @param boundaryId
   * @param child
   * @param index
   */
  addMemberToBoundaryWithIndex(boundaryId, child, index) {
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId);
    member.splice(index, 0, child);
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    setMinBoundaryGraph(this.dataContainer);
  }

  /**
   * Remove member from boundary
   * @param boundaryId
   * @param objectId
   */
  removeMemberFromBoundary(boundaryId, objectId) {
    const {member, parent} = this.objectUtils.getBoundaryInfoById(boundaryId);
    let data = _.remove(member, (e) => {
      return e.id === objectId;
    });
    // Resize parent and childs of parent
    this.reorderPositionMember(boundaryId);
    this.resizeParentBoundary(boundaryId);
    if (parent)
      this.removeMemberFromBoundary(parent);
    setMinBoundaryGraph(this.dataContainer);
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

    d3.select(`#${boundaryId}`).attr("transform", (d, i) => {
      return "translate(" + [position.x, position.y] + ")"
    });

    this.reorderPositionMember(boundaryId, position);
  }

  /**
   * Reset parent for child boundary when it deleted
   * @param boundaryId
   */
  resetParentForChildBoundary(boundaryId) {
    // Get child of boundary
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId)
    member.forEach(mem => {
      let objectId = mem.id;
      if (mem.type === "V") {
        let info = this.objectUtils.getVertexInfoById(objectId);
        info.parent = null;
      } else {
        let info = this.objectUtils.getBoundaryInfoById(objectId)
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
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId)

    member.forEach(mem => {
      let objectId = mem.id;
      if (mem.type === "V") {
        this.mainMgmt.deleteVertex(objectId);
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
        let cVertex = this.objectUtils.cloneVertexInfo(objectId);
        let cVertexId = generateObjectId("V");
        cVertex.id = cVertexId;
        cVertex.parent = cloneId;
        let child = {id: cVertexId, type: "V", show: true};
        this.mainMgmt.createVertex(cVertex);
        this.addMemberToBoundary(cloneId, child);
      } else {
        let cBoundary = this.objectUtils.cloneBoundaryInfo(objectId);
        let members = cBoundary.member.slice();
        let cBoundaryId = generateObjectId("B");
        cBoundary.id = cBoundaryId;
        cBoundary.parent = cloneId;
        cBoundary.member = [];
        let child = {id: cBoundaryId, type: "B", show: true};
        this.createBoundary(cBoundary);
        this.addMemberToBoundary(cloneId, child);
        if (members.length > 0)
          this.cloneChildElementsBoundary(cBoundaryId, members);
      }
    }
  }

  /**
   * Move boundary to front
   * @param selectorBoundaryGroup
   * @param boundaryId
   * @param dataContainerBoundary
   * @param dataContainerVertex
   */
  moveToFrontBoundary(selectorBoundaryGroup, boundaryId, dataContainerBoundary, dataContainerVertex) {
    d3.select(selectorBoundaryGroup).moveToFront(boundaryId, dataContainerBoundary);

    if (this.checkHasMember(dataContainerBoundary, boundaryId)) {
      this.moveMemberToFront(selectorBoundaryGroup, dataContainerVertex, dataContainerBoundary, boundaryId);
    }
  }

  /**
   * Move boundary to back
   * @param selectorBoundaryGroup
   * @param boundaryId
   * @param dataContainerBoundary
   * @param dataContainerVertex
   */
  moveToBackBoundary(selectorBoundaryGroup, boundaryId, dataContainerBoundary, dataContainerVertex) {
    if (this.checkHasMember(dataContainerBoundary, boundaryId)) {
      this.moveMemberToBack(selectorBoundaryGroup, dataContainerVertex, dataContainerBoundary, boundaryId);
    }
    d3.select(selectorBoundaryGroup).moveToBack(boundaryId, dataContainerBoundary);
  }

  /**
   * Check boundary has member or not
   * Type must be boundary
   * @param dataContainer
   * @param boundaryId
   * @returns {boolean}
   */
  checkHasMember(dataContainer, boundaryId) {
    let selectedData = dataContainer.find(element => element.id === boundaryId);
    if (typeof selectedData != "undefined" && selectedData.member.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get list of boundary element
   * @param parentSelector
   * @returns {Array}
   */
  getChildNodes(parentSelector) {
    let childElements = [];
    d3.select(parentSelector).each(function () {
      for (let i = 0; i < this.parentNode.childNodes.length; i++) {
        if (this.parentNode.childNodes[i].nodeType === 1 && this.parentNode.childNodes[i].nodeName === 'g')
          childElements.push(this.parentNode.childNodes[i]);
      }
    })
    return childElements;
  }

  /**
   * Process move to front if boundary has member
   * @param selectorBoundaryGroup
   * @param dataContainerVertex
   * @param boundaryDataContainer
   * @param parentId
   */
  moveMemberToFront(selectorBoundaryGroup, dataContainerVertex, boundaryDataContainer, parentId) {
    // process when it has member
    let listBoundaryElement = this.getChildNodes(selectorBoundaryGroup);
    let parentDataContain = boundaryDataContainer.find(item => item.id === parentId);
    let members = parentDataContain.member;
    let selectorVertexGroup = `.${HTML_VERTEX_CONTAINER_CLASS}`;

    //check child boundary has member?
    for (let i = 0; i < members.length; i++) {
      //if child boundary has member is vertex, move to front all of them firstly
      //vertex always in front of boundary
      let childElement = listBoundaryElement.find(child => child.id === members[i].id);
      let childDataContainer = boundaryDataContainer.find(element => element.id === members[i].id);
      let childBoundary = [];
      if (this.checkHasMember(boundaryDataContainer, members[i].id)) {
        let childVertexList = childDataContainer.member.filter(vertex => vertex.type === "V");
        childBoundary = childDataContainer.member.find(item => item.type === "B");
        this.moveChildVertexToFront(selectorVertexGroup, dataContainerVertex, childVertexList);

        if (typeof childBoundary != "undefined") {
          this.moveMemberToFront(selectorBoundaryGroup, dataContainerVertex, boundaryDataContainer, members[i].id);
        } else {
          d3.select(selectorBoundaryGroup).moveToFront(childElement.id, boundaryDataContainer);
        }
      } else {
        if (members[i].type === "V") {
          d3.select(selectorVertexGroup).moveToFront(members[i].id, dataContainerVertex);
        } else {
          d3.select(selectorBoundaryGroup).moveToFront(childElement.id, boundaryDataContainer);
        }

      }
    }
  }

  /**
   * Process move to back if boundary has member
   * @param selectorBoundaryGroup
   * @param dataContainerVertex
   * @param boundaryDataContainer
   * @param parentId
   */
  moveMemberToBack(selectorBoundaryGroup, dataContainerVertex, boundaryDataContainer, parentId) {
    // process when it has member
    let listBoundaryElement = this.getChildNodes(selectorBoundaryGroup);
    let parentDataContain = boundaryDataContainer.find(item => item.id === parentId);
    let members = parentDataContain.member;
    let selectorVertexGroup = `.${HTML_VERTEX_CONTAINER_CLASS}`;

    for (let i = 0; i < members.length; i++) {
      let childElement = listBoundaryElement.find(child => child.id === members[i].id);
      let childDataContainer = boundaryDataContainer.find(element => element.id === members[i].id);
      let childBoundary = [];

      //check child boundary has member?
      if (this.checkHasMember(boundaryDataContainer, members[i].id)) {
        //if child boundary has member is vertex, move to back all of them firstly
        //vertex always in front of boundary
        let childVertexList = childDataContainer.member.filter(vertex => vertex.type === "V");
        childBoundary = childDataContainer.member.find(item => item.type === "B");
        this.moveChildVertexToBack(selectorVertexGroup, dataContainerVertex, childVertexList);

        if (typeof childBoundary != "undefined") {
          this.moveMemberToBack(selectorBoundaryGroup, dataContainerVertex, boundaryDataContainer, members[i].id);
        } else {
          d3.select(selectorBoundaryGroup).moveToBack(childElement.id, boundaryDataContainer);
        }
      } else {
        if (members[i].type === "V") {
          d3.select(selectorVertexGroup).moveToBack(members[i].id, dataContainerVertex);
        } else {
          d3.select(selectorBoundaryGroup).moveToBack(childElement.id, boundaryDataContainer);
        }
      }
    }
  }

  /**
   * move list of child vertex to front
   * @param selectorVertexGroup
   * @param dataContainerVertex
   * @param vertexList
   */
  moveChildVertexToFront(selectorVertexGroup, dataContainerVertex, vertexList) {
    for (let i = 0; i < vertexList.length; i++) {
      d3.select(selectorVertexGroup).moveToFront(vertexList[i].id, dataContainerVertex)
    }
  }

  /**
   * Move list of child vertex to back
   * @param selectorVertexGroup
   * @param dataContainerVertex
   * @param vertexList
   */
  moveChildVertexToBack(selectorVertexGroup, dataContainerVertex, vertexList) {
    for (let i = 0; i < vertexList.length; i++) {
      d3.select(selectorVertexGroup).moveToBack(vertexList[i].id, dataContainerVertex)
    }
  }

  /**
   * Make controls to edit boundary info
   * @param boundaryId
   */
  makeEditBoundaryInfo(boundaryId) {
    const boundaryInfo = this.objectUtils.getBoundaryInfoById(boundaryId);
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

  /**
   * Update data boundary change
   */
  confirmEditBoundaryInfo() {
    const id = this.originBoundary.id;
    let boundaryInfo = this.objectUtils.getBoundaryInfoById(id);
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
};

export default Boundary;
