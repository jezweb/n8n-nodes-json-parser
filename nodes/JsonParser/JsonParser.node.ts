import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import * as JSON5 from 'json5';
import Ajv from 'ajv';

// Helper functions
function smartDetection(text: string, options: IDataObject): string[] {
	const results: string[] = [];
	
	// Try markdown code blocks first
	const markdownPattern = /```(?:json)?\s*([\s\S]*?)```/g;
	let match;
	while ((match = markdownPattern.exec(text)) !== null) {
		const content = match[1].trim();
		if (looksLikeJson(content)) {
			results.push(content);
		}
	}
	
	// If no markdown blocks, try to find JSON objects/arrays
	if (results.length === 0) {
		results.push(...findAllJson(text, options));
	}
	
	return results;
}

function findFirstJson(text: string, options: IDataObject): string | null {
	const all = findAllJson(text, options);
	return all.length > 0 ? all[0] : null;
}

function findLastJson(text: string, options: IDataObject): string | null {
	const all = findAllJson(text, options);
	return all.length > 0 ? all[all.length - 1] : null;
}

function findAllJson(text: string, options: IDataObject): string[] {
	const results: string[] = [];
	const includeArrays = options.includeArrays !== false;
	
	// Find all potential JSON objects
	const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
	let match;
	while ((match = objectPattern.exec(text)) !== null) {
		if (isValidJsonString(match[0], options)) {
			results.push(match[0]);
		}
	}
	
	// Find all potential JSON arrays if enabled
	if (includeArrays) {
		const arrayPattern = /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g;
		text.replace(arrayPattern, (matchStr) => {
			if (isValidJsonString(matchStr, options) && !results.includes(matchStr)) {
				results.push(matchStr);
			}
			return matchStr;
		});
	}
	
	return results;
}

function extractBetweenMarkers(text: string, startMarker: string, endMarker: string): string | null {
	const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
	const match = text.match(pattern);
	return match ? match[1].trim() : null;
}

function extractWithRegex(text: string, pattern: string, node: any): string | null {
	try {
		const regex = new RegExp(pattern);
		const match = text.match(regex);
		return match ? (match[1] || match[0]) : null;
	} catch (error) {
		throw new NodeOperationError(
			node,
			`Invalid regex pattern: ${pattern}`
		);
	}
}

function looksLikeJson(text: string): boolean {
	const trimmed = text.trim();
	return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
	       (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

function isValidJsonString(str: string, options: IDataObject): boolean {
	try {
		let testStr = str;
		if (options.fixIssues !== false) {
			testStr = fixCommonIssues(testStr);
		}
		
		if (options.allowJson5) {
			JSON5.parse(testStr);
		} else {
			JSON.parse(testStr);
		}
		return true;
	} catch {
		return false;
	}
}

function parseJson(jsonString: string, options: IDataObject, node: any): unknown {
	let str = jsonString;
	
	// Fix common issues if enabled
	if (options.fixIssues !== false && !options.strictMode) {
		str = fixCommonIssues(str);
	}
	
	try {
		if (options.allowJson5) {
			return JSON5.parse(str);
		} else {
			return JSON.parse(str);
		}
	} catch (error) {
		if (options.strictMode) {
			throw new NodeOperationError(
				node,
				`Failed to parse JSON: ${(error as Error).message}`
			);
		}
		
		// Try JSON5 as fallback if not in strict mode
		try {
			return JSON5.parse(str);
		} catch (json5Error) {
			throw new NodeOperationError(
				node,
				`Failed to parse JSON: ${(error as Error).message}`
			);
		}
	}
}

function fixCommonIssues(jsonString: string): string {
	let fixed = jsonString;
	
	// Replace smart quotes with regular quotes
	fixed = fixed.replace(/[\u201C\u201D]/g, '"');
	fixed = fixed.replace(/[\u2018\u2019]/g, "'");
	
	// Remove trailing commas in objects
	fixed = fixed.replace(/,(\s*})/g, '$1');
	
	// Remove trailing commas in arrays
	fixed = fixed.replace(/,(\s*\])/g, '$1');
	
	// Fix single quotes to double quotes (careful with apostrophes)
	fixed = fixed.replace(/(?<=[{,]\s*)'([^']+)'(?=\s*:)/g, '"$1"');
	
	// Remove comments (basic approach)
	fixed = fixed.replace(/\/\/.*$/gm, '');
	fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
	
	return fixed;
}

