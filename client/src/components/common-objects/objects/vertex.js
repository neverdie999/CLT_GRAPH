import ColorHash from 'color-hash';
import _ from "lodash";
import * as d3 from 'd3';

import {
  VERTEX_ATTR_SIZE,
  CONNECT_SIDE,
  TYPE_CONNECT,
} from '../../../common/const/index';

import { 
  generateObjectId,
  setMinBoundaryGraph,
  checkModePermission,
} from '../../../common/utilities/common.ult';

const CONNECT_KEY = 'Connected';

class Vertex {
  constructor(props) {
    this.dataContainer    = props.vertexMgmt.dataContainer;
    this.containerId      = props.vertexMgmt.containerId;
    this.svgId            = props.vertexMgmt.svgId;
    this.selectorClass    = props.vertexMgmt.selectorClass || "defaul_vertex_class";
    this.vertexDefinition = props.vertexMgmt.vertexDefinition;
    this.viewMode         = props.vertexMgmt.viewMode;
    this.vertexMgmt       = props.vertexMgmt;

    this.id               = null;
    this.x                = 0; //type: number, require: true, purpose: coordinate x
    this.y                = 0; //type: number, require: true, purpose: coordinate y
    this.groupType        = ""; // Current is OPERATIONS or SEGMENT
    this.vertexType       = ""; // The details of group type
    this.name             = ""; //type: string, require: false, purpose: vertex name
    this.description      = ""; //type: string, require: false, purpose: content title when hover to vertex
    this.data             = []; //type: array, require: false, default: empty array, purpose: define the content of vertex
    this.parent           = null;
    this.mandatory        = false;
    this.repeat           = 1;
    this.connectSide      = ""; //type: string, require: false, the default value is an anonymous function not handle anything. (LEFT, RIGHT, BOTH)
    this.type;
    this.show;

    this.initialize();
  }

  initialize() {
    this.colorHash = new ColorHash({lightness: 0.7});
    this.colorHashConnection = new ColorHash({lightness: 0.8});
  }

