class BoundaryMenuItems{
  constructor(props){
    this.selector = props.selector;
    this.boundary = props.boundary;
    this.objectUtils = props.objectUtils;
    this.dataShow = {};
    this.initBoundaryMenuItems();
  }

  initBoundaryMenuItems(){
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
          items: this.initItems($trigger),
          events: {
            show: (opt) => {
              $('.data-title').attr('data-menutitle', "Member Visible");
              $.contextMenu.setInputValues(opt, this.dataShow);
            }
          }
        }
      }
    });
  }

  initItems($trigger) {
    this.dataShow = {};
    // Get info of boundarys
    let boundaryId = $trigger.attr('data');
    const {member} = this.objectUtils.getBoundaryInfoById(boundaryId);
    const subItems = {};
    if(member.length == 0){
      subItems.isHtmlItem = {type: 'html', html: '<div style="text-align: center; color: red;"><span>No member added</span></div>'};
    }

    member.forEach(mem => {
      const {type, id, show} = mem;
      const {name} = type === "B" ? this.objectUtils.getBoundaryInfoById(id) : this.objectUtils.getVertexInfoById(id);
      subItems[`${id}`] = {name: `${name}`, type: 'checkbox', events: {click: (e) => { this.boundary.selectMemberVisible(boundaryId, mem, e.target.checked); }}};
      this.dataShow[`${id}`] = mem.show;
    });
    return subItems;
  }
}

export default BoundaryMenuItems;
