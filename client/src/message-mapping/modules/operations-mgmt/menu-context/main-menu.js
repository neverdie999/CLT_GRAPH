import {getCoorMouseClickRelativeToParent} from '../../../common/utilities/common.ult';
import _ from "lodash";

class MainMenu {
  constructor(props) {
    this.selector = props.selector;
    this.parentContainer = props.parentContainer;
    this.operationsMgmt = props.operationsMgmt;
    this.operationsDefined = props.operationsDefined;
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
                this.operationsMgmt.clearAll();
                break;

              case "createBoundary":
                this.operationsMgmt.createBoundary(options);
                break;

              case "showReduced":
                this.operationsMgmt.isShowReduced ? this.operationsMgmt.showFull(options) : this.operationsMgmt.showReduced(options);
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
              // disabled: COMMON_DATA.isDisabledCommand
            },
            "sep1": "-",
            "createBoundary": {
              name: "Create Boundary",
              icon: "fa-object-group",
              // disabled: COMMON_DATA.isDisabledCommand
            },
            "sep3": "-",
            "showReduced": {
              name: this.operationsMgmt.isShowReduced ? "Show Full" : "Show Reduced",
              icon: "fa-link",
              // disabled: COMMON_DATA.isDisabledCommand
            },
            "sep4": "-",
            "clearAll": {
              name: "Clear All",
              icon: "fa-times",
              // disabled: COMMON_DATA.isDisabledCommand
            }
          },
          events: {
            show: (opt) => {
              if (!event)
                return;

              const {x, y} = getCoorMouseClickRelativeToParent(event, this.parentContainer);
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
    const options = {};
    // Build options
    if (this.operationsDefined.vertexTypes && Array.isArray(this.operationsDefined.vertexTypes)) {
      let vertices = this.operationsDefined.vertexTypes;
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

      $($select).click();
    }
  }

  onSelectVertex(self) {
    return function () {
      let opt = self.opt;
      opt.vertexType = this.value;
      self.operationsMgmt.createVertex(opt);
      $(`${self.selector}`).contextMenu("hide");
    }
  }
}

export default MainMenu;
