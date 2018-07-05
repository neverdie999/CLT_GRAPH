import {
  COMMON_DATA,
} from '../../const/index';

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
      build: () => {
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

              default:
                break;
            }
          },
          items: {
            "makeEditBoundaryInfo": {
              name: "Edit Boundary Info",
              icon: "fa-pencil-square-o",
              disabled: COMMON_DATA.isDisabledCommand
            },
            "removeBoundary": {name: "Delete", icon: "fa-times", disabled: COMMON_DATA.isDisabledCommand},
            "copyAllBoundary": {name: "Copy All", icon: "fa-files-o", disabled: COMMON_DATA.isDisabledCommand},
            "deleteAllBoundary": {name: "Delete All", icon: "fa-square-o", disabled: COMMON_DATA.isDisabledCommand}
          }
        }
      }
    });
  }
}

export default BoundaryMenu;
