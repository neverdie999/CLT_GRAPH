// File management
export const ID_CONTAINER_INPUT_MESSAGE = 'containerInputMessage';
export const ID_CONTAINER_OPERATIONS = 'containerOperations';
export const ID_CONTAINER_OUTPUT_MESSAGE = 'containerOutputMessage';
export const ID_SVG_INPUT_MESSAGE = 'svgInputMessage';
export const ID_SVG_OPERATIONS = 'svgOperations';
export const ID_SVG_OUTPUT_MESSAGE = 'svgOutputMessage';
export const ID_SVG_CONNECT = 'svgConnect';

// Vertex
export const CLASS_CONTAINER_VERTEX = 'groupVertex';
export const VERTEX_ATTR_SIZE = {
  HEADER_HEIGHT: 38,
  PROP_HEIGHT: 26,
  GROUP_WIDTH: 150,
  SPACE_COPY: 5, // When copy vertex then new coordinate = old coordinate + spaceAddVertex
}
export const CONNECT_SIDE = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  BOTH: 'BOTH'
}
export const TYPE_CONNECT = {
  OUTPUT: 'O',
  INPUT: 'I'
};

// Boundary
export const CLASS_CONTAINER_BOUNDARY = 'groupBoundary';
export const CLASS_MENU_ITEM_BOUNDARY = 'menuItemBoundary';
export const BOUNDARY_ATTR_SIZE = {
  HEADER_HEIGHT: 38,
  BOUND_WIDTH: 160,
  BOUND_HEIGHT: 200,
}

// Repeat range
export const REPEAT_RANGE = {
  MIN: 0,
  MAX: 9999,
};

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
};

// Popup config
export const POPUP_CONFIG = {
  MAX_WIDTH: 1550,
  MIN_WIDTH: 450,
  PADDING_CHAR: 18,
  WIDTH_CHAR: 10,
  WIDTH_CHAR_UPPER: 11.5,
  WIDTH_COL_DEL_CHECK: 45,
};

// Vertex group option
export const VERTEX_GROUP_OPTION = {
  SHOW_FULL_ALWAYS: 'SHOW_FULL_ALWAYS',
  DYNAMIC_DATASET: 'DYNAMIC_DATASET',
};

export const COMMON_DATA = {
  isCreatingEdge: false, // Define state creation connect (edge)
  tmpSource: null, // Define source node for create connect
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
};

export const VERTEX_TYPE_DEFINE_OPERATIONS = {
  "VERTEX_GROUP": [
    {
      "groupType": "OPERATION",
      "option": ["SHOW_FULL_ALWAYS", "DYNAMIC_DATASET"],
      "dataElementFormat": {
        "name": "",
        "value": "",
        "description": "",
        "description2": "Empty means mapped value else the value as constant"
      },
      "vertexPresentation": {
        "key": "name",
        "value": "value",
        "keyTooltip": "description",
        "valueTooltip": "description2"
      }
    }
  ],
  "VERTEX": [
    {
      "groupType": "OPERATION",
      "vertexType": "upcase",
      "description": "convert a string to upper case",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "downcase",
      "description": "convert a string to lower case",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "lpad",
      "description": "left padding",
      "data": [
        {
          "name": "length",
          "value": "",
          "description": ""
        },
        {
          "name": "char",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "rpad",
      "description": "right padding",
      "data": [
        {
          "name": "length",
          "value": "",
          "description": ""
        },
        {
          "name": "char",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "trim",
      "description": "trim whilespaces fore and behind",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "concat",
      "description": "concat strings",
      "data": [
        {
          "name": "connector",
          "value": "",
          "description": ""
        },
        {
          "name": "item#1",
          "value": "",
          "description": ""
        },
        {
          "name": "item#2",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "replace",
      "description": "replace strings",
      "data": [
        {
          "name": "fromPattern",
          "value": "",
          "description": ""
        },
        {
          "name": "toPattern",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "substr",
      "description": "substract strings",
      "data": [
        {
          "name": "fromIndex",
          "value": "",
          "description": ""
        },
        {
          "name": "toIndex",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "strlen",
      "description": "length of a string",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "toInt",
      "description": "convert to an integer",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "toReal",
      "description": "convert to a real number",
      "data": [
        {
          "name": "format",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "strFormat",
      "description": "make a string with a format and arguements",
      "data": [
        {
          "name": "format",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "numeric?",
      "description": "check whether it is a number",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "exist?",
      "description": "check whether it is not empty",
      "data": []
    },
    {
      "groupType": "OPERATION",
      "vertexType": "in?",
      "description": "check whether it is the same element of in a set",
      "data": [
        {
          "name": "set",
          "value": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "contain?",
      "description": "check whether it has the same strings",
      "data": [
        {
          "name": "item#1",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "equal?",
      "description": "check whether they are equal",
      "data": [
        {
          "name": "item#1",
          "value": "",
          "description": ""
        },
        {
          "name": "item#2",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "and?",
      "description": "check whether all is true",
      "data": [
        {
          "name": "item#1",
          "value": "",
          "description": ""
        },
        {
          "name": "item#2",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "or?",
      "description": "check whether anyone is true",
      "data": [
        {
          "name": "item#1",
          "value": "",
          "description": ""
        },
        {
          "name": "item#2",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "match?",
      "description": "check whether it matches any condition",
      "data": [
        {
          "name": "item#1",
          "value": "",
          "description": ""
        },
        {
          "name": "item#2",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "now",
      "description": "get dateTime of requested format",
      "data": [
        {
          "name": "format",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "dateTime",
      "description": "get dateTime of requested format",
      "data": [
        {
          "name": "fromFormat",
          "value": "",
          "description": ""
        },
        {
          "name": "toFormat",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "CodeMap",
      "description": "setup CodeList",
      "data": [
        {
          "name": "filePath",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "map",
      "description": "map with a code list",
      "data": [
        {
          "name": "category",
          "value": "",
          "description": ""
        },
        {
          "name": "alternative",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "error",
      "description": "set error message",
      "data": [
        {
          "name": "message",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "var",
      "description": "set a variable",
      "data": [
        {
          "name": "name",
          "value": "",
          "description": ""
        },
        {
          "name": "dataType",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "const",
      "description": "set a constant",
      "data": [
        {
          "name": "name",
          "value": "",
          "description": ""
        },
        {
          "name": "dataType",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "searchKey",
      "description": "set a searchKey",
      "data": [
        {
          "name": "number",
          "value": "",
          "description": ""
        }
      ]
    },
    {
      "groupType": "OPERATION",
      "vertexType": "matchGroup",
      "description": "match input message group and output message group",
      "data": [
        {
          "name": "inputGroup",
          "value": "",
          "description": ""
        },
        {
          "name": "outputGroup",
          "value": "",
          "description": ""
        }
      ]
    }
  ]
}
