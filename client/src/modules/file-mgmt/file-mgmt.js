import {
  HTML_ALGETA_CONTAINER_ID,
  SCREEN_SIZES,
  FILE_MGMT_HEIGHT,
} from '../../const/index';

import * as d3 from 'd3';

class FileMgmt{
  constructor(props){
    this.mainMgmt = props.mainMgmt;
    this.initButtonEvent();
  }

  initButtonEvent(){
    $("#inputFile").change((event) => {
      this.loadJsonFile(event);
    });
    $("#resetInput").click((event) => {
      $("#inputFile").val('');
    });
  }

  loadJsonFile(event){
    let file = event.target.files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = () => {
        let data = JSON.parse(reader.result);
        if($("#fileType").val() === "1"){
          // Load json data from Vertex Type Definition and append to Menu Vertex
          this.mainMgmt.reloadMenuVertex(data);
        }else{
          // Load json data from Graph Data Structure and draw to Screen
          this.mainMgmt.reDrawGraph(data);
        }
      }
      reader.readAsText(file);
    }
  }

  saveAsJson(){
    let filename = $("#outFile").val();
    let graph = JSON.stringify([{id:'3'}]);
    let blob = new Blob([graph], {type: "text/plain", charset: "utf-8"});

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
      return;
    }

    let fileUrl = window.URL.createObjectURL(blob);
    let downLink = $(document.createElement("a"));
    downLink.attr("download", filename);
    downLink.attr("href", fileUrl);
    downLink.css("display", "none");
    $("body").append(downLink);
    downLink[0].click();
    downLink.remove();
  }
}

export default FileMgmt;
