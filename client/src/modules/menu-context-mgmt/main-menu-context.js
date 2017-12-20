import * as d3 from 'd3';

class MainMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.vertexMgmt = props.vertexMgmt;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.mainMgmt = props.mainMgmt;
    this.initMainMenu();
  }

  initMainMenu(){
    // Context menu for Screen
    $.contextMenu({
      selector: this.selector,
      autoHide: true,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            switch (key)
            {
              case "clearAll": this.clearAll();
                break;

              case "createBoundary": this.boundaryMgmt.createBoundary(options);
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
              disabled: window.disabledCommand
            },
            "sep1": "-",
            "createBoundary": {name: "Create Boundary", icon: "fa-object-group", disabled: window.disabledCommand},
            "sep2": "-",
            "autoAlign": {name: "Auto Align", icon: "fa-sort-amount-desc", disabled: window.disabledCommand},
            "sep3": "-",
            "showReduced": {name: "Show Reduced", icon: "fa-link", disabled: window.disabledCommand},
            "sep4": "-",
            "clearAll": {name: "Clear All", icon: "fa-times", disabled: window.disabledCommand},
            "sep5": "-",
            "undo": {name: "Undo", icon: "fa-undo", disabled: window.disabledCommand},
            "sep6": "-",
            "redo": {name: "Redo", icon: "fa-repeat", disabled: window.disabledCommand},
          },
          events: {
            show: (opt) => {
              if(event){
                opt["x"] = event.x;
                opt["y"] = event.y;
              }
            }
          }
        };
      }
    });
  }

  clearAll(){
    this.mainMgmt.clearAll();
  }

  loadItems() {
    const subItems = {};
    if(window.vertexTypes){
      for (const key of Object.keys(window.vertexTypes)) {
        subItems[`${key}`] = {
          name: `${key}`,
          icon: "fa-window-maximize",
          callback: (key, opt) => {
            opt.vertexType = opt.$selected.text()
            this.vertexMgmt.create(opt);
          }
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
