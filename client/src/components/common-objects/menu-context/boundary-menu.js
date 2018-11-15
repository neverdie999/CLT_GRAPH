import {
	COMMON_DATA,
} from '../../../common/const/index'
import { checkModePermission } from '../../../common/utilities/common.util'

class BoundaryMenu {
	constructor(props) {
		this.selector = props.selector
		this.boundaryMgmt = props.boundaryMgmt
		this.dataContainer = props.dataContainer
		this.viewMode = props.viewMode
		this.initBoundaryMenu()
	}

	initBoundaryMenu() {
		// Context menu for Vertex
		$.contextMenu({
			selector: this.selector,
			zIndex: 100,
			build: () => {
				return {
					callback: (key, options) => {
						let boundaryId = options.$trigger.attr('id')
						let boundary = _.find(this.dataContainer.boundary,{'id':boundaryId})
						switch (key) {
						case 'removeBoundary':
							boundary.remove()
							break

						case 'deleteAllBoundary':
							boundary.deleteAll()
							break

						case 'editBoundary':
							this.boundaryMgmt.makeEditBoundaryInfo(boundaryId)
							break

						case 'copyAllBoundary':
							boundary.copyAll(boundaryId)
							break

						default:
							break
						}
					},
					items: {
						'editBoundary': {
							name: 'Edit Boundary Info',
							icon: 'fa-pencil-square-o',
							disabled: !checkModePermission(this.viewMode.value, 'editBoundary')
						},
						'removeBoundary': {
							name: 'Delete',
							icon: 'fa-times',
							disabled: !checkModePermission(this.viewMode.value, 'removeBoundary')
						},
						'copyAllBoundary': {
							name: 'Copy All',
							icon: 'fa-files-o',
							disabled: !checkModePermission(this.viewMode.value, 'copyAllBoundary')
						},
						'deleteAllBoundary': {
							name: 'Delete All',
							icon: 'fa-square-o',
							disabled: !checkModePermission(this.viewMode.value, 'deleteAllBoundary')
						}
					}
				}
			}
		})
	}
}

export default BoundaryMenu
