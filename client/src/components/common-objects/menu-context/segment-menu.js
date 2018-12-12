import { checkModePermission } from '../../../common/utilities/common.util'

class SegmentMenu {
	constructor(props) {
		this.selector = props.selector
		this.parent = props.parent
		this.dataContainer = props.dataContainer
		this.viewMode = props.viewMode
		this.initVertexMenu()
	}

	initVertexMenu() {
		$.contextMenu({
			selector: this.selector,
			zIndex: 100,
			build: () => {
				return {
					callback: (key, options) => {
						let vertexId = options.$trigger.attr('id')
						let vertexObj = _.find(this.dataContainer.vertex, {'id': vertexId})
						switch (key) {
						case 'editVertex':
							this.parent.makePopupEditVertex(vertexObj)
							break

						case 'copyVertex':
							vertexObj.copy()
							break

						case 'removeVertex':
							vertexObj.remove()
							break

						default:
							break
						}
					},
					items: {
						'editVertex': {
							name: 'Edit Vertex Info',
							icon: 'fa-pencil-square-o',
							disabled: !checkModePermission(this.viewMode.value, 'editVertex')
						},
						'copyVertex': {
							name: 'Copy',
							icon: 'fa-files-o',
							disabled: !checkModePermission(this.viewMode.value, 'copyVertex')
						},
						'removeVertex': {
							name: 'Delete',
							icon: 'fa-times',
							disabled: !checkModePermission(this.viewMode.value, 'removeVertex')
						}
					}
				}
			}
		})
	}
}

export default SegmentMenu
