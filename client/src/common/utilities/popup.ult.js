import {
	POPUP_CONFIG,
} from '../const/index'

class PopUtils {
	metSetShowPopup(options) {

		const {popupId, position, width} = options
		/**
     * Configure position, width for modal popup.
     */
		if (!options.popupId) {
			return
		}
		// Configure show modal and prevent close modal when use
		// click outside or press ESC
		$(`#${popupId}`).modal({backdrop: 'static', keyboard: true})

		// Set position popup center
		// Default is top center
		if (position === 'center') {
			$(`#${popupId} .modal-dialog`).css('left', 0)
			$(`#${popupId} .modal-dialog`).css('top', 0)
			//$(`#${popupId}` + ` .modal-dialog`).css("margin-top", Math.max(0, ($(window).height() - $('.modal-dialog').height()) / 4));
		}

		// Set width for modal.
		if (width) {
			$(`#${popupId}` + ' .modal-dialog')
				.css('width', width)
				.css('max-width', POPUP_CONFIG.MAX_WIDTH)
				.css('min-width', POPUP_CONFIG.MIN_WIDTH)
		}
	}

	metClosePopup(options) {
		/**
     * Hide modal popup.
     */
		if (!options.popupId) {
			return
		}
		$(`#${options.popupId}`).modal('hide')
	}
}

export default new PopUtils()
