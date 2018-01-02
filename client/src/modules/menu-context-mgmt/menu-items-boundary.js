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
              console.log($this.data());
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
    let boundaryId = $trigger.attr('id');
    let boundaryInfo = this.boundaryMgmt.getBoundaryInfoById(boundaryId);
    let vetexMembers = boundaryInfo.member.vertex;
    let boundaryMembers = boundaryInfo.member.boundary;

    const subItems = {};
    if(vetexMembers.length == 0 && boundaryMembers.length == 0){
      subItems.isHtmlItem = {type: 'html', html: '<div style="text-align: center; color: red;"><span>No item added</span></div>'};
    }
    vetexMembers.forEach(vertex => {
      let vertexInfo = this.vertexMgmt.getVertexInfoById(vertex.id);
      subItems[`${vertex.id}`] = {name: `${vertexInfo.name}`, type: 'checkbox', events: {click: (e) => { this.boundaryMgmt.setVisibleVertex(`${vertex.id}`); }}};
    });
    boundaryMembers.forEach(boundary => {
      let boundaryInfo = this.boundaryMgmt.getBoundaryInfoById(boundary.id);
      subItems[`${boundary.id}`] = {name: `${boundaryInfo.name}`, type: 'checkbox', events: {click: (e) => { this.boundaryMgmt.setVisibleBoundary(`${boundary.id}`); }}};
    });

    return subItems;
  }
}

export default MenuItemsBoundary;
