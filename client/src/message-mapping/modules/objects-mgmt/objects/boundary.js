import * as d3 from 'd3';
import ColorHash from 'color-hash';
import _ from "lodash";
import ObjectUtils from '../../../common/utilities/object.ult';

import {
  BOUNDARY_ATTR_SIZE,
  BOUNDARY_ATTR_SIZE,
} from '../../../const/index';

import {
  generateObjectId,
  setMinBoundaryGraph,
  arrayMove,
} from '../../../common/utilities/common.ult';

class Boundary {
  constructor(props) {
    this.dataContainer              = props.boundaryMgmt.dataContainer;
    this.containerId                = props.boundaryMgmt.containerId;
    this.svgId                      = props.boundaryMgmt.svgId;
    this.selectorClass              = props.boundaryMgmt.selectorClass || "defaul_boundary_class";
    this.visibleItemSelectorClass   = props.boundaryMgmt.visibleItemSelectorClass || "default_visible_item_menu_class";
    this.boundaryMgmt               = props.boundaryMgmt;

    this.id;
    this.x;
    this.y;
    this.name;
    this.description;
    this.member;
    this.width;
    this.height;
    this.parent;
    this.mandatory;
    this.repeat;
    this.type;
    this.show;
    this.isShowReduced = false;

    this.ctrlSrcX = -1;
    this.ctrlSrcY = -1;
    this.ctrlSrcWidth = -1;
    this.ctrlSrcHeight = -1;

    this.objectUtils = new ObjectUtils();
    this.initialize();
  }

  initialize() {
    this.colorHash = new ColorHash({ lightness: 0.2 });
    this.configsDefault = {
      width: BOUNDARY_ATTR_SIZE.BOUND_WIDTH,
      height: BOUNDARY_ATTR_SIZE.BOUND_HEIGHT
    };
  }

