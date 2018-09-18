import * as d3 from 'd3';
import _ from 'lodash';
import ObjectUtils from '../../common/utilities/object.ult';
import SegmentMgmt from '../common-objects/objects/segment-mgmt';
import EdgeMgmt from '../common-objects/objects/edge-mgmt';
import MainMenuSegment from '../common-objects/menu-context/main-menu-segment';

import {
  comShowMessage,
  setSizeGraph,
  setMinBoundaryGraph
} from '../../common/utilities/common.ult';

import { 
  DEFAULT_CONFIG_GRAPH, VIEW_MODE, VERTEX_ATTR_SIZE, PADDING_POSITION_SVG,
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
      edgeMgmt : this.edgeMgmt,
     // parent: this
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
    
    this.sortByName();
  }

  showFull(){
    this.isShowReduced = false;
    
    this.dataContainer.vertex.forEach((vertex) => {
      let arrProp = d3.select(`#${vertex.id}`).selectAll('.property').classed("hide", false)._groups[0];
      d3.select(`#${vertex.id}`).select('foreignObject').attr("height", VERTEX_ATTR_SIZE.HEADER_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT * arrProp.length);
    });

    this.sortByName();
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
    await this.sortByName();

    this.initMenuContext();
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

  sortBySize() {
    let arrSort =  _.clone(this.dataContainer.vertex);

    // Sort descending by data lenght of vertex
    arrSort.sort(function (a,b) {
      return b.data.length - a.data.length;
    });

    // get height for all vertex
    for (let i = 0; i < arrSort.length; i++) {
      const $vSelector = $(`#${arrSort[i].id}`);
      arrSort[i].height = $vSelector.get(0).getBoundingClientRect().height;
    }
   
    const nMarginRight = 5;
    const nMarginBottom = 5;
    const $container = $(`#${this.graphContainerId}`);
    const {width: cntrW} = $container.get(0).getBoundingClientRect();
    let columnCount = parseInt((cntrW - ((parseInt(cntrW / VERTEX_ATTR_SIZE.GROUP_WIDTH) - 1) * nMarginRight)) / VERTEX_ATTR_SIZE.GROUP_WIDTH);
    if (columnCount < 1) columnCount = 1;

    // Fist arrange
    let arrSort2 = [];
    let arrLenght = [];
    for (let i = 0; i < columnCount && i < arrSort.length; i++) {
      let arr = [];
      arrSort[i].y = PADDING_POSITION_SVG.MIN_OFFSET_Y;
      arr.push(arrSort[i]);
      arrSort2.push(arr);
      arrLenght[i] = PADDING_POSITION_SVG.MIN_OFFSET_Y + arrSort[i].height;
    }

    // Calculate for sorting
    if (arrSort.length > columnCount) {
      let nCount = columnCount;
      while (nCount < arrSort.length) {
        // Find the column has the min height
        let indexOfMin = this.indexOfMinOf(arrLenght);

        arrSort[nCount].y = arrLenght[indexOfMin] + nMarginBottom;
        arrSort2[indexOfMin].push(arrSort[nCount]);
        arrLenght[indexOfMin] += arrSort[nCount].height + nMarginBottom;

        nCount++;
      }
    }

    // Arrange all vertex with arrSort2 was made
    let x = PADDING_POSITION_SVG.MIN_OFFSET_X;

    for (let row = 0; row < arrSort2.length; row++) {
      for (let col = 0; col < arrSort2[row].length; col++) {
        const vertex = _.find(this.dataContainer.vertex, {"id": arrSort2[row][col].id});
        vertex.setPosition({x, y: arrSort2[row][col].y});
      }
      x += VERTEX_ATTR_SIZE.GROUP_WIDTH + nMarginRight;
    }

    setMinBoundaryGraph(this.dataContainer, this.graphSvgId);
  }

  sortByName() {
    let arrSort =  _.clone(this.dataContainer.vertex);

    arrSort.sort(function (a,b) {
      return (a.name.toUpperCase()).localeCompare((b.name.toUpperCase()));
    });

    // get height for all vertex
    for (let i = 0; i < arrSort.length; i++) {
      const $vSelector = $(`#${arrSort[i].id}`);
      arrSort[i].height = $vSelector.get(0).getBoundingClientRect().height;
    }
   
    const nMarginRight = 5;
    const nMarginBottom = 5;
    const $container = $(`#${this.graphContainerId}`);
    const {width: cntrW} = $container.get(0).getBoundingClientRect();
    let columnCount = parseInt((cntrW - ((parseInt(cntrW / VERTEX_ATTR_SIZE.GROUP_WIDTH) - 1) * nMarginRight)) / VERTEX_ATTR_SIZE.GROUP_WIDTH);
    if (columnCount < 1) columnCount = 1;

    // Fist arrange
    let arrSort2 = [];
    let arrLenght = [];
    for (let i = 0; i < columnCount && i < arrSort.length; i++) {
      let arr = [];
      arrSort[i].y = PADDING_POSITION_SVG.MIN_OFFSET_Y;
      arr.push(arrSort[i]);
      arrSort2.push(arr);
      arrLenght[i] = PADDING_POSITION_SVG.MIN_OFFSET_Y + arrSort[i].height;
    }

    // Calculate for sorting
    if (arrSort.length > columnCount) {
      let nCount = columnCount;
      while (nCount < arrSort.length) {
        // Find the column has the min height
        let indexOfMax = this.indexOfMaxOf(arrLenght);
        const maxLength = arrLenght[indexOfMax];
        const y = arrLenght[indexOfMax] + nMarginBottom;

        for (let i = 0; i < columnCount && nCount < arrSort.length; i++) {
          arrSort[nCount].y = y;
          arrSort2[i].push(arrSort[nCount]);

          arrLenght[i] = maxLength + nMarginBottom + arrSort[nCount].height;

          nCount++;
        }
      }
    }

    // Arrange all vertex with arrSort2 was made
    let x = PADDING_POSITION_SVG.MIN_OFFSET_X;

    for (let row = 0; row < arrSort2.length; row++) {
      for (let col = 0; col < arrSort2[row].length; col++) {
        const vertex = _.find(this.dataContainer.vertex, {"id": arrSort2[row][col].id});
        vertex.setPosition({x, y: arrSort2[row][col].y});
      }
      x += VERTEX_ATTR_SIZE.GROUP_WIDTH + nMarginRight;
    }

    setMinBoundaryGraph(this.dataContainer, this.graphSvgId);
  }

  indexOfMinOf(arr) {
    if (arr.length == 0) return -1;

    let min = arr[0];
    let index = 0;

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i];
        index = i;
      }
    }

    return index;
  }

  indexOfMaxOf(arr) {
    if (arr.length == 0) return -1;

    let max = arr[0];
    let index = 0;

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i];
        index = i;
      }
    }

    return index;
  }
}
  
export default CltSegment;
