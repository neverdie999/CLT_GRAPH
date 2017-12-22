import * as d3 from 'd3';
import {
  SCREEN_SIZES,
  INTERACTION_TP,
  INTERACTION_TP_LST,
  TYPE_POINT,
  VERTEX_ATTR_SIZE
} from '../../const/index';
import _ from "lodash";

import PopUtils from '../../common/utilities/popup.ult';
import {moveToFront} from '../../common/utilities/common.ult';

const HTML_VERTEX_INFO_ID = 'vertexInfo';
const HTML_OPTIONS_INTERACTION_TYPE = 'vertexInteraction';
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties';
const HTML_VERTEX_FORM_ID = 'vertexForm';

class VertexMgmt{
  constructor(props){
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.edgeMgmt = props.edgeMgmt;
    this.objectUtils = props.objectUtils;

    this.bindEventForPopButton();

    // Init event drag
    this.dragRegister = d3.drag()
      .on("start", this.dragstarted)
      .on("drag", this.dragged)
      .on("end", this.dragended);
    this.originVertex = null;
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
    let vertexProperties = options.data ? Object.assign({}, options.data) : Object.assign({}, window.vertexTypes[vertexType]);
    let interaction = options.interaction || INTERACTION_TP.FULL;
    let vertexId = options.id? options.id : this.objectUtils.generateObjectId('V');
    let mainScope = this;

    let vertexInfo = {
      x: options.x,
      y: options.y,
      vertexType: vertexType,
      interaction: interaction,
      name: options.name || "Name",
      description: options.description || "Description",
      data: vertexProperties,
      id: vertexId,
      mainScope: mainScope,
    };
    this.dataContainer.vertex.push(vertexInfo);

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", vertexId)
      .attr("class", "groupVertex")
      .on("mouseover", (d, i, node) => {
        let vertexId = d.id;
        d3.select(node[0]).moveToFront();
        // Bring data to top
        this.moveDataToLast(vertexId);
      });
      // .on("mouseout", (d, i, node) => {
      //   console.log("Mouse up");
      //   let vertexId = d.id;
      //   d3.select(node[0]).moveToBack();
      //   // Bring data to top
      //   this.moveDataToFirst(vertexId);
      // });

    let htmlContent = '';
    let countProperty = 0;
    for (const key of Object.keys(vertexProperties)) {
      if(interaction === INTERACTION_TP.FULL){
        htmlContent += `
          <div class="interaction_full property" prop="${key}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
            <label class="key">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>`;
      } else if (interaction === INTERACTION_TP.LEFT) {
        htmlContent += `
          <div class="interaction_left property" prop="${key}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
            <label class="key">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>`;
      } else {
        htmlContent += `
          <div class="interaction_right property" prop="${key}" style="height: ${VERTEX_ATTR_SIZE.PROP_HEIGHT}px">
            <label class="key">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>`;
      }
      countProperty ++;
    }

    let vertexHeight = VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT*countProperty;
    // May be no need for vertex.
    // group.append("rect")
    //   .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
    //   .attr("height", vertexHeight)
    //   .style("fill", "white");
    group.append("foreignObject")
      .attr("width", VERTEX_ATTR_SIZE.GROUP_WIDTH)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .style("font-size", "13px")
      .style("background", "#ffffff")
      .html(`
        <p class="header_name" style="height: ${VERTEX_ATTR_SIZE.HEADER_HEIGHT}px">${vertexInfo.name}</p>
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
    this.svgSelector.selectAll(".groupVertex")
      .data(this.dataContainer.vertex).call(this.dragRegister);
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
    d.x = d3.event.x;
    d.y = d3.event.y;

    let mainScope = d.mainScope;
    let dragPos = {x: d3.event.x, y: d3.event.y}; // New position of vertex.

    // Update path connected to this vertex
    let srcPaths = mainScope.objectUtils.findEdgeStartFromVertex(vertexId);
    let desPaths = mainScope.objectUtils.findEdgeConnectToVertex(vertexId);

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
    // d3.select(this).classed("active", false);
    // console.log(d);
    // console.log(this.parentNode);
    let tmpVertex = this;
    // console.log(tmpVertex);
    d3.select("svg").selectAll(".groupBoundary").each(function(d, i) {

      console.log(this);
      d3.select(this).append("circle")
        .attr("r", 40) //get radius from targetCircle and also styles?
        .attr("id", "circleAddedId")
        .classed("circleAddedClass", true)
        .attr("cx", d3.mouse(this)[0])
        .attr("cy", d3.mouse(this)[1])
        .style("fill", "white")
        .style("stroke", "black")
        .style("stroke-width", "2px");
      console.log((d3.select(tmpVertex).node().cloneNode(true)));
      // d3.select(this).node().appendChild(d3.select(tmpVertex).node().cloneNode(true));
      // d3.select(tmpVertex).remove();
    });
  }

  /**
   * Remove vertex element by id
   * @param vertexId
   */
  remove(vertexId) {
    // Remove from DOM
    d3.select(`#${vertexId}`).remove();
    // Remove from data container
    let data = _.remove(this.dataContainer.vertex, (e) => {
      return e.id == vertexId;
    });

    // Remove all edge relate to vertex
    // let relatePaths = this.objectUtils.findEdgeRelateToVertex(vertexId);
    // relatePaths.forEach(path => {
    //   this.edgeMgmt.removeEdge(path.id);
    // });
  }

  /**
   * Copy vertex selected, only vertex on above connect (paths)
   * @param vertexId
   */
  copy(vertexId) {
    let vertexObj = this.getVertexInfoById(vertexId);

    if(vertexObj){
      let info = Object.assign({}, vertexObj);
      let options = {
        x: info.x + VERTEX_ATTR_SIZE.SPACE_COPY,
        y: info.y + VERTEX_ATTR_SIZE.SPACE_COPY,
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
    if(vertexObj){
      let vertexInfo = Object.assign({}, vertexObj);
      this.openPopupVertexInfo(vertexInfo);
    }
  }

  /**
   * Redraw vertex with new info.
   * @param vertexInfo
   */
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
    window.sourceNode = null;
  }

  /**
   * Set state connect from source
   * @param vertexId
   * @param prop
   */
  setConnectFrom(vertexId, prop = null) {
    window.creatingEdge = true;
    let source = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.OUTPUT);
    source.vertexId = vertexId;
    source.prop = prop;
    window.sourceNode = source;
  }

  /**
   * Set state connect to target
   * @param vertexId: string, require
   * @param prop: string, option
   */
  setConnectTo(vertexId, prop = null) {
    if(window.creatingEdge){
      let target = this.getCoordinateProperty(vertexId, prop, TYPE_POINT.INPUT);
      target.vertexId = vertexId;
      target.prop = prop;
      let options = {source: window.sourceNode, target: target};
      this.createConnect(options);
    }
  }

  /**
   * Call create connect from source to target
   * @param options
   */
  createConnect(options) {
    this.edgeMgmt.create(options);
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
    let vertexInfo = Object.assign({}, vertexObj);
    let axisX = vertexInfo.x;
    let axisY = vertexInfo.y;

    // If get Coordinate for vertex only
    // if(!prop)
    //   return {x: type === TYPE_POINT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH : axisX, y: axisY + 2 };
    if(!prop)
      return {x: axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH/2, y: axisY};

    let vertexData = vertexInfo.data;
    // Find index prop in object
    let index = Object.keys(vertexData).indexOf(prop);
    // Calculate coordinate of prop
    // y = current axis y + height header + indexProp*heightProp + 13;
    // x = if output then axis x + width vertex; if not then axis x
    // Get coordinate
    axisY = axisY + VERTEX_ATTR_SIZE.HEADER_HEIGHT + index*VERTEX_ATTR_SIZE.PROP_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT/2;

    return {x: type === TYPE_POINT.OUTPUT ? axisX + VERTEX_ATTR_SIZE.GROUP_WIDTH : axisX, y: axisY};
  }

  /**
   * Get vertex info by id
   * @param vertexId
   * @returns {*}
   */
  getVertexInfoById(vertexId) {
    return _.find(this.dataContainer.vertex, (e) => { return e.id === vertexId; });
  }

  /**
   * When vertex selected then move it to last
   * @param vertexId
   */
  moveDataToLast(vertexId) {
    // Remove
    let tmpVertex = this.getVertexInfoById(vertexId);
    _.remove(this.dataContainer.vertex, (e) => {
      return e.id == vertexId;
    });

    this.dataContainer.vertex.push(tmpVertex);
  }

  /**
   * When vertex selected then move it to first
   * @param vertexId
   */
  moveDataToFirst(vertexId) {
    console.log("Move to first");
    // Remove
    let tmpVertex = this.getVertexInfoById(vertexId);
    _.remove(this.dataContainer.vertex, (e) => {
      return e.id == vertexId;
    });

    this.dataContainer.vertex.unshift(tmpVertex);
  }

};

export default VertexMgmt;
