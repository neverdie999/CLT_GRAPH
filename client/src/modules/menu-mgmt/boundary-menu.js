class BoundaryMenu{
  constructor(props){
    this.selector = props.selector;
    this.boundary = props.boundary;
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

              default:
                break;
            }
          },
          items: {
            "makeEditBoundaryInfo": {name: "Edit Boundary Info", icon: "fa-pencil-square-o", disabled: window.disabledCommand},
            "removeBoundary": {name: "Delete", icon: "fa-times", disabled: window.disabledCommand},
            "copyAllBoundary": {name: "Copy All", icon: "fa-files-o", disabled: window.disabledCommand},
            "deleteAllBoundary": {name: "Delete All", icon: "fa-square-o", disabled: window.disabledCommand},
          }
        }
      }
    });
  }
}

export default BoundaryMenu;
