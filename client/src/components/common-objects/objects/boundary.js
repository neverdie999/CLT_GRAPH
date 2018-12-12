import * as d3 from 'd3';
import ColorHash from 'color-hash';
import _ from "lodash";
import ObjectUtils from '../../../common/utilities/object.util';

import {
  BOUNDARY_ATTR_SIZE,
  VERTEX_ATTR_SIZE,
  TYPE_CONNECT,
  CONNECT_SIDE,
} from '../../../common/const/index';

import {
  generateObjectId,
  setMinBoundaryGraph,
  arrayMove,
  checkModePermission,
	segmentName,
} from '../../../common/utilities/common.util';

const CONNECT_KEY = 'Connected';

class Boundary {
  constructor(props) {
    this.dataContainer = props.boundaryMgmt.dataContainer;
    this.containerId = props.boundaryMgmt.containerId;
    this.svgId = props.boundaryMgmt.svgId;
    this.selectorClass = props.boundaryMgmt.selectorClass || "defaul_boundary_class";
    this.visibleItemSelectorClass = props.boundaryMgmt.visibleItemSelectorClass || "default_visible_item_menu_class";
    this.viewMode = props.boundaryMgmt.viewMode;
    this.boundaryMgmt = props.boundaryMgmt;

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

    this.initialize();
  }

  initialize() {
    this.objectUtils = new ObjectUtils();
    this.colorHash = new ColorHash({ lightness: 0.2 });
    this.colorHashConnection = new ColorHash({lightness: 0.8});

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
   */
  create(options = {}, callbackDragBoundary = () => { },  callbackDragConnection = ()=>{}) {
    let { id, x, y, name, description, member, width, height, parent, mandatory, repeat, isImport} = options;
    this.id = id || generateObjectId('B');
    this.x = x || 0;
    this.y = y || 0;
    this.name = name || "Boundary";
    this.description = description || "Boundary Description";
    this.member = member || [];
    this.width = width || BOUNDARY_ATTR_SIZE.BOUND_WIDTH;
    this.height = height || BOUNDARY_ATTR_SIZE.BOUND_HEIGHT;
    this.parent = parent || null;
    this.mandatory = mandatory || false;
    this.repeat = repeat || 1;
    this.type = "B";
    this.show = true;

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
    
    if (checkModePermission(this.viewMode.value, "isEnableDragBoundary")) {
      group.call(callbackDragBoundary);
    }else{
      $(`#${this.id}`).click( () => {
        this.boundaryMgmt.edgeMgmt.emphasizePathConnectForBoundary(this);
      })
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
             title="${this.description}">${segmentName(this, this.viewMode.value)}</p>
          </div>
    `);

    if (checkModePermission(this.viewMode.value, "isEnableItemVisibleMenu")) {

      const offset = this.boundaryMgmt.vertexMgmt.connectSide == CONNECT_SIDE.LEFT ? 0 : 7;
      group.append("text")
        .attr("id", `${this.id}Text`)
        .attr("x", this.width - 20 - offset)
        .attr("y", BOUNDARY_ATTR_SIZE.HEADER_HEIGHT - 14)
        .style("stroke", "#ffffff")
        .style("pointer-events", "all")
        .text("+");

      group.append("rect")
        .attr("x", this.width - 25 - offset)
        .attr("y", 9)
        .attr("class", `boundary_right ${this.visibleItemSelectorClass}`)
        .attr("id", `${this.id}Button`)
        .attr("data", this.id)
        .style("pointer-events", "all")
        .style("fill", "none")
        .append("title")
        .text("Right click to select visible member");
    }

    // Rect connect title INPUT
    if (this.boundaryMgmt.vertexMgmt.connectSide === CONNECT_SIDE.BOTH || this.boundaryMgmt.vertexMgmt.connectSide === CONNECT_SIDE.LEFT) {
      group.append("rect")
      .attr("class", `drag_connect connect_header drag_connect_${this.svgId}`)
      .attr("type", TYPE_CONNECT.INPUT)
      .attr("prop", `${this.id}${CONNECT_KEY}boundary_title`)
      .attr("pointer-events", "all")
      .attr("width", 12)
      .attr("height", BOUNDARY_ATTR_SIZE.HEADER_HEIGHT - 1)
      .attr("x", 1)
      .attr("y", 1)
      .style("fill", this.colorHash.hex(this.name))
      .style("cursor", "default")
      .call(callbackDragConnection);
    }

    // Rect connect title OUTPUT
    if (this.boundaryMgmt.vertexMgmt.connectSide === CONNECT_SIDE.BOTH || this.boundaryMgmt.vertexMgmt.connectSide === CONNECT_SIDE.RIGHT) {
      group.append("rect")
        .attr("class", `drag_connect connect_header drag_connect_${this.svgId}`)
        .attr("prop", `${this.id}${CONNECT_KEY}boundary_title`)
        .attr("pointer-events", "all")
        .attr("type", TYPE_CONNECT.OUTPUT)
        .attr("width", 12)
        .attr("height", BOUNDARY_ATTR_SIZE.HEADER_HEIGHT - 1)
        .attr("x", this.width - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2))
        .attr("y", 1)
        .style("fill", this.colorHash.hex(this.name))
        .style("cursor", "default")
        .call(callbackDragConnection);
   }

    if(!isImport)
      setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
  }

  updateHeightBoundary() {

    let boundaries = _.filter(this.dataContainer.boundary, (g) => {
      return g.parent == null && g.member.length > 0;
    });

    boundaries.forEach(boundary => {
      boundary.updateSize();
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

        if (mem.type == "B") {
          let boundaryObj = _.find(this.dataContainer.boundary, {"id": mem.id});
          boundaryObj.updateSize();
        }

        const { width, height } = this.objectUtils.getBBoxObject(`#${mem.id}`);
        orderObject++;
        hBeforeElements += height;
        if (width >= wBoundary)
          wBoundary = width + 10;
      }
    });

