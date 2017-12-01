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
let originVertex = {};

class VertexMgmt{
  constructor(props){
    this.svgSelector = props.svgSelector;
    this.dataContainer = props.dataContainer;
    this.vertexTypes = props.vertexTypes;
    this.bindEventForButton();
  }

  create(options){

    if(!options.vertexType)
      return;

    let vertexType = options.vertexType;
    // Get properties vertex from list object vertex type
    let vertexProperties = options.data ? options.data : this.vertexTypes[vertexType];

    let interaction = options.interaction || INTERACTION_TP.FULL;

    const dragRegister = d3.drag()
      .on("start", this.dragstarted)
      .on("drag", this.dragged)
      .on("end", this.dragended);

    let vertexId = this.generateVertexId();
    let vertexInfo = {
      x: options.x,
      y: options.y,
      vertexType: vertexType,
      interaction: interaction,
      name: options.name || "Vertex Name",
      description: options.description || "Vertex Description",
      data: vertexProperties,
      id: vertexId
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
      .attr("class", "groupVertex");

    group.append("rect")
      .attr("width", groupVertexWidth)
      .attr("height", vertexHeight)
      .style("fill", "white")

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
    this.svgSelector.selectAll(".groupVertex").call(dragRegister).data(this.dataContainer.vertex);
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
  }

  // Vertex ID = 'vertex' + Date.now()
  generateVertexId() {
    return `vertex${Date.now()}`;
  }

  // Remove element by ID
  remove(vertexId) {
    // Remove from DOM
    let foreignObject = d3.select(`#${vertexId}`).select("foreignObject");
    console.log(foreignObject);
    d3.select(`#${vertexId}`).remove();
    // Remove from data container
    let data = $.grep(this.dataContainer.vertex, (e) => {
      return e.id != vertexId;
    });

    this.dataContainer.vertex = data;
  }

  // Copy element has ID
  copy(vertexId) {
    let vertexObj = $.grep(this.dataContainer.vertex, (e) =>
      { return e.id === vertexId; }
    );
    if(vertexObj.length == 1){
      let info = vertexObj[0];
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
  editVertex(vertexId) {
    // Remove from DOM
    let vertexObj = $.grep(this.dataContainer.vertex, (e) =>
      { return e.id === vertexId; }
    );
    if(vertexObj.length == 1){
      let vertexInfo = vertexObj[0];
      this.openPopupVertexInfo(vertexInfo);
    }
  }

  openPopupVertexInfo(vertexInfo){
    // Use in function updateVertexInfo()
    originVertex = vertexInfo;
    // Append content to popup
    $(`#${HTML_OPTIONS_INTERACTION_TYPE}`).val(vertexInfo.interaction);
    $(`#vertexName`).val(vertexInfo.name);
    $(`#vertexId`).val(vertexInfo.id);
    $(`#vertexDesc`).val(vertexInfo.description);

    // Generate properties vertex
    let vertexData = vertexInfo.data;
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

  bindEventForButton() {
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
    originVertex.name = data.vertexName;
    originVertex.interaction = data.vertexInteraction;
    originVertex.description = data.vertexDesc;
    // Update data follow key in originVertex.data
    for (const key of Object.keys(originVertex.data)) {
      originVertex.data[key] = data[key];
    }
    originVertex.update = true;

    this.create(originVertex);
    this.closePopVertexInfo();
  }

  closePopVertexInfo(){
    let options = {popupId : HTML_VERTEX_INFO_ID}
    PopUtils.metClosePopup(options);
  }
};

export default VertexMgmt;
