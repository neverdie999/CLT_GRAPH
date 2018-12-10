import {readDataFileJson} from '../../../common/utilities/common.util'

const ID_FOLDER_OPEN_FILE_MGMT = 'folderOpenFileMgmt'
const ID_CONTAINER_FILE_MGMT = 'containerFileMgmt'
const ID_OPTION_FILE_TYPE_INPUT = 'optionFileTypeInput'
const ID_INPUT_FILE_DATA = 'inputFileData'

const GROUP_OPTION_MODE_GRAPH = 'input:radio[name=graphMode]'
const ID_OUTPUT_FILE_NAME = 'outputFileName'
const ID_BUTTON_DOWNLOAD_FILE = 'btnDownloadFile'


class FileMgmt {
	constructor(props) {
		this.parent = props.parent
		this.initialize()
		this.loadedFile = []
	}

	initialize() {
		this.bindEventListenerToControls()
	}

	bindEventListenerToControls() {
		$(`#${ID_FOLDER_OPEN_FILE_MGMT}`).click(() => {
			$(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle()
		})

		$(`#${ID_OPTION_FILE_TYPE_INPUT}`).change(event => {
			$(`#${ID_INPUT_FILE_DATA}`).val('')
		})

		$(`#${ID_INPUT_FILE_DATA}`).change((event) => {
			this.readJsonFile(event)
		})

		// Handle event click on button Download
		$(`#${ID_BUTTON_DOWNLOAD_FILE}`).click((event) => {
			this.saveFile()
		})

		// Handle event press enter on input file name
		$(`#${ID_OUTPUT_FILE_NAME}`).keypress((event) => {
			if (event.keyCode == 13) {
				this.saveFile()
				event.preventDefault()
			}
		})
	}

	/**
   * Read content file Vertex Type Definition
   * or  read content file Graph Data Structure
   * @param event
   */
	async readJsonFile(event) {
		let file = event.target.files[0]
		if (!file)
			return

		const data = await readDataFileJson(file)
		if (!data)
			return

		const options = $(`#${ID_OPTION_FILE_TYPE_INPUT}`).val()
		this.parent.separateDataToManagement(data, options)

		//Hide file managememnt area
		$(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle()
	}

	saveFile() {
		let fileName = $(`#${ID_OUTPUT_FILE_NAME}`).val()
		this.parent.save(fileName)

		this.clearOutFileName()
		$(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle()
	}

	clearOutFileName() {
		$(`#${ID_OUTPUT_FILE_NAME}`).val(null)
	}
}

export default FileMgmt
