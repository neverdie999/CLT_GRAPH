import * as d3 from 'd3';

/**
 * Show message alert
 * @param msg
 */
export function comShowMessage(msg = null) {
  if(!msg)
    return;
  alert(msg);
}
