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

export const COMMON_DATA = {
  isCreatingEdge: false, // Define state creation connect (edge)
  sourceNode: null, // Define source node for create connect
  sourceId: null, // Store temporary vertex id at source when start create edge
  isDisabledCommand: false, // Define disable or enable command on menu context)
  vertexTypes: null, // Vertex types using in current graph
  vertexTypesOld: null, // Vertex types export in file Graph Data Structure => Used to validate
  isImportVertexTypeDefine: false, // If vertex type define was imported.
  isShowReduced: false, // Determine mode show full or reduced
  isUpdateEdge: false, // Set state is updating an edge
  groupVertexOption: {}, // List vertex type have same option.
  vertexDefine: null, // Data of json file vertex type definition.
  vertexFormatType: {}, // Vertex group format type
  vertexFormat: {}, // Data element vertex format
  vertexGroupType: {}, // Group vertex type
  headerForm: {}, // Header group type
  vertexPresentation: {}, // Group vertex presentation
  vertexGroup: null, // Group vertex
  currentWidth: 1900, // Default current width graph
  currentHeight: 959, // Default current height graph
}
