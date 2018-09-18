import {getCoorMouseClickRelativeToParent, checkModePermission} from '../../../common/utilities/common.ult';
import _ from "lodash";

class MainMenuSegment {
  constructor(props) {
    this.selector = props.selector;
    this.containerId = props.containerId;
    this.parent = props.parent;
    this.viewMode = props.viewMode;
    
    this.initMainMenu();
  }

  initMainMenu() {
    // Main menu config
    $.contextMenu({
      selector: this.selector,
      autoHide: true,
      zIndex: 100,
      build: () => {
        return {
          callback: (key, options) => {
            switch (key) {
              
              case "createNew":
                let params = {
                  x: options.x,
                  y: options.y,
                  data: {}
                };
                this.parent.segmentMgmt.makePopupEditVertex(params);
                break;

              case "showReduced":
                this.parent.isShowReduced ? this.parent.showFull() : this.parent.showReduced();
                break;

              case "sort":
                this.parent.sortByName();
                break;

              default:
                break;
            }
          },
          items: {
            "createNew": {
              name: "Create New",
              icon: "fa-window-maximize",
              disabled: !checkModePermission(this.viewMode.value, 'createNew')
            },
            "sep1": "-",
            "find": {
              name: "Find...",
              type: "sub",
              icon: "fa-search",
              items: checkModePermission(this.viewMode.value, 'find') ? this.loadItems() : {},
              disabled: !checkModePermission(this.viewMode.value, 'find')
            },
            "sep2": "-",
            "showReduced": {
              name: this.parent.isShowReduced ? "Show Full" : "Show Reduced",
              icon: "fa-link",
              disabled: !checkModePermission(this.viewMode.value, 'showReduced')
            },
            "sep3": "-",
            "sort": {
              name: "Sort",
              icon: "fa-sort"
            },
          },
          events: {
            show: (opt) => {
              if (!event)
                return;

              const {x, y} = getCoorMouseClickRelativeToParent(event, this.containerId);
              opt["x"] = x;
              opt["y"] = y;
              opt.isMenu = true;
              this.opt = opt;
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
    subItems.isHtmlItem = {
      placeholder: 'Type to search',
      type: 'text',
      value: '',
      events: {
        keyup: this.searchVertexType()
      }
    };
    subItems["sep4"] = "-";
    // Build options
    const options = {};

    // Sort array object
    let vertices = _.clone(this.parent.dataContainer.vertex);

    vertices.sort(function (a,b) {
      return (a.vertexType.toUpperCase()).localeCompare((b.vertexType.toUpperCase()));
    });

    const len = vertices.length;
    for (let i = 0; i < len; i++) {
      let type = vertices[i].vertexType;
      options[`${type}`] = type;
    }

    subItems.select = {
      type: 'select',
      size: 10,
      options: options,
      events: {
        click: this.onSelectVertex(this)
      }
    };

    let dfd = jQuery.Deferred();
    setTimeout(() => {
      dfd.resolve(subItems);
    }, 10);
    return dfd.promise();
  }

  searchVertexType() {
    return function () {
      let filter = this.value.toUpperCase();
      let $select = $(this).closest('ul').find(`select`);
      let options = $select.find(`option`);

      // Remove first li cause it is input search
      let length = options.length;
      for (let i = 0; i < length; i++) {
        let element = options[i];
        let value = $(element).val();
        if (value.toUpperCase().indexOf(filter) > -1) {
          $(element).css('display', '');
        } else {
          $(element).css('display', 'none');
        }
      }
    }
  }

  onSelectVertex(main) {
    return function () {
      const vertex = _.find(main.parent.dataContainer.vertex, {"vertexType": this.value});

      if (vertex){
        vertex.showToUser();
      }
    }
  }
}

export default MainMenuSegment;