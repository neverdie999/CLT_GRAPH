export const HTML_ALGETA_CONTAINER_CLASS = 'algetaContainer';
export const HTML_ALGETA_CONTAINER_ID = 'algetaContainer';
export const HTML_VERTEX_CONTAINER_CLASS = 'groupVertex';
export const HTML_BOUNDARY_CONTAINER_CLASS = 'groupBoundary';
export const HTML_EDGE_CONTAINER_CLASS = 'groupEdge';
export const SVG_CONTAINER_ID = 'svgContainer';

// Area file management size
export const FILE_MGMT_HEIGHT = 115;

// Screen size
export const SCREEN_SIZES = {
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight,
}

// Interaction type
export const INTERACTION_TP = {
  FULL: 'FULL',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
}

export const INTERACTION_TP_LST = [
  {value: 'FULL', name: 'Full'},
  {value: 'LEFT', name: 'Left'},
  {value: 'RIGHT', name: 'Right'}
];

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

// The attributes size of vertex
export const VERTEX_ATTR_SIZE = {
  HEADER_HEIGHT: 38,
  PROP_HEIGHT: 26,
  GROUP_WIDTH: 150,
  SPACE_COPY: 5, // When copy vertex then new coordinate = old coordinate + spaceAddVertex
}

// The attributes size of boundary
export const BOUNDARY_ATTR_SIZE = {
  HEADER_HEIGHT: 38,
  BOUND_WIDTH: 160,
  BOUND_HEIGHT: 200,
}

// Graph size
export const DEFAULT_CONFIG_GRAPH = {
  MIN_OFFSETX: 5,
  MIN_OFFSETY: 5,
  MIN_WIDTH: 1900,
  MIN_HEIGHT: 959,
}

// Repeat range
export const REPEAT_RANGE = {
  MIN: 0,
  MAX: 9999,
}

// Boundary default config
export const BOUNDARY_CONFIG = {
  BG_HEADER_COLOR: '#778899',
  LIGHT_COLOR: -20,
  NAME: 'Boundary',
}

// Vertex type format
export const VERTEX_FORMAT_TYPE = {
  BOOLEAN: 1,
  ARRAY: 2,
  NUMBER: 3,
  STRING: 4,
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
window.groupVertexOption = {} // list vertex type have same option.
window.vertexDefine = null //data of json file vertex type definition.
window.xBoundary = 1900;
window.yBoundary = 959;
