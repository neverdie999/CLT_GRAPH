class VertexMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.vertexMgmt = props.vertexMgmt;
    this.dataContainer = props.dataContainer;
    this.vertexTypes = props.vertexTypes;
    this.initVertexMenu();
  }

  initVertexMenu(){
    // Context menu for Vertex
    $.contextMenu({
      selector: this.selector,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            let vertexId = options.$trigger.attr('id');
            switch (key)
            {
              case "editVertex":
                this.vertexMgmt.edit(vertexId);
                break;

              case "copyVertex":
                this.vertexMgmt.copy(vertexId);
                break;

              case "removeVertex":
                this.vertexMgmt.remove(vertexId);
                break;

              case "cancelCreateEdge":
                this.vertexMgmt.cancelCreateEdge();
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

  initItemOnFlagCreateEdge($trigger){
    let originItems = {
      "editVertex": {name: "Edit Vertex Info", icon: "fa-pencil-square-o"},
      "copyVertex": {name: "Copy", icon: "fa-files-o"},
      "removeVertex": {name: "Delete", icon: "fa-times"},
      "connectFrom": {
        name: "Create Edge",
        icon: "fa-times",
        items: this.loadItems($trigger.attr('id'))
      },
      "cancelCreateEdge": {name: "Cancel Edge", icon: "fa-times"},
    };

    let connectItems = {
      "editVertex": {name: "Edit Vertex Info", icon: "fa-pencil-square-o"},
      "copyVertex": {name: "Copy", icon: "fa-files-o"},
      "removeVertex": {name: "Delete", icon: "fa-times"},
      "connectTo": {
        name: "Connect To",
        icon: "fa-times",
        items: this.loadItems($trigger.attr('id'), false)
      },
      "cancelCreateEdge": {name: "Cancel Edge", icon: "fa-times"},
    };
    return !window.creatingEdge ? originItems : connectItems;
  }

  /**
   * If source true mean create connect, if false or null then mean selected to connect
   * @param vertexId
   * @param source
   * @returns {*}
   */
  loadItems(vertexId, source = true) {
    const subItems = {};
    // Set menu hard code
    subItems['vertex'] = {
      name: 'Vertex',
      icon: "fa-window-maximize",
      callback: (key, opt) => {
        if(source){
          this.vertexMgmt.setConnectFrom(vertexId);
        }else{
          this.vertexMgmt.setConnectTo(vertexId);
        }
      }
    }
    // Get properties of vertex
    let vertexObj = this.vertexMgmt.getVertexInfoById(vertexId)[0];
    let propVertexes = this.vertexTypes[vertexObj.vertexType];

    for (const key of Object.keys(propVertexes)) {
      subItems[`${key}`] = {
        name: `${key}`,
        icon: "fa-window-maximize",
        callback: (key, opt) => {
          let prop = opt.$selected.text();
          if(source){
            this.vertexMgmt.setConnectFrom(vertexId, prop);
          }else{
            this.vertexMgmt.setConnectTo(vertexId, prop);
          }
        }
      }
    }

    let dfd = jQuery.Deferred();
    setTimeout(() => {
      dfd.resolve(subItems);
    }, 10);
    return dfd.promise();
  }
}

export default VertexMenuContext;
