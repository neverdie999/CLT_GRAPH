import * as d3 from 'd3';

class EdgeMenu {
  constructor(props) {
    this.selector = props.selector;
    this.edge = props.edge;
    this.initEdgeMenu();
  }

  initEdgeMenu() {
    // Context menu for Edge
    let edgeMgmt = this.edgeMgmt;
    $.contextMenu({
      selector: this.selector,
      delay: 300,
      zIndex: 100,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            let edgeId = options.$trigger.attr('id');
            switch (key) {
              case "openPopupEditType":
                this.edge.openPopEditType(edgeId);
                break;

              case "removeEdge":
                this.edge.removeEdge(edgeId);
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
            "openPopupEditType": {
              name: "Edit line style",
              icon: "fa-pencil-square-o",
              disabled: window.disabledCommand
            },
            "removeEdge": {
              name: "Delete",
              icon: "fa-times",
              disabled: window.disabledCommand
            },
          },
          events: {
            show: (opt) => {
              // Get edge notes
              let edgeId = opt.$trigger.attr('id');
              d3.select(`#${edgeId}`).classed("selected", true);
              let data = this.edge.getEdgeNotes(edgeId)
              $.contextMenu.setInputValues(opt, data);
            },
            hide: this.onEdgeMenuHide(this)
          }
        }
      }
    });
  }

  onEdgeMenuHide(self) {
    return function (opt) {
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
      d3.select(`#${edgeId}`).classed("selected", false);
      self.edge.setEdgeNotes(edgeId, notes);
    }
  }
}

export default EdgeMenu;
