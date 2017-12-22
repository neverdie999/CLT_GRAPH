class MenuItemsBoundary{
  constructor(props){
    this.initListItem();
  }

  initListItem(){
    $.contextMenu({
      selector: '.groupBoundary',
      className: 'data-title',
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
          items: this.loadItems(),
          events: {
            show: function(opt) {
              $('.data-title').attr('data-menutitle', "Member Visible");
              var $this = this;
              $.contextMenu.setInputValues(opt, $this.data());
            },
            hide: function(opt) {
              var $this = this;
              $.contextMenu.getInputValues(opt, $this.data());
            }
          }
        }
      }
    });
  }

  loadItems() {

    let yesno01 = {name: "Vertex Grull", type: 'checkbox', selected: true};
    let yesno02 = {name: "Vertex Boun", type: 'checkbox', selected: true};
    let yesno03 = {name: "Vertex Trunt", type: 'checkbox', selected: true};
    let yesno04 = {name: "Boundary Tank", type: 'checkbox', selected: true};
    let yesno05 = {name: "Boundary Container", type: 'checkbox', selected: true};

    const subItems = {
      yesno01, yesno02, yesno03, yesno04, yesno05
    };

    // let dfd = jQuery.Deferred();
    // setTimeout(() => {
    //   dfd.resolve(subItems);
    // }, 10);
    // // set a title
    // return dfd.promise();

    return subItems;
  }
}

export default MenuItemsBoundary;
