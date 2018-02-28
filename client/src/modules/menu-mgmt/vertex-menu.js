class VertexMenu {
  constructor(props) {
    this.selector = props.selector;
    this.vertex = props.vertex;
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

              // case "cancelCreateEdge":
              //   this.vertex.cancelCreateEdge();
              //   break;

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
      // "connectFrom": {
      //   name: "Create Edge",
      //   icon: "fa-times",
      //   items: this.loadItems($trigger.attr('id')),
      //   disabled: window.disabledCommand
      // },
    };

    // let connectItems = {
    //   "editVertex": {
    //     name: "Edit Vertex Info",
    //     icon: "fa-pencil-square-o",
    //     disabled: window.disabledCommand
    //   },
    //   "copyVertex": {
    //     name: "Copy",
    //     icon: "fa-files-o",
    //     disabled: window.disabledCommand
    //   },
    //   "removeVertex": {
    //     name: "Delete",
    //     icon: "fa-times",
    //     disabled: window.disabledCommand
    //   },
    //   "connectTo": {
    //     name: "Connect To",
    //     icon: "fa-times",
    //     items: this.loadItems($trigger.attr('id'), false),
    //     disabled: window.disabledCommand
    //   },
    //   "cancelCreateEdge": {
    //     name: "Cancel Edge",
    //     icon: "fa-times",
    //     disabled: window.disabledCommand
    //   }
    // };
    return originItems;
  }

  /**
   * If source true mean create connect, if false or null then mean selected to connect
   * @param vertexId
   * @param source
   * @returns {*}
   */
  // loadItems(vertexId, source = true) {
  //   const subItems = {};
  //   // Set menu hard code
  //   subItems['vertex'] = {
  //     name: 'Vertex',
  //     icon: "fa-window-maximize",
  //     callback: (key, opt) => {
  //       if (source) {
  //         this.vertex.setConnectFrom(vertexId);
  //       } else {
  //         this.vertex.setConnectTo(vertexId);
  //       }
  //     }
  //   };
  //   // Get properties of vertex
  //   let vertexObj = this.objectUtils.getVertexInfoById(vertexId);
  //
  //   // When mode show that don't have vertex type.
  //   if (window.vertexTypes) {
  //     let propVertexes = window.vertexTypes[vertexObj.vertexType];
  //     if (!propVertexes)
  //       return;
  //     for (const key of Object.keys(propVertexes)) {
  //       subItems[`${key}`] = {
  //         name: `${key}`,
  //         icon: "fa-window-maximize",
  //         callback: (key, opt) => {
  //           let prop = opt.$selected.text();
  //           if (source) {
  //             this.vertex.setConnectFrom(vertexId, prop);
  //           } else {
  //             this.vertex.setConnectTo(vertexId, prop);
  //           }
  //         }
  //       }
  //     }
  //   }
  //
  //   let dfd = jQuery.Deferred();
  //   setTimeout(() => {
  //     dfd.resolve(subItems);
  //   }, 10);
  //   return dfd.promise();
  // }
}

export default VertexMenu;
