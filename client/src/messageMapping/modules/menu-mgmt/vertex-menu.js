import {
  COMMON_DATA,
} from '../../const/index';

class VertexMenu {
  constructor(props) {
    this.selector = props.selector;
    this.vertex = props.vertex;
    this.dataContainer = props.dataContainer;
    this.objectUtils = props.objectUtils;
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
                this.vertex.makePopupEditVertex(vertexId);
                break;

              case "copyVertex":
                this.vertex.copyVertex(vertexId);
                break;

              case "removeVertex":
                this.vertex.removeVertex(vertexId);
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