export class JsonParser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON Parser',
		name: 'jsonParser',
		icon: 'file:jsonParser.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["extractionMethod"]}}',
		description: 'Extract and parse JSON from text, including AI model outputs. Handles markdown code blocks, malformed JSON, and validates against optional schemas. Perfect for processing responses from Gemini, GPT, Claude, and other AI models.',
		defaults: {
			name: 'JSON Parser',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			// Main Parameters
			{
				displayName: 'Source Field',
				name: 'sourceField',
				type: 'string',
				default: '={{ $json.text }}',
				required: true,
				placeholder: '{{ $json.content.parts[0].text }}',
				description: 'The field containing the text with JSON to extract. Use an expression to point to your data, e.g., {{ $json.response }} for AI outputs.',
			},
			{
				displayName: 'Extraction Method',
				name: 'extractionMethod',
				type: 'options',
				options: [
					{
						name: 'Smart Detection',
						value: 'smart',
						description: 'Automatically detect JSON in markdown blocks, plain text, or mixed content. Best for AI outputs.',
					},
					{
						name: 'First JSON Object',
						value: 'first',
						description: 'Extract the first valid JSON object {...} found in the text.',
					},
					{
						name: 'Last JSON Object',
						value: 'last',
						description: 'Extract the last valid JSON object {...} found in the text.',
					},
					{
						name: 'All JSON Objects',
						value: 'all',
						description: 'Extract all valid JSON objects found in the text as an array.',
					},
					{
						name: 'Between Markers',
						value: 'markers',
						description: 'Extract JSON between custom start and end markers.',
					},
					{
						name: 'Custom Regex',
						value: 'regex',
						description: 'Use a custom regular expression pattern to extract JSON.',
					},
				],
				default: 'smart',
				description: 'Method to use for finding JSON in the text.',
			},
			{
				displayName: 'Output Mode',
				name: 'outputMode',
				type: 'options',
				options: [
					{
						name: 'Replace Input',
						value: 'replace',
						description: 'Replace the entire input with the extracted JSON.',
					},
					{
						name: 'Add to Input',
						value: 'add',
						description: 'Add the extracted JSON as a new field to the existing input.',
					},
					{
						name: 'New Items',
						value: 'items',
						description: 'Create new items for each extracted JSON object (useful with "All JSON Objects").',
					},
				],
				default: 'replace',
				description: 'How to output the extracted JSON data.',
			},
			{
				displayName: 'Output Field Name',
				name: 'outputFieldName',
				type: 'string',
				default: 'extractedJson',
				displayOptions: {
					show: {
						outputMode: ['add'],
					},
				},
				description: 'Name of the field to add the extracted JSON to.',
			},
			// Marker Options
			{
				displayName: 'Start Marker',
				name: 'startMarker',
				type: 'string',
				default: '```json',
				displayOptions: {
					show: {
						extractionMethod: ['markers'],
					},
				},
				description: 'Text that marks the beginning of JSON content.',
			},
			{
				displayName: 'End Marker',
				name: 'endMarker',
				type: 'string',
				default: '```',
				displayOptions: {
					show: {
						extractionMethod: ['markers'],
					},
				},
				description: 'Text that marks the end of JSON content.',
			},
			// Regex Options
			{
				displayName: 'Regex Pattern',
				name: 'regexPattern',
				type: 'string',
				default: '\\{[^{}]*\\}',
				displayOptions: {
					show: {
						extractionMethod: ['regex'],
					},
				},
				description: 'Regular expression pattern to match JSON. Use capturing groups if needed.',
			},
			// Advanced Options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Strict Mode',
						name: 'strictMode',
						type: 'boolean',
						default: false,
						description: 'Whether to require valid JSON without any fixing attempts.',
					},
					{
						displayName: 'Fix Common Issues',
						name: 'fixIssues',
						type: 'boolean',
						default: true,
						description: 'Whether to automatically fix common JSON issues like smart quotes, trailing commas, etc.',
					},
					{
						displayName: 'Allow JSON5',
						name: 'allowJson5',
						type: 'boolean',
						default: false,
						description: 'Whether to support JSON5 format (trailing commas, comments, unquoted keys, etc.).',
					},
					{
						displayName: 'JSON Schema',
						name: 'jsonSchema',
						type: 'json',
						default: '',
						description: 'Optional JSON schema to validate the extracted data against.',
					},
					{
						displayName: 'Include Arrays',
						name: 'includeArrays',
						type: 'boolean',
						default: true,
						description: 'Whether to also extract JSON arrays [...] in addition to objects.',
					},
				],
			},
			// Error Handling
			{
				displayName: 'On Error',
				name: 'onError',
				type: 'options',
				options: [
					{
						name: 'Stop Workflow',
						value: 'error',
						description: 'Throw an error and stop the workflow execution.',
					},
					{
						name: 'Continue with Error',
						value: 'continueWithError',
						description: 'Output an error message but continue processing.',
					},
					{
						name: 'Output Original',
						value: 'outputOriginal',
						description: 'Output the original input unchanged.',
					},
					{
						name: 'Output Empty',
						value: 'outputEmpty',
						description: 'Output an empty object or array.',
					},
				],
				default: 'error',
				description: 'What to do when JSON extraction or parsing fails.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const ajv = new Ajv();

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get parameters
				const sourceField = this.getNodeParameter('sourceField', itemIndex) as string;
				const extractionMethod = this.getNodeParameter('extractionMethod', itemIndex) as string;
				const outputMode = this.getNodeParameter('outputMode', itemIndex) as string;
				const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

				// Get source text
				let text = sourceField;
				if (typeof text !== 'string') {
					text = JSON.stringify(text);
				}

				// Extract JSON based on method
				let extractedJsonStrings: string[] = [];

				switch (extractionMethod) {
					case 'smart':
						extractedJsonStrings = smartDetection(text, options);
						break;
					case 'first':
						const first = findFirstJson(text, options);
						if (first) extractedJsonStrings = [first];
						break;
					case 'last':
						const last = findLastJson(text, options);
						if (last) extractedJsonStrings = [last];
						break;
					case 'all':
						extractedJsonStrings = findAllJson(text, options);
						break;
					case 'markers':
						const startMarker = this.getNodeParameter('startMarker', itemIndex) as string;
						const endMarker = this.getNodeParameter('endMarker', itemIndex) as string;
						const marked = extractBetweenMarkers(text, startMarker, endMarker);
						if (marked) extractedJsonStrings = [marked];
						break;
					case 'regex':
						const pattern = this.getNodeParameter('regexPattern', itemIndex) as string;
						const regexMatch = extractWithRegex(text, pattern, this.getNode());
						if (regexMatch) extractedJsonStrings = [regexMatch];
						break;
				}

				// Handle no JSON found
				if (extractedJsonStrings.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						`No JSON found in input text using method: ${extractionMethod}`,
						{ itemIndex }
					);
				}

				// Parse and validate JSON
				const parsedJsonObjects: IDataObject[] = [];
				for (const jsonString of extractedJsonStrings) {
					const parsed = parseJson(jsonString, options, this.getNode());
					
					// Validate against schema if provided
					if (options.jsonSchema) {
						const schema = typeof options.jsonSchema === 'string' 
							? JSON.parse(options.jsonSchema) 
							: options.jsonSchema;
						const validate = ajv.compile(schema);
						if (!validate(parsed)) {
							throw new NodeOperationError(
								this.getNode(),
								`JSON does not match schema: ${JSON.stringify(validate.errors)}`,
								{ itemIndex }
							);
						}
					}
					
					parsedJsonObjects.push(parsed as IDataObject);
				}

				// Output based on mode
				if (outputMode === 'replace') {
					// Replace entire input with extracted JSON
					if (parsedJsonObjects.length === 1) {
						returnData.push({
							json: parsedJsonObjects[0],
							pairedItem: { item: itemIndex },
						});
					} else {
						returnData.push({
							json: { extracted: parsedJsonObjects },
							pairedItem: { item: itemIndex },
						});
					}
				} else if (outputMode === 'add') {
					// Add extracted JSON to existing input
					const outputFieldName = this.getNodeParameter('outputFieldName', itemIndex, 'extractedJson') as string;
					const newItem = {
						...items[itemIndex].json,
						[outputFieldName]: parsedJsonObjects.length === 1 ? parsedJsonObjects[0] : parsedJsonObjects,
					};
					returnData.push({
						json: newItem,
						pairedItem: { item: itemIndex },
					});
				} else if (outputMode === 'items') {
					// Create new items for each extracted JSON
					for (const jsonObj of parsedJsonObjects) {
						returnData.push({
							json: jsonObj,
							pairedItem: { item: itemIndex },
						});
					}
				}

			} catch (error) {
				// Handle errors based on configuration
				const onError = this.getNodeParameter('onError', itemIndex) as string;
				
				if (onError === 'error') {
					throw error;
				} else if (onError === 'continueWithError') {
					returnData.push({
						json: {
							error: (error as Error).message,
							originalInput: items[itemIndex].json,
						},
						pairedItem: { item: itemIndex },
					});
				} else if (onError === 'outputOriginal') {
					returnData.push({
						json: items[itemIndex].json,
						pairedItem: { item: itemIndex },
					});
				} else if (onError === 'outputEmpty') {
					returnData.push({
						json: {},
						pairedItem: { item: itemIndex },
					});
				}
			}
		}

		return [returnData];
	}
}