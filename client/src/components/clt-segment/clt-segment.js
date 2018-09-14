import * as d3 from 'd3';
import _ from 'lodash';
import ObjectUtils from '../../common/utilities/object.ult';
import SegmentMgmt from '../common-objects/objects/segment-mgmt';
import EdgeMgmt from '../common-objects/objects/edge-mgmt';
import MainMenuSegment from '../common-objects/menu-context/main-menu-segment';

import {
  comShowMessage,
  setSizeGraph,
  setMinBoundaryGraph,
} from '../../common/utilities/common.ult';

import { 
  DEFAULT_CONFIG_GRAPH, VIEW_MODE, VERTEX_ATTR_SIZE,
} from '../../common/const/index';

class CltSegment {
  constructor(props) {
    this.selector = props.selector;
    this.viewMode = {value: props.viewMode || VIEW_MODE.SEGMENT};

    this.selectorName = this.selector.selector.replace(/[\.\#]/,'');

    this.graphContainerId = `graphContainer_${this.selectorName}`;
    this.graphSvgId = `graphSvg_${this.selectorName}`;
    this.connectSvgId = `connectSvg_${this.selectorName}`;

    this.isShowReduced = false;

    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();

    this.initSvgHtml();

    this.dataContainer = {
      vertex: [],
      boundary: [],
      edge: []
    };

    this.edgeMgmt = new EdgeMgmt({
      dataContainer    : this.dataContainer,
      svgId            : this.connectSvgId,
      vertexContainer  : [
        this.dataContainer
      ]
    });

    this.segmentMgmt = new SegmentMgmt({
      dataContainer : this.dataContainer,
      containerId : this.graphContainerId,
      svgId : this.graphSvgId,
      viewMode: this.viewMode,
      edgeMgmt : this.edgeMgmt
    });

    this.initCustomFunctionD3();
    this.objectUtils.initListenerContainerScroll(this.graphContainerId, this.edgeMgmt, [this.dataContainer]);
    this.objectUtils.initListenerOnWindowResize(this.edgeMgmt, [this.dataContainer]);
  };

  initSvgHtml(){
    let sHtml = 
    `<div id="${this.graphContainerId}" class="graphContainer" ref="${this.graphSvgId}">
        <svg id="${this.graphSvgId}" class="svg"></svg>
      </div>
      <svg id="${this.connectSvgId}" class="connect-svg"></svg>`;

    this.selector.append(sHtml);
  }

  initCustomFunctionD3() {
    /**
     * Move DOM element to front of others
     */
    d3.selection.prototype.moveToFront = function () {
      return this.each(function () {
        this.parentNode.appendChild(this);
      });
    };

    /**
     * Move DOM element to back of others
     */
    d3.selection.prototype.moveToBack = function () {
      this.each(function () {
        this.parentNode.firstChild && this.parentNode.insertBefore(this, this.parentNode.firstChild);
      });
    };
  }

  initMenuContext() {
    new MainMenuSegment({
      selector: `#${this.graphSvgId}`,
      containerId: `#${this.graphContainerId}`,
      parent: this,
      viewMode: this.viewMode
    });
  }

  createVertex(opt) {
    this.vertexMgmt.create(opt);
  }

  /**
   * Clear all element on graph
   * And reinit marker def
   */
  clearAll() {
    this.segmentMgmt.clearAll();

    setSizeGraph({ width: DEFAULT_CONFIG_GRAPH.MIN_WIDTH, height: DEFAULT_CONFIG_GRAPH.MIN_HEIGHT }, this.graphSvgId);
  }

  showReduced(){
    this.isShowReduced = true;
    
    this.dataContainer.vertex.forEach((vertex) => {
      d3.select(`#${vertex.id}`).selectAll('.property').classed("hide", true);
      d3.select(`#${vertex.id}`).select('foreignObject').attr("height", VERTEX_ATTR_SIZE.HEADER_HEIGHT);
    });
    
    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  showFull(){
    this.isShowReduced = false;
    
    this.dataContainer.vertex.forEach((vertex) => {
      let arrProp = d3.select(`#${vertex.id}`).selectAll('.property').classed("hide", false)._groups[0];
      d3.select(`#${vertex.id}`).select('foreignObject').attr("height", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * arrProp.length);
    });

    setMinBoundaryGraph(this.dataContainer, this.svgId);
  }

  LoadVertexGroupDefinition(vertexDefinitionData){
    if (this.dataContainer.vertex.length > 0 && !confirm('The current data will be cleared, do you want to continue ?')) {
      return;
    }

    this.clearAll();

    if (this.segmentMgmt.LoadVertexGroupDefinition(vertexDefinitionData)) {
      this.initMenuContext();
    }
  }

  async drawObjects(data) {
    const { VERTEX: vertices } = data;
    // Draw Segment

    let x = 5;
    let y = 5;
    vertices.forEach(e => {
      e.x = x;
      e.y = y;
      e.isImport = true;

      this.segmentMgmt.create(e);

      x += VERTEX_ATTR_SIZE.GROUP_WIDTH + 5;
    });
  }

  async loadSegmentSpecEditor(segmentData) {

    if (!this.validateSegmentSpecStructure(segmentData)) {
      comShowMessage("Format or data in Segment Spec Structure is corrupted. You should check it!");
      return false;
    }

    this.segmentMgmt.processDataVertexTypeDefine(segmentData);

    //clear data
    this.clearAll();

    await this.drawObjects(segmentData);

    this.initMenuContext();

    setMinBoundaryGraph(this.dataContainer,this.graphSvgId);
  }

  save(fileName) {

    if (!fileName) {
      comShowMessage("Please input file name");
      return;
    }

    this.getContentGraphAsJson().then(content => {
      if (!content) {
        comShowMessage("No content to export");
        return;
      }
      // stringify with tabs inserted at each level
      let graph = JSON.stringify(content, null, "\t");
      let blob = new Blob([graph], {type: "application/json", charset: "utf-8"});

      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
        return;
      }

      let fileUrl = window.URL.createObjectURL(blob);
      let downLink = $('<a>');
      downLink.attr("download", `${fileName}.json`);
      downLink.attr("href", fileUrl);
      downLink.css("display", "none");
      $("body").append(downLink);
      downLink[0].click();
      downLink.remove();
    }).catch(err => {
      comShowMessage(err);
    });
  }

  getContentGraphAsJson() {
    let dataContent = {VERTEX_GROUP: [], VERTEX: []};

    if (this.isEmptyContainerData(this.dataContainer)){
      return Promise.reject("There is no Input data. Please import!");
    } 

    const cloneVertexDefine = _.cloneDeep(this.segmentMgmt.vertexDefinition);

    if(cloneVertexDefine.vertexGroup){
      dataContent.VERTEX_GROUP = this.getSaveVertexGroup(cloneVertexDefine.vertexGroup);
    }

    // Process data to export
    // Need clone data cause case user export
    // later continue edit then lost parent scope
    // Purpose prevent reference data.

    //Vertex and Boundary data
    const cloneData = _.cloneDeep(this.dataContainer);
    cloneData.vertex.forEach(vertex => {
      dataContent.VERTEX.push(this.getSaveDataVertex(vertex));
    });

    return Promise.resolve(dataContent);
  }

  /**
   * Filter properties that need to save
   * @param {*} vertexGroup 
   */
  getSaveVertexGroup(vertexGroup){
    let resObj = [];

    vertexGroup.forEach(group => {
      let tmpGroup = {};

      tmpGroup.groupType          = group.groupType;
      tmpGroup.option             = group.option;
      tmpGroup.dataElementFormat  = group.dataElementFormat;
      tmpGroup.vertexPresentation = group.vertexPresentation;

      resObj.push(tmpGroup);
    })
    
    return resObj;
  }

  /**
   * Filter properties that need to save
   * @param {*} vertex 
   */
  getSaveDataVertex(vertex){
    let resObj = {};
    resObj.groupType = vertex.groupType;
    resObj.vertexType = vertex.vertexType;
    resObj.description = vertex.description;
    resObj.data = [];

    const arrPropNeedToSave = Object.keys(this.segmentMgmt.vertexGroup.dataElementFormat);

    vertex.data.forEach(e => {
      let elementDataObj = {};

      arrPropNeedToSave.forEach(prop => {
        elementDataObj[prop] = e[prop];
      });

      resObj.data.push(elementDataObj);
    });

    return resObj;
  }

  isEmptyContainerData(containerData){
    return (containerData.vertex.length == 0 && containerData.boundary.length == 0)
  }

  /**
   * Validate Vertex Group Define Structure
   */
  validateSegmentSpecStructure(data) {

    //Validate data exists
    if(data===undefined)
    {
      return false;
    }

    if (!data.VERTEX_GROUP || !data.VERTEX) {
      return false;
    }

    if (Object.keys(data).length > 2) {
      return false;
    }

    return true;
  }
}
  
export default CltSegment;
