import {
  COMMON_DATA,
} from '../../../const/index';

class BoundaryMenu {
  constructor(props) {
    this.selector = props.selector;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.isEnableEdit = props.isEnableEdit
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
            let boundary = _.find(this.dataContainer.boundary,{'id':boundaryId});
            switch (key) {
              case "removeBoundary":
              boundary.remove();
                break;

              case "deleteAllBoundary":
                boundary.deleteAll();
                break;

              case "makeEditBoundaryInfo":
                this.boundaryMgmt.makeEditBoundaryInfo(boundaryId);
                break;

              case "copyAllBoundary":
                boundary.copyAll(boundaryId);
                break;

              default:
                break;
            }
          },
          items: {
            "makeEditBoundaryInfo": {
              name: "Edit Boundary Info",
              icon: "fa-pencil-square-o",
              disabled: false
            },
            "removeBoundary": {name: "Delete", icon: "fa-times", disabled: this.isEnableEdit ? false : true},
            "copyAllBoundary": {name: "Copy All", icon: "fa-files-o", disabled: this.isEnableEdit ? false : true},
            "deleteAllBoundary": {name: "Delete All", icon: "fa-square-o", disabled: this.isEnableEdit ? false : true}
          }
        }
      }
    });
  }
}

export default BoundaryMenu;
