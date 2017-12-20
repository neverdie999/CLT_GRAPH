export const HTML_ALGETA_CONTAINER_CLASS = 'algetaContainer';
export const HTML_ALGETA_CONTAINER_ID = 'algetaContainer';
export const HTML_VERTEX_CONTAINER_CLASS = 'groupVertex';
export const HTML_BOUNDARY_CONTAINER_CLASS = 'groupBoundary';
export const HTML_EDGE_CLASS = 'edge';

// Graph size
export const GRAPH_WIDTH = '100%';
export const GRAPH_HEIGHT = '100%';

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
  {value: 'FULL', name:'Full'},
  {value: 'LEFT', name:'Left'},
  {value: 'RIGHT', name:'Right'}
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
  SPACE_COPY: 10, // When copy vertex then new coordinate = old coordinate + spaceAddVertex
}

// Global variable
window.creatingEdge = false; // Define state creation connect (edge)
window.sourceNode = null; // Define source node for create connect
window.disabledCommand = false; // Use for only mode (Disable all command on menu context)
window.disabledMenu = true; // Not show menu context
window.vertexTypes = null; // Vertex types use in current graph
