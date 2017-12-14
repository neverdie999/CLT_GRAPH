import * as d3 from 'd3';
import {
  SCREEN_SIZES,
  INTERACTION_TP,
  INTERACTION_TP_LST,
  TYPE_POINT
} from '../../const/index';

import PopUtils from '../../common/utilities/popup.ult';

const headerVertexHeight = 38;
const propertyVertexHeight = 26;
const groupVertexWidth = 150;
const spaceAddVertex = 10; // When copy vertex then new coordinate = old coordinate + spaceAddVertex
const HTML_VERTEX_INFO_ID = 'vertexInfo';
const HTML_OPTIONS_INTERACTION_TYPE = 'vertexInteraction';
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties';
const HTML_VERTEX_FORM_ID = 'vertexForm';

class VertexMgmt{
  constructor(props){
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.vertexTypes = props.vertexTypes;
    this.edgeMgmt = props.edgeMgmt;

    this.bindEventForPopButton();

    // Init event drag
    this.dragRegister = d3.drag()
      .on("start", this.dragstarted)
      .on("drag", this.dragged)
      .on("end", this.dragended);
    this.originVertex = null;
    this.scope = this;
  }

  /**
   *
   * @param options
   * vertexType: object, required
   * vertexProperties: object, option
   * interaction: string, option
   * vertexProperties: object, option
   * id: string, option (format V*********)
   * Ex
   */
  create(options){

    if(!options.vertexType)
      return;

    let vertexType = options.vertexType;
    // Get properties vertex from list object vertex type
    let vertexProperties = options.data ? Object.assign({}, options.data) : Object.assign({}, this.vertexTypes[vertexType]);
    let interaction = options.interaction || INTERACTION_TP.FULL;
    let vertexId = options.id? options.id : this.generateVertexId();
    let vertexInfo = {
      x: options.x,
      y: options.y,
      vertexType: vertexType,
      interaction: interaction,
      name: options.name || "Name",
      description: options.description || "Description",
      data: vertexProperties,
      id: vertexId,
      mainScope: this,
    };
    this.dataContainer.vertex.push(vertexInfo);

    // Vertex property have height is 25px
    // Height = height header + number properties * 26


    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", vertexId)
      .attr("class", "groupVertex")
      .on("click", (obj) => {
      });
      // .on("mouseover",function(){
      //   var sel = d3.select(this);
      //   sel.moveToFront();
      // });

    // May be no need for vertex.
    // group.append("rect")
    //   .attr("width", groupVertexWidth)
    //   .attr("height", vertexHeight)
    //   .style("fill", "white");
    let htmlContent = '';
    let countProperty = 0;
    for (const key of Object.keys(vertexProperties)) {
      if(interaction === INTERACTION_TP.FULL){
        htmlContent += `
          <div class="interaction_full property" prop="${key}" vertexId="${vertexId}">
            <label class="key">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>`;
      } else if (interaction === INTERACTION_TP.LEFT) {
        htmlContent += `
          <div class="interaction_left property" prop="${key}" vertexId="${vertexId}">
            <label class="key">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>`;
      } else {
        htmlContent += `
          <div class="interaction_right property" prop="${key}" vertexId="${vertexId}">
            <label class="key">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>`;
      }
      countProperty ++;
    }

    let vertexHeight = headerVertexHeight + propertyVertexHeight*countProperty;
    group.append("foreignObject")
      .attr("width", groupVertexWidth)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .style("font-size", "13px")
      .html(`
        <p class="header_name">${vertexInfo.name}</p>
        <div class="vertex_data">
          ${htmlContent}
        </div>
      `);

    // Call event drag for all object vertex exit.
    this.initEventDrag();
  }

  /**
   * Init event drag for all vertex
   */
  initEventDrag(){
    // Call event drag for all object vertex exit.
    this.svgSelector.selectAll(".groupVertex").call(this.dragRegister).data(this.dataContainer.vertex);
  }

  dragstarted(d) {
    d3.select(this).classed("active", true);
    d3.event.sourceEvent.stopPropagation();
  }

