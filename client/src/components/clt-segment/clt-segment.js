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
  VERTEX_FORMAT_TYPE, DEFAULT_CONFIG_GRAPH, VIEW_MODE, VERTEX_ATTR_SIZE,
} from '../../common/const/index';

class CltSegment {
  constructor(props) {
    this.selector = props.selector;
    this.viewMode = {value: props.viewMode || VIEW_MODE.EDIT};

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

    this.vertexDefinition = {
      groupVertexOption: {}, // List vertex type have same option.
      vertexFormatType: {}, // Vertex group format type
      vertexFormat: {}, // Data element vertex format
      vertexGroupType: {}, // Group vertex type
      headerForm: {}, // Header group type
      vertexPresentation: {}, // Group vertex presentation
      vertexGroup: null, // Group vertex
      keyPrefix: {type:{}}
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
      vertexDefinition : this.vertexDefinition,
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
      vertexDefinition: this.vertexDefinition,
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

  async drawObjects(data) {
    const { VERTEX: vertices } = data;
    // Draw Segment

    let x = 5;
    let y = 5;
    vertices.forEach(e => {
      e.x = x;
      e.y = y;
      e.presentation = this.vertexDefinition.vertexPresentation[e.groupType];
      e.isImport = true;

      this.segmentMgmt.create(e);

      x += VERTEX_ATTR_SIZE.GROUP_WIDTH + 5;
    });
  }

  async loadSegmentSpecEditor(segmentData) {

    let errorContent = await this.validateVertexDefineStructure(segmentData);
    if (errorContent){
      comShowMessage("Format or data in Data Segment Structure is corrupted. You should check it!");
      return;
    }

    //clear data
    this.clearAll();

    //Reload Vertex Define and draw graph
    await this.processDataVertexTypeDefine(segmentData, this.vertexDefinition);
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

  async LoadVertexGroupDefinition(vertexDefinitionData){
    //Validate data struct
    let errorContent = await this.validateVertexDefineStructure(vertexDefinitionData);
    if (errorContent){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");
      return;
    }

    //Reload Vertex Define and init main menu
    await this.processDataVertexTypeDefine(vertexDefinitionData, this.vertexDefinition);
    this.initMenuContext();
  }

  getVertexFormatType(vertexGroup, container) {
    vertexGroup.forEach(group => {
      const {groupType, dataElementFormat, vertexPresentation} = group;
      container.headerForm[groupType] = Object.keys(dataElementFormat);
      
      container.vertexPresentation[groupType] = vertexPresentation;
      if (!container.vertexPresentation[groupType]["keyPrefix"]) {
        container.vertexPresentation[groupType]["keyPrefix"] = {};
      }

      container.vertexFormat[groupType] = dataElementFormat;
      container.vertexGroupType[groupType] = group;
      let formatType = {};
      let header = container.headerForm[groupType];
      let len = header.length;
      for (let i = 0; i < len; i++) {
        let key = header[i];
        let value = dataElementFormat[key];
        let type = typeof(value);

        formatType[key] = VERTEX_FORMAT_TYPE.STRING; // For string and other type
        if (type === "boolean")
          formatType[key] = VERTEX_FORMAT_TYPE.BOOLEAN; // For boolean

        if (type === "object" && Array.isArray(value))
          formatType[key] = VERTEX_FORMAT_TYPE.ARRAY; // For array

        if (type === "number")
          formatType[key] = VERTEX_FORMAT_TYPE.NUMBER; // For number
      }

      container.vertexFormatType[groupType] = formatType;
    });
  }

  getVertexTypesShowFull(data, container) {
    const group = data["VERTEX_GROUP"];
    const vertex = data["VERTEX"];
    let len = group.length;
    for (let i = 0; i < len; i++) {
      let groupType = group[i].groupType;
      let groupOption = group[i].option;
      let lenOpt = groupOption.length;
      for (let j = 0; j < lenOpt; j++) {
        let option = groupOption[j];
        let groupVertex = _.filter(vertex, (e) => {
            return e.groupType === groupType;
          }
        );
        let groupAction = [];
        groupVertex.forEach(e => {
          groupAction.push(e.vertexType);
        });
        container.groupVertexOption[option] = groupAction;
      }
    }
  }

  processDataVertexTypeDefine(data, container) {

    this.resetVertexDefinition();

    const {VERTEX_GROUP} = data;
    container.vertexGroup = VERTEX_GROUP;
    this.getVertexFormatType(VERTEX_GROUP, container);
    //this.getVertexTypesShowFull(data, container);
  }

  /**
   * Validate Graph Data Structure
   * with embedded vertex type
   * Validate content
   */
  async validateGraphDataStructure(data) {
    //Validate data exists
    if(data===undefined)
    {
      console.log("Data does not exist");
      return Promise.resolve("error");
    }

    // Validate struct data
    if (!data.vertex || !data.boundary || !data.position || !data.vertexTypes ||
      (Object.keys(data.vertexTypes).length === 0 && data.vertexTypes.constructor === Object)) {
      console.log("Data Graph Structure is corrupted. You should check it!");
      return Promise.resolve("error");
    }

    // Validate embedded vertex type with vertices
    let dataTypes = data.vertexTypes['VERTEX'];
    let vertices = this.removeDuplicates(data.vertex, "vertexType");
    let types = this.getListVertexType(dataTypes);
    for (let vertex of vertices) {

      let type = vertex.vertexType;
      // If vertex type not exit in embedded vertex type
      if (types.indexOf(type) < 0) {
        console.log("[Graph Data Structure] Vertex type not exits in embedded vertex type");
        return Promise.resolve("warning");
      }

      // Validate data key between embedded vertex and vetex in graph.
      let dataSource = vertex.data;
      let dataTarget = _.find(dataTypes, {'vertexType': type});
      let keySource = Object.keys(dataSource[0] || {});
      let keyTarget = Object.keys(dataTarget.data[0] || {});

      // Check length key
      if (this.checkLengthMisMatch(keySource, keyTarget)) {
        console.log("[Graph Data Structure] Data's length is different");
        return Promise.resolve("warning");
      }

      // Check mismatch key
      let flag = await this.checkKeyMisMatch(keySource, keyTarget);

      if (flag) {
        console.log("[Graph Data Structure] Key vertex at source not exit in target");
        return Promise.resolve("warning");
      }
    }

    return Promise.resolve("ok");
  }

  /**
   * Validate Vertex Define Structure
   */
  async validateVertexDefineStructure(data) {

    //Validate data exists
    if(data===undefined)
    {
      return Promise.resolve(true);
    }

    // Option vertex type definition but choose graph type file
    if (data.vertex || data.edge || data.boundary || data.position || data.vertexTypes) {
      return Promise.resolve(true);
    }

    // Option vertex type definition but choose mapping type file
    if (data.inputMessage||data.operations||data.outputMessage||data.edges){
      return Promise.resolve(true);
    }
  }

  /**
   * Removing Duplicate Objects From An Array By Property
   * @param myArr
   * @param prop
   * @author: Dwayne
   * @reference: https://ilikekillnerds.com/2016/05/removing-duplicate-objects-array-property-name-javascript/
   */
  removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
  }

  /**
   * get list vertex type of graph
   * @param array data
   * @returns {*}
   */
  getListVertexType(data) {
    let types = [];
    let len = data.length;
    for (let i = 0; i < len; i++) {
      let type = data[i];
      types.push(type.vertexType);
    }

    return types;
  }

  /**
   * Check length of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
  checkLengthMisMatch(src, tgt) {
    return src.length != tgt.length ? true : false;
  }

  /**
   * Check key of source and target is match
   * @param src
   * @param tgt
   * @returns {boolean}
   */
  checkKeyMisMatch(src, tgt) {
    let misMatch = false;
    src.forEach(key => {
      if (tgt.indexOf(key) < 0) {
        misMatch = true;
      }
    });

    return Promise.resolve(misMatch);
  }

  getContentGraphAsJson() {
    let dataContent = {VERTEX_GROUP: [], VERTEX: []};

    if (this.isEmptyContainerData(this.dataContainer)){
      return Promise.reject("There is no Input data. Please import!");
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

    const cloneVertexDefine = _.cloneDeep(this.vertexDefinition);

    if(this.vertexDefinition.vertexGroup){
      dataContent.VERTEX_GROUP = cloneVertexDefine.vertexGroup;
    }

    return Promise.resolve(dataContent);
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

    vertex.data.forEach(e => {
      resObj.data.push({
        name        : e.name,
        type        : e.type,
        usage       : e.usage,
        format      : e.format,
        repeat      : e.repeat,
        description : e.description
      });
    });

    return resObj;
  }

  isEmptyContainerData(containerData){
    return (containerData.vertex.length == 0 && containerData.boundary.length == 0)
  }

  resetVertexDefinition(){
    this.vertexDefinition.groupVertexOption = {};
    this.vertexDefinition.vertexFormatType = {};
    this.vertexDefinition.vertexFormat = {};
    this.vertexDefinition.vertexGroupType = {};
    this.vertexDefinition.headerForm = {};
    this.vertexDefinition.vertexPresentation = {};
    this.vertexDefinition.vertexGroup = null;
    this.vertexDefinition.keyPrefix = {type:{}};
  }
}
  
export default CltSegment;
