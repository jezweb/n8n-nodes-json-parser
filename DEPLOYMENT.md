# Deployment Guide

## Local Development

### Prerequisites
- Node.js >= 20.15
- npm or yarn
- n8n instance (local or Docker)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/jezweb/n8n-nodes-json-parser.git
   cd n8n-nodes-json-parser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the node:
   ```bash
   npm run build
   ```

4. Link for local development:
   ```bash
   npm link
   cd ~/.n8n/custom
   npm link n8n-nodes-json-parser
   ```

5. Restart n8n to load the node

### Development Workflow
```bash
# Watch for changes during development
npm run dev

# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lintfix
```

## Testing

### Local Testing with n8n
1. Start n8n in development mode
2. Create a new workflow
3. Add the "JSON Parser" node
4. Connect to a data source (e.g., HTTP Request, AI node)
5. Configure extraction settings
6. Execute workflow and verify output

### Test Scenarios
- Simple JSON object extraction
- Markdown code block extraction
- Multiple JSON objects
- Malformed JSON fixing
- Schema validation
- Error handling modes

## Publishing to npm

### Pre-publish Checklist
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] README.md complete with examples
- [ ] All tests passing
- [ ] Code linted and formatted
- [ ] Built successfully

### Publish Process
1. Ensure you're logged into npm:
   ```bash
   npm login
   ```

2. Build and validate:
   ```bash
   npm run build
   npm run lint
   ```

3. Publish to npm:
   ```bash
   npm publish
   ```

4. Create GitHub release:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

## Installation for End Users

### Via n8n UI
1. Go to Settings → Community Nodes
2. Click "Install a community node"
3. Enter: `n8n-nodes-json-parser`
4. Click "Install"
5. Restart n8n

### Via npm (Self-hosted)
```bash
cd /path/to/n8n
npm install n8n-nodes-json-parser
# Restart n8n
```

### Via Docker
Add to your docker-compose.yml:
```yaml
environment:
  - N8N_COMMUNITY_PACKAGES_ENABLED=true
```

Then install via UI or:
```bash
docker exec -it n8n npm install n8n-nodes-json-parser
docker restart n8n
```

## Configuration

### Environment Variables
- `N8N_COMMUNITY_PACKAGES_ENABLED=true` - Enable community nodes
- `NODE_FUNCTION_ALLOW_EXTERNAL=json5,ajv` - Allow required packages

### Node Settings
No additional configuration required. The node works out of the box with sensible defaults.

## Troubleshooting

### Node Not Appearing
1. Check n8n logs for loading errors
2. Verify community nodes are enabled
3. Ensure correct n8n version (>= 1.0.0)
4. Try manual installation via npm

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Runtime Errors
- Check input data format
- Verify extraction method matches data
- Review error messages in n8n execution log
- Enable "Continue with Error" for debugging

## Updates

### Updating the Node
```bash
# For npm installations
npm update n8n-nodes-json-parser

# For UI installations
# Go to Settings → Community Nodes
# Click update button next to the node
```

### Breaking Changes
Check CHANGELOG.md for breaking changes between versions.

## Support

### Getting Help
- GitHub Issues: https://github.com/jezweb/n8n-nodes-json-parser/issues
- n8n Community Forum: https://community.n8n.io

### Reporting Bugs
Include:
- n8n version
- Node version
- Sample workflow (exported JSON)
- Input data that causes the issue
- Error messages

## Performance

### Optimization Tips
- Use specific extraction methods vs. smart detection for better performance
- Enable strict mode to fail fast on invalid JSON
- Limit input size for large datasets
- Use schema validation sparingly (adds overhead)

### Benchmarks
- Simple extraction: ~1ms per item
- Smart detection: ~5ms per item
- With fixing enabled: ~10ms per item
- With schema validation: ~15ms per item

## Security

### Best Practices
- Always validate untrusted input
- Use schema validation for critical data
- Set appropriate error handling
- Monitor execution logs
- Keep node updated

### Reporting Security Issues
Email: jeremy@jezweb.net
Subject: [SECURITY] n8n-nodes-json-parser