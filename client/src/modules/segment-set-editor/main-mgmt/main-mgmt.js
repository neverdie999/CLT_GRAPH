import FileMgmt from '../file-mgmt/file-mgmt'
import CltSegment from '../../../components/clt-segment/clt-segment'
import { VIEW_MODE, DATA_ELEMENT_TYPE } from '../../../common/const/index'

class MainMgmt {
	constructor(props) {

		const options = {
			selector: $('.algetaContainer'),
			viewMode: VIEW_MODE.SEGMENT,
			mandatoryDataElementConfig: {
				mandatoryEvaluationFunc: (dataElement) => {
					if (!dataElement) return false
					if ((dataElement.usage && dataElement.usage !== 'M') && !dataElement.mandatory) return false
					if (dataElement.type && dataElement.type === DATA_ELEMENT_TYPE.COMPOSITE) return false
	
					return true
				},
				clrWarning: '#ff8100', // Orange
				clrAvailable: '#5aabff' // Light blue
			}
		}
		
		this.cltSegment = new CltSegment(options)

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
			await this.cltSegment.LoadVertexGroupDefinition(data)
		}else if (option === 'GRPH_DATA') {
			await this.cltSegment.loadSegmentSpecEditor(data)
		}
	}

	save(fileName) {
		this.cltSegment.save(fileName)
	}
	
	saveToImage(fileName) {
		this.cltSegment.saveToImage(fileName)
	}
}
export default MainMgmt
