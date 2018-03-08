import * as d3 from "d3";

class BoundaryMenu {
  constructor(props) {
    this.selector = props.selector;
    this.boundary = props.boundary;
    this.dataContainer = props.dataContainer;
    this.initBoundaryMenu();
  }

  initBoundaryMenu() {
    // Context menu for Vertex
    $.contextMenu({
      selector: this.selector,
      zIndex: 100,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            let boundaryId = options.$trigger.attr('id');
            switch (key) {
              case "removeBoundary":
                this.boundary.removeBoundary(boundaryId);
                break;

              case "deleteAllBoundary":
                this.boundary.deleteAllBoundary(boundaryId);
                break;

              case "makeEditBoundaryInfo":
                this.boundary.makeEditBoundaryInfo(boundaryId);
                break;

              case "copyAllBoundary":
                this.boundary.copyAllBoundary(boundaryId);

                break;

              case "moveToFront":
                //d3.select(this.selector).moveToFront(boundaryId, this.dataContainer.boundary);
                this.boundary.moveToFrontBoundary(this.selector, boundaryId, this.dataContainer.boundary, this.dataContainer.vertex)
                break;

              case "moveToBack":
                //d3.select(this.selector).moveToBack(boundaryId, this.dataContainer.boundary);
                this.boundary.moveToBackBoundary(this.selector, boundaryId, this.dataContainer.boundary, this.dataContainer.vertex)
                break;

              default:
                break;
            }
          },
          items: {
            "makeEditBoundaryInfo": {
              name: "Edit Boundary Info",
              icon: "fa-pencil-square-o",
              disabled: window.disabledCommand
            },
            "removeBoundary": {name: "Delete", icon: "fa-times", disabled: window.disabledCommand},
            "copyAllBoundary": {name: "Copy All", icon: "fa-files-o", disabled: window.disabledCommand},
            "deleteAllBoundary": {name: "Delete All", icon: "fa-square-o", disabled: window.disabledCommand},
            // "moveToFront": {name: "Move To Front", icon: "fa-level-up",  disabled: window.disabledCommand},
            // "moveToBack": {name: "Move To Back",  icon: "fa-level-down",  disabled: window.disabledCommand},
          }
        }
      }
    });
  }
}

export default BoundaryMenu;
