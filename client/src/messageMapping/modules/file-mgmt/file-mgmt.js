import {
  COMMON_DATA,
} from '../../const/index';
import {comShowMessage} from '../../common/utilities/common.ult';
import _ from "lodash";

const HTML_INPUT_FILE_ID = 'inputFile';
const HTML_OUTPUT_FILE_ID = 'outFile';
const HTML_FILE_TYPE_ID = 'fileType';
const HTML_BTN_EXPORT_FILE_ID = 'btnExportFile';
const HTML_SELECTOR_MODE_GRPH = 'input:radio[name=graphMode]';
const HTML_BTN_FILE_INTERFACE = 'btnFileInterface';
const HTML_FILE_INTERFACE = 'fileInterface';

class FileMgmt {
  constructor(props) {
    this.mainMgmt = props.mainMgmt;
    this.dataContainer = props.dataContainer;
    this.initButtonEvent();
  }

  initButtonEvent() {
    // Handle event on value change on input file
    $(`#${HTML_INPUT_FILE_ID}`).change((event) => {
      this.readJsonFile(event);
    });

    // Handle event click on button Download
    $(`#${HTML_BTN_EXPORT_FILE_ID}`).click((event) => {
      this.writeJsonFileGraph();
    });

    // Handle event change value on group radio Mode
    $(HTML_SELECTOR_MODE_GRPH).change((event) => {
      let modeGraph = event.target.value;
      this.setGraphMode(modeGraph);
    });

    // Handle event press enter on input file name
    $(`#${HTML_OUTPUT_FILE_ID}`).keypress((event) => {
      if (event.keyCode == 13) {
        this.writeJsonFileGraph();
        event.preventDefault();
      }
    });

    $(`#${HTML_BTN_FILE_INTERFACE}`).click((event) => {
      $(`#${HTML_FILE_INTERFACE}`).slideToggle();
    });

  }

  /**
   * Read content file Vertex Type Definition
   * or  read content file Graph Data Structure
   * @param event
   */
  readJsonFile(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    let fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        let data = JSON.parse(fileReader.result);
        if ($(`#${HTML_FILE_TYPE_ID}`).val() === "VERTEX_TYPE") {
          // Load json data from Vertex Type Definition and append to Menu Vertex
          this.mainMgmt.reloadVertexTypes(data);
          
        } else {
          // Load json data from Graph Data Structure and draw to Screen
          this.mainMgmt.drawGraphFromData(data);
        }
      }
      catch (ex) {
        console.log("Error", ex);
        comShowMessage("Read file error!");
      }
      finally {
        this.clearInputFile();
        $(`#${HTML_FILE_INTERFACE}`).slideToggle();
      }
    }
    fileReader.readAsText(file);
  }

  writeJsonFileGraph() {
    let fileName = $(`#${HTML_OUTPUT_FILE_ID}`).val();
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
      $(`#${HTML_FILE_INTERFACE}`).slideToggle();
    });
  }

  getContentGraphAsJson() {
    let dataContent = {vertex: [], edge: [], boundary: [], position: [], vertexTypes: {}};

    // Process data to export
    // Need clone data cause case user export
    // later continue edit then lost parent scope
    // Purpose prevent reference data.
    const cloneData = _.cloneDeep(this.dataContainer);
    cloneData.vertex.forEach(node => {
      let pos = new Object({
        "id": node.id,
        "x": node.x,
        "y": node.y
      });

      delete node.x;
      delete node.y;

      dataContent.vertex.push(node);
      dataContent.position.push(pos);
    });

    dataContent.edge = cloneData.edge;

    cloneData.boundary.forEach(boundary => {
      let pos = new Object({
        "id": boundary.id,
        "x": boundary.x,
        "y": boundary.y
      });

      delete boundary.x;
      delete boundary.y;

      dataContent.boundary.push(boundary);
      dataContent.position.push(pos);
    });

    dataContent.vertexTypes = COMMON_DATA.vertexDefine || {};

    return Promise.resolve(dataContent);
  }

  clearInputFile() {
    $(`#${HTML_INPUT_FILE_ID}`).val(null);
  }

  clearOutFileName() {
    $(`#${HTML_OUTPUT_FILE_ID}`).val(null);
  }

  /**
   * Set mode graph is enable or disable edit
   * @param modeGraph
   */
  setGraphMode(modeGraph) {
    COMMON_DATA.isDisabledCommand = modeGraph === "S" ? true : false;
  }
}

export default FileMgmt;
