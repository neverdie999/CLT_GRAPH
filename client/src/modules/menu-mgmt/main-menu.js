class MainMenu {
  constructor(props) {
    this.selector = props.selector;
    this.mainMgmt = props.mainMgmt;
    this.dataContainer = props.dataContainer;
    this.initMainMenu();
  }

  initMainMenu() {
    // Main menu config
    $.contextMenu({
      selector: this.selector,
      autoHide: true,
      zIndex: 100,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            switch (key) {
              case "clearAll":
                this.mainMgmt.clearAll();
                break;

              case "createBoundary":
                this.mainMgmt.createBoundary(options);
                break;

              case "showReduced":
                window.showReduced ? this.mainMgmt.showFull(options) : this.mainMgmt.showReduced(options);
                break;

              default:
                break;
            }
          },
          items: {
            "createVertex": {
              name: "Create Vertex",
              icon: "fa-window-maximize",
              items: this.loadItems(),
              disabled: window.disabledCommand
            },
            "sep1": "-",
            "createBoundary": {
              name: "Create Boundary",
              icon: "fa-object-group",
              disabled: window.disabledCommand
            },
            "sep2": "-",
            "autoAlign": {
              name: "Auto Align",
              icon: "fa-sort-amount-desc",
              disabled: window.disabledCommand
            },
            "sep3": "-",
            "showReduced": {
              name: window.showReduced ? "Show Full" : "Show Reduced",
              icon: "fa-link",
              disabled: window.disabledCommand
            },
            "sep4": "-",
            "clearAll": {
              name: "Clear All",
              icon: "fa-times",
              disabled: window.disabledCommand
            },
            "sep5": "-",
            "undo": {
              name: "Undo",
              icon: "fa-undo",
              disabled: window.disabledCommand
            },
            "sep6": "-",
            "redo": {
              name: "Redo",
              icon: "fa-repeat",
              disabled: window.disabledCommand
            },
          },
          events: {
            show: (opt) => {
              if (event) {
                opt["x"] = event.pageX;
                // opt["x"] = event.x;
                opt["y"] = event.pageY;
                // opt["y"] = event.y;
              }
            }
          }
        };
      }
    });
  }

  /**
   * Generate verties from array vertexTypes
   */
  loadItems() {
    const subItems = {};
    if (window.vertexTypes) {
      for (const key of Object.keys(window.vertexTypes)) {
        subItems[`${key}`] = {
          name: `${key}`,
          icon: "fa-window-maximize",
          callback: (key, opt) => {
            opt.vertexType = opt.$selected.text()
            this.mainMgmt.createVertex(opt);
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

export default MainMenu;
