import * as d3 from 'd3';
import {
  SCREEN_SIZES,
  INTERACTION_TP,
  INTERACTION_TP_LST
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
  }

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
      // mainScope: this,
    };
    this.dataContainer.vertex.push(vertexInfo);

    // Height = height header + number properties * 26
    let htmlContent = '';
    let countProperty = 0;
    for (const key of Object.keys(vertexProperties)) {
      if(interaction === INTERACTION_TP.FULL){
        htmlContent += `
          <div class="interaction_full">
            <label class="property">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>
        `;
      } else if (interaction === INTERACTION_TP.LEFT) {
        htmlContent += `
          <div class="interaction_left">
            <label class="property">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>
        `;
      } else {
        htmlContent += `
          <div class="interaction_right">
            <label class="property">${key} : </label>
            <label class="data ${key}">${vertexProperties[key]}</label>
          </div>
        `;
      }

      countProperty ++;
    }

    let vertexHeight = headerVertexHeight + propertyVertexHeight*countProperty;

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", vertexId)
      .attr("class", "groupVertex")
      .on("click", (obj) => {
        this.checkCreateConnect(obj);
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

    group.append("foreignObject")
      .attr("width", groupVertexWidth)
      .attr("height", vertexHeight)
      .append("xhtml:div")
      .attr("class", "vertex_content")
      .style("font-size", "13px")
      .style("background", "white")
      .html(`
        <p class="header_name">${vertexInfo.name}</p>
        <div class="vertex_data">
          ${htmlContent}
        </div>
      `);

    // Call event drag for all object vertex exit.
    this.initEventDrag();
  }

  initEventDrag(){
    // Call event drag for all object vertex exit.
    this.svgSelector.selectAll(".groupVertex").call(this.dragRegister).data(this.dataContainer.vertex);
  }

  dragstarted(d) {
    d3.select(this).classed("active", true);
    d3.event.sourceEvent.stopPropagation();
  }

  dragged(d) {
    // Update poition object in this.dataContainer.boundary
    d3.select(this)
      .attr("x", d.x = d3.event.x)
      .attr("y", d.y = d3.event.y);

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    })
  }

  dragended(d) {
    d3.select(this).classed("active", false);
    // Get main scope store in object.
  }

  // Vertex ID = 'V' + Date.now()
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

  // Copy element has ID
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

  // Edit vertex infos
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

  closePopVertexInfo(){
    this.originVertex = null;
    let options = {popupId : HTML_VERTEX_INFO_ID}
    PopUtils.metClosePopup(options);
  }

  /**
   * Edge function
   */

  setOnCreateEdge(vertexId) {
    let vertexObj = this.getVertexInfoById(vertexId);
    window.creatingEdge = true;
    window.removingEdge = false;
    window.criterionNode = vertexObj[0];
    // console.log($(`#${vertexId}`)[0].getBoundingClientRect().width);
  }

  checkCreateConnect(target){
    if(window.creatingEdge){
      // console.log(window.criterionNode, target);
      let options = {source: window.criterionNode, target: target};
      this.edgeMgmt.create(options);
    }
  }

  getVertexInfoById(vertexId) {
    let vertexObj = $.grep(this.dataContainer.vertex, (e) =>
      { return e.id === vertexId; }
    );

    return vertexObj;
  }
};

export default VertexMgmt;
