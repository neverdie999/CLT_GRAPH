const ID_FOLDER_OPEN_FILE_MGMT = 'folderOpenFileMgmt'
const ID_CONTAINER_FILE_MGMT = 'containerFileMgmt'
const ID_INPUT_SPEC_FILE = 'specFile'
const ID_INPUT_SPEC_FILE_NAME = 'specFileName'
const ID_INPUT_SAMPLE_FILE = 'sampleFile'
const ID_INPUT_SAMPLE_FILE_NAME = 'sampleFileName'
const ID_BUTTON_VIEW_FULL_TEXT = 'btnViewFullText'

class FileMgmt {
	constructor(props) {
		this.parent = props.parent
		this.initialize()
	}

	initialize() {
		this.bindEventListenerToControls()
	}

	bindEventListenerToControls() {
		$(`#${ID_FOLDER_OPEN_FILE_MGMT}`).click(() => {
			$(`#${ID_CONTAINER_FILE_MGMT}`).slideToggle()
		})

		$(`#${ID_INPUT_SPEC_FILE}`).change((event) => {
			const file = event.target.files[0];
			if (!file) return

			const reader = new FileReader();
			reader.readAsText(file);
			reader.onload = (event) => {		
				if ($(`#${ID_INPUT_SPEC_FILE_NAME}`).val() === file.name) return

				$(`#${ID_INPUT_SPEC_FILE_NAME}`).val(file.name)

				this.parent.loadSpecFile(event.target.result)
			}
		})

		$(`#${ID_INPUT_SAMPLE_FILE}`).change((event) => {
			const file = event.target.files[0];
			if (!file) return

			const reader = new FileReader();
			reader.readAsText(file);
			reader.onload = (event) => {
				if ($(`#${ID_INPUT_SAMPLE_FILE_NAME}`).val() === file.name) return

				$(`#${ID_INPUT_SAMPLE_FILE_NAME}`).val(file.name)

				this.parent.loadSampleFile(event.target.result)
			}
		})

		// Handle event click on button Download
		$(`#${ID_BUTTON_VIEW_FULL_TEXT}`).click((event) => {
			this.parent.viewFullText()
		})
	}
}

export default FileMgmt
