import * as d3 from 'd3';

class MainMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.vertexMgmt = props.vertexMgmt;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.initMainMenu();
  }

  initMainMenu(){
    // Context menu for Screen
    $.contextMenu({
      selector: this.selector,
      callback: (key, options) => {
        switch (key)
        {
          case "clearAll": this.clearAll();
            break;

          case "createVertex": this.vertexMgmt.create(options);
            break;

          case "createBoundary": this.boundaryMgmt.create(options);
            break;

          default:
            break;
        }
      },
      items: {
        "createVertex": {name: "Create Vertex", icon: "fa-window-maximize"},
        "sep1": "-",
        "createBoundary": {name: "Create Boundary", icon: "fa-object-group"},
        "sep2": "-",
        "autoAlign": {name: "Auto Align", icon: "fa-sort-amount-desc"},
        "sep3": "-",
        "clearAll": {name: "Clear All", icon: "fa-times"},
        "sep4": "-",
        "undo": {name: "Undo", icon: "fa-undo"},
        "sep5": "-",
        "redo": {name: "Redo", icon: "fa-repeat"},
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

export default MainMenuContext;
