class EdgeMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.edgeMgmt = props.edgeMgmt;
    this.dataContainer = props.dataContainer;
    this.initEdgeMenu();
  }

  initEdgeMenu(){
    // Context menu for Edge
    let edgeMgmt = this.edgeMgmt;
    $.contextMenu({
      selector: this.selector,
      zIndex: 100,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            let edgeId = options.$trigger.attr('id');
            switch (key)
            {
              case "openPopupEditType":
                this.edgeMgmt.openPopEditType(edgeId);
                break;

              case "removeEdge":
                this.edgeMgmt.removeEdge(edgeId);
                break;

              default:
                break;
            }
          },
          items: {
            originNote: {
              name: "Origin Note",
              type: 'text',
              value: "",
              placeholder: "Origin Note",
              disabled: window.disabledCommand
            },
            middleNote: {
              name: "Middle Note",
              type: 'text',
              value: "",
              disabled: window.disabledCommand
            },
            destNote: {
              name: "Destination Note",
              type: 'text',
              value: "",
              disabled: window.disabledCommand
            },
            "openPopupEditType": {name: "Edit line style", icon: "fa-pencil-square-o", disabled: window.disabledCommand},
            "removeEdge": {name: "Delete", icon: "fa-times", disabled: window.disabledCommand},
          },
          events: {
            show: (opt) => {
              // Get edge notes
              let edgeId = opt.$trigger.attr('id');
              let data = this.edgeMgmt.getEdgeNotes(edgeId)
              $.contextMenu.setInputValues(opt, data);
            },
            hide: function(opt) {
              // this is the trigger element
              let $this = this;
              $.contextMenu.getInputValues(opt, $this.data());

              // Get edge notes
              let data = $this.data();
              let notes = {
                originNote: data.originNote,
                middleNote: data.middleNote,
                destNote: data.destNote
              };
              let edgeId = opt.$trigger.attr('id');
              edgeMgmt.setEdgeNotes(edgeId, notes);
            }
          }
        }
      }
    });
  }
}

export default EdgeMenuContext;