  /**
   * Handle event move vertex
   * And update position of paths related to this vertex
   * @param d
   */
  dragged(d) {
    let vertexId = this.id;
    // Update poition object in this.dataContainer.boundary
    d3.select(this)
      .attr("x", d.x = d3.event.x)
      .attr("y", d.y = d3.event.y);

    let mainScope = d.mainScope;
    let dragPos = {x: d3.event.x, y: d3.event.y}; // New position of vertex.

    // Update path connected to this vertex
    let srcPaths = mainScope.edgeMgmt.findEdgeStartFromVertex(vertexId);
    let desPaths = mainScope.edgeMgmt.findEdgeConnectToVertex(vertexId);

    srcPaths.forEach(src => {
      let edgeId = src.id;
      let prop = src.source.prop;
      let newPos = mainScope.getCoordinateProperty(vertexId, prop, TYPE_POINT.OUTPUT);
      let options = {source: newPos}
      mainScope.edgeMgmt.updateAttributeNS(edgeId, options);
    });

    desPaths.forEach(des => {
      let edgeId = des.id;
      let prop = des.target.prop;
      let newPos = mainScope.getCoordinateProperty(vertexId, prop, TYPE_POINT.INPUT);
      let options = {target: newPos}
      mainScope.edgeMgmt.updateAttributeNS(edgeId, options);
    });

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    });
  }

  /**
   * Call back when stop drag vertex
   * @param d
   */
  dragended(d) {
    d3.select(this).classed("active", false);
  }

  /**
   * Gernerate vertex id with format 'V' + Date.now()
   * @returns {string}
   */
  generateVertexId() {
    return `V${Date.now()}`;
  }

  // Remove element by ID
  remove(vertexId) {
    // Remove from DOM
    d3.select(`#${vertexId}`).remove();
    // Remove from data container
    let data = $.grep(this.dataContainer.vertex, (e) => {
      return e.id != vertexId;
    });

    this.dataContainer.vertex = data;
  }

  /**
   * Copy vertex selected, only vertex on above connect (paths)
   * @param vertexId
   */
  copy(vertexId) {
    let vertexObj = this.getVertexInfoById(vertexId);

    if(vertexObj.length == 1){
      let info = Object.assign({}, vertexObj[0]);
      let options = {
        x: info.x + spaceAddVertex,
        y: info.y + spaceAddVertex,
        interaction: info.interaction,
        name: info.name,
        description: info.description,
        vertexType: info.vertexType,
        data: info.data
      };
      this.create(options);
    }
  }

  /**
   * Handle event select menu Edit on
   * context menu Vertex
   * @param vertexId
   */
  edit(vertexId) {
    let vertexObj = this.getVertexInfoById(vertexId);
    if(vertexObj.length == 1){
      let vertexInfo = Object.assign({}, vertexObj[0]);
      this.openPopupVertexInfo(vertexInfo);
    }
  }

  update(vertexInfo) {
    // Remove old
    this.remove(vertexInfo.id);
    // Redraw with old id
    this.create(vertexInfo);
  }

  /**
   * Open popup vertex info
   * @param vertexInfo
   */
  openPopupVertexInfo(vertexInfo){
    // Use in function updateVertexInfo()
    this.originVertex = vertexInfo;
    // Append content to popup
    $(`#${HTML_OPTIONS_INTERACTION_TYPE}`).val(vertexInfo.interaction);
    $(`#vertexName`).val(vertexInfo.name);
    $(`#vertexId`).val(vertexInfo.id);
    $(`#vertexDesc`).val(vertexInfo.description);

    // Generate properties vertex
    let vertexData = Object.assign({}, vertexInfo.data);
    let $propertiesGroup = $(`#${HTML_VERTEX_PROPERTIES_ID}`).empty();
    const $rowVertexType = $('<tr>');
    const $vertexType = $('<th>').text(vertexInfo.vertexType);
    $vertexType.attr('colspan', 2);
    $vertexType.attr('class', 'vertex-type');
    $vertexType.appendTo($rowVertexType);
    $rowVertexType.appendTo($propertiesGroup);
    for (const key of Object.keys(vertexData)) {
      const $row = $('<tr>');
      const $th = $('<th>').text(key).appendTo($row);
      const $td = $('<td>');

      const $input = $('<input>');
      $input.attr('type', 'text');
      $input.attr('id', key);
      $input.attr('name', key);
      $input.attr('class', 'form-control');
      $input.val(vertexData[key]);
      $input.appendTo($td);
      $td.appendTo($row);
      $row.appendTo($propertiesGroup);
    }

    let options = {popupId : HTML_VERTEX_INFO_ID, position: 'center', width: 430}
    PopUtils.metSetShowPopup(options);
  }

  /**
   * Bind event and init data for controls on popup
   */
  bindEventForPopButton() {
    // Append content to vertex popup
    let $group = $(`#${HTML_OPTIONS_INTERACTION_TYPE}`);
    INTERACTION_TP_LST.forEach((elm) => {
      const $options = $('<option>', {value: elm.value}).text(elm.name).appendTo($group);
    });

    $("#vertexBtnConfirm").click(e => {
      this.updateVertexInfo();
    });

    $("#vertexBtnCancel").click(e => {
      this.closePopVertexInfo();
    });

  }

  /**
   * Update vertex info
   * Update value properties
   * Update name, type, ...
   */
  updateVertexInfo() {
    let formdata = $(`#${HTML_VERTEX_FORM_ID}`).serializeArray();
    let data = {};
    $(formdata).each(function(index, obj){
      data[obj.name] = obj.value;
    });

    // Update origin data vertex
    this.originVertex.name = data.vertexName;
    this.originVertex.interaction = data.vertexInteraction;
    this.originVertex.description = data.vertexDesc;
    // Update data follow key in originVertex.data
    for (const key of Object.keys(this.originVertex.data)) {
      this.originVertex.data[key] = data[key];
    }

    let dataVertex = this.dataContainer.vertex;
    Object.assign(dataVertex[dataVertex.findIndex(el => el.id === this.originVertex.id)], this.originVertex)
    this.update(this.originVertex);
    this.closePopVertexInfo();
  }

  /**
   * Close popup edit vertex info
   */
  closePopVertexInfo(){
    this.originVertex = null;
    let options = {popupId : HTML_VERTEX_INFO_ID}
    PopUtils.metClosePopup(options);
  }

  /**
   * Cancle state create edge on vertex
   */
  cancelCreateEdge() {
    window.creatingEdge = false;
    window.criterionNode = null;
  }

  /**
   * Set state connect from source
   * @param vertexId
   * @param prop
   */
  setConnectFrom(vertexId, prop = null) {
    // let vertexObj = this.getVertexInfoById(vertexId);
    window.creatingEdge = true;
    // window.removingEdge = false;
    let source = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.OUTPUT);
    source.vertexId = vertexId;
    source.prop = prop;
    window.criterionNode = source;
  }

  /**
   * Set state connect to target
   * @param vertexId: string, require
   * @param prop: string, option
   */
  setConnectTo(vertexId, prop = null) {
    if(window.creatingEdge){
      // console.log(window.criterionNode, target);
      let target = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.INPUT);
      target.vertexId = vertexId;
      target.prop = prop;
      let options = {source: window.criterionNode, target: target};
      this.createConnect(options);
    }
  }

  /**
   * Get vertex info by id
   * @param vertexId
   * @returns {*}
   */
  getVertexInfoById(vertexId) {
    let vertexObj = $.grep(this.dataContainer.vertex, (e) =>
      { return e.id === vertexId; }
    );

    return vertexObj;
  }

  /**
   * Calculate position of vertex or position of property in vertex
   * @param vertexId: string, required
   * @param prop: string, option, prop of vertex
   * @param type: string, default is O (output)
   * @returns {{x: *, y: *}}
   */
  getCoordinateProperty(vertexId, prop, type) {
    if(!type)
      type = TYPE_POINT.OUTPUT;
    let vertexObj = this.getVertexInfoById(vertexId);
    let vertexInfo = Object.assign({}, vertexObj[0]);
    let axisX = vertexInfo.x;
    let axisY = vertexInfo.y;

    // If get Coordinate for vertex only
    if(!prop)
      return {x: type === TYPE_POINT.OUTPUT ? axisX + groupVertexWidth : axisX, y: axisY + 2 };

    let vertexData = vertexInfo.data;
    // Find index prop in object
    let index = Object.keys(vertexData).indexOf(prop);
    // Calculate coordinate of prop
    // y = current axis y + height header + indexProp*heightProp + 13;
    // x = if output then axis x + width vertex; if not then axis x
    // Get coordinate
    // const headerVertexHeight = 38;
    // const propertyVertexHeight = 26;
    axisY = axisY + headerVertexHeight + index*propertyVertexHeight + propertyVertexHeight/2;

    return {x: type === TYPE_POINT.OUTPUT ? axisX + groupVertexWidth : axisX, y: axisY};
  }

  /**
   * Call create connect from source to target
   * @param options
   */
  createConnect(options) {
    this.edgeMgmt.create(options);
  }
};

export default VertexMgmt;
