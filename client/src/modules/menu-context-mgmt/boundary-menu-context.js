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
              case "editVertex":
                this.boundaryMgmt.edit(boundaryId);
                break;

              case "copyVertex":
                this.boundaryMgmt.copy(boundaryId);
                break;

              case "removeBoundary":
                this.boundaryMgmt.removeBoundary(boundaryId);
                break;

              case "createEdge":
                this.boundaryMgmt.setOnCreateEdge(boundaryId);
                break;

              default:
                break;
            }
          },
          items: {
            "editBoundary": {name: "Edit Boundary Info", icon: "fa-pencil-square-o", disabled: window.disabledCommand},
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
