class PopUtils {
  metSetShowPopup(options) {
    /**
     * Configure position, width for modal popup.
     */
    if (!options.popupId) {
      return;
    }
    let popupId = options.popupId;
    // Configure show modal and prevent close modal when use
    // click outside or press ESC
    $(`#${popupId}`).modal({backdrop: 'static', keyboard: false})

    // Set position popup center
    // Default is top center
    if (options.position === 'center') {
      $(`#${popupId}` + ` .modal-dialog`).css("margin-top", Math.max(0, ($(window).height() - $('.modal-dialog').height()) / 4));
    }

    // Set width for modal.
    if (options.width) {
      $(`#${popupId}` + ` .modal-dialog`).css("width", options.width);
    }
  }

  metClosePopup(options) {
    /**
     * Hide modal popup.
     */
    if (!options.popupId) {
      return;
    }
    $(`#${options.popupId}`).modal('hide');
  }
}

export default new PopUtils();
