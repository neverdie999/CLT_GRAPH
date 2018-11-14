class BoundaryMenuItems {
	constructor(props) {
		this.selector = props.selector
		this.dataContainer = props.dataContainer
		this.dataShow = {}
    
		this.initBoundaryMenuItems()
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
							$('.data-title').attr('data-menutitle', 'Member Visible')
							$.contextMenu.setInputValues(opt, this.dataShow)
						}
					}
				}
			}
		})
	}

	initItems($trigger) {
		this.dataShow = {}
		// Get info of boundary
		let boundaryId = $trigger.attr('data')
		let boundaryObj = _.find(this.dataContainer.boundary, {'id':boundaryId})
		const {member} = boundaryObj
		const subItems = {}
		if (member.length == 0) {
			subItems.isHtmlItem = {
				type: 'html',
				html: '<div style="text-align: center; color: #ff0000;"><span>No member added</span></div>'
			}
		}else{

			subItems['showAll'] = {
				name: 'Show all', type: 'checkbox', events: {
					click: this.handleOnSelectAll( boundaryObj )
				}
			}

			subItems['sep1'] = '-'

			member.forEach(mem => {
				const {type, id, show} = mem
				const {name} = type === 'B' ? _.find(this.dataContainer.boundary, {'id':id}) : _.find(this.dataContainer.vertex, {'id':id})
				subItems[`${id}`] = {
					name: `${name}`, type: 'checkbox', events: {
						click: (e) => {
							this.setStateForShowAllCheckBox(boundaryObj, e.target)
							boundaryObj.selectMemberVisible(mem, e.target.checked)
						}
					}
				}
				this.dataShow[`${id}`] = show
			})
		}

		let bHasUncheckItem = _.find(this.dataShow, item => {
			return item == false
		})

		if (bHasUncheckItem == false) {
			this.dataShow['showAll'] = false
		}else{
			this.dataShow['showAll'] = true
		}

		return subItems
	}

	/**
   * Event handle for Show all checkbox click
   * @param {*} boundaryId
   * @param {*} member
   */
	handleOnSelectAll(boundary) {
		return function(e) {
			let listBox = $(this).closest('ul').find('li').find('input:checkbox')

			let length = listBox.length
			for (let i = 0; i < length; i++) {
				let element = listBox[i]
				if(element.name.indexOf('showAll') == -1 && element.checked != e.target.checked) {
					element.checked = e.target.checked
				}
			}

			boundary.selectAllMemberVisible(e.target.checked)
		}
	}

	/**
   * Change the state of Show all checkbox when others changed
   * @param {*} boundary
   * @param {*} owner
   */
	setStateForShowAllCheckBox(boundary, owner) {
		let arrItem = $(owner).closest('ul').find('li').find('input:checkbox')
		let length = arrItem.length
		let showAllItem

		for (let i = 0; i < length; i++) {
			let element = arrItem[i]
			if(element.name.indexOf('showAll') != -1) {
				showAllItem = element
			}else{
				if (element.checked == false) {
					showAllItem.checked = false
					return
				}
			}
		}

		showAllItem.checked = true
	}
}

export default BoundaryMenuItems
