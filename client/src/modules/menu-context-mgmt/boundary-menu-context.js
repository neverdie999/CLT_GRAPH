class BoundaryMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.initBoundaryMenu();
  }

  initBoundaryMenu(){
    // Context menu for Vertex
    $.contextMenu({
      selector: this.selector,
      callback: (key, options) => {
        let vertexId = options.$trigger.attr('id');
        switch (key)
        {
          case "editVertex":
            this.boundaryMgmt.edit(vertexId);
          break;

          case "copyVertex":
            this.boundaryMgmt.copy(vertexId);
          break;

          case "removeVertex":
            this.boundaryMgmt.remove(vertexId);
          break;

          case "createEdge":
            this.boundaryMgmt.setOnCreateEdge(vertexId);
          break;

          default:
          break;
        }
      },
      items: {
        "editVertex": {name: "Edit Boundary Info", icon: "fa-pencil-square-o"},
        "removeVertex": {name: "Delete", icon: "fa-times"},
        "copyVertex": {name: "Copy All", icon: "fa-files-o"},
        "createEdge": {name: "Delete All", icon: "fa-times"},
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

export default BoundaryMenuContext;
