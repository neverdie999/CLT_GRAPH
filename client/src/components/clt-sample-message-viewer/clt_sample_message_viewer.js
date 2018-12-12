import SampleMessageViewer from './sample_message_viewer'
import PopUtils from '../../common/utilities/popup.util'
class cltSampleMessageViewer {
	constructor(props){
		this.specFile = ''
		this.sampleFile = ''
		this.messageElement = null
		this.main = new SampleMessageViewer();

		this.bindMainEvent()

		this.initPopupHtml()

		this.bindEventForPopup()
	}

	bindMainEvent() {
		$('#editSample').click(event => {
			this.editSampleClickEvent(event)
		})
	}

	initPopupHtml() {
		let sHtml = `
    
    <div id="popupFullText" class="modal fade" role="dialog" tabindex="-1">
      <div class="modal-dialog">
        <div class="web-dialog modal-content">
          <div class="dialog-title">
            <span class="title">Full Text</span>
          </div>

          <div class="dialog-wrapper">
						<div>
							<pre id='popupContent'></pre>
						</div>
            
            <div class="dialog-button-top">
              <div class="row text-right">
                <button id="btnPopupClose" class="btn-etc">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
		</div>`
		
		$('body').append(sHtml)
	}

	bindEventForPopup() {

		$(`#btnPopupClose`).click(() => {
			let options = {popupId: `popupFullText`}
			PopUtils.metClosePopup(options)
		})

		// Prevent refresh page after pressing enter on form control (Edit popup)
		$('form').submit(function() { return false })
		
		// Enable dragging for popup
		this.initDialogDragEvent()
	}

	/**
	 * Enable dragging for popup
	 */
	initDialogDragEvent() {
		$(`#popupFullText .dialog-title`).css('cursor', 'move').on('mousedown', (e) => {
			let $drag = $(`#popupFullText .modal-dialog`).addClass('draggable')
				
			let pos_y = $drag.offset().top - e.pageY,
				pos_x = $drag.offset().left - e.pageX,
				winH = window.innerHeight,
				winW = window.innerWidth,
				dlgW = $drag.get(0).getBoundingClientRect().width
				
			$(window).on('mousemove', function(e) {
				let x = e.pageX + pos_x
				let y = e.pageY + pos_y

				if (x < 10) x = 10
				else if (x + dlgW > winW - 10) x = winW - dlgW - 10

				if (y < 10) y = 10
				else if (y > winH - 10) y = winH - 10

				$(`#popupFullText .draggable`).offset({
					top: y,
					left: x
				})
			})
			e.preventDefault() // disable selection
		})

		$(window).on('mouseup', function(e) {
			$(`#popupFullText .draggable`).removeClass('draggable')
		})
	}

	loadSpecFile(data) {
		this.specFile = data;

		if (this.sampleFile !== '') {
			this.loadData()
		}
	}

	loadSampleFile(data) {
		this.sampleFile = data;

		if (this.specFile !== '') {
			this.loadData()
		}
	}

	loadData() {
		if (this.specFile === '' || this.sampleFile === '') return

		this.printError(this.main.makeTree(this.specFile, this.sampleFile));
		$('#jstree').jstree({
			'core': {
				'data': this.main.jsTree
			}
		});

		this.treeNodeClickEvent();
	}

	viewFullText() {
		if (this.sampleFile === '') return

		const fullText = this.main.getAssembledMessage('\n');
		$('#popupContent').get(0).innerHTML = fullText.join('')

		let options = {
			popupId: `popupFullText`,
			position: 'center',
			width: ((window.innerWidth/3)*2) < 500 ? 500 : ((window.innerWidth/3)*2)
		}

		PopUtils.metSetShowPopup(options)
  } 

  treeNodeClickEvent() {    
    $('#jstree').on("changed.jstree", (e, data) => {
			//element가 아니라 messageElementd를 가져올 수 있도록!!      
			const id = (data.instance.get_node(data.selected).id);
			this.messageElement = this.main.getDetail(id);
			if (this.messageElement.constructor.name === "MessageSegment") {
				$('#editSample').show()
				$('#btnViewFullText').show()

				$('#detailBody').html('');
				$('#detailHead').html('');
				$('#detailHead').append('<tr>');
				$('#detailHead').append('<td class="col_header" >NAME</td>');
				$('#detailHead').append('<td class="col_header" >TYPE</td>');
				$('#detailHead').append('<td class="col_header" >USAGE</td>');
				$('#detailHead').append('<td class="col_header" >FORMAT</td>');
				$('#detailHead').append('<td class="col_header" >DESCRIPTION</td>');
				$('#detailHead').append('<td class="col_header" >VALUE</td>');
				$('#detailHead').append('</tr>');

				this.printMessageElement();
			}
		});
	}
	
