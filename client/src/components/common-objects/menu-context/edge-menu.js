class EdgeMenu {
	constructor(props) {
		this.dataContainer = props.dataContainer // a reference to dataContain of Edge
		this.selector = props.selector
		this.edgeMgmt = props.edgeMgmt
		this.initEdgeMenu()
		this.selectedEdge = null
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
						switch (key) {
						case 'removeEdge':
							this.selectedEdge.remove()
							break

						default:
							break
						}
					},
					items: {
						originNote: {
							type: 'text',
							value: '',
							placeholder: 'Origin note',
							events: {
								keyup: this.onNoteChanged(this, 'originNote')
							}
						},
						middleNote: {
							type: 'text',
							value: '',
							placeholder: 'Middle note',
							events: {
								keyup: this.onNoteChanged(this, 'middleNote')
							}
						},
						destNote: {
							type: 'text',
							value: '',
							placeholder: 'Destination note',
							events: {
								keyup: this.onNoteChanged(this, 'destNote')
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
							options: {'Y': 'Arrow', 'N': 'None'},
							events: {
								change: this.onUseMarkerChanged(this)
							}
						},
						removeEdge: {
							name: 'Delete',
							icon: 'fa-times'
						},
					},
					events: {
						show: (opt) => {
							// Get edge notes
							let edgeId = opt.$trigger.attr('ref')
							this.selectedEdge = _.find(this.dataContainer.edge, {'id':edgeId})
							this.edgeMgmt.handlerOnClickEdge(this.selectedEdge)
							$.contextMenu.setInputValues(opt, this.selectedEdge)
						}
					}
				}
			}
		})
	}

	onNoteChanged(main, targetNote) {
		return function () {
			main.selectedEdge.setNote(this.value, targetNote)
		}
	}

	onLineTypeChanged(main) {
		return function () {
			main.selectedEdge.setLineType(this.value)
		}
	}

	onUseMarkerChanged(main) {
		return function () {
			main.selectedEdge.setUseMarker(this.value)
		}
	}
}

export default EdgeMenu
