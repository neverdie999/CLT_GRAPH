class BoundaryMenuItems {
  constructor(props) {
    this.selector = props.selector;
    this.boundaryOperations = props.boundaryOperations;
    this.objectUtils = props.objectUtils;
    this.dataShow = {};
    this.storeOperations = props.storeOperations;
    this.initBoundaryMenuItems();
  }

  initBoundaryMenuItems() {
    $.contextMenu({
      selector: this.selector,
      className: 'data-title',
      zIndex: 100,
      build: ($trigger) => {
        return {
          callback: (key, options) => {
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
    // Get info of boundary
    let boundaryId = $trigger.attr('data');
    const {member} = _.find(this.storeOperations.boundary, {"id":boundaryId});
    const subItems = {};
    if (member.length == 0) {
      subItems.isHtmlItem = {
        type: 'html',
        html: '<div style="text-align: center; color: #ff0000;"><span>No member added</span></div>'
      };
    }else{

      subItems["showAll"] = {
        name: `Show all`, type: 'checkbox', events: {
          click: this.handleOnSelectAll(this, boundaryId, member)
        }
      };

      subItems["sep1"] = "-";

      member.forEach(mem => {
        const {type, id, show} = mem;
        const {name} = type === "B" ? _.find(this.storeOperations.boundary, {"id":id}) : _.find(this.storeOperations.vertex, {"id":id});
        subItems[`${id}`] = {
          name: `${name}`, type: 'checkbox', events: {
            click: (e) => {
              this.setStateForShowAllCheckBox(e.target);
              this.boundaryOperations.selectMemberVisible(boundaryId, mem, e.target.checked);
            }
          }
        };
        this.dataShow[`${id}`] = show;
      });
    }

    let bHasUncheckItem = _.find(this.dataShow, item => {
      return item == false;
    });

    if (bHasUncheckItem == false){
      this.dataShow["showAll"] = false;
    }else{
      this.dataShow["showAll"] = true;
    }

    return subItems;
  }

  /**
   * Event handle for Show all checkbox click
   * @param {*} owner
   * @param {*} boundaryId
   * @param {*} member
   */
  handleOnSelectAll(owner, boundaryId, member) {
    return function(e) {
      let listBox = $(this).closest('ul').find(`li`).find(`input:checkbox`);

      let length = listBox.length;
      for (let i = 0; i < length; i++) {
        let element = listBox[i];
        if(element.name.indexOf("showAll") == -1 && element.checked != e.target.checked){
          element.checked = e.target.checked;
          owner.boundaryOperations.selectMemberVisible(boundaryId, member[i-1], e.target.checked);
        }
      }
    }
  }

  /**
   * Change the state of Show all checkbox when others changed
   * @param {*} owner
   */
  setStateForShowAllCheckBox(owner){
    let arrItem = $(owner).closest('ul').find(`li`).find(`input:checkbox`);
    let length = arrItem.length;
    let showAllItem;

    for (let i = 0; i < length; i++) {
      let element = arrItem[i];
      if(element.name.indexOf("showAll") != -1){
        showAllItem = element;
      }else{
        if (element.checked == false){
          showAllItem.checked = false;
          return;
        }
      }
    }

    showAllItem.checked = true;
  }
}

export default BoundaryMenuItems;
