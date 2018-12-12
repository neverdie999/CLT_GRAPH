import {getCoorMouseClickRelativeToParent, checkModePermission} from '../../../common/utilities/common.util'
import _ from 'lodash'

class MainMenu {
	constructor(props) {
		this.selector = props.selector
		this.containerId = props.containerId
		this.parent = props.parent
		this.vertexDefinition = props.vertexDefinition
		this.viewMode = props.viewMode
    
		this.initMainMenu()
	}

	initMainMenu() {
		// Main menu config
		$.contextMenu({
			selector: this.selector,
			autoHide: true,
			zIndex: 100,
			build: () => {
				return {
					callback: (key, options) => {
						switch (key) {
              
						case 'createBoundary':
							let params = {
								x: options.x,
								y: options.y
							}
							this.parent.createBoundary(params)
							break

						case 'clearAll':
							this.parent.edgeMgmt.clearAll()
							this.parent.clearAll()
							break
								
						case 'autoAlignment':
							this.parent.operationsAutoAlignment()
							break

						case 'showReduced':
							this.parent.isShowReduced ? this.parent.showFull(options) : this.parent.showReduced(options)
							break

						default:
							break
						}
					},
					items: {
						'createVertex': {
							name: 'Create Vertex',
							icon: 'fa-window-maximize',
							items: checkModePermission(this.viewMode.value, 'createVertex') ? this.loadItems() : {},
							type: 'sub',
							disabled: !checkModePermission(this.viewMode.value, 'createVertex')
						},
						'sep1': '-',
						'createBoundary': {
							name: 'Create Boundary',
							icon: 'fa-object-group',
							disabled: !checkModePermission(this.viewMode.value, 'createBoundary')
						},
						'sep2': '-',
						'clearAll': {
							name: 'Clear All',
							icon: 'fa-times',
							disabled: !checkModePermission(this.viewMode.value, 'clearAll')
						},
						'sep3': '-',
						'autoAlignment': {
							name: 'Auto Alignment',
							icon: 'fa-sort',
							disabled: !checkModePermission(this.viewMode.value, 'autoAlignment')
						},
						'sep4': '-',
						'showReduced': {
							name: this.parent.isShowReduced ? 'Show Full' : 'Show Reduced',
							icon: 'fa-link',
							disabled: !checkModePermission(this.viewMode.value, 'showReduced')
						},
					},
					events: {
						show: (opt) => {
							if (!event)
								return

							const {x, y} = getCoorMouseClickRelativeToParent(event, this.containerId)
							opt['x'] = x
							opt['y'] = y
							opt.isMenu = true
							this.opt = opt
						}
					}
				}
			}
		})
	}

	/**
   * Generate verties from array vertexTypes
   */
	loadItems() {
		const subItems = {}
		subItems.isHtmlItem = {
			placeholder: 'Type to search',
			type: 'text',
			value: '',
			events: {
				keyup: this.searchVertexType()
			}
		}
		subItems['sep4'] = '-'
		const options = {}
		// Build options
		if (this.vertexDefinition.vertex && Array.isArray(this.vertexDefinition.vertex)) {
			let vertices = this.vertexDefinition.vertex
			// Sort array object
			vertices = _.orderBy(vertices, ['vertexType'], ['asc'])
			let len = vertices.length
			for (let i = 0; i < len; i++) {
				let type = vertices[i].vertexType
				options[`${type}`] = type
			}
		}

		subItems.select = {
			type: 'select',
			size: 10,
			options: options,
			events: {
				change: this.onSelectVertex(this)
			}
		}

		let dfd = jQuery.Deferred()
		setTimeout(() => {
			dfd.resolve(subItems)
		}, 10)
		return dfd.promise()
	}

	searchVertexType() {
		return function () {
			let filter = this.value.toUpperCase()
			let $select = $(this).closest('ul').find('select')
			let options = $select.find('option')
			// Remove first li cause it is input search
			let length = options.length
			for (let i = 0; i < length; i++) {
				let element = options[i]
				let value = $(element).val()
				if (value.toUpperCase().indexOf(filter) > -1) {
					$(element).css('display', '')
				} else {
					$(element).css('display', 'none')
				}
			}

			//$($select).click();
		}
	}

	onSelectVertex(self) {
		return function () {

			let params = {
				x: self.opt.x,
				y: self.opt.y,
				isMenu: self.opt.isMenu,
				vertexType: this.value,
				isImport: false
			}
			self.parent.createVertex(params)
			$(`${self.selector}`).contextMenu('hide')
		}
	}
}

export default MainMenu
