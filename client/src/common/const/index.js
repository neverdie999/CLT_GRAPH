// File management
export const ID_CONTAINER_INPUT_MESSAGE = 'containerInputMessage'
export const ID_CONTAINER_OPERATIONS = 'containerOperations'
export const ID_CONTAINER_OUTPUT_MESSAGE = 'containerOutputMessage'
export const ID_SVG_INPUT_MESSAGE = 'svgInputMessage'
export const ID_SVG_OPERATIONS = 'svgOperations'
export const ID_SVG_OUTPUT_MESSAGE = 'svgOutputMessage'
export const ID_SVG_CONNECT = 'svgConnect'

// Vertex
export const CLASS_CONTAINER_VERTEX = 'groupVertex'
export const VERTEX_ATTR_SIZE = {
	HEADER_HEIGHT: 38,
	PROP_HEIGHT: 26,
	GROUP_WIDTH: 220,
	SPACE_COPY: 5, // When copy vertex then new coordinate = old coordinate + spaceAddVertex
}
export const CONNECT_SIDE = {
	NONE: 'NONE',
	LEFT: 'LEFT',
	RIGHT: 'RIGHT',
	BOTH: 'BOTH'
}
export const TYPE_CONNECT = {
	OUTPUT: 'O',
	INPUT: 'I'
}

export const LINE_TYPE = {
	SOLID: 'S',
	DASH: 'D'
}

export const VIEW_MODE = {
	SHOW_ONLY       : 'SHOW_ONLY',
	EDIT            : 'EDIT',
	OPERATIONS      : 'OPERATIONS',
	INPUT_MESSAGE   : 'INPUT_MESSAGE',
	OUTPUT_MESSAGE  : 'OUTPUT_MESSAGE',
	SEGMENT         : 'SEGMENT',
}

// Boundary
export const CLASS_CONTAINER_BOUNDARY = 'groupBoundary'
export const CLASS_MENU_ITEM_BOUNDARY = 'menuItemBoundary'
export const BOUNDARY_ATTR_SIZE = {
	HEADER_HEIGHT: 38,
	BOUND_WIDTH: 230,
	BOUND_HEIGHT: 64,
}

// Repeat range
export const REPEAT_RANGE = {
	MIN: 0,
	MAX: 9999,
}

// Vertex format type
export const VERTEX_FORMAT_TYPE = {
	BOOLEAN: 1,
	ARRAY: 2,
	NUMBER: 3,
	STRING: 4,
}

// Padding size left and top
export const PADDING_POSITION_SVG = {
	MIN_OFFSET_X: 5,
	MIN_OFFSET_Y: 5,
}

// Graph size
export const DEFAULT_CONFIG_GRAPH = {
	MIN_WIDTH: 1900,
	MIN_HEIGHT: 1800,
}

export const AUTO_SCROLL_CONFIG = {
	LIMIT_TO_SCROLL: 10,
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

export const DATA_ELEMENT_TYPE = {
	SIMPLE: 'SIMPLE',
	COMPOSITE: 'COMPOSITE',
	COMPONENT: 'COMPONENT'
}

export const VERTEX_GROUP_TYPE = {
	SEGMENT: 'SEGMENT',
	OPERATION: 'OPERATION'
}

export const COMMON_DATA = {
	//isCreatingEdge: false, // Define state creation connect (edge)
	//tmpSource: null, // Define source node for create connect
	sourceId: null, // Store temporary vertex id at source when start create edge
	isSelectingEdge: false, // Define state has an edge is selecting
	isDisabledCommand: false, // Define disable or enable command on menu context)
	// vertexTypes: null, // Vertex types using in current graph
	// vertexTypesOld: null, // Vertex types export in file Graph Data Structure => Used to validate
	// isImportVertexTypeDefine: false, // If vertex type define was imported.
	// isUpdateEdge: false, // Set state is updating an edge
	// groupVertexOption: {}, // List vertex type have same option.
	// vertexDefine: null, // Data of json file vertex type definition.
	// vertexFormatType: {}, // Vertex group format type
	// vertexFormat: {}, // Data element vertex format
	// vertexGroupType: {}, // Group vertex type
	// headerForm: {}, // Header group type
	// vertexPresentation: {}, // Group vertex presentation
	// vertexGroup: null, // Group vertex
	currentWidth: 1900, // Default current width graph
	currentHeight: 1800, // Default current height graph
	viewMode: VIEW_MODE.EDIT
}
