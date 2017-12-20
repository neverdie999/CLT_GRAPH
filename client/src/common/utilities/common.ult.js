/**
 * Show message alert
 * @param msg
 */
export function comShowMessage(msg = null) {
  if(!msg)
    return;
  alert(msg);
}
