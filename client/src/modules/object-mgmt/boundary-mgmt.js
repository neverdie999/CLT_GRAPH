import * as d3 from 'd3';
import {
  SCREEN_SIZES,
  INTERACTION_TP,
  INTERACTION_TP_LST
} from '../../const/index';

import PopUtils from '../../common/utilities/popup.ult';
import {HTML_BOUNDARY_CONTAINER_CLASS} from "../../const";

const headerBoundaryHeight = 38;
const groupBoundaryWidth = 180;
const groupBoundaryHeight = 200;
const HTML_VERTEX_INFO_ID = 'vertexInfo';
const HTML_OPTIONS_INTERACTION_TYPE = 'vertexInteraction';
const HTML_VERTEX_PROPERTIES_ID = 'vertexProperties';
const HTML_VERTEX_FORM_ID = 'vertexForm';
const boundaryType = {
  "Boundary": {
    "name":"Grunt",
    "hp": 500,
    "atk": "M20",
    "def": "H2",
    "spd": 1
  }
};

class BoundaryMgmt{
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
    let boundaryId = options.id? options.id : this.objectUtils.generateObjectId('B');
    let boundaryInfo = {
      x: options.x,
      y: options.y,
      name: options.name || "Boundary",
      description: options.description || "Boundary Description",
      member: ["v1", "b2"],
      id: boundaryId
    };

    let htmlContent = '';
    let boundaryHeight = groupBoundaryWidth;

    let group = this.svgSelector.append("g")
      .attr("transform", `translate(${options.x}, ${options.y})`)
      .attr("id", boundaryId)
      .attr("class", "groupBoundary")

    group.append("foreignObject")
      .attr("width", groupBoundaryWidth)
      .attr("height", groupBoundaryHeight)
      .append("xhtml:div")
      .attr("class", "boundary_content")
      .style("font-size", "13px")
      .style("background", "#ffffff")
      .html(`
          <div class="boundary_header" style="width: ${groupBoundaryWidth + 20}px;">
            <label class="boundary_right" id="${boundaryId}_visiable">+</label>
            <label class="header_boundary" style="width: ${groupBoundaryWidth}px; height: ${headerBoundaryHeight}px;">${boundaryInfo.name}</label>
          </div>
          <div class="boundary_data" style="height: ${groupBoundaryHeight}px"></div>
      `);

    boundaryInfo.width = groupBoundaryWidth;
    boundaryInfo.height = boundaryHeight;
    this.dataContainer.boundary.push(boundaryInfo);

    // Call event drag for all object vertex exit.
    this.initEventDrag();
  }

  initOptionBoundaryMenu(select){
    $.contextMenu({
      selector: select,
      trigger: 'left',
      callback: (key, options) => {
        let m = "clicked: " + key;
        window.console && console.log(m) || alert(m);
      },
      items: {
        "edit": {name: "Edit", icon: "fa-pencil-square-o"},
        "cut": {name: "Cut", icon: "fa-pencil-square-o"},
        "copy": {name: "Copy", icon: "fa-pencil-square-o"},
        "paste": {name: "Paste", icon: "fa-pencil-square-o"},
        "delete": {name: "Delete", icon: "fa-pencil-square-o"}
      }
    });
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
    // Update poition object in this.dataContainer.boundary
    d3.select(this)
      .attr("x", d.x = d3.event.x)
      .attr("y", d.y = d3.event.y);

    // Transform group
    d3.select(this).attr("transform", (d,i) => {
      return "translate(" + [ d3.event.x, d3.event.y ] + ")"
    })
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
      return e.id != boundaryId;
    });

    console.log(data);
  }

  /**
   * Get boundary info by id
   * @param boundaryId
   * @returns {*}
   */
  getBoundaryInfoById(boundaryId) {
    return _.find(this.dataContainer.boundary, (e) => { return e.id === boundaryId; });
  }
};

export default BoundaryMgmt;