    let hBoundary = hBeforeElements + marginTop * orderObject + 2;

    this.setHeight(hBoundary);
    this.setWidth(wBoundary);
  }

  /**
   * Set height boundary
   * @param height
   */
  setHeight(height) {

    let hasShowedMember = _.find(this.member, {"show": true});
    // Set height for boundary
    if (height < BOUNDARY_ATTR_SIZE.BOUND_HEIGHT && (this.member.length == 0 || !hasShowedMember))
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

    const offset = this.boundaryMgmt.vertexMgmt.connectSide == CONNECT_SIDE.LEFT ? 0 : 7;

    $(`#${this.id}Content`).attr('width', width);
    $(`#${this.id}Button`).attr('x', width - 25 - offset);
    $(`#${this.id}Text`).attr('x', width - 20 - offset);
    $(`[prop='${this.id}${CONNECT_KEY}boundary_title'][type='O']`).attr('x', width - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2));

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
      }
    });
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
    this.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(this);

    this.reorderPositionMember(position);
  }

  findAncestorOfMemberInNestedBoundary() { 
    if (!this.parent) 
      return this; 
 
    let parentObj = _.find(this.dataContainer.boundary, {"id": this.parent}); 
 
    return parentObj.findAncestorOfMemberInNestedBoundary(); 
  } 

  /**
 * Add memebr to boundary
 * @param member
 * @param isEffectToParent if Copy All, just clone from the origin Boundary, no need to calculate the position of parent
 * Member format
 * {id: '', type: [V, B], show: true}
 */
  async addMemberToBoundary(member, isEffectToParent = true) {
    this.member.push(member);

    if (isEffectToParent) {
      this.updateSize();
      this.reorderPositionMember();
      setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
    }
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
        cVertex.x = cVertex.x + 5;
        cVertex.y = cVertex.y + 5;
        let child = {id: cVertexId, type: "V", show: true};
        this.boundaryMgmt.vertexMgmt.create(cVertex);
        this.addMemberToBoundary(child, false);
      } else {
        let cBoundary = _.cloneDeep(_.find(this.dataContainer.boundary, {"id": objectId}));
        let members = cBoundary.member.slice();
        let cBoundaryId = generateObjectId("B");
        cBoundary.id = cBoundaryId;
        cBoundary.parent = this.id;
        cBoundary.member = [];
        cBoundary.x = cBoundary.x + 5;
        cBoundary.y = cBoundary.y + 5;
        let child = {id: cBoundaryId, type: "B", show: true};
        this.boundaryMgmt.create(cBoundary);
        this.addMemberToBoundary(child, false);

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
    let cBoundary = _.cloneDeep(this);
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
  deleteAll() {

    this.doDeleteAll();

    let ancestor = this.findAncestorOfMemberInNestedBoundary();
    ancestor.updateSize();
    ancestor.reorderPositionMember();
    ancestor.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(ancestor);

    setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
  }

  doDeleteAll() {
    // Remove child of boundary
    this.removeChildElementsBoundary();

     // Case that delete child boundary nested in boundary
     if(this.parent) {
      let parentObj = _.find(this.dataContainer.boundary, {"id": this.parent});
      parentObj.removeMemberFromBoundary(this, false);
    }

    //remove all edge connect to this boundary
    this.boundaryMgmt.edgeMgmt.removeAllEdgeConnectToVertex(this);

    // Remove from DOM
    d3.select(`#${this.id}`).remove();

    // Remove from data container
    _.remove(this.dataContainer.boundary, (e) => {
      return e.id === this.id;
    });
  }

  /**
   * Remove boundary element by id
   */
  remove() {

    this.selectAllMemberVisible(true, false);

    if (this.parent) {
      let parentObj = _.find(this.dataContainer.boundary,{"id": this.parent});
      parentObj.removeMemberFromBoundary(this, false);
    }

    //remove all edge connect to this boundary
    this.boundaryMgmt.edgeMgmt.removeAllEdgeConnectToVertex(this);

    // Remove from DOM
    d3.select(`#${this.id}`).remove();

    // Remove from data container
    _.remove(this.dataContainer.boundary, (e) => {
      return e.id === this.id;
    });

    // Reset child parent
    this.resetParentForChildBoundary();

    let ancestor = this.findAncestorOfMemberInNestedBoundary();
    ancestor.updateSize();
    ancestor.reorderPositionMember();
    ancestor.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(ancestor);
    setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
  }

  /**
   * Remove child boundary
   */
  removeChildElementsBoundary() {
    // Get child of boundary
    const  member = _.cloneDeep(this.member);
    member.forEach(mem => {
      if (mem.type=="V") {
        //need to put deleteVertex function
        let memObj = _.find(this.dataContainer.vertex, {"id": mem.id})
        this.removeMemberFromBoundary(memObj, false);
        memObj.delete();
      } else {
        // Remove all child boundary
        let memObj = _.find(this.dataContainer.boundary, {"id": mem.id})
        memObj.doDeleteAll();
      }
    });
  }

  /**
   * Selecte member show or hidden
   * @param child
   * @param status
   * @param isEffectToParent
   */
  async selectMemberVisible(child, status, isEffectToParent = true) {
    const { id: idChild, type } = child;

    d3.select(`#${idChild}`).classed('hidden-object', !status);
    // Update status member boundary

    this.setBoundaryMemberStatus(idChild, status);

    if (type === "V") {
      // Set show|hide for edge related
      // Need to work on edge
      this.boundaryMgmt.vertexMgmt.hideAllEdgeRelatedToVertex(idChild, status);

    }else if (type === "B") {
      // TO-DO: Need improve this code
      let childObj = _.find(this.dataContainer.boundary, {"id": child.id});
      await childObj.setObjectShowHide(status);
    }

    if (isEffectToParent) {
      let ancestor = await this.findAncestorOfMemberInNestedBoundary();
      await ancestor.updateSize();
      await ancestor.reorderPositionMember();
      ancestor.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(ancestor);
  
      setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
    }
  }

  async selectAllMemberVisible(status, isEffectToParent = true) {
    this.member.forEach(e => {
      this.selectMemberVisible(e, status, false);
    });

    if (isEffectToParent) {
      let ancestor = await this.findAncestorOfMemberInNestedBoundary();
      await ancestor.updateSize();
      await ancestor.reorderPositionMember();
      ancestor.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(ancestor);

      setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
    }
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
    // Loop child    
    this.member.forEach(member => {
      this.setBoundaryMemberStatus(member.id, status);
      d3.select(`#${member.id}`).classed('hidden-object', !status);
      if (member.type === "B") {
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

    this.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(this);

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
    this.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(this);
    setMinBoundaryGraph(this.dataContainer, this.svgId, this.viewMode.value);
  }

  async removeMemberFromBoundary( obj, isEffectToParent = true ) {
    _.remove(this.member, (e) => {
      return e.id === obj.id;
    });

    // Resize ancestor of parent
    if (isEffectToParent) {
        let ancestor = await this.findAncestorOfMemberInNestedBoundary();
        await ancestor.updateSize();
        await ancestor.reorderPositionMember();
        ancestor.boundaryMgmt.edgeMgmt.updatePathConnectForVertex(ancestor);
    }
  }

	/**
	 * Move this boundary and all it's child when selelecting on it
	 */
  moveToFront() {
    d3.select(`#${this.id}`).moveToFront();

    if (this.dataContainer.boundary.length > 1) {
      let curIndex = _.findIndex(this.dataContainer.boundary, {"id": this.id});

      arrayMove(this.dataContainer.boundary, curIndex, this.dataContainer.boundary.length - 1);
    }
    
    let memObj = null;
    this.member.forEach(e => {
      if (e.type == "V") {
        memObj = _.find(this.dataContainer.vertex, {"id": e.id});
      }else{
        memObj = _.find(this.dataContainer.boundary, {"id": e.id});
      }
      
      if (memObj)
        memObj.moveToFront();
    });
	}
	
	/**
	 * Checking if this boundary is the parent of object with objectId
	 * @param {*} objectId 
	 */
	isParentOf(objectId) {
		for (let i = 0; i < this.member.length; i++) {
			let mem = this.member[i];
			if (mem.id == objectId) {
				return true;
			} else if (mem.type == "B") {
				let memObj = _.find(this.dataContainer.boundary, {"id": mem.id});
				if (memObj.isParentOf(objectId)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * 
	 */
	validateConnectionByUsage() {
		let bFlag = true;

		for (let i = 0; i < this.member.length; i++) {
			let mem = this.member[i];
			if (!this.doValidateConnectionByUsage(mem) && bFlag)  bFlag = false;
		}

		return bFlag;
	}

	/**
	 * 
	 * @param {*} mem
	 */
	doValidateConnectionByUsage(mem) {
		let bFlag = true;
		
		if (mem.type == "V") {
			let vertex = _.find(this.dataContainer.vertex, {"id": mem.id})
			if (vertex) {
				if (!vertex.validateConnectionByUsage() && bFlag) {
					bFlag = false;
				}
			}
		} else {
			let boundary = _.find(this.dataContainer.boundary, {"id": mem.id})
			boundary.member.forEach(item => {
				if (!this.doValidateConnectionByUsage(item) && bFlag) {
					bFlag = false;
				}
			})
		}

		return bFlag;
	}
}

export default Boundary
