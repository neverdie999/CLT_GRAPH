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
                this.mainMgmt.clearAll();
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
                const {x, y} = getCoordinateMouseOnClick(event);
                opt["x"] = x;
                opt["y"] = y;
                opt.isMenu = true;
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
      icon: "fa-search",
      type: 'text',
      value: '',
      events: {
        keyup: this.searchVertexType()
      }
    };
    subItems["sep4"] = "-";
    if (COMMON_DATA.vertexTypes && Array.isArray(COMMON_DATA.vertexTypes)) {
      let vertices = COMMON_DATA.vertexTypes;
      // Sort array object
      vertices = _.orderBy(vertices, ['vertexType'],['asc']);
      let len = vertices.length;
      for (let i = 0; i < len; i++) {
        let type = vertices[i].vertexType;
        subItems[`${type}`] = {
          name: `${type}`,
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

  /**
   * Filter the segment with name contain character input
   * @returns {Function}
   */
  searchVertexType() {
    return function () {
      console.log("Called");
      let filter = this.value.toUpperCase();
      let li = $(this).closest('ul').find(`li`);
      // Remove first li cause it is input search
      let length = li.length;
      for (let i = 1; i < length; i++) {
        let element = li[i];
        let text = $(element).find('span').text();
        if (text.toUpperCase().indexOf(filter) > -1) {
          $(element).css('display', '');
        } else {
          $(element).css('display', 'none');
        }
      }
    }
  }
}

export default MainMenu;
