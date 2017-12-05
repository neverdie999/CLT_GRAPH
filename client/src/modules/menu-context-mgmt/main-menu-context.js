import * as d3 from 'd3';

class MainMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.vertexMgmt = props.vertexMgmt;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.vertexTypes = props.vertexTypes;
    this.initMainMenu();
  }

  initMainMenu(){
    // Context menu for Screen
    $.contextMenu({
      selector: this.selector,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            switch (key)
            {
              case "clearAll": this.clearAll();
                break;

              case "createBoundary": this.boundaryMgmt.create(options);
                break;

              default:
                break;
            }
          },
          items: {
            "createVertex":{
              name: "Create Vertex",
              icon: "fa-window-maximize",
              items: this.loadItems(),
            },
            "sep1": "-",
            "createBoundary": {name: "Create Boundary", icon: "fa-object-group"},
            "sep2": "-",
            "autoAlign": {name: "Auto Align", icon: "fa-sort-amount-desc"},
            "sep3": "-",
            "showReduced": {name: "Show Reduced", icon: "fa-link"},
            "sep4": "-",
            "clearAll": {name: "Clear All", icon: "fa-times"},
            "sep5": "-",
            "undo": {name: "Undo", icon: "fa-undo"},
            "sep6": "-",
            "redo": {name: "Redo", icon: "fa-repeat"},
          },
          events: {
            show: (opt) => {
              opt["x"] = event.x;
              opt["y"] = event.y;
            }
          }
        };
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

  loadItems() {
    const subItems = {};

    for (const key of Object.keys(this.vertexTypes)) {
      subItems[`${key}`] = {
        name: `${key}`,
        icon: "fa-window-maximize",
        callback: (key, opt) => {
          opt.vertexType = opt.$selected.text()
          this.vertexMgmt.create(opt);
        }
      }
    }

    let dfd = jQuery.Deferred();
    setTimeout(() => {
      dfd.resolve(subItems);
    }, 10);
    return dfd.promise();
  }
}

export default MainMenuContext;
