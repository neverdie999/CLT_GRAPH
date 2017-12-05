import * as d3 from 'd3';

class VertexMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.vertexMgmt = props.vertexMgmt;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.initVertexMenu();
  }

  initVertexMenu(){
    // Context menu for Screen
    $.contextMenu({
      selector: this.selector,
      callback: (key, options) => {
        let vertexId = options.$trigger.attr('id');
        switch (key)
        {
          case "editVertex":
            this.vertexMgmt.edit(vertexId);
            break;

          case "copyVertex":
            this.vertexMgmt.copy(vertexId);
            break;

          case "removeVertex":
            this.vertexMgmt.remove(vertexId);
            break;

          default:
            break;
        }
      },
      items: {
        "editVertex": {name: "Edit Vertex Info", icon: "fa-pencil-square-o"},
        "copyVertex": {name: "Copy", icon: "fa-files-o"},
        "removeVertex": {name: "Delete", icon: "fa-times"},
      },
      events: {
        show: (opt) => {
          opt["x"] = event.x;
          opt["y"] = event.y;
        }
      }
    });
  }

  clearAll(){
    // Delete all element inside SVG
    d3.select("svg").selectAll("*").remove();

    // Clear all data cotainer for vertex, boundary, edge
    this.dataContainer.vertex = [];
    this.dataContainer.boundary = [];
    this.dataContainer.edge = [];
  }
}

export default VertexMenuContext;