	editSampleClickEvent() {
		this.setMessageElement();
		let result = this.main.reMatch(this.main.messageStructure)
		this.printError(result);

		if (result) {
			if (result.resultType === Symbol.for('SUCCESS')) {
				$.notify({
					message: 'Applied!'
				},{
					type: "success"
				});
			} else {
				let regex = /(Symbol\()(.*)(\))/
				let errorType = regex.exec(result.resultType.toString())

				$.notify({
					message: `[Failed] ${errorType[2]}!`
				},{
					type: "danger",
				});
			}
		}
	}

	printMessageElement() {
		let seqTextBox = 0;
		this.messageElement.spec.dataElements.forEach((eachDataElement) => {
			let elementDataExist = false;
			this.messageElement._children.forEach((eachMessageDataElements) => {
				eachMessageDataElements.forEach((eachMessageDataElement) => {
					if (
						eachMessageDataElement.name === eachDataElement.name
						&& eachMessageDataElement.spec.id === eachDataElement.id
					) {
						eachMessageDataElement.whiteSpace = eachMessageDataElement.value.length - eachMessageDataElement.value.trim().length;
						$('#detailBody').append('<tr>')
							.append(`<td>${eachDataElement.name}</td>`)
							.append(`<td>${eachDataElement.type}</td>`)
							.append(`<td>${eachDataElement.mandatory}</td>`)
							.append(`<td>${eachDataElement.format}</td>`)
							.append(`<td>${eachDataElement.description}</td>`)
							.append(`<td ><input type="text" class="form-control" id="editValue${eachDataElement.name + seqTextBox}" value="${eachMessageDataElement.value.trim()}"></td>`)
							.append('</tr>');

						let main = this;
						$(`#editValue${eachDataElement.name + seqTextBox}`).change(function(event) {
							if (!main.validateByFormat($(this).val(), eachDataElement.format)) {
								$(this).css('background-color', '#fb2d2d')
								$(this).css('color', 'white')
							} else {
								$(this).css('background-color', '')
								$(this).css('color', '')
							}
						})
						
						elementDataExist = true;
					}
					seqTextBox += 1;
				});
				seqTextBox += 1;
			});

			if (!elementDataExist) {
				$('#detailBody').append('<tr>')
					.append(`<td>${eachDataElement.name}</td>`)
					.append(`<td>${eachDataElement.type}</td>`)
					.append(`<td>${eachDataElement.mandatory}</td>`)
					.append(`<td>${eachDataElement.format}</td>`)
					.append(`<td>${eachDataElement.description}</td>`)
					.append(`<td></td>`)
					.append('</tr>');
			}
			seqTextBox += 1;
		});
	}

	setMessageElement(defaultValue=true) {
		let seqTextBox = 0;
		this.messageElement.spec.dataElements.forEach((eachDataElement) => {
			let elementDataExist = false;
			this.messageElement._children.forEach((eachMessageDataElements) => {
				eachMessageDataElements.forEach((eachMessageDataElement) => {
					if (eachMessageDataElement.name === eachDataElement.name && eachMessageDataElement.spec.id === eachDataElement.id) {
						eachMessageDataElement.value = $('#editValue' + eachDataElement.name + seqTextBox).val() + ' '.repeat(Number(eachMessageDataElement.whiteSpace));
						eachMessageDataElement.matchResult = defaultValue;
					}
					seqTextBox += 1;
				});
				seqTextBox += 1;
			});
			seqTextBox += 1;
		});
	}

	printError(result) {
		const text = `ERROR MESSAGE: ${result._desc}`; 
		$('#desc').html(text);
	}

	validateByFormat(string='', format='AN999') { 
    if (!format) { 
      return true; 
    } 
 
    const normalizedFormat = format.trim().toUpperCase(); 
    const regex = /([AN]{1,2})(\d+)/; 
    const matched = normalizedFormat.match(regex); 
    if (matched === null) { 
      return true; 
    } 
 
    const [, dataFormat, length] = matched; 
    if (string.length > parseInt(length, 10)) { 
      return false; 
    } 
 
    if (dataFormat === 'A') { 
      const regexAnyNumber = /\d+/; 
      return !regexAnyNumber.test(string); 
    } 
 
    if (dataFormat === 'N') { 
      const regexNumeric = /^(\+|-)?\d+[.,]?\d*$/; 
      return regexNumeric.test(string); 
    } 
 
    return true; 
  }
}

export default cltSampleMessageViewer