  /**
   * Create boundary with options
   * @param id => type: string, require: true, purpose: identify for boundary
   * @param x => type: number, require: true, purpose: coordinate x
   * @param y => type: number, require: true, purpose: coordinate y
   * @param name => type: string, require: false, purpose: vertex name
   * @param description => type: string, require: false, purpose: content title when hover to boundary
   * @param member => type: array, require: false, purpose: content members of this boundary
   
   * @param width => type: number, require: true, purpose: width boundary
   * @param height => type: number, require: true, purpose: height boundary
   * @param parent => type: object, require: false, purpose: link to parent boundary that contain this boundary
   * @param mandatory => type: bool, require: false
   * @param repeat => type: number, require: false,
   * @param isEnableItemVisibleMenu => type: bool, require: false, purpose: show or hide button that use to decide a member will visible or not
   */
  create(options = {}, callbackDragBoundary = () => { }) {
    let { id, x, y, name, description, member, width, height, parent, mandatory, repeat, show, isImport, isEnableItemVisibleMenu, isEnableDrag} = options;
    this.id             = id || generateObjectId('B');
    this.x              = x || 0;
    this.y              = y || 0;
    this.name           = name || "Boundary";
    this.description    = description || "Boundary Description";
    this.member         = member || [];
    this.width          = width || BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    this.height         = height || BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;
    this.parent         = parent || null;
    this.mandatory      = mandatory || false;
    this.repeat         = repeat || 1;
    this.type           = "B";
    this.show           = true;

    if(isEnableItemVisibleMenu == undefined) isEnableItemVisibleMenu = true;
    if(isEnableDrag == undefined) isEnableDrag = true;

    if (!this.dataContainer.boundary) this.dataContainer.boundary = [];
    this.dataContainer.boundary.push(this);

    let group = d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`)
      .data(this.dataContainer.boundary)
      .enter()
      .append("g")
      .attr("transform", `translate(${this.x}, ${this.y})`)
      .attr("id", this.id)
      .attr("class", `${this.selectorClass}`)
      .style("cursor", "move");
    
    if (isEnableDrag) {
      group.call(callbackDragBoundary);
    }

    group.append("foreignObject")
      .attr("id", `${this.id}Content`)
      .attr("width", this.width)
      .attr("height", this.height)
      .style("border", "solid 1px")
      .style("border-color", this.colorHash.hex(this.name))
      .style("font-size", "13px")
      .style("background", "none")
      .style("pointer-events", "none")
      .append("xhtml:div")
      .attr("class", "boundary_content")
      .html(`
          <div class="boundary_header" style="pointer-events: all">
            <p id="${this.id}Header" class="header_name header_boundary" style="width: 100%;
             height: ${BOUNDARY_ATTR_SIZE.HEADER_HEIGHT}px;
             background-color: ${this.colorHash.hex(this.name)}" 
             title="${this.description}">${this.name}</p>
          </div>
    `);


    if (isEnableItemVisibleMenu) {
      group.append("text")
        .attr("id", `${this.id}Text`)
        .attr("x", this.width - 20)
        .attr("y", BOUNDARY_ATTR_SIZE.HEADER_HEIGHT - 14)
        .style("fill", "#ffffff")
        .style("stroke", "#ffffff")
        .style("pointer-events", "all")
        .text("+");

      group.append("rect")
        .attr("x", this.width - 25)
        .attr("y", 9)
        .attr("class", `boundary_right ${this.visibleItemSelectorClass}`)
        .attr("id", `${this.id}Button`)
        .attr("data", this.id)
        .style("pointer-events", "all")
        .style("fill", "none")
        .append("title")
        .text("Right click to select visible member");
    }

    if(!isImport)
      setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  async updateHeightBoundary() {
    // Get all boundary that without parent but have child
    let boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent != null;
    });

    boundaries.forEach(boundary => {
      boundary.updateSize();
    });

    boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent == null && g.member.length > 0;
    });

    boundaries.forEach(boundary => {
      boundary.reorderPositionMember();
    });
  }

  /**
   * Resize (height, width) of parent boundary
   * When add or remove elements
   */
  updateSize() {
    let orderObject = 0;
    let hBeforeElements = 42;
    let wBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    let marginTop = 3;

    this.member.forEach(mem => {
      if (mem.show) {
        const { width, height } = this.objectUtils.getBBoxObject(`#${mem.id}`);
        orderObject++;
        hBeforeElements += height;
        if (width >= wBoundary)
          wBoundary = width + (mem.type === "B" ? 10 : 0);
      }
    });

    let hBoundary = hBeforeElements + marginTop * orderObject;

    this.setHeight(hBoundary);
    this.setWidth(wBoundary);

    if (this.parent) {
      let parentObj = _.find(this.dataContainer.boundary, {"id": this.parent})
      parentObj.updateSize();
    }
  }

  /**
   * Set height boundary
   * @param height
   */
  setHeight(height) {
    // Set height for boundary
    if (height < BOUNDARY_ATTR_SIZE.BOUND_HEIGHT)
      height = BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;

    $(`#${this.id}Content`).attr('height', height);

    // Update data    
    this.height = height;
  }

  /**
   * Set height boundary
   * @param width
   */
  setWidth(width) {
    // Set width for boundary
    if (width < BOUNDARY_ATTR_SIZE.BOUND_WIDTH)
      width = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;

    $(`#${this.id}Content`).attr('width', width);
    $(`#${this.id}Button`).attr('x', width - 25);
    $(`#${this.id}Text`).attr('x', width - 20);

    // Update data
    this.width = width;
  }

  /**
   * Reorder and Calculator position for child element
   * @param boudaryId
   * @param position
   */
  reorderPositionMember(pos) {
    let orderObject = 0;
    let hBeforeElements = 42;
    let wBoundary = BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    let marginTop = 3;

    // Get child of boundary
    if (!pos) {
      pos = { x: this.x, y: this.y };
    }
    this.member.forEach(mem => {
      if (mem.show) {

        const { width, height } = this.objectUtils.getBBoxObject(`#${mem.id}`);

        // Vertex position center of boundary
        let position = { x: pos.x + 5, y: pos.y + hBeforeElements + marginTop * orderObject };
        let memObj = {};
        if (mem.type === "V") {
          memObj = _.find(this.dataContainer.vertex, { "id": mem.id });
        } else {
          memObj = _.find(this.dataContainer.boundary, { "id": mem.id });
        }
        memObj.setPosition(position);

        orderObject++;
        hBeforeElements += height;
        if (width >= wBoundary)
          wBoundary = width + (mem.type === "B" ? 10 : 0);
      }
    });

    let hBoundary = hBeforeElements + marginTop * orderObject;
    this.setHeight(hBoundary);
    this.setWidth(wBoundary);
  }

  /**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param vertexId
   * @param position
   */
  setPosition(position) {
    this.x = position.x;
    this.y = position.y;

    d3.select(`#${this.id}`).attr("transform", "translate(" + [this.x, this.y] + ")");

    this.reorderPositionMember(position);
  }

  async findAncestorOfMemberInNestedBoundary() { 
    if (!this.parent) 
      return Promise.resolve(this); 
 
    let parentObj = _.find(this.dataContainer.boundary, {"id": this.parent}); 
 
    return parentObj.findAncestorOfMemberInNestedBoundary(); 
  } 

  /**
 * Add memebr to boundary
 * @param member
 * @param memberObj
 * Member format
 * {id: '', type: [V, B], show: true}
 */
  async addMemberToBoundary(member) {
    this.member.push(member);

    this.updateSize();
    this.reorderPositionMember();

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  /**
   * Clone all child boundary, above child of child boundary
   * boundaryCloneId, cloneMembers
   */
  async cloneChildElements(cMembers = []) {
    for (let i = 0; i < cMembers.length; i++) {
      const member = cMembers[i];
      let objectId = member.id;
      if (member.type === "V") {
        let cVertex = _.cloneDeep(_.find(this.dataContainer.vertex, {"id": objectId}));
        let cVertexId = generateObjectId("V");
        cVertex.id = cVertexId;
        cVertex.parent = this.id;
        let child = {id: cVertexId, type: "V", show: true};
        this.boundaryMgmt.vertexMgmt.create(cVertex);
        this.addMemberToBoundary(child);
      } else {
        let cBoundary = _.cloneDeep(_.find(this.dataContainer.boundary, {"id": objectId}));
        let members = cBoundary.member.slice();
        let cBoundaryId = generateObjectId("B");
        cBoundary.id = cBoundaryId;
        cBoundary.parent = this.id;
        cBoundary.member = [];
        let child = {id: cBoundaryId, type: "B", show: true};
        this.boundaryMgmt.create(cBoundary);
        this.addMemberToBoundary(child);

        let boundaryObj = _.find(this.dataContainer.boundary, { "id": cBoundaryId });
        if (members.length > 0)
          boundaryObj.cloneChildElements(members);
      }
    }
  }

  /**
   * Copy boundary and all elements of it
   * Above vertex of boundary (Event child of boundary)
   */
  async copyAll() {
    let cBoundaryId = generateObjectId("B");
    let cBoundary = _.clone(this);
    let cMembers = cBoundary.member.slice();

    cBoundary.member = [];
    cBoundary.id = cBoundaryId;
    cBoundary.x = cBoundary.x + 5;
    cBoundary.y = cBoundary.y + 5;
    cBoundary.parent = null;
    this.boundaryMgmt.create(cBoundary);

    let boudaryObj = _.find(this.dataContainer.boundary, {"id": cBoundaryId});
    boudaryObj.cloneChildElements(cMembers);
  }

  /**
   * Delete boundary and all elements of it
   * Above vertex or boundary (Event child of boundary)
   */
  async deleteAll() {
    // Case that delete child boundary nested in boundary
    if(!d3.select(`#${this.parent}`).empty()){
      let parentObj = _.find(this.dataContainer.boundary, {"id": this.parent});
      parentObj.removeMemberFromBoundary(this);
    }

    // Remove child of boundary
    await this.removeChildElementsBoundary();

    // Remove from DOM
    d3.select(`#${this.id}`).remove();

    // Remove from data container
    _.remove(this.dataContainer.boundary, (e) => {
      return e.id === this.id;
    });

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  /**
   * Remove boundary element by id
   */
  remove() {
    // Set visible all child
    this.member.forEach(mem => {
      this.selectMemberVisible(mem, true);
    });

    if (this.parent){
      let parentObj = _.find(this.dataContainer.boundary,{"id": this.parent});
      parentObj.removeMemberFromBoundary(this);
    }
      

    // Remove from DOM
    d3.select(`#${this.id}`).remove();

    // Remove from data container
    _.remove(this.dataContainer.boundary, (e) => {
      return e.id === this.id;
    });

    // Reset child parent
    this.resetParentForChildBoundary();

    // Remove from data container
    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }


  /**
 * Remove child boundary
 */
  removeChildElementsBoundary() {
    // Get child of boundary
    const  member  = _.cloneDeep(this.member);
    member.forEach(mem => {
      if (mem.type=="V") {
        //need to put deleteVertex function
        let memObj = _.find(this.dataContainer.vertex, {"id": mem.id})
        this.removeMemberFromBoundary(memObj);
        memObj.delete();
      } else {
        // Remove all child boundary
        let memObj = _.find(this.dataContainer.boundary, {"id": mem.id})
        memObj.deleteAll();
      }
    });
  }

  /**
 * Selecte member show or hidden
 * @param child
 * @param status
 */
  async selectMemberVisible(child, status) {
    const { id: idChild, type } = child;

    d3.select(`#${idChild}`).classed('hidden-object', !status);
    // Update status member boundary

    this.setBoundaryMemberStatus(idChild, status);

    if (type === "V"){
      // Set show|hide for edge related
      // Need to work on edge
      this.boundaryMgmt.vertexMgmt.hideAllEdgeRelatedToVertex(idChild, status);
      
      let vertexObj = _.find(this.dataContainer.vertex, {"id": idChild});
      this.boundaryMgmt.vertexMgmt.updatePathConnectForVertex(vertexObj, status);

    }else if (type === "B"){
      // TO-DO: Need improve this code
      let childObj = _.find(this.dataContainer.boundary, {"id": child.id});
      childObj.setObjectShowHide(status);
    }

    await this.updateSize();

    if (this.parent) {
      let ancestor = await this.findAncestorOfMemberInNestedBoundary();
      await ancestor.reorderPositionMember();
    }else{
      await this.reorderPositionMember();
    }

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }
  /**
 * Update status for child boundary
 * child match with childId
 * @param childId
 * @param status
 */
  setBoundaryMemberStatus(childId, status) {
    let select = _.find(this.member, (e) => {
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
 * @param status
 */
  async setObjectShowHide(status) {
    d3.select(`#${this.id}`).classed('hidden-object', !status);

    // Loop child    
    this.member.forEach(member => {
      this.setBoundaryMemberStatus(member.id, status);
      d3.select(`#${member.id}`).classed('hidden-object', !status);
      if (member.type === "B"){
        let memberObj = _.find(this.dataContainer.boundary, {"id": member.id});
        memberObj.setObjectShowHide(status);
      }
    });

    // Get vertices relative to parent boundary
    let vertices = _.filter(this.dataContainer.vertex, e => {
        return e.parent === this.id;
    });

    vertices.forEach((e) => {
      this.boundaryMgmt.vertexMgmt.hideAllEdgeRelatedToVertex(e.id, status);
    });
  }

    /**
   * Reset parent for child boundary when it deleted
   */
  resetParentForChildBoundary() {
    // Get child of boundary
    this.member.forEach(mem => {
      let id = mem.id;
      if (mem.type === "V") {
        let info = _.find(this.dataContainer.vertex, {"id": id});
        info.parent = null;
      } else {
        let info = _.find(this.dataContainer.boundary, {"id": id});
        info.parent = null;
      }
    });
  }

  moveMember(offsetX, offsetY) {

    this.member.forEach(member => {
      if (member.show) {

        let memberobj = null;
        if (member.type === "V") {
          memberobj = _.find(this.dataContainer.vertex, {"id": member.id});
        } else {
          memberobj = _.find(this.dataContainer.boundary, {"id": member.id});
        }

        memberobj.move(offsetX, offsetY);
      }
    });
  }

    /**
   * Move boundary with specified offset
   * @param {*} offsetX
   * @param {*} offsetY
   */
  move( offsetX, offsetY) {

    this.x = this.x + offsetX;
    this.y = this.y + offsetY;

    d3.select(`#${this.id}`).attr("transform", "translate(" + [this.x, this.y] + ")");

    this.moveMember(offsetX, offsetY);
  }

  changeIndexMemberToBoundary( indexOld, indexNew) {
    arrayMove(this.member, indexOld, indexNew);
    this.reorderPositionMember();    
  }

  /**
   * Add member to boundary by index
   * @param child
   * @param index
   */
  addMemberToBoundaryWithIndex( child, index) {
    this.member.splice(index, 0, {id: child.id, type: child.type, show: child.show});
    this.updateSize();
    this.reorderPositionMember();    
    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  async removeMemberFromBoundary( obj ) {
    _.remove(this.member, (e) => {
      return e.id === obj.id;
    });

    // Resize parent and child of parent
    this.updateSize();
    
    // Resize ancestor of parent
    if (this.parent) {
      let ancestor = await this.findAncestorOfMemberInNestedBoundary();
      await ancestor.reorderPositionMember();
    }else{
      await this.reorderPositionMember();
    }
  }
}

export default Boundary
