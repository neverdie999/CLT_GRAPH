class BoundaryMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.boundaryMgmt = props.boundaryMgmt;
    this.dataContainer = props.dataContainer;
    this.initBoundaryMenu();
  }

  initBoundaryMenu(){
    // Context menu for Vertex
    $.contextMenu({
      selector: this.selector,
      zIndex: 100,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            let boundaryId = options.$trigger.attr('id');
            switch (key)
            {
              case "removeBoundary":
                this.boundaryMgmt.removeBoundary(boundaryId);
                break;

              case "deleteAllBoundary":
                this.boundaryMgmt.deleteAllBoundary(boundaryId);
                break;

              case "editInfoBoundary":
                this.boundaryMgmt.editInfoBoundary(boundaryId);
                break;

              case "copyAllBoundary":
                this.boundaryMgmt.copyAllBoundary(boundaryId);

              default:
                break;
            }
          },
          items: {
            "editInfoBoundary": {name: "Edit Boundary Info", icon: "fa-pencil-square-o", disabled: window.disabledCommand},
            "removeBoundary": {name: "Delete", icon: "fa-times", disabled: window.disabledCommand},
            "copyAllBoundary": {name: "Copy All", icon: "fa-files-o", disabled: window.disabledCommand},
            "deleteAllBoundary": {name: "Delete All", icon: "fa-square-o", disabled: window.disabledCommand},
          }
        }
      }
    });
  }
}

export default BoundaryMenuContext;
