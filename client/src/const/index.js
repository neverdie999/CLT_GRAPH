export const HTML_ALGETA_CONTAINER_CLASS = 'algetaContainer';
export const HTML_ALGETA_CONTAINER_ID = 'algetaContainer';
export const HTML_VERTEX_CONTAINER_CLASS = 'groupVertex';
export const HTML_BOUNDARY_CONTAINER_CLASS = 'groupBoundary';
export const HTML_EDGE_CONTAINER_CLASS = 'groupEdge';
export const SVG_CONTAINER_ID = 'svgContainer';

export const EDGE_LINE_TP = [
  {value: 'solid', name: 'Solid'},
  {value: 'dash', name: "Dash"}
];

export const EDGE_ARROW_FLG = [
  {value: 'Y', name: 'Yes'},
  {value: 'N', name: 'No'}
]

// Type of point connect
export const TYPE_POINT = {
  OUTPUT: 'O',
  INPUT: 'I'
};

// Connect side (left, right, both)
export const CONNECT_TYPE = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  BOTH: 'BOTH'
}

// The attributes size of vertex
export const VERTEX_ATTR_SIZE = {
  HEADER_HEIGHT: 38,
  PROP_HEIGHT: 26,
  GROUP_WIDTH: 150,
  SPACE_COPY: 5, // When copy vertex then new coordinate = old coordinate + spaceAddVertex
}

//atributes size of rectangle
export const RECTANGLE_ATTR_SIZE = {
  RECTANGLE_HEIGHT: 20,
  RECTANGLE_WIDTH: 20,
}
// The attributes size of boundary
export const BOUNDARY_ATTR_SIZE = {
  HEADER_HEIGHT: 38,
  BOUND_WIDTH: 160,
  BOUND_HEIGHT: 200,
}

// Graph size
export const DEFAULT_CONFIG_GRAPH = {
  MIN_OFFSET_X: 5,
  MIN_OFFSET_Y: 5,
  MIN_WIDTH: 1900,
  MIN_HEIGHT: 959,
}

// Repeat range
export const REPEAT_RANGE = {
  MIN: 0,
  MAX: 9999,
}

// Vertex type format
export const VERTEX_FORMAT_TYPE = {
  BOOLEAN: 1,
  ARRAY: 2,
  NUMBER: 3,
  STRING: 4,
}

// Popup config
export const POPUP_CONFIG = {
  MAX_WIDTH: 1550,
  MIN_WIDTH: 450,
  PADDING_CHAR: 18,
  WIDTH_CHAR: 10,
  WIDTH_CHAR_UPPER: 11.5,
  WIDTH_COL_DEL_CHECK: 45,
}

// Vertex group option
export const VERTEX_GROUP_OPTION = {
  SHOW_FULL_ALWAYS: 'SHOW_FULL_ALWAYS',
  DYNAMIC_DATASET: 'DYNAMIC_DATASET',
}

// Global variable
window.creatingEdge = false; // Define state creation connect (edge)
window.sourceNode = null; // Define source node for create connect
window.disabledCommand = false; // Use for only mode (Disable all command on menu context)
window.disabledMenu = true; // Not show menu context
window.vertexTypes = null; // Vertex types use in current graph
window.vertexTypesOld = null; // Vertex types export in file Graph Data Structure => Used to validate
window.isVertexTypeDefine = false; // If vertex type define was importted.
window.showReduced = false; // Determine show full or reduced
window.udpateEdge = false; // Define state update connect (edge) exited.
window.groupVertexOption = {}; // list vertex type have same option.
window.vertexDefine = null; //data of json file vertex type definition.
window.vertexFormatType = {}; // Vertex group format type
window.vertexFormat = {}; // Data element vertex format
window.vertexGroupType = {};
window.headerForm = {}; // Header group type
window.vertexPresentation = {}; // Group vertex presentation
window.xBoundary = 1900;
window.yBoundary = 959;

export const DATA_GLOBAL = {
  isCreatingEdge: false,
  srcNode: null,
  isDisabledCommand: false,
  isDisabledMenu: true,
  vertexTypes: null,
  vertexTypesOld: null,
  IS_IMPORT_VERTEX_TYPE_DEFINE: false,
  IS_SHOW_REDUCED: false,
  IS_UPDATE_EDGE: false,
  GROUP_VERTEX_OPTION: null,
  VERTEX_DEFINE: null,
  VERTEX_GROUP: null,
  CURRENT_GRAPH_WIDTH: 1900,
  CURRENT_GRAPH_HEIGHT: 959,
}
