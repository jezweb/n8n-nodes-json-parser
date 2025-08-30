# Claude Development Guidelines

## Project Overview
This is an n8n community node for extracting and parsing JSON from text, particularly useful for AI model outputs that embed JSON in conversational text or markdown.

## Key Requirements

### Functionality
- Extract JSON from various text formats (plain, markdown, mixed content)
- Support multiple extraction strategies
- Fix common JSON issues (smart quotes, trailing commas, etc.)
- Validate against optional JSON schema
- Work as both regular node and AI tool

### Code Standards
- TypeScript with strict typing
- Follow n8n node development patterns
- Use INodeType interface correctly
- Implement proper error handling
- Include AI-friendly descriptions

### Testing Requirements
Test with outputs from:
- Google Gemini
- OpenAI GPT models
- Anthropic Claude
- Local LLMs
- Webhook payloads
- Log files

## Development Workflow

### Building
```bash
npm run build    # Build for production
npm run dev      # Watch mode for development
```

### Testing
1. Link to local n8n instance
2. Create test workflows with various inputs
3. Verify all extraction methods work
4. Test error scenarios
5. Validate AI tool compatibility

### Code Style
- Use prettier for formatting
- Follow ESLint rules
- Clear, descriptive variable names
- Comprehensive JSDoc comments
- AI-friendly property descriptions

## Common Patterns

### Extraction Pattern Examples
```typescript
// Markdown code blocks
const markdownPattern = /```json\s*([\s\S]*?)```/;

// First JSON object
const firstObjectPattern = /\{[^{}]*\}/;

// Between specific markers
const customPattern = new RegExp(`${startMarker}([\\s\\S]*?)${endMarker}`);
```

### Error Handling
```typescript
if (onError === 'error') {
    throw new Error(`Descriptive error message`);
} else if (onError === 'continue') {
    return { json: { error: message }, pairedItem: { item: i } };
}
```

## Important Notes

### For AI Tool Compatibility
- Set `usableAsTool: true` in node description
- Write clear, detailed descriptions for all properties
- Include examples in description text
- Use sensible defaults

### Performance Considerations
- Process items individually for memory efficiency
- Cache compiled schemas
- Use efficient string operations
- Implement timeouts for regex operations

### Security
- Never use eval() for JSON parsing
- Sanitize error messages
- Validate input sizes
- Use safe regex patterns

## File Locations
- Main node: `nodes/JsonParser/JsonParser.node.ts`
- Tests: `test/JsonParser.test.ts`
- Utilities: `utils/` directory
- Icon: `icons/jsonParser.svg`

## Publishing Checklist
1. Update version in package.json
2. Update CHANGELOG.md
3. Run full test suite
4. Build and lint
5. Commit with clear message
6. Tag release
7. Publish to npm
8. Create GitHub release

## Maintenance
- Monitor GitHub issues
- Keep dependencies updated
- Test with new n8n versions
- Update for new AI models/formats