  /**
   * Create vertex with options
   * @param x => type: number, require: true, purpose: coordinate x
   * @param y => type: number, require: true, purpose: coordinate y
   * @param name => type: string, require: false, purpose: vertex name
   * @param description => type: string, require: false, purpose: content title when hover to vertex
   * @param id => type: string, require: true, purpose: identify for vertex
   * @param data => type: array, require: false, default: empty array, purpose: define the content of vertex
   * @param connectSide => type: string, require: false, the default value is an anonymous function not handle anything.
   * @param presentation => type: object, require: true if @param[data] defined
   * and selector for menu context on vertex
   * @param callbackDragVertex => type: function, require: false, default: anonymous function, purpose: call back drag vertex
   * @param callbackDragConnection => type: function, require: false, default: anonymous function, purpose: call back drag connection
   */
  create(sOptions = {}, callbackDragVertex = ()=>{}, callbackDragConnection = ()=>{}) {

    let {id, x, y, groupType, vertexType, name, description, data, parent, mandatory, repeat, connectSide, isMenu, isImport} = sOptions;

    if ( isMenu ) {
      let vertexTypeInfo = _.cloneDeep(_.find(this.vertexDefinition.vertexTypes, {'vertexType': vertexType}));
      data = vertexTypeInfo.data;
      description = vertexTypeInfo.description;
      groupType = vertexTypeInfo.groupType;
    }

    let presentation = this.vertexDefinition.vertexPresentation[groupType]; 

    this.id           = id || generateObjectId('V');
    this.x            = x || 0;
    this.y            = y || 0;
    this.groupType    = groupType;
    this.vertexType   = vertexType;
    this.name         = name || vertexType;
    this.description  = description || "Description";
    this.data         = data || [];
    this.parent       = parent || null;
    this.mandatory    = mandatory || false;
    this.repeat       = repeat || 1;
    this.connectSide  = connectSide || CONNECT_SIDE.BOTH;
    this.type         = "V";
    this.show         = true;

    if ( !this.dataContainer.vertex ) this.dataContainer.vertex = [];
    this.dataContainer.vertex.push(this);

    let group = d3.select(`#${this.svgId}`).selectAll(`.${this.selectorClass}`)
      .data(this.dataContainer.vertex)
      .enter().append("g")
      .attr("transform", `translate(${this.x}, ${this.y})`)
      .attr("id", this.id)
      .style("pointer-events", "none")
      .attr("class", `${this.selectorClass}`);

      if(checkModePermission(this.viewMode, "isEnableDragVertex")){
        group.call(callbackDragVertex);
      }

    let htmlContent = '';
    let countData = this.data.length;
    for (let i = 0; i < countData; i++) {
      let item = this.data[i];
      htmlContent += `
        <div class="property" prop="${this.id}${CONNECT_KEY}${i}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
          <label class="key" id="${this.id}_${presentation.key}_${i}" title="${item[presentation.keyTooltip] || "No data to show"}">${item[presentation.key] || ""}</label><label> : </label>
          <label class="data" id="${this.id}_${presentation.value}_${i}" title="${item[presentation.valueTooltip] || "No data to show"}">${item[presentation.value] || ""}</label>
        </div>`;
    }

    let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * countData;

    group.append("foreignObject")
      .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .html(`
        <p class="header_name" id="${this.id}Name" title="${this.description}" 
          style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px;
          background-color: ${this.colorHash.hex(this.name)};
          cursor: move; pointer-events: all">${this.name}</p>
        <div class="vertex_data" style="pointer-events: none">
          ${htmlContent}
        </div>
      `);

    for (let i = 0; i < countData; i++) {
      // Input
      if (this.connectSide === CONNECT_SIDE.BOTH || this.connectSide === CONNECT_SIDE.LEFT){
       let connect = group.append("rect")
          .attr("class", `drag_connect drag_connect_${this.svgId}`)
          .attr("type", TYPE_CONNECT.INPUT)
          .attr("prop", `${this.id}${CONNECT_KEY}${i}`)
          .attr("pointer-events", "all")
          .attr("width", 12)
          .attr("height", 25)
          .attr("x", 1)
          .attr("y", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
          .style("fill", this.colorHashConnection.hex(this.name))
          .call(callbackDragConnection);
      }

      // Output
      if (this.connectSide === CONNECT_SIDE.BOTH || this.connectSide === CONNECT_SIDE.RIGHT){
        let connect =  group.append("rect")
          .attr("class", `drag_connect drag_connect_${this.svgId}`)
          .attr("prop", `${this.id}${CONNECT_KEY}${i}`)
          .attr("pointer-events", "all")
          .attr("type", TYPE_CONNECT.OUTPUT)
          .attr("width", 12)
          .attr("height", 25)
          .attr("x", VERTEX_ATTR_SIZE.GROUP_WIDTH - (VERTEX_ATTR_SIZE.PROP_HEIGHT / 2))
          .attr("y", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * i + 1)
          .style("fill", this.colorHashConnection.hex(this.name))
          .call(callbackDragConnection);
      }
    }

    if(!isImport) 
      setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  /**
   * Set position for vertex
   * Called in function dragBoundary (Object boundary)
   * @param position
   */
  setPosition(position) {
    let {x, y} = position;
    this.x = x;
    this.y = y;
    this.updatePathConnect();

    d3.select(`#${this.id}`).attr("transform","translate(" + [x, y] + ")");
  }

  /**
   * Copy vertex selected
   */
  copy() {
    let {x, y, name, description, vertexType, data, repeat, mandatory, groupType} = _.cloneDeep(this);
    x = x + VERTEX_ATTR_SIZE.SPACE_COPY;
    y = y + VERTEX_ATTR_SIZE.SPACE_COPY;

    this.vertexMgmt.create({x, y, name, description, vertexType, data, repeat, mandatory, groupType});
  }

  /**
   * Remove vertex
   */
  remove() {
    // Remove all edge relate to vertex
    this.vertexMgmt.edgeMgmt.removeAllEdgeConnectToVertex(this);

    if (this.parent){
      let parentObj = _.find(this.dataContainer.boundary, {"id": this.parent});
      parentObj.removeMemberFromBoundary(this);
    }
      
    // Remove from DOM
    d3.select(`#${this.id}`).remove();

    // Remove from data container
    let vertexInfo = _.remove(this.dataContainer.vertex, (e) => {
      return e.id === this.id;
    });

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }
  
  /**
   * The function called from boundary via mainMgmt
   * In case that delete all boundary parent of vertex
   * Different between this func and remove func is, in this case we don't care the parent, because it was deleted 
   */
  delete() {
    // Remove from DOM
    d3.select(`#${this.id}`).remove();
    // Remove from data container
    _.remove(this.dataContainer.vertex, (e) => {
      return e.id === this.id;
    });

    // Remove all edge relate to vertex
    this.vertexMgmt.edgeMgmt.removeAllEdgeConnectToVertex(this);

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }  

  /**
   * Move to new position with parent offset(called when moving the boundary that contain this vertex)
   * @param {*} offsetX
   * @param {*} offsetY
   */
  move(offsetX, offsetY) {
    this.x = this.x + offsetX;
    this.y = this.y + offsetY;
    d3.select(`#${this.id}`).attr("transform", "translate(" + [this.x, this.y] + ")");

    this.updatePathConnect()
  }

  updatePathConnect(){
    this.vertexMgmt.updatePathConnectForVertex(this);
  }
}

export default Vertex;
