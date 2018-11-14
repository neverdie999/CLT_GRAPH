import FileMgmt from '../file-mgmt/file-mgmt';
import CltMessageMapping from '../../../components/clt-message-mapping/clt-message-mapping';
import { DATA_ELEMENT_TYPE } from '../../../common/const';

class MainMgmt {
  constructor(props) {

		const options = {
			selector: $('.wrap-container-area'),
			mandatoryDataElementConfig: {
				mandatoryEvolutionFunc: (dataElement) => {
					if (!dataElement) return false;
					if ((dataElement.usage && dataElement.usage !== "M") && !dataElement.mandatory) return false;
					if (dataElement.type && dataElement.type === DATA_ELEMENT_TYPE.COMPOSITE) return false;
	
					return true;
				},
				clrWarning: '#ff8100', // Orange
				clrAvailable: '#5aabff' // Light blue
			}
		}

    this.cltMessageMapping = new CltMessageMapping(options);

    new FileMgmt({
      parent: this
    });
	}

  /**
   * Validation data input match structure of graph data
   * @param data
   * @param option
   */
  async separateDataToManagement(data, option) {
    if (option === "DATA_INPUT_MESSAGE") {
      await this.cltMessageMapping.LoadInputMessage(data);

    }else if (option === "DATA_OUTPUT_MESSAGE") {
      await this.cltMessageMapping.LoadOutputMessage(data);

    }else if (option === "DATA_VERTEX_DEFINE_OPERATIONS") {
      await this.cltMessageMapping.LoadOperationsVertexDefinition(data);

    }else if (option === "DATA_MESSAGE_MAPPING_DEFINITION") {
      await this.cltMessageMapping.LoadMesseageMapping(data);
    }
  }

  save(fileName){
    this.cltMessageMapping.save(fileName);
  }
};
export default MainMgmt;