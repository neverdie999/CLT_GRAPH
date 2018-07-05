import {getCoordinateMouseOnClick} from '../../common/utilities/common.ult';
import {
  COMMON_DATA,
} from '../../const/index';
import _ from "lodash";

class MainMenu {
  constructor(props) {
    this.selector = props.selector;
    this.mainMgmt = props.mainMgmt;
    this.dataContainer = props.dataContainer;
    this.initMainMenu();
    this.opt = {};
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
              case "clearAll":
                this.mainMgmt.clearAll(options);
                break;

              case "createBoundary":
                this.mainMgmt.createBoundary(options);
                break;

              case "showReduced":
                COMMON_DATA.isShowReduced ? this.mainMgmt.showFull(options) : this.mainMgmt.showReduced(options);
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
              type: "sub",
              disabled: COMMON_DATA.isDisabledCommand
            },
            "sep1": "-",
            "createBoundary": {
              name: "Create Boundary",
              icon: "fa-object-group",
              disabled: COMMON_DATA.isDisabledCommand
            },
            "sep3": "-",
            "showReduced": {
              name: COMMON_DATA.isShowReduced ? "Show Full" : "Show Reduced",
              icon: "fa-link",
              disabled: COMMON_DATA.isDisabledCommand
            },
            "sep4": "-",
            "clearAll": {
              name: "Clear All",
              icon: "fa-times",
              disabled: COMMON_DATA.isDisabledCommand
            }
          },
          events: {
            show: (opt) => {
              if (event) {
                let svg = opt.$trigger.attr('id');
                let root = $(`#${svg}`).parent().attr('id');
                const {x, y} = getCoordinateMouseOnClick(event, root);
                opt["x"] = x;
                opt["y"] = y;
                opt.isMenu = true;
                opt.svg = svg;
                this.opt = opt;
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
    subItems.isHtmlItem = {
      placeholder: 'Type to search',
      type: 'text',
      value: '',
      events: {
        keyup: this.searchVertexType()
      }
    };
    subItems["sep4"] = "-";
    const options = {};
    // Build options
    if (COMMON_DATA.vertexTypes && Array.isArray(COMMON_DATA.vertexTypes)) {
      let vertices = COMMON_DATA.vertexTypes;
      // Sort array object
      vertices = _.orderBy(vertices, ['vertexType'], ['asc']);
      let len = vertices.length;
      for (let i = 0; i < len; i++) {
        let type = vertices[i].vertexType;
        options[`${type}`] = type;
      }
    }

    subItems.select = {
      type: 'select',
      size: 10,
      options: options,
      events: {
        change: this.onSelectVertex(this)
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

  onSelectVertex(self) {
    return function () {
      let opt = self.opt;
      opt.vertexType = this.value;
      self.mainMgmt.createVertex(opt);
      let selector = opt.svg;
      $(`#${selector}`).contextMenu("hide");
    }
  }
}

export default MainMenu;
