import {
  COMMON_DATA,
} from '../../../const/index';

class VertexMenu {
  constructor(props) {
    this.selector = props.selector;
    this.vertexOperations = props.vertexOperations;
    this.initVertexMenu();
  }

  initVertexMenu() {
    $.contextMenu({
      selector: this.selector,
      zIndex: 100,
      build: () => {
        return {
          callback: (key, options) => {
            let vertexId = options.$trigger.attr('id');
            switch (key) {
              case "editVertex":
                this.vertexOperations.makePopupEditVertex(vertexId);
                break;

              case "copyVertex":
                this.vertexOperations.copyVertex(vertexId);
                break;

              case "removeVertex":
                this.vertexOperations.removeVertex(vertexId);
                break;

              default:
                break;
            }
          },
          items: {
            "editVertex": {
              name: "Edit Vertex Info",
              icon: "fa-pencil-square-o",
              disabled: COMMON_DATA.isDisabledCommand
            },
            "copyVertex": {
              name: "Copy",
              icon: "fa-files-o",
              disabled: COMMON_DATA.isDisabledCommand
            },
            "removeVertex": {
              name: "Delete",
              icon: "fa-times",
              disabled: COMMON_DATA.isDisabledCommand
            }
          }
        }
      }
    });
  }
}

export default VertexMenu;
