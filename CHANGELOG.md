# Changelog

All notable changes to n8n-nodes-json-parser will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-08-30

### Added
- Initial release of n8n-nodes-json-parser
- Core JSON extraction from text functionality
- Multiple extraction methods:
  - Smart Detection (automatic)
  - First JSON Object
  - Last JSON Object
  - All JSON Objects
  - Between Markers
  - Custom Regex Pattern
- JSON5 support for relaxed syntax
- Common issue fixing:
  - Smart quotes to regular quotes
  - Trailing comma removal
  - Escape sequence correction
- Schema validation using AJV
- Multiple output modes:
  - Replace Input
  - Add to Input
  - New Items
- Comprehensive error handling
- AI Tool compatibility (usableAsTool: true)
- Support for markdown code blocks
- Batch processing for multiple items

### Technical
- Built with TypeScript
- Based on n8n-nodes-starter template
- Dependencies: json5, ajv

[0.1.0]: https://github.com/jezweb/n8n-nodes-json-parser/releases/tag/v0.1.0