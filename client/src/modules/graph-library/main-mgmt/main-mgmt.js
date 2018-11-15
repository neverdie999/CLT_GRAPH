import FileMgmt from '../file-mgmt/file-mgmt'
import CltGraph from '../../../components/clt-graph/clt-graph'
import { VIEW_MODE } from '../../../common/const/index'

class MainMgmt {
	constructor(props) {
		
		let options = {
			selector: $('.algetaContainer'),
			viewMode: VIEW_MODE.EDIT,
			mandatoryDataElementConfig: {
				mandatoryEvaluationFunc: (dataElement) => {
					if (!dataElement) return false
					if (dataElement.usage !== undefined && dataElement.usage !== '' && dataElement.usage !== 'M') return false
					if (dataElement.mandatory !== undefined && !dataElement.mandatory) return false
	
					return true
				},
				colorWarning: '#ff8100', // Orange
				colorAvailable: '#5aabff' // Light blue
			}
		}

		this.cltGraph = new CltGraph(options)

		/**
     * Init file mgmt
     */
		new FileMgmt({
			parent: this
		})
	}

	/**
   * Validation data input match structure of graph data
   * @param data
   * @param option
   */
	async separateDataToManagement(data, option) {
		if (option === 'VERTEX_TYPE') {
			await this.cltGraph.LoadVertexDefinition(data)
		}else if (option === 'GRPH_DATA') {
			await this.cltGraph.loadGraphData(data)
		}
	}

	save(fileName) {
		this.cltGraph.save(fileName)
	}

	/**
   * Set mode graph is enable or disable edit
   * @param modeGraph
   */
	setGraphMode(modeGraph) {
		let viewMode = modeGraph === 'S' ? VIEW_MODE.SHOW_ONLY : VIEW_MODE.EDIT
		this.cltGraph.setViewMode(viewMode)
	}
}
export default MainMgmt
