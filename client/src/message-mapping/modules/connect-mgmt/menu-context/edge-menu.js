import * as d3 from 'd3';

class EdgeMenu {
  constructor(props) {
    this.selector = props.selector;
    this.connectMgmt = props.connectMgmt;
    this.initEdgeMenu();
    this.id = null;
  }

  initEdgeMenu() {
    // Context menu for Edge
    $.contextMenu({
      selector: this.selector,
      delay: 300,
      zIndex: 100,
      build: () => {
        return {
          callback: (key, options) => {
            this.id = options.$trigger.attr('ref');
            switch (key) {
              case "removeEdge":
                this.connectMgmt.removeEdge(this.id);
                break;

              default:
                break;
            }
          },
          items: {
            originNote: {
              type: 'text',
              value: "",
              placeholder: 'Origin note',
              events: {
                keyup: this.onNoteChanged(this, "originNote")
              }
            },
            middleNote: {
              type: 'text',
              value: "",
              placeholder: 'Middle note',
              events: {
                keyup: this.onNoteChanged(this, "middleNote")
              }
            },
            destNote: {
              type: 'text',
              value: "",
              placeholder: 'Destination note',
              events: {
                keyup: this.onNoteChanged(this, "destNote")
              }
            },
            lineType: {
              type: 'select',
              options: {'S': 'Solid', 'D': 'Dash'},
              events: {
                change: this.onLineTypeChanged(this)
              }
            },
            useMarker: {
              type: 'select',
              options: {'Y': 'Yes', 'N': 'No'},
              events: {
                change: this.onUseMarkerChanged(this)
              }
            },
            removeEdge: {
              name: "Delete",
              icon: "fa-times"
            },
          },
          events: {
            show: (opt) => {
              // Get edge notes
              this.id = opt.$trigger.attr('ref');
              this.connectMgmt.handlerOnClickEdge(this.id);
              let data = this.connectMgmt.getEdgeInfo(this.id);
              $.contextMenu.setInputValues(opt, data);
            }
          }
        }
      }
    });
  }

  onNoteChanged(main, targetNote) {
    return function () {
      main.connectMgmt.setEdgeNote(main.id, this.value, targetNote);
    }
  }

  onLineTypeChanged(main) {
    return function () {
      main.connectMgmt.setLineType(main.id, this.value);
    }
  }

  onUseMarkerChanged(main) {
    return function () {
      main.connectMgmt.setUseMarker(main.id, this.value);
    }
  }
}

export default EdgeMenu;
