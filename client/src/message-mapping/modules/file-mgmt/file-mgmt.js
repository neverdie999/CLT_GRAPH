import{
  COMMON_DATA,
} from '../../const/index';
import {readDataFileJson} from '../../common/utilities/common.ult'

const ID_FOLDER_OPEN_FILE_MGMT = 'folderOpenFileMgmt';
const ID_CONTAINER_FILE_MGMT = 'containerFileMgmt';
const ID_OPTION_FILE_TYPE_INPUT = 'optionFileTypeInput';
const ID_INPUT_FILE_DATA = 'inputFileData';
const GROUP_OPTION_MODE_GRAPH = 'input:radio[name=graphMode]';
const ID_OUTPUT_FILE_NAME = 'outputFileName';
const ID_BUTTON_DOWNLOAD_FILE = 'btnDownloadFile';

class FileMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.storeInputMessage = props.storeInputMessage,
    this.storeOperations = props.storeOperations,
    this.storeOutputMessage = props.storeOutputMessage,
    this.inputDefined = props.inputDefined,
    this.outputDefined = props.outputDefined,
    this.operationsDefined = props.operationsDefined,
    this.initialize();
  }

  initialize() {
    this.bindEventListenerToControls();
  }

  bindEventListenerToControls() {
    $(`#${ID_FOLDER_OPEN_FILE_MGMT}`).click(() => {
      $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    });

    $(`#${ID_INPUT_FILE_DATA}`).change((event) => {
      this.readJsonFile(event);
    });

    // Handle event click on button Download
    $(`#${ID_BUTTON_DOWNLOAD_FILE}`).click((event) => {
      this.writeJsonFile();
    });

    // Handle event press enter on input file name
    $(`#${ID_OUTPUT_FILE_NAME}`).keypress((event) => {
      if (event.keyCode == 13) {
        this.writeJsonFile();
        event.preventDefault();
      }
    });
  }

  /**
   * Read content file Vertex Type Definition
   * or  read content file Graph Data Structure
   * @param event
   */
  async readJsonFile(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    const data = await readDataFileJson(file);
    if (!data)
      return;

    const options = $(`#${ID_OPTION_FILE_TYPE_INPUT}`).val();
    this.mainMgmt.separateDataToManagement(data, options);
    $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    $(`#${ID_INPUT_FILE_DATA}`).val(null);
  }

  writeJsonFile() {
    let fileName = $(`#${ID_OUTPUT_FILE_NAME}`).val();
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

      this.clearOutFileName();
      $(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle();
    });
  }

  clearOutFileName() {
    $(`#${ID_OUTPUT_FILE_NAME}`).val(null);
  }

  getContentGraphAsJson() {
    let dataContent = {inputMessage: {}, outputMessage: {}, operations: {}, edges: []};

    let inputMessage = {vertex: [], boundary: [],position: [], vertexTypes: {}};
    let outputMessage = {vertex: [], boundary: [],position: [], vertexTypes: {}};
    let operations = {vertex: [], boundary: [],position: [], vertexTypes: {}};

    // Process data to export
    // Need clone data cause case user export
    // later continue edit then lost parent scope
    // Purpose prevent reference data.

    //Input data
    const cloneInputData = _.cloneDeep(this.storeInputMessage);
    cloneInputData.vertex.forEach(node => {
      let pos = new Object({
        "id": node.id,
        "x": node.x,
        "y": node.y
      });

      delete node.x;
      delete node.y;

      inputMessage.vertex.push(node);
      inputMessage.position.push(pos);
    });

    cloneInputData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      delete boundary.x;
      delete boundary.y;
      delete boundary.ctrlSrcHeight;
      delete boundary.ctrlSrcParent;
      delete boundary.ctrlSrcWidth;
      delete boundary.ctrlSrcX;
      delete boundary.ctrlSrcY;

      inputMessage.boundary.push(boundary);
      inputMessage.position.push(pos);
    });

    const cloneVertexInputDefine = _.cloneDeep(this.inputDefined);
    let inputVertexDefine = new Object({
      "VERTEX_GROUP": cloneVertexInputDefine.vertexGroup,
      "VERTEX": cloneVertexInputDefine.vertexTypes
    });
    inputMessage.vertexTypes = inputVertexDefine || {};

    //Output data

    const cloneOutputData = _.cloneDeep(this.storeOutputMessage);
    cloneOutputData.vertex.forEach(node => {
      let pos = new Object({
        "id": node.id,
        "x": node.x,
        "y": node.y
      });

      delete node.x;
      delete node.y;

      outputMessage.vertex.push(node);
      outputMessage.position.push(pos);
    });

    cloneOutputData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      delete boundary.x;
      delete boundary.y;
      delete boundary.ctrlSrcHeight;
      delete boundary.ctrlSrcParent;
      delete boundary.ctrlSrcWidth;
      delete boundary.ctrlSrcX;
      delete boundary.ctrlSrcY;

      outputMessage.boundary.push(boundary);
      outputMessage.position.push(pos);
    });

    const cloneVertexOutputDefine = _.cloneDeep(this.outputDefined);
    let outputVertexDefine = new Object({
      "VERTEX_GROUP": cloneVertexOutputDefine.vertexGroup,
      "VERTEX": cloneVertexOutputDefine.vertexTypes
    });
    outputMessage.vertexTypes = outputVertexDefine || {};

    //Operations data
    const cloneOperationsData = _.cloneDeep(this.storeOperations);
    cloneOperationsData.vertex.forEach(node => {
      let pos = new Object({
        "id": node.id,
        "x": node.x,
        "y": node.y
      });

      delete node.x;
      delete node.y;

      operations.vertex.push(node);
      operations.position.push(pos);
    });

    cloneOperationsData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      delete boundary.x;
      delete boundary.y;
      delete boundary.ctrlSrcHeight;
      delete boundary.ctrlSrcParent;
      delete boundary.ctrlSrcWidth;
      delete boundary.ctrlSrcX;
      delete boundary.ctrlSrcY;

      operations.boundary.push(boundary);
      operations.position.push(pos);
    });

    const cloneVertexOperationDefine = _.cloneDeep(this.operationsDefined);
    let operationVertexDefine = new Object({
      "VERTEX_GROUP": cloneVertexOperationDefine.vertexGroup,
      "VERTEX": cloneVertexOperationDefine.vertexTypes
    });
    operations.vertexTypes = operationVertexDefine || {};

    //Data content
    dataContent.inputMessage = inputMessage;
    dataContent.outputMessage = outputMessage;
    dataContent.operations = operations;
    const cloneEdgesData = _.cloneDeep(this.mainMgmt.storeConnect);
    cloneEdgesData.edge.forEach(node => {
      let edge = new Object({
        "id": node.id,
        "source": node.source,
        "target": node.target,
        "note": {
          "originNote": node.originNote === null ? "" : node.originNote,
          "middleNote": node.middleNote === null ? "" : node.middleNote,
          "destNote": node.destNote === null ? "" : node.destNote
        },
        "style":{
          "line": node.lineType,
          "arrow": node.useMarker
        }
      });
      
      dataContent.edges.push(edge);
    })

    return Promise.resolve(dataContent);
  }
  
}

export default FileMgmt;
