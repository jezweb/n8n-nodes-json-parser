# Architecture Documentation

## Overview
The n8n-nodes-json-parser is a community node for n8n that extracts and parses JSON from text input, particularly useful for processing AI model outputs that often embed JSON within conversational text or markdown formatting.

## Core Components

### 1. JsonParser Node (`nodes/JsonParser/JsonParser.node.ts`)
The main node implementation that provides the UI and execution logic.

#### Key Interfaces
- `INodeType` - Standard n8n node interface
- `INodeTypeDescription` - Node metadata and UI configuration
- `IExecuteFunctions` - Execution context provided by n8n

#### Node Properties
- **Source Field**: Expression field for input text
- **Extraction Method**: Strategy for finding JSON
- **Output Mode**: How to return the extracted data
- **Error Handling**: Configurable error behavior
- **Advanced Options**: JSON5 support, schema validation, fixing common issues

### 2. Extraction Strategies

#### Smart Detection (Default)
1. Check for markdown code blocks (```json)
2. Look for obvious JSON object/array boundaries
3. Apply heuristics for common AI output patterns
4. Fall back to regex-based extraction

#### Specific Methods
- **First JSON Object**: Find first valid `{...}` 
- **Last JSON Object**: Find last valid `{...}`
- **All JSON Objects**: Extract all valid JSON structures
- **Between Markers**: User-defined start/end markers
- **Custom Regex**: User-provided pattern

### 3. Parsing Pipeline

```
Input Text
    ↓
Pre-processing (trim, normalize)
    ↓
Extraction (based on method)
    ↓
Fixing (if enabled)
    - Smart quotes → regular quotes
    - Trailing commas removal
    - Escape sequence fixing
    ↓
Parsing (JSON or JSON5)
    ↓
Validation (optional schema)
    ↓
Output formatting
```

### 4. Error Handling

#### Error Types
1. **No JSON Found**: Input contains no detectable JSON
2. **Invalid JSON**: Malformed JSON that cannot be parsed
3. **Schema Validation Failed**: JSON doesn't match provided schema
4. **Multiple Objects Error**: When single object expected but multiple found

#### Error Modes
- **Stop Workflow**: Throw error, halt execution
- **Continue with Error**: Add error to output, continue
- **Output Original**: Pass through original input
- **Output Empty**: Return empty object/array

## Dependencies

### Runtime Dependencies
- **json5**: For parsing relaxed JSON syntax
- **ajv**: For JSON schema validation

### Development Dependencies
- **typescript**: Type safety and compilation
- **eslint**: Code quality
- **prettier**: Code formatting
- **gulp**: Build tasks

## File Structure

```
n8n-nodes-json-parser/
├── nodes/
│   └── JsonParser/
│       ├── JsonParser.node.ts     # Main node implementation
│       └── JsonParser.node.json   # Node metadata (if needed)
├── utils/
│   ├── extractors.ts             # Extraction strategy implementations
│   ├── fixers.ts                 # JSON fixing utilities
│   └── validators.ts             # Validation helpers
├── icons/
│   └── jsonParser.svg            # Node icon
├── test/
│   └── JsonParser.test.ts       # Unit tests
└── dist/                         # Compiled output (generated)
```

## Data Flow

### Input Processing
1. Receive input items from previous node
2. Extract source field value using expression
3. Process each item independently
4. Handle batching if "All JSON Objects" selected

### Output Generation
Based on Output Mode:
- **Replace Input**: Return only extracted JSON
- **Add to Input**: Merge extracted JSON with original
- **New Items**: Create separate items for each JSON object

## AI Tool Compatibility

The node implements `usableAsTool: true` to enable AI Agent usage:
- Clear, descriptive text for all properties
- Examples in descriptions
- Sensible defaults for common use cases
- Error messages that help AI understand issues

## Performance Considerations

1. **Large Inputs**: Stream processing for very large texts
2. **Complex Regex**: Timeout protection for custom patterns
3. **Schema Validation**: Cached compiled schemas
4. **Memory**: Efficient string processing, avoid duplicates

## Security

1. **JSON Parsing**: Safe parsing, no eval()
2. **Regex Safety**: Timeout and complexity limits
3. **Schema Validation**: Sanitized error messages
4. **Input Limits**: Configurable max input size

## Extension Points

The architecture supports future enhancements:
- Additional extraction methods
- Custom fixing strategies
- Output transformations
- Integration with other parsers (XML, YAML, etc.)