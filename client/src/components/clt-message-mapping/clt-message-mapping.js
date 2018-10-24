import * as d3 from 'd3';
import _ from 'lodash';
import InputMgmt from './input-mgmt/input-mgmt';
import OutputMgmt from './output-mgmt/output-mgmt';
import OperationsMgmt from './operations-mgmt/operations-mgmt';
import ConnectMgmt from './connect-mgmt/connect-mgmt';
import ObjectUtils from '../../common/utilities/object.ult';

import {
  comShowMessage,
  setMinBoundaryGraph
} from '../../common/utilities/common.ult';

import { 
  VERTEX_FORMAT_TYPE, VERTEX_ATTR_SIZE, BOUNDARY_ATTR_SIZE, TYPE_CONNECT, PADDING_POSITION_SVG
} from '../../common/const/index';
import { isObject } from 'util';


class CltMessageMapping {
  constructor(props) {
    this.selector     = props.selector;
    this.selectorName = this.selector.selector.replace(/[\.\#]/,'');

    this.inputMessageContainerId  = `inputMessageContainer_${this.selectorName}`;
    this.inputMessageSvgId        = `inputMessageSvg_${this.selectorName}`;
    this.outputMessageContainerId = `outputMessageContainer_${this.selectorName}`;
    this.outputMessageSvgId       = `outputMessageSvg_${this.selectorName}`;
    this.operationsContainerId    = `operationsContainer_${this.selectorName}`;
    this.operationsSvgId          = `operationsSvg_${this.selectorName}`;
    this.connectSvgId             = `connectSvg_${this.selectorName}`;

    this.initialize();
  }

  initialize() {

    this.objectUtils = new ObjectUtils();
    this.initSvgHtml();

    this.storeConnect = {
      edge: [],
    };
    this.storeInputMessage = {
      vertex: [],
      boundary: [],
    };
    this.storeOperations = {
      vertex: [],
      boundary: [],
    };
    this.storeOutputMessage = {
      vertex: [],
      boundary: [],
    };

    this.connectMgmt = new ConnectMgmt({
      mainSelector: this.selector,
      svgId: this.connectSvgId,
      storeConnect: this.storeConnect,
      storeInputMessage: this.storeInputMessage,
      storeOperations: this.storeOperations,
      storeOutputMessage: this.storeOutputMessage,

    });

    this.inputMgmt = new InputMgmt({
      mainSelector: this.selector,
      containerId: this.inputMessageContainerId,
      svgId: this.inputMessageSvgId,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      dataContainer: this.storeInputMessage
    });

    this.outputMgmt = new OutputMgmt({
      mainSelector: this.selector,
      containerId: this.outputMessageContainerId,
      svgId: this.outputMessageSvgId,
      edgeMgmt: this.connectMgmt.edgeMgmt,
      dataContainer: this.storeOutputMessage
    });

    this.operationsMgmt = new OperationsMgmt({
      mainSelector: this.selector,
      containerId: this.operationsContainerId,
      svgId: this.operationsSvgId,
      edgeMgmt: this.connectMgmt.edgeMgmt,
			dataContainer: this.storeOperations,
			parent: this
    });

    this.initCustomFunctionD3();
    this.objectUtils.initListenerContainerScroll(this.inputMessageContainerId, this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    this.objectUtils.initListenerContainerScroll(this.operationsContainerId, this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    this.objectUtils.initListenerContainerScroll(this.outputMessageContainerId, this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    this.initListenerOnWindowResize();
		this.initOnMouseUpBackground();
  };

  initSvgHtml(){
    let sHtml = 
    `<div id="${this.inputMessageContainerId}" class="left-svg container-svg" ref="${this.inputMessageSvgId}">
        <svg id="${this.inputMessageSvgId}" class="svg"></svg>
      </div>
      <div id="${this.operationsContainerId}" class="middle-svg container-svg" ref="${this.operationsSvgId}">
        <svg id="${this.operationsSvgId}" class="svg"></svg>
      </div>
      <div id="${this.outputMessageContainerId}" class="right-svg container-svg" ref="${this.outputMessageSvgId}">
        <svg id="${this.outputMessageSvgId}" class="svg"></svg>
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

  initListenerOnWindowResize() {
    $(window).resize(() => {

      if(this.connectMgmt.edgeMgmt.isSelectingEdge()){
        this.connectMgmt.edgeMgmt.cancleSelectedPath();
      }

      this.inputMgmt.setCenterAlignmentGarph();
      this.outputMgmt.setCenterAlignmentGarph();
      
      this.objectUtils.updatePathConnectOnWindowResize(this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
    });
  }

  initOnMouseUpBackground() {
    let selector = this.selector.prop("id");

    if (selector == ""){
      selector = `.${this.selector.prop("class")}`;
    }else{
      selector = `#${selector}`;
    }
    
    let tmpEdgeMgmt = this.connectMgmt.edgeMgmt;
    d3.select(selector).on("mouseup", function(){
      let mouse = d3.mouse(this);
      let elem = document.elementFromPoint(mouse[0], mouse[1]);

      //disable selecting effect if edge is selecting
      if((!elem || !elem.tagName || elem.tagName != 'path') && tmpEdgeMgmt.isSelectingEdge()) {
        tmpEdgeMgmt.cancleSelectedPath();
      }
    })
  }

  async LoadInputMessage(graphData){
    
    let resMessage = await this.validateGraphDataStructure(graphData);

    if(resMessage != "ok"){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    let isError = this.validatesSameGraph(graphData, "I");
    if( isError ){
      comShowMessage("There was duplicate data with Output graph.\nYou should check it or choose another one!");
      return;
    }

    //clear data
    this.connectMgmt.clearInputEdges();
    this.inputMgmt.clearAll();

    //Reload Vertex Define and draw graph
    const {vertexTypes} = graphData;
    this.inputMgmt.processDataVertexTypeDefine(vertexTypes);
    this.inputMgmt.drawObjectsOnInputGraph(graphData);
    this.inputMgmt.initMenuContext();

    setMinBoundaryGraph(this.storeInputMessage,this.inputMessageSvgId, this.inputMgmt.viewMode.value);
  }

  async LoadOutputMessage(graphData){
    const {vertexTypes} = graphData;

    let resMessage = await this.validateGraphDataStructure(graphData);

    if(resMessage != "ok"){
      comShowMessage("Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    let isError= await this.validatesSameGraph(graphData, "O");
    if( isError ){
      comShowMessage("There was duplicate data with Iutput graph.\nYou should check it or choose another one!");
      return;
    }

    //clear data
    this.connectMgmt.clearOutputEdges();
    this.outputMgmt.clearAll();

    //Reload Vertex Define and draw graph
    await this.outputMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.outputMgmt.drawObjectsOnOutputGraph(graphData);
    this.outputMgmt.initMenuContext();

    setMinBoundaryGraph(this.storeOutputMessage,this.outputMessageSvgId, this.outputMgmt.viewMode.value);
  }

  async LoadMesseageMapping(messageMappingData){
    const {inputMessage, outputMessage, operations, edges} = messageMappingData;

     //Validate Input data
    let resMessage = await this.validateGraphDataStructure(inputMessage);

    if(resMessage != "ok"){
      comShowMessage("Input Message: Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

   //Validate Output data
    resMessage = await this.validateGraphDataStructure(outputMessage);

    if(resMessage != "ok"){
      comShowMessage("Output Message: Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    //Validate Operations data
    resMessage = await this.validateGraphDataStructure(operations);

    if(resMessage != "ok"){
      comShowMessage("Operations Message: Format or data in Data Graph Structure is corrupted. You should check it!");

      if(resMessage == "error")
        return;
    }

    //Clear all data
    this.inputMgmt.clearAll();
    this.operationsMgmt.clearAll();
    this.outputMgmt.clearAll();
    this.connectMgmt.clearAll();

    //Input Graph - Reload Vertex define and draw new graph
    let vertexTypes = inputMessage.vertexTypes;
    await this.inputMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.inputMgmt.drawObjectsOnInputGraph(inputMessage);
    this.inputMgmt.initMenuContext();

    //Output Graph - Reload Vertex define and draw new graph
    vertexTypes = {};
    vertexTypes = outputMessage.vertexTypes;
    await this.outputMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.outputMgmt.drawObjectsOnOutputGraph(outputMessage);
    this.outputMgmt.initMenuContext();

    //Operations Graph - Reload Vertex define and draw new graph.
    vertexTypes = {};
    vertexTypes = operations.vertexTypes;
    await this.operationsMgmt.processDataVertexTypeDefine(vertexTypes);
    await this.operationsMgmt.drawObjectsOnOperationsGraph(operations);
    this.operationsMgmt.initMenuContext();
    
    //Draw edges
    this.edgeVerifySvgId(edges);
    await this.connectMgmt.drawEdgeOnConnectGraph(edges);

    setMinBoundaryGraph(this.storeInputMessage,this.inputMessageSvgId, this.inputMgmt.viewMode.value);
    setMinBoundaryGraph(this.storeOutputMessage,this.outputMessageSvgId, this.outputMgmt.viewMode.value);
    setMinBoundaryGraph(this.storeOperations,this.operationsSvgId, this.operationsMgmt.viewMode.value);

    //Solve in case of save and import from different window size
    await this.objectUtils.updatePathConnectOnWindowResize(this.connectMgmt.edgeMgmt, [this.storeInputMessage, this.storeOperations, this.storeOutputMessage]);
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

  LoadOperationsVertexDefinition(vertexDefinitionData){
    if (this.operationsMgmt.LoadVertexDefinition(vertexDefinitionData)) {
      this.operationsMgmt.initMenuContext();
    }
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

  /**
   * Check duplicate data when import Input or Output graph
   * @param dataContainer the data of current graph
   * @param type type current graph (Input: "I", Output: "O")
   */
  validatesSameGraph(dataContainer, type){

    //Variable to store data of the other
    let tmpDataContainer = {};

    if(type == "I"){
      tmpDataContainer = this.storeOutputMessage;
    }else{
      tmpDataContainer = this.storeInputMessage;
    }

    //Check duplicate Vertex ID between Input and Output
    if (tmpDataContainer.vertex.length > 0){
      for (let vertext1 of dataContainer.vertex){
        for (let vertext2 of tmpDataContainer.vertex){
          if(vertext1.id === vertext2.id)
            return true;
        }
      }
    }

    //Check duplicate Boundary ID between Input and Output
    if(tmpDataContainer.boundary.length > 0){
      for (let boudary1 of dataContainer.boundary){
        for (let boudary2 of tmpDataContainer.boundary){
          if(boudary1.id === boudary2.id)
            return true;
        }
      }
    }

   return false;
  }

  getContentGraphAsJson() {
    let dataContent = {inputMessage: {}, outputMessage: {}, operations: {}, edges: []};

    let inputMessage  = {vertex: [], boundary: [],position: [], vertexTypes: {}};
    let outputMessage = {vertex: [], boundary: [],position: [], vertexTypes: {}};
    let operations    = {vertex: [], boundary: [],position: [], vertexTypes: {}};

    if (this.isEmptyContainerData(this.storeInputMessage)){
      return Promise.reject("There is no Input data. Please import!");
    } 
    if (this.isEmptyContainerData(this.storeOutputMessage)){
      return Promise.reject("There is no Output data. Please import!");
    } 
    if (this.isEmptyContainerData(this.storeOperations)){
      return Promise.reject("There is no Operations data!");
    } 

    // Process data to export
    // Need clone data cause case user export
    // later continue edit then lost parent scope
    // Purpose prevent reference data.

    //Input data
    const cloneInputData = _.cloneDeep(this.storeInputMessage);
    cloneInputData.vertex.forEach(vertex => {
      let pos = new Object({
        "id": vertex.id,
        "x": vertex.x,
        "y": vertex.y
      });

      inputMessage.vertex.push(this.getSaveDataVertex(vertex));
      inputMessage.position.push(pos);
    });

    cloneInputData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      inputMessage.boundary.push(this.getSaveDataBoundary(boundary));
      inputMessage.position.push(pos);
    });

    const cloneVertexInputDefine = _.cloneDeep(this.inputMgmt.vertexMgmt.vertexDefinition);

    let inputVertexDefine = {};
    if(cloneVertexInputDefine.vertexGroup){
      inputVertexDefine = {
        "VERTEX_GROUP": this.getSaveVertexGroup(cloneVertexInputDefine.vertexGroup),
        "VERTEX": cloneVertexInputDefine.vertex
      };
    }
    inputMessage.vertexTypes = inputVertexDefine;

    //Output data

    const cloneOutputData = _.cloneDeep(this.storeOutputMessage);
    cloneOutputData.vertex.forEach(vertex => {
      let pos = new Object({
        "id": vertex.id,
        "x": vertex.x,
        "y": vertex.y
      });

      outputMessage.vertex.push(this.getSaveDataVertex(vertex));
      outputMessage.position.push(pos);
    });

    cloneOutputData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      outputMessage.boundary.push(this.getSaveDataBoundary(boundary));
      outputMessage.position.push(pos);
    });

    const cloneVertexOutputDefine = _.cloneDeep(this.outputMgmt.vertexMgmt.vertexDefinition);

    let outputVertexDefine = {};
    if(cloneVertexOutputDefine.vertexGroup){
      outputVertexDefine = {
        "VERTEX_GROUP": this.getSaveVertexGroup(cloneVertexOutputDefine.vertexGroup),
        "VERTEX": cloneVertexOutputDefine.vertex
      };
    }
    outputMessage.vertexTypes = outputVertexDefine;

    //Operations data
    const cloneOperationsData = _.cloneDeep(this.storeOperations);
    cloneOperationsData.vertex.forEach(vertex => {
      let pos = new Object({
        "id": vertex.id,
        "x": vertex.x,
        "y": vertex.y
      });

      operations.vertex.push(this.getSaveDataVertex(vertex));
      operations.position.push(pos);
    });

    cloneOperationsData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      operations.boundary.push(this.getSaveDataBoundary(boundary));
      operations.position.push(pos);
    });

    const cloneVertexOperationDefine = _.cloneDeep(this.operationsMgmt.vertexMgmt.vertexDefinition);
    let operationVertexDefine = {};
    if(cloneVertexOperationDefine.vertexGroup){
      operationVertexDefine = {
        "VERTEX_GROUP": this.getSaveVertexGroup(cloneVertexOperationDefine.vertexGroup),
        "VERTEX": cloneVertexOperationDefine.vertex
      };
    }
    operations.vertexTypes = operationVertexDefine;

    //Edges    
    let edges = [];
    const cloneEdgesData = _.cloneDeep(this.storeConnect);
    cloneEdgesData.edge.forEach(edge => {
      edges.push(this.getSaveDataEdge(edge));
    })

    //Data content
    dataContent.inputMessage = inputMessage;
    dataContent.outputMessage = outputMessage;
    dataContent.operations = operations;
    dataContent.edges = edges;

    return Promise.resolve(dataContent);
  }

  /**
   * Filter properties that need to save
   * @param {*} boundary 
   */
  getSaveDataBoundary(boundary){
    return {
      name: boundary.name,
      description: boundary.description,
      member: boundary.member,
      id: boundary.id,
      width: boundary.width,
      height: boundary.height,
      parent: boundary.parent,
      mandatory: boundary.mandatory,
      repeat: boundary.repeat,
      svgId: boundary.svgId
    };
  }

  /**
   * Filter properties that need to save
   * @param {*} vertex 
   */
  getSaveDataVertex(vertex){
    return {
      vertexType: vertex.vertexType,
      name: vertex.name,
      description: vertex.description,
      data: vertex.data,
      id: vertex.id,
      groupType: vertex.groupType,
      parent: vertex.parent,
      mandatory: vertex.mandatory,
      repeat: vertex.repeat,
      svgId: vertex.svgId
    };
  }

  /**
   * Filter properties that need to save
   * @param {*} edge 
   */
  getSaveDataEdge(edge){
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      note: {
        originNote: edge.originNote,
        middleNote: edge.middleNote,
        destNote: edge.destNote,

      },
      style:{
        line: edge.lineType,
        arrow: edge.useMarker
      }
    };
  }

  isEmptyContainerData(containerData){
    return (containerData.vertex.length == 0 && containerData.boundary.length == 0)
  }

  /**
   * If loading from another svgId, then correct by curent svgId
   */
  edgeVerifySvgId(edges){
    if (edges.length > 0){
      let oldSvgId = edges[0].source.svgId;
      let index = edges[0].source.svgId.indexOf('_');
      let oldSelectorName = oldSvgId.substring(index + 1, oldSvgId.length);

      if (oldSelectorName != this.selectorName){
        edges.forEach(e => {
          e.source.svgId = e.source.svgId.replace(oldSelectorName, this.selectorName);
          e.target.svgId = e.target.svgId.replace(oldSelectorName, this.selectorName);
        });
      }
    }
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

	operationsAutoAlignment() {
		let arrRes = [];
		let operationsContainer = _.cloneDeep(this.storeOperations);
		
		// All edge start from input message
		let arrEdgeStartFromInput = [];
		arrEdgeStartFromInput = this.storeConnect.edge.filter(e => {
			return e.source.svgId == this.inputMessageSvgId && e.target.svgId == this.operationsSvgId
		})
		
		// sort from top to bottom
		arrEdgeStartFromInput.sort(function(a, b){
			return a.source.y - b.source.y
		})

		// Find all object connect to input area		
		arrEdgeStartFromInput.forEach(e => {
			let object = null;
			if (e.target.vertexId[0] == "V") {
				object = _.remove(operationsContainer.vertex, el => {
					return el && el.id == e.target.vertexId;
				})
			} else {
				object = _.remove(operationsContainer.boundary, el => {
					return el && el.id == e.target.vertexId;
				})
			}

			if (object.length > 0) {
				if (object[0].parent) {
					let parent = _.remove(operationsContainer.boundary, {"id":object[0].parent});
					if (parent.length > 0) {
						arrRes.push(parent[0]);
					}
				} else {
					arrRes.push(object[0]);
				}
			}
		})

		// Finding and pushing objects related to each object in current array
		for(let i = 0; i < arrRes.length; i++) {
			this.findNextObjects(arrRes[i], operationsContainer);
		}

		// Find longest way for each line
		let arrLongestLine = [];
		for(let i = 0; i < arrRes.length; i++) {
			let arrLine = [];
			arrLongestLine.push(arrLine);
			let line = [];
			arrLine.push(line);
			this.findLongestLine(arrRes[i], line, arrLine);
		}

		this.removeUnexpectedResult(arrLongestLine);

		let arrFinalResult = this.mergeFinalResult(arrLongestLine);

		// link to real object
		for (let i = 0; i < arrFinalResult.length; i++) {
			for (let j = 0; j < arrFinalResult[i].length; j++) {
				for (let k = 0; k < arrFinalResult[i][j].length; k++) {
					if (arrFinalResult[i][j][k].type == "V") {
						arrFinalResult[i][j][k] = _.find(this.storeOperations.vertex, {"id": arrFinalResult[i][j][k].id})
					} else {
						arrFinalResult[i][j][k] = _.find(this.storeOperations.boundary, {"id": arrFinalResult[i][j][k].id})
					}
				}
			}
		}

		// Arrange and calculate to avoid edge draw through objects
		let top = 5;
		for (let i = 0; i < arrFinalResult.length; i++) {
			if (i > 0) {
				top = this.maxHeight(arrFinalResult[i-1]) + 100;
			}

			// Arrange for each line
			this.arrangeLine(arrFinalResult[i], top);
			
			// avoid edge draw draw through objects for each line
			this.avoidEdgeGoThrowObject(arrFinalResult[i]);
		}

		// ============================ Arrange for mapping constanst output message ================================================

		let arrMappingConstObj = []
		// Find all object connect to output message
		this.storeConnect.edge.forEach(e => {
			if (e.target.svgId == this.outputMessageSvgId && e.source.svgId == this.operationsSvgId) {
				let object = null;
				if (e.source.vertexId[0] == "V") {
					object = _.remove(operationsContainer.vertex, el => {
						return el && el.id == e.source.vertexId;
					})
				} else {
					object = _.remove(operationsContainer.boundary, el => {
						return el && el.id == e.source.vertexId;
					})
				}

				if (object.length > 0) {
					if (object[0].parent) {
						let parent = _.remove(operationsContainer.boundary, {"id":object[0].parent});
						if (parent.length > 0) {
							arrMappingConstObj.push(parent[0]);
						}
					} else {
						arrMappingConstObj.push(object[0]);
					}
				} 
			}
		})

		// Remove all objects that have left connection
		this.storeConnect.edge.forEach(e => {
			_.remove(arrMappingConstObj, item => {
				return item.id == e.target.vertexId;
			})
		})

		// link to real object
		for (let i = 0; i < arrMappingConstObj.length; i++) {
			if (arrMappingConstObj[i].type == "V") {
				arrMappingConstObj[i] = _.find(this.storeOperations.vertex, {"id": arrMappingConstObj[i].id})
			} else {
				arrMappingConstObj[i] = _.find(this.storeOperations.boundary, {"id": arrMappingConstObj[i].id})
			}
		}

		// Find all edges connect to arrMappingConstObj
		let listEdgeConnectToMappingConstObj = [];
		this.storeConnect.edge.forEach((edge) => {
			arrMappingConstObj.forEach(item => {
				if (this.isNodeConnectToObject(item, edge.source)) {
					listEdgeConnectToMappingConstObj.push(edge);	
				}
			})
		})

		// Move all Mapping Constant object to a temp place then arrange them by new position
		arrMappingConstObj.forEach(item => {
			item.setPosition({x: 5, y: 5});
		})

		// get the coordinate in output svg for target
		listEdgeConnectToMappingConstObj = _.cloneDeep(listEdgeConnectToMappingConstObj);
		listEdgeConnectToMappingConstObj.forEach((item, index) => {
			this.doCalculateCoordinateForNodeOfEdge(item.target, TYPE_CONNECT.INPUT, this.storeOutputMessage);
			this.doCalculateCoordinateForNodeOfEdge(item.source, TYPE_CONNECT.OUTPUT, this.storeOperations);
		})

		// sort by y coordinate from Top to Bottom then use them to arrange Mapping constant from Top to Bottom
		listEdgeConnectToMappingConstObj.sort(function(a, b){
			return a.target.y - b.target.y
		})

		// start arrange Mapping Constant object
		let arrArrangedObj = [];
		let {maxLength, index} = this.maxLength(arrFinalResult);

		let rect = $(`#${arrFinalResult[index][maxLength-1][0].id}`).get(0).getBoundingClientRect();
		let maxLengthLine = arrFinalResult[index][maxLength-1][0].x + rect.width;

		listEdgeConnectToMappingConstObj.forEach((edge, index) => {
			if (!_.find(arrArrangedObj, {"id": edge.source.vertexId})) {
				let obj = _.find(arrMappingConstObj, {"id": edge.source.vertexId});
				if (!obj) {
					obj = _.find([].concat(this.storeOperations.vertex).concat(this.storeOperations.boundary), {"id": edge.source.vertexId});
				}

				if (obj && obj.parent) {
					obj = _.find(arrMappingConstObj, {"id": obj.parent});
				}
				this.arrangeForMappingConstantObject(obj, edge, maxLengthLine);
				arrArrangedObj.push(obj);
				if (obj.type == "B") {
					obj.member.forEach(item => {
						arrArrangedObj.push(item);
					})
				}
			}
		})

		setMinBoundaryGraph(this.storeOperations, this.operationsSvgId, this.operationsMgmt.viewMode.value);
	}

	/**
	 * 
	 * @param {*} object 
	 * @param {*} edge 
	 * @param {*} maxLengthLine 
	 */
	arrangeForMappingConstantObject(object, edge, maxLengthLine) {
		// distance from top to edge.source.y of object
		let offset = edge.source.y - object.y;

		let finalX = maxLengthLine + 200;
		let finalY = edge.target.y - offset < PADDING_POSITION_SVG.MIN_OFFSET_Y ? PADDING_POSITION_SVG.MIN_OFFSET_Y : edge.target.y - offset;

		let rect = $(`#${object.id}`).get(0).getBoundingClientRect();
		let overridePosition;
		while ((overridePosition = this.haveOverride({id: object.id, x: finalX, y: finalY, width: rect.width, height: rect.height})) != -1) {
			finalY = overridePosition + 5;
		}

		object.setPosition({x: finalX, y: finalY});
	}

	/**
	 * 
	 * @param {*} objectId 
	 * @param {*} point 
	 */
	haveOverride(objectInfo) {
		for (let i = 0; i < this.storeOperations.boundary.length; i++){
			let boundary = this.storeOperations.boundary[i];
			if (boundary.id != objectInfo.id && this.isOverride(objectInfo, boundary)) {
				return boundary.y + boundary.height;
			}
		}

		for (let i = 0; i < this.storeOperations.vertex.length; i++){
			let vertex = this.storeOperations.vertex[i];
			let rect = $(`#${vertex.id}`).get(0).getBoundingClientRect();
			if (vertex.id != objectInfo.id && this.isOverride(objectInfo, {x: vertex.x, y: vertex.y, width: rect.width, height: rect.height})) {
				return vertex.y + rect.height;
			}
		}

		return -1;
	}

	isOverride(object1, object2) {
		if (
			(	// Top Left of object1 is in object2
				(object1.y >= object2.y && object1.x >= object2.x && object1.y <= object2.y + object2.height + 4 && object1.x <= object2.x + object2.width)
				// Top Right of object1 is in object2
				|| (object1.y >= object2.y && object1.y <= object2.y + object2.height + 4 && object1.x + object1.width >= object2.x && object1.x + object1.width <= object2.x + object2.width)
				// Bottom left of object1 is in object2
				|| (object1.y + object1.height >= object2.y && object1.y + object1.height <= object2.y + object2.height + 4 && object1.x >= object2.x && object1.x <= object2.x + object2.width)
				// Bottom Right of object1 is in object2
				|| (object1.y  + object1.height >= object2.y && object1.y + object1.height <= object2.y + object2.height + 4 && object1.x + object1.width >= object2.x && object1.x + object1.width <= object2.x + object2.width)
			)
			||
			( // Top Left of object2 is in object1
				(object2.y >= object1.y && object2.x >= object1.x && object2.y <= object1.y + object1.height + 4 && object2.x <= object1.x + object1.width)
				// Top Right of object2 is in object1
				|| (object2.y >= object1.y && object2.y <= object1.y + object1.height + 4 && object2.x + object2.width >= object1.x && object2.x + object2.width <= object1.x + object1.width)
				// Bottom left of object2 is in object1
				|| (object2.y + object2.height >= object1.y && object2.y + object2.height <= object1.y + object1.height + 4 && object2.x >= object1.x && object2.x <= object1.x + object1.width)
				// Bottom Right of object2 is in object1
				|| (object2.y  + object2.height >= object1.y && object2.y + object2.height <= object1.y + object1.height + 4 && object2.x + object2.width >= object1.x && object2.x + object2.width <= object1.x + object1.width)
			)
		) {
			return true;
		}

		return false;
	}

	/**
	 * 
	 * @param {*} line 
	 * @param {*} top 
	 */
	arrangeLine(line, top) {
		// distance between each object
		let distance = 100;

		for (let i = 0; i < line.length; i++) {
			for (let j = 0; j < line[i].length; j++) {
				let x, y;

				// x
				if (i == 0) {
					x = distance;
				} else {
					let prevObj = line[i - 1][0];

					if (prevObj.type == "V") {
						x = prevObj.x + VERTEX_ATTR_SIZE.GROUP_WIDTH + distance;
					} else {
						x = prevObj.x + prevObj.width + distance;
					}
				}

				// y
				if (j == 0) {
					y = top;
				} else {
					let aboveObj = line[i][j-1];
					let rect = $(`#${aboveObj.id}`).get(0).getBoundingClientRect();
					y = aboveObj.y + rect.height + 5;
				}

				line[i][j].setPosition({x,y});
			}
		}
	}

	/**
	 * 
	 * @param {*} line 
	 */
	avoidEdgeGoThrowObject(line) {
		let listEdge = [];
		this.storeConnect.edge.forEach((edge, index) => {
			if (edge.source.svgId == this.operationsSvgId && edge.target.svgId == this.operationsSvgId) {
				listEdge.push(edge);
			}
		})

		listEdge = _.cloneDeep(listEdge);
		this.calculateCoordinateByOperationsAreaForEdge(listEdge);

		for (let i = 1; i < line.length; i++) {
			for (let j = 0; j < line[i].length; j++) {
				
				let obj = line[i][j];
				let pointRes = null;

				// Find all edge that crossing objects
				listEdge.forEach((item, index)=>{
					let point = this.getIntersectionObject(item, obj);
					// Choose the highest point
					if (point) {
						if (!pointRes || point.y > pointRes.y) {
							pointRes = point;
						}
					}
				})

				// 
				if (pointRes) {
					let offset = pointRes.y - obj.y;
					obj.setPosition({x: obj.x, y: obj.y + offset + 100});

					// update position for below object in the same column
					if (j < line[i].length - 1) {
						for (let k = j + 1; k < line[i].length; k++) {
							line[i][k].setPosition({x: line[i][k-1].x, y: line[i][k-1].y + $(`#${line[i][k-1].id}`).get(0).getBoundingClientRect().height + 5})
						}
					}
				}
			}
		}
	}

	/**
	 * get the intersection point between the edge and object then choose a point that has the highest y coordinate
	 * @param {*} edge 
	 * @param {*} object 
	 */
	getIntersectionObject(edge, object) {

		if (object.type == "B") {
			if (!this.notIn(object.member, edge.target.vertexId) || !this.notIn(object.member, edge.source.vertexId)) return null;
		}

		let inputRect = $(`#${this.inputMessageContainerId}`).get(0).getBoundingClientRect();
		inputRect.width = 0;

		// edge
		let eA = {x: edge.source.x, y: edge.source.y};
		let eB = {x: edge.target.x, y: edge.target.y};

		let objRect = $(`#${object.id}`).get(0).getBoundingClientRect();
		// left edge of object
		let leftA = {x: object.x + inputRect.width, y: object.y};
		let leftB = {x: object.x + inputRect.width, y: object.y + objRect.height};

		// right edge of object
		let rightA = {x: object.x + objRect.width + inputRect.width, y: object.y};
		let rightB = {x: object.x + objRect.width + inputRect.width, y: object.y + objRect.height};

		// top edge of object
		let topA = {x: object.x + inputRect.width, y: object.y};
		let topB = {x: object.x + inputRect.width + inputRect.width, y: object.y};

		// bottom edge of object
		let bottomA = {x: object.x + inputRect.width, y: object.y + objRect.height};
		let bottomB = {x: object.x + inputRect.width + inputRect.width, y: object.y + objRect.height};

		let pointRes = null;
		// Left edge
		let point = this.getIntersection({A: leftA, B: leftB}, {A: eA, B: eB});
		if (point && point.y > leftA.y && point.y < leftB.y && point.x > eA.x && point.x < eB.x) {
			if (!pointRes || point.y > pointRes.y) pointRes = point;
		}

		// Right edge
		point = this.getIntersection({A: rightA, B: rightB}, {A: eA, B: eB});
		if (point && point.y > leftA.y && point.y < leftB.y && point.x > eA.x && point.x < eB.x) {
			if (!pointRes || point.y > pointRes.y) pointRes = point;
		}

		// Top edge
		point = this.getIntersection({A: topA, B: topB}, {A: eA, B: eB});
		if (point && point.x > topA.x && point.x < topB.x && point.x > eA.x && point.x < eB.x) {
			if (!pointRes || point.y > pointRes.y) pointRes = point;
		}

		// Bottom edge
		point = this.getIntersection({A: bottomA, B: bottomB}, {A: eA, B: eB});
		if (point && point.x > bottomA.x && point.x < bottomB.x && point.x > eA.x && point.x < eB.x) {
			if (!pointRes || point.y > pointRes.y) pointRes = point;
		}

		return pointRes;
	}

	/**
	 * get intersection between two edges
	 * @param {*} edge1 
	 * @param {*} edge2 
	 */
	getIntersection(edge1, edge2) {
		/* 
			y = ax + b

			With: A(x1,y1), B(x2,y2)

			=> a = (y2 - y1) / (x2 - x1)
			=> b = (y1x2 - y2x1) / (x2 - x1)


			With:
			(d1): y = a1x + b1
			(d2): y = a2x + b2

			=> x = (a1 - a2) / (b2 - b1)
			=> y = (b1*a2 - a1*b2) / (a2 - a1)
		*/

		/* edge1 // edge2 then there is no intersection */
		if (   (edge1.B.x - edge1.A.x == 0 && edge2.B.x - edge2.A.x == 0)
				|| (edge1.B.y - edge1.A.y == 0 && edge2.B.y - edge2.A.y == 0) ) {
					return null;
		}
		
		if (edge1.B.x - edge1.A.x == 0) {
			/* edge1 // Oy */

			let resX = edge1.A.x;

			if (edge2.B.y - edge2.A.y == 0) {
				// edge2 // Ox
				return {x: resX, y: edge2.A.y};	
			}

			let a2 = (edge2.B.y - edge2.A.y) / (edge2.B.x - edge2.A.x);
			let b2 = (edge2.A.y*edge2.B.x - edge2.B.y*edge2.A.x) / (edge2.B.x - edge2.A.x);

			let resY = a2*resX + b2;

			return {x: resX, y: resY};

		} else if (edge1.B.y - edge1.A.y == 0) {
			/* edge1 // Ox */

			let resY = edge1.A.y;

			if (edge2.B.x - edge2.A.x == 0) {
				// edge2 // Oy
				return {x: edge2.A.x, y: resY}	
			}

			let a2 = (edge2.B.y - edge2.A.y) / (edge2.B.x - edge2.A.x);
			let b2 = (edge2.A.y*edge2.B.x - edge2.B.y*edge2.A.x) / (edge2.B.x - edge2.A.x);

			let resX = (resY - b2)/a2;

			return {x: resX, y: resY}

		} else if (edge2.B.x - edge2.A.x == 0) {
			/* edge2 // Oy */
			let resX = edge2.A.x;

			if (edge1.B.y - edge1.A.y == 0) {
				// edge1 // Ox
				return {x: resX, y: edge1.A.y};	
			}

			let a1 = (edge1.B.y - edge1.A.y) / (edge1.B.x - edge1.A.x);
			let b1 = (edge1.A.y*edge1.B.x - edge1.B.y*edge1.A.x) / (edge1.B.x - edge1.A.x);

			let resY = a1*resX + b1;

			return {x: resX, y: resY};
			
		} else if (edge2.B.y - edge2.A.y == 0) {
			/* edge2 // Ox */
			
			let resY = edge2.A.y;

			if (edge1.B.x - edge1.A.x == 0) {
				return {x: edge1.A.x, y: resY};	
			}

			let a1 = (edge1.B.y - edge1.A.y) / (edge1.B.x - edge1.A.x);
			let b1 = (edge1.A.y*edge1.B.x - edge1.B.y*edge1.A.x) / (edge1.B.x - edge1.A.x);

			let resX = (resY - b1)/a1;

			return {x: resX, y: resY};

		} else {
			let a1 = (edge1.B.y - edge1.A.y) / (edge1.B.x - edge1.A.x);
			let b1 = (edge1.A.y*edge1.B.x - edge1.B.y*edge1.A.x) / (edge1.B.x - edge1.A.x);

			let a2 = (edge2.B.y - edge2.A.y) / (edge2.B.x - edge2.A.x);
			let b2 = (edge2.A.y*edge2.B.x - edge2.B.y*edge2.A.x) / (edge2.B.x - edge2.A.x);

			let resX = (a1 - a2) / (b2 - b1);
			let resY = (b1*a2 - a1*b2) / (a2 - a1);

			return {x: resX, y: resY};
		}
	}

	// Find all objects connect to this object from right side
	findNextObjects(object, operationsContainer) {
		// If this object was run findNextObjects before then do nothing
		if (object.child) return;

		object.child = [];
		this.storeConnect.edge.forEach(e => {
			if (e.source.svgId == this.operationsSvgId && this.haveConnectToThisObject(object, e.source.vertexId)) {
				let tmpObj = null;

				if (e.target.vertexId[0] == "V") {
					tmpObj = _.find(operationsContainer.vertex, {"id": e.target.vertexId})
				} else {
					tmpObj = _.find(operationsContainer.boundary, {"id": e.target.vertexId})
				}

				if (tmpObj) {
					if (tmpObj.parent) {
						tmpObj = _.find(operationsContainer.boundary, {"id":tmpObj.parent});
					}

					if (this.notIn(object.child, tmpObj.id)) {
						object.child.push(tmpObj);
					}
				} 
			}
		})

		for(let i = 0; i < object.child.length; i++) {
			this.findNextObjects(object.child[i], operationsContainer);
		}
	}

	/**
	 * Return true if object does not exist in arr
	 * @param {*} arr 
	 * @param {*} object 
	 */
	notIn(arr, objectId) {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i].id == objectId) return false;
		}

		return true;
	}

	/**
	 * 
	 * @param {*} object 
	 * @param {*} id 
	 */
	haveConnectToThisObject(object, id) {
		if (object.type == "V") {
			return object.id == id;
		} else {
			if (object.id == id) return true;

			for (let i = 0; i < object.member.length; i++) {
				if (object.member[i].id == id) return true;
			}
		}

		return false;
	}

	/**
	 * 
	 * @param {*} object 
	 * @param {*} arrCurLine 
	 * @param {*} arrRes 
	 */
	findLongestLine(object, arrCurLine, arrRes) {
		arrCurLine.push(object);

		if (object.child.length > 0) {
			for (let i = 0; i < object.child.length; i++) {
				let newLine = _.clone(arrCurLine);
				arrRes.push(newLine);
				this.findLongestLine(object.child[i], newLine, arrRes);
			}
		}
	}

	/**
	 * 
	 */
	maxLength(arr) {
		if (arr.length == 0) return 0;

		let max = arr[0].length;
		let index = 0;

		if (arr.length > 1) {
			for (let i = 1; i < arr.length; i++) {
				if (arr[i].length > max) {
					max = arr[i].length;
					index = i;
				}
			}
		}

		return {maxLength: max, index: index};
	}

	/**
	 * 
	 * @param {*} arrLongestLine 
	 */
	removeUnexpectedResult(arrLongestLine) {
		for (let i = 0; i < arrLongestLine.length; i++) {
			let {maxLength} = this.maxLength(arrLongestLine[i]);
			_.remove(arrLongestLine[i], item => {
				return item.length < maxLength;
			})
		}
	}

	/**
	 * 
	 * @param {*} arrLongestLine 
	 */
	mergeFinalResult(arrLongestLine) {
		let arrRes = [];
		for (let i = 0; i < arrLongestLine.length; i++) {
			let line = arrLongestLine[i];
			let tempLine = line[0]; // Choose the first item in line for the base then merge other item into it
			let arrResTemp = []; // store the final result for each line
			arrRes.push(arrResTemp);

			// use first item for base data
			tempLine.forEach((item, index) => {
				arrResTemp[index] = [];
				arrResTemp[index].push(item);
			})

			// if more than 1 item in line then merge them to the base
			if (line.length > 1) {
				for (let j = 1; j < line.length; j++) {
					line[j].forEach((item, index) => {
						if (this.notIn(arrResTemp[index], item.id)) {
							arrResTemp[index].push(item);
						}
					})
				}
			}
		}

		return arrRes;
	}

	/**
	 * 
	 * @param {*} arrEdge 
	 */
	calculateCoordinateByOperationsAreaForEdge(arrEdge) {

		arrEdge.forEach((item, index) => {
			// source
			this.doCalculateCoordinateForNodeOfEdge(item.source, TYPE_CONNECT.OUTPUT, this.storeOperations);

			// target
			this.doCalculateCoordinateForNodeOfEdge(item.target, TYPE_CONNECT.INPUT, this.storeOperations);
		})
	}

	/**
	 * 
	 * @param {*} node 
	 * @param {*} connectType 
	 * @param {*} dataContainer 
	 */
	doCalculateCoordinateForNodeOfEdge(node, connectType, dataContainer) {
		let {vertexId, prop} = node;
		let vertices = [];
		vertices = vertices.concat(dataContainer.vertex);
		vertices = vertices.concat(dataContainer.boundary);

		let object = _.find(vertices, {"id": vertexId});

		if (prop.indexOf('boundary_title') != -1){
			node.y = object.y + BOUNDARY_ATTR_SIZE.HEADER_HEIGHT / 2;
			node.x = connectType === TYPE_CONNECT.OUTPUT ? object.x + object.width : object.x

    }else if (prop.indexOf('title') != -1){
			node.y = object.y + VERTEX_ATTR_SIZE.HEADER_HEIGHT / 2;
			node.x = connectType === TYPE_CONNECT.OUTPUT ? object.x + VERTEX_ATTR_SIZE.GROUP_WIDTH : object.x

    } else{
      // Get index prop in object
      let index = this.objectUtils.findIndexPropInVertex(vertexId, prop);
			node.y = object.y + VERTEX_ATTR_SIZE.HEADER_HEIGHT + index * VERTEX_ATTR_SIZE.PROP_HEIGHT + VERTEX_ATTR_SIZE.PROP_HEIGHT / 2;
			node.x = connectType === TYPE_CONNECT.OUTPUT ? object.x + VERTEX_ATTR_SIZE.GROUP_WIDTH : object.x;
    }
	}

	/**
	 * 
	 * @param {*} line 
	 */
	maxHeight(line) {
		let maxHeight = 0;
		for (let i = 0; i < line.length; i++) {
			for (let j = 0; j < line[i].length; j++) {
				let rect = $(`#${line[i][j].id}`).get(0).getBoundingClientRect();
				if (maxHeight < line[i][j].y + rect.height) {
					maxHeight = line[i][j].y + rect.height;
				}
			}
		}

		return maxHeight;
	}

	isNodeConnectToObject(object, node) {
		if (object.type == "V") {
			return object.id == node.vertexId;
		} else {
			return object.id == node.vertexId || _.find(object.member, {"id": node.vertexId});
		}
	}
	
}
  
export default CltMessageMapping;
