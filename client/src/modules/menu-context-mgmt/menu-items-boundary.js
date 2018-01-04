class MenuItemsBoundary{
  constructor(props){
    this.selector = props.selector;
    this.boundaryMgmt = props.boundaryMgmt;
    this.vertexMgmt = props.vertexMgmt;
    this.dataContainer = props.dataContainer;
    this.mainMgmt = props.mainMgmt;
    this.initListItem();
  }

  initListItem(){
    $.contextMenu({
      selector: '.boundary_right',
      className: 'data-title',
      zIndex: 100,
      // autoHide: true,
      build: ($trigger, e) => {
        return {
          callback: (key, options) => {
            let boundaryId = options.$trigger.attr('id');
          },
          items: this.loadItems($trigger),
          events: {
            show: function(opt) {
              $('.data-title').attr('data-menutitle', "Member Visible");
              var $this = this;
              let data = {yesno01: true, yesno02: true, yesno03: true, yesno04: true, yesno05: false};
              $.contextMenu.setInputValues(opt, data);
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

  loadItems($trigger) {

    // Get info of boundary
    let boundaryId = $trigger.attr('data');
    let boundaryInfo = this.boundaryMgmt.getBoundaryInfoById(boundaryId);
    let childs = boundaryInfo.member;
    let boundaryMembers = boundaryInfo.member.boundary;

    const subItems = {};
    if(childs.length == 0){
      subItems.isHtmlItem = {type: 'html', html: '<div style="text-align: center; color: red;"><span>No member added</span></div>'};
    }
    childs.forEach(child => {
      let type = child.type;
      let childId = child.id;
      let childInfo = type === "B" ? this.boundaryMgmt.getBoundaryInfoById(childId) : this.vertexMgmt.getVertexInfoById(childId);
      subItems[`${childId}`] = {name: `${childInfo.name}`, type: 'checkbox', events: {click: (e) => { this.boundaryMgmt.setVisibleMember(child); }}};
    });

    return subItems;
  }
}

export default MenuItemsBoundary;
