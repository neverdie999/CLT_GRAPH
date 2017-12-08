class EdgeMenuContext{
  constructor(props){
    this.selector = props.selector;
    this.edgeMgmt = props.edgeMgmt;
    this.dataContainer = props.dataContainer;
    this.initEdgeMenu();
  }

  initEdgeMenu(){
    // Context menu for Edge
    $.contextMenu({
      selector: this.selector,
      callback: (key, options) => {
        let edgeId = options.$trigger.attr('id');
        switch (key)
        {
          case "editLineType":
            this.edgeMgmt.editType(edgeId);
            break;

          case "removeEdge":
            this.edgeMgmt.remove(edgeId);
            break;

          default:
            break;
        }
      },
      items: {
        area1: {
          name: "Origin Note",
          type: 'text',
          value: "",
          placeholder: "Origin Note"
        },
        area2: {
          name: "Middle Note",
          type: 'text',
          value: ""
        },
        area3: {
          name: "Destination Note",
          type: 'text',
          value: ""
        },
        "editLineType": {name: "Edit line style", icon: "fa-pencil-square-o"},
        "removeEdge": {name: "Delete", icon: "fa-times"},
      },
      events: {
        show: function(opt) {
          // this is the trigger element
          var $this = this;
          // import states from data store
          $.contextMenu.setInputValues(opt, $this.data());
          // this basically fills the input commands from an object
          // like {name: "foo", yesno: true, radio: "3", &hellip;}
        },
        hide: function(opt) {
          // this is the trigger element
          var $this = this;
          // export states to data store
          $.contextMenu.getInputValues(opt, $this.data());
          // this basically dumps the input commands' values to an object
          // like {name: "foo", yesno: true, radio: "3", &hellip;}
        }
      }
    });
  }
}

export default EdgeMenuContext;
