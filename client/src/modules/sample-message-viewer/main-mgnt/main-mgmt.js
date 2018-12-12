import FileMgmt from '../file-mgmt/file-mgmt'
import cltSampleMessageViewer from '../../../components/clt-sample-message-viewer/clt_sample_message_viewer'

class MainMgmt {
	constructor(props) {

		this.cltSampleMessageViewer = new cltSampleMessageViewer()

		new FileMgmt({
			parent: this
		})
	}

	loadSpecFile(data) {
		this.cltSampleMessageViewer.loadSpecFile(data)
	}

	loadSampleFile(data) {
		this.cltSampleMessageViewer.loadSampleFile(data)
	}

	viewFullText() {
		this.cltSampleMessageViewer.viewFullText()
	}
}
export default MainMgmt