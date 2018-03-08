import * as d3 from 'd3';

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
      build: ($trigger, e) => {
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

              case "moveToFront":
                d3.select(this.selector).moveToFront(vertexId, this.dataContainer.vertex);
                break;

              case "moveToBack":
                d3.select(this.selector).moveToBack(vertexId, this.dataContainer.vertex);
                break;

              default:
                break;
            }
          },
          items: this.initItemOnFlagCreateEdge($trigger)
        }
      }

    });
  }

  initItemOnFlagCreateEdge($trigger) {
    let originItems = {
      "editVertex": {
        name: "Edit Vertex Info",
        icon: "fa-pencil-square-o",
        disabled: window.disabledCommand
      },
      "copyVertex": {
        name: "Copy",
        icon: "fa-files-o",
        disabled: window.disabledCommand
      },
      "removeVertex": {
        name: "Delete",
        icon: "fa-times",
        disabled: window.disabledCommand
      },
      // "moveToFront": {
      //   name: "Move To Front",
      //   icon: "fa-level-up",
      //   disabled: window.disabledCommand},
      // "moveToBack": {
      //   name: "Move To Back",
      //   icon: "fa-level-down",
      //   disabled: window.disabledCommand
      // },
    };
    return originItems;
  }
}

export default VertexMenu;
