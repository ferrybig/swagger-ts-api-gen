/* eslint-disable @typescript-eslint/no-var-requires, strict, indent */
'use strict';
import cli from 'cli'

import OpenApi, {
	Schema, Ref, Parameter, RequestBody, PathItem, Operation, Component, Responses, Response, SecurityRequirement,
} from "./swagger";

// Add parentheses around a typeString when it is a complex expression,
// this is required when the elements of an array can be null
function g(typeString: string): string {
	return /[^a-zA-Z0-9[\]/*\\]/.test(typeString) ? `(${typeString})` : typeString;
}
function trimWS(s: string): string {
	return s.replace(/\/\*.*?\*\//sgm, '').replace(/\s+/g,' ').trim();
}

function getEntityName(name: string): string {
	return `Api${name.replace('dto', '')}`;
}

function refToType(ref: string): string {
	const [hash, components, partition, name] = ref.split('/');
	if (hash !== '#') {
		cli.error('Invalid ref discovered: ' + ref);
	}
	if (components !== 'components') {
		cli.error('Invalid ref discovered: ' + ref);
	}
	if (partition !== 'schemas') {
		cli.error('Invalid ref discovered: ' + ref);
	}
	return getEntityName(name);
}

interface EntityDefinition {
	text: string,
	description: string[],
	enumValues: string[] | null;
	simpleObject: boolean | string;
}

function indent(input: string, padding: string): string {
	return input.replace(/\n/g, `\n${padding}`);
}

function escapeKey(input: string): string {
	if ((/^[a-zA-Z_]$/i.test(input[0]) && /^[a-zA-Z0-9_]+$/.test(input)) || input.startsWith('[')) {
		return input;
	}
	return `'${input.replace('\\', '\\\\').replace('\'', '\\\'')}'`;
}

function writeDefinition(
	key: string,
	{ text, description, enumValues, simpleObject }: EntityDefinition,
	padding: string | undefined,
	mapOptionalAsPartial: boolean = false,
): string {
	let keyOutput;
	if (padding && mapOptionalAsPartial) {
		const isOptional = text.endsWith(' | null')
		const orNull = isOptional ? '?' : '';
		if(isOptional) {
			text = text.substring(0, text.length - ' | null'.length)
		}
		keyOutput = `${escapeKey(key)}${orNull}: `;
	} else if (padding) {
		keyOutput = `${escapeKey(key)}: `;
	} else if (typeof simpleObject === 'string') {
		keyOutput = `export interface ${key} extends ${simpleObject} `;
	} else if (simpleObject) {
		keyOutput = `export interface ${key} `;
	} else {
		keyOutput = `export type ${key} = `;
	}
	let output = '';
	if (!padding) {
		cli.debug('Generating [definition]: ' + key)
		output += `// DEFINITION: ${key}\n`;
	}
	if (description && description.length > 0) {
		output += '/**\n';
		for (const line of description) {
			output += ` * ${indent(line.replace('*/', '* /'), ' * ')}\n`;
		}
		output += ' */\n';
	}
	if (enumValues && padding === undefined) {
		output += 'export enum ${key} {\n';
		for (const line of enumValues) {
			output += `\t${line} = '${line}',\n`;
		}
		output += '}';
	} else {
		output += keyOutput + text;
	}
	if (padding !== undefined) {
		output = indent(output, padding);
	}
	return output;
}

// Make a typescript type definition based on a prop
function makeEntityDefinition(prop: Schema | Ref | true, optional: boolean, mapOptionalAsPartial: boolean = false): EntityDefinition {
	const orNull = optional ? ' | null' : '';
	const description: string[] = [];
	let output = '';
	let enumValues = null;

	if (prop === true) {
		return {
			description,
			text: 'any',
			enumValues: null,
			simpleObject: false,
		};
	}

	if ('$ref' in prop) {
		return {
			text: `${refToType(prop.$ref)}${orNull}`,
			description: [],
			enumValues: null,
			simpleObject: false,
		};
	}
	if ('description' in prop && prop.description) {
		description.push(...prop.description.split('\n\n').map(line => line.replace('\n', '')));
	}
	if ('readOnly' in prop) {
		description.push('This value is server --> client only, and thus ignored by the server');
	}
	if ('writeOnly' in prop) {
		description.push('This value is client --> server only, and thus ignored by the server');
	}

	if ('oneOf' in prop) {
		for (const oneOf of prop.oneOf) {
			output += g(makeEntityDefinition(oneOf, false).text) + ' | ';
		}
		output = output.substring(0, output.length - 3) + orNull;
		return {
			description,
			text: output,
			enumValues: null,
			simpleObject: false,
		};
	}
	if ('anyOf' in prop) {
		for (const oneOf of prop.anyOf) {
			output += g(makeEntityDefinition(oneOf, false).text) + ' | ';
		}
		output = output.substring(0, output.length - 3) + orNull;
		return {
			description,
			text: output,
			enumValues: null,
			simpleObject: false,
		};
	}

	if ('allOf' in prop) {
		const isSimpleAllOf = prop.allOf.every((d) => '$ref' in d || 'type' in d && d.type === 'object') && !optional;
		if (isSimpleAllOf) {
			const extendsList: string[] = [];
			let baseObject: EntityDefinition = {
				description,
				text: output,
				enumValues: null,
				simpleObject: true,
			}
			for (const obj of prop.allOf) {
				if ('$ref' in obj) {
					extendsList.push(refToType(obj.$ref));
				} else {
					baseObject = makeEntityDefinition(obj, false);
				}
			}
			return {
				...baseObject,
				simpleObject: extendsList.join(', '),
			};
		} else {
			for (const allOf of prop.allOf) {
				output += g(makeEntityDefinition(allOf, false).text) + ' & ';
			}
			output = output.substring(0, output.length - 3);
			if (optional) {
				output = `${g(output)}${orNull}`;
			}
			return {
				description,
				text: output,
				enumValues: null,
				simpleObject: false,
			};
		}
	}
	if(!('type' in prop)) {
		return {
			description,
			text: 'null',
			enumValues: null,
			simpleObject: false,
		};
	}
	switch (prop.type) {
		case 'integer':
		case 'number':
			output = `number${orNull}`;
			if ('multipleOf' in prop) {
				description.push('This number should be a multiple of ' + prop.multipleOf);
			} else if (prop.type === 'integer') {
				description.push('This number should have no decimals');
			}
			if ('minimum' in prop ) {
				description.push('This number should be ' + prop.minimum + ' or higher');
			}
			if ('maximum' in prop) {
				description.push('This number should be ' + prop.maximum + ' or lower');
			}
			if ('format' in prop) {
				description.push('This should be in the following format: ' + prop.format);
			}
			break;
		case 'string':
			if (prop.enum) {
				output = prop.enum.map(e => `'${e}'`).join(' | ') + orNull;
				enumValues = prop.enum;
			} else if (prop.format === 'binary') {
				output = `Blob${orNull}`;
			} else {
				output = `string${orNull}`;
				if (prop.format) {
					description.push('This should be in the following format: ' + prop.format);
				}
			}
			if (prop.minLength) {
				description.push('This value should have a minium of ' + prop.minLength + ' characters');
			}
			if (prop.maxLength) {
				description.push('This value should have a maxium of ' + prop.maxLength + ' characters');
			}
			if (prop.pattern) {
				description.push('This value should match the following pattern: ' + prop.pattern);
			}
			break;
		case 'boolean':
			output = `boolean${orNull}`;
			break;
		case 'object':
			output += '{\n';
			if (prop.properties) {
				output += Object.entries(prop.properties).map(([key, value]) => {
					const required = prop.required && prop.required.find(name => name === key);
					return `\t${writeDefinition(
						key,
						makeEntityDefinition(value, !required),
						'\t',
						mapOptionalAsPartial,
					)};\n`;
				}).join('');
			}
			if (prop.additionalProperties) {
				output += `\t${writeDefinition(
					'[key: string]',
					makeEntityDefinition(prop.additionalProperties, false),
					'\t'
				)};\n`;
			}
			output += `}`;
			if (!prop.additionalProperties && !prop.properties) {
				output = 'JsonAny';
			}
			if (prop.minProperties) {
				description.push('This value should have a minium of ' + prop.minProperties + ' items');
			}
			if (prop.maxProperties) {
				description.push('This value should have a maxium of ' + prop.maxProperties + ' items');
			}
			output += orNull;
			break;
		case 'array':
			output = `${g(makeEntity(prop.items, false))}[]${orNull}`;
			if (prop.minItems) {
				description.push('This value should have a minium of ' + prop.minItems + ' items');
			}
			if (prop.maxItems) {
				description.push('This value should have a maxium of ' + prop.maxItems + ' items');
			}
			if (prop.uniqueItems) {
				description.push('This value should have unique items');
			}
			break;
		default:
			throw new Error(`Unknown type: ${prop} on node ${JSON.stringify(prop)}`);
	}
	return {
		description,
		text: output,
		enumValues,
		simpleObject: prop.type === 'object',
	};
}
function makeEntity(prop: Schema | Ref | true, optional: boolean, mapOptionalAsPartial: boolean = false) {
	return makeEntityDefinition(prop, optional, mapOptionalAsPartial).text;
}

// Make the boilerplate required for the api section
function makeBoilerPlate(): string {
	const urlencode = 'encodeURIComponent';

	return `
interface CancelablePromise<T> extends Promise<T> {
	'@@redux-saga/CANCEL_PROMISE': () => void;
}

function makeCancelablePromise<T>(promise: Promise<T>, onCancel: () => void): CancelablePromise<T> {
	const castedPromise = promise as CancelablePromise<T>;
	castedPromise['@@redux-saga/CANCEL_PROMISE'] = onCancel;
	return castedPromise;
}

export class FetchResponse<S extends number, R> {
	public status: S;
	public result: R;
	public url: Response['url'];
	public type: Response['type'];
	public headers: Response['headers'];
	public statusText: Response['statusText'];
	public redirected: Response['redirected'];
	public ok: S extends 200 ? true : S extends 201 ? true : S extends 204 ? true : false;
	public constructor(response: Response, status: S, result: R) {
		this.status = status;
		this.result = result;
		this.url = response.url;
		this.type = response.type;
		this.headers = response.headers;
		this.statusText = response.statusText;
		this.redirected = response.redirected;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.ok = (status === 200 || status === 201 || status === 204) as any;
	}
	public expectSuccess(): S extends 200 ? R : S extends 201 ? R : S extends 204 ? R : never {
		if (this.ok) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return this.result as any;
		}
		const stringifiedResponse = JSON.stringify(this.result, null, 2);
		throw new Error(\`Response was not OK.\\nResponse body:\\n\${stringifiedResponse}\`);
	}
	public expect<E extends S>(code: E | E[]): S extends E ? R : never {
		if (Array.isArray(code) ? (code as number[]).includes(this.status) : this.status === code) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return this.result as any;
		}
		const stringifiedResponse = JSON.stringify(this.result, null, 2);
		throw new Error(
			\`Expected HTTP status code to be \${code}, but it was \${this.status}.\\n` +
			`Response body:\\n\${stringifiedResponse}\`
		);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function toJson(response: Response): Promise<any> {
	return response.json();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toResponse(response: Response): Promise<Response> {
	return Promise.resolve(response);
}

export interface ResolvedSecurity {
	updateUrl(url: string): string;
	updateHeaders(headers: Record<string, string>): Record<string, string>;
}
export interface Security<N extends string, S extends string> extends ResolvedSecurity {
	readonly name: N;
	readonly scope: S[];
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HttpAuthentication<N extends string> implements Security<N, never> {
	public readonly name: N;
	public readonly scope: never[] = [];
	public readonly token: string;
	public readonly schema: string;
	public constructor(name: N, token: string, schema: string) {
		this.name = name;
		this.token = token;
		this.schema = schema;
	}
	public updateUrl(url: string): string {
		return url;
	}
	public updateHeaders(headers: Record<string, string>): Record<string, string> {
		return {
			...headers,
			'Authorization': \`\${this.schema} \${this.token}\`,
		};
	}
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ApiKeyAuthentication<N extends string> implements Security<N, never> {
	public readonly name: N;
	public readonly scope: never[] = [];
	public readonly token: string;
	public readonly key: string;
	public readonly in: 'query' | 'header' | 'cookie';
	public constructor(name: N, inType: 'query' | 'header' | 'cookie', key: string, token: string) {
		this.name = name;
		this.token = token;
		this.in = inType;
		this.key = key;
	}
	public updateUrl(url: string): string {
		if (this.in === 'query') {
			const arg = \`\${encodeURIComponent(this.key)}=\${encodeURIComponent(this.token)}\`;
			if (url.includes('?')) {
				return \`\${url}&\${arg}\`;
			} else {
				return \`\${url}?\${arg}\`;
			}
		}
		return url;
	}
	public updateHeaders(headers: Record<string, string>): Record<string, string> {
		if (this.in === 'header') {
			return {
				...headers,
				[this.key]: this.token,
			};
		}
		return headers;
	}
}

const VoidSecurity: ResolvedSecurity = {
	updateUrl(url): string {
		return url;
	},
	updateHeaders(headers): Record<string, string> {
		return headers;
	},
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function combinedSecurity<S extends Record<string, ResolvedSecurity>>(sec: S): ResolvedSecurity {
	const array = Object.values(sec);
	switch (array.length) {
		case 0:
			return VoidSecurity;
		case 1:
			return array[0];
		default: return {
			updateUrl(url): string {
				for (const security of array) {
					url = security.updateUrl(url);
				}
				return url;
			},
			updateHeaders(headers): Record<string, string> {
				for (const security of array) {
					headers = security.updateHeaders(headers);
				}
				return headers;
			},
		};
	}
}

type ObjectValues<O> = O[keyof O];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Unpromisify<F extends (...args: any[]) => Promise<any>> = F extends (...args: []) => Promise<infer R> ? R : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResponseMapToReturnType<R extends {[key: number]: (...args: any[]) => Promise<any>}> =
	ObjectValues<{ [K in keyof R]: K extends number ? FetchResponse<K, Unpromisify<R[K]>> : never }>
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
type JsonAny = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiRequest<R extends {[key: number]: (response: Response) => Promise<any>}>(
	request: Request,
	statusCodes: R,
): CancelablePromise<ResponseMapToReturnType<R>> {
	const controller = new AbortController();
	const newRequest = new Request(request, {
		signal: controller.signal,
		credentials: 'omit',
	});
	return makeCancelablePromise(fetch(newRequest).then((response): Promise<ResponseMapToReturnType<R>> => {
		const status = response.status;
		const parser = statusCodes[status];
		if (!parser) {
			throw new Error(\`Undocumented HTTP status code: \${status}\`);
		}
		return parser(response).then((decoded): ResponseMapToReturnType<R> => {
			const result = new FetchResponse(response, status, decoded);
			return result as ResponseMapToReturnType<R>;
		});
	}), (): void => controller.abort());
}

interface Options {
	cache?: Request['cache'];
	headers?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function objectToQueryString(input: Record<string, string | number | boolean | null | undefined>): string {
	const entries = Object.entries(input).filter((entry): entry is [string, string | number | boolean] => entry[1] !== null && entry[1] !== undefined);
	if (entries.length === 0) {
		return '';
	}
	return \`?\${entries
		.map(([key, value]): string => \`\${${urlencode}(key)}=\${${urlencode}(value.toString())}\`).join()}\`;
}
`;
}

// Write out all entity definitions
function createDefinitions(swagger: OpenApi) {
	if (swagger.components && swagger.components.schemas) {
		return Object
			.entries(swagger.components.schemas)
			.map(([key, definition]) => {
				return writeDefinition(getEntityName(key), makeEntityDefinition(definition, false), '');
			}).join('\n');
	}
	return '';
}

// Map a parameter from the parameters section to something typescript knows
function mapBodyParam(
	def: Parameter,
	name: string | undefined = undefined,
	isOptional: boolean | undefined = undefined,
	mapOptionalAsPartial: boolean = false,
): string {
	const optional = isOptional === undefined ? !def.required : isOptional;
	if ('schema' in def) {
		const schema = trimWS(makeEntity(def.schema, optional, mapOptionalAsPartial)).replace(/; }$/, ' }');
		if (mapOptionalAsPartial) {
			const isOptional = schema.endsWith(' | null')
			if (isOptional) {
				return `${name || def.name}?: ${schema.substring(0, schema.length - ' | null'.length)}`;
			}
		}
		return `${name || def.name}: ${schema}`;
	} else {
		return `${name || def.name}: BodyInit`;
	}
}

const REQUEST_BODY_NAME = 'requestBody';

function mapRequestBody(def: RequestBody): {
	arg: string,
	type: string,
	rawBody: boolean,
} {
	const optional = !def.required;
	const entries = Object.entries(def.content);
	if (entries.length !== 1) {
		console.error('definition.content had multiple keys, this is not supported yet!', def);
		return {
			arg:  `${REQUEST_BODY_NAME}: never`,
			type: 'never',
			rawBody: false,
		};
	}
	const [[type, body]] = entries;
	if ('type' in body.schema && body.schema.type === 'string' && body.schema.format === 'binary') {
		return {
			arg: `${REQUEST_BODY_NAME}: BodyInit`,
			type,
			rawBody: true,
		};
	}
	return {
		arg: mapBodyParam({
			schema: body.schema,
			name: REQUEST_BODY_NAME,
			in: 'path'
		}, REQUEST_BODY_NAME, optional),
		type,
		rawBody: false,
	};
}

// Map a status code from the swagger file into a struct that typescript can use
function mapResponseParam(statusCode: string, def: Response): {
	type: string,
	parser: string,
} | null {
	if (def.content && def.content['application/json']) {
		return {
			type: `FetchResponse<${statusCode}, ${makeEntity(def.content['application/json'].schema, false)}>`,
			parser: `${statusCode}: toJson`,
		};
	} else if (statusCode.startsWith('2')) {
		return {
			type: `FetchResponse<${statusCode}, Response>`,
			parser: `${statusCode}: toResponse`,
		};
	} else {
		return null;
	}
}

// TODO: make it support more patterns as more entities are defined in the backend, example list:
// https://stackoverflow.com/a/27194360/1542723
function singular(input: string): string {
	if (input.endsWith('ies')) {
		return input.substring(0, input.length - 3) + 'y';
	}
	if (input.endsWith('s')) {
		return input.substring(0, input.length - 1);
	}
	return input;
}

function capitalize(input: string): string {
	return input.length === 0 ? input : input[0].toUpperCase() + input.substring(1);
}
function unCapitalize(input: string): string {
	return input.length === 0 ? input : input[0].toLowerCase() + input.substring(1);
}

function stringToCamelCase(input: string): string {
	const split = input.split(/[ _-]/);
	if (split.length > 1) {
		let output = '';
		for (const chunk of split) {
			output += capitalize(chunk);
		}
		return unCapitalize(output);
	}
	return input;
}

function calculateFunctionName(definition: Operation, method: string, path: string): string {
	const baseName = stringToCamelCase(
		definition.operationId ||
		definition.summary ||
		path.replace(/(\{[^}]*\})|\//, '') + capitalize(method)
	);

	const tagName = definition.tags && definition.tags.length > 0 ? stringToCamelCase(definition.tags[0]) : undefined;
	if (!tagName) {
		return unCapitalize(baseName);
	}

	const tagNameSingular = singular(tagName.toLowerCase());
	const convertedBasename = baseName
		.replace(new RegExp(tagName, 'ig'), '')
		.replace(new RegExp(tagNameSingular, 'ig'), '');
	return tagNameSingular + capitalize(convertedBasename);
}

function getPathOperations(
	pathItem: PathItem
): ['get' | 'post' | 'put' | 'patch' | 'options' | 'delete', Operation][] {
	const items: ReturnType<typeof getPathOperations> = [];
	if (pathItem.get) items.push(['get', pathItem.get]);
	if (pathItem.post) items.push(['post', pathItem.post]);
	if (pathItem.put) items.push(['put', pathItem.put]);
	if (pathItem.options) items.push(['options', pathItem.options]);
	if (pathItem.delete) items.push(['delete', pathItem.delete]);
	if (pathItem.patch) items.push(['patch', pathItem.patch]);
	if (items.length === 0) {
		console.warn('PathItem object contained no Operations!')
	}
	return items;
}

function resolveRefs<T extends NonNullable<Component[keyof Component]>[string]>(
	swagger: OpenApi,
	obj: T | Ref
): T {
	if ('$ref' in obj) {
		if(!swagger.components) {
			throw new Error('Entry referred to ref while components was undefined');
		}
		const ref = (obj as Ref).$ref;
		const [hash, components, partition, name] = ref.split('/');
		if (hash !== '#' || components !== 'components') {
			throw new Error('Invalid ref discovered: ' + ref);
		}
		const castedPartition = partition as keyof Component;
		let slice = swagger.components[castedPartition];
		if (!slice) {
			throw new Error('Entry referred to ref while components.' + partition +' was undefined');
		}
		const result = slice[name];
		if (!slice) {
			throw new Error('Entry referred to ref while components.' + partition + '.'+name+' was undefined');
		}
		return result as T;
	}
	return obj;
}

function getResponsesAsList(swagger: OpenApi, responses: Responses): [string, Response][] {
	const numberKeys = Object.keys(responses).filter((key): boolean => !Number.isNaN(Number(key))) as (keyof Responses)[];
	if (numberKeys.length > 0) {
		const result: ReturnType<typeof getResponsesAsList> = [];
		for (const key of numberKeys) {
			result.push([`${key}`, resolveRefs(swagger, responses[key])]);
		}
		return result;
	}
	return [];
}

function calculateFinalParameters(root: (Ref | Parameter)[] | undefined, local: (Ref | Parameter)[] | undefined, swagger: OpenApi): Parameter[] {
	const map: Record<string, Parameter> = {};
	if(root) {
		for (const param of root) {
			const resolved = resolveRefs(swagger, param);
			map[resolved.in + resolved.name] = resolved;
		}
	}
	if(local) {
		for (const param of local) {
			const resolved = resolveRefs(swagger, param);
			map[resolved.in + resolved.name] = resolved;
		}
	}
	return Object.values(map);
}
function securityName(input: string): string {
	return stringToCamelCase(input);
}

function mapSecurityObject(key: string, scope: string[]): string {
	return `Security<'${key}', ${scope.map((e): string => `'${securityName(e)}'`).join(' | ') || 'never'}>`;
}

function makeFunctionArguments(parameters: Parameter[], requestBody: RequestBody | null, security: SecurityRequirement[], path: string): {
	arguments: string[];
	documentation: Record<string, string>;
	body: string,
	contentType: string | null,
	hasQuery: boolean,
	hasSecurity: boolean,
	hasClientBody: boolean;
} {
	const params = {
		path: parameters.filter(i => i.in === 'path').sort((a, b) => {
			const valA = path.indexOf(a.name);
			const valB = path.indexOf(b.name);

			if (valA < valB) {
				return 1;
			}
			if (valB < valA) {
				return -1;
			}
			return 0;
		}),
		query: parameters.filter(i => i.in === 'query'),
		header: parameters.filter(i => i.in === 'header'),
		cookie: parameters.filter(i => i.in === 'cookie'),
	}
	const result: ReturnType<typeof makeFunctionArguments> = {
		arguments: [],
		documentation: {},
		body: '',
		contentType: null,
		hasQuery: false,
		hasSecurity: false,
		hasClientBody: false,
	}
	// Security goes before anything else, if its required
	switch (security.length) {
		case 0:
			// Do nothing
			break;
		case 1:
			const entries = Object.entries(security[0])
			switch (entries.length) {
				case 0:
					cli.error('Empty security requirement object spotted!');
					// do nothing
					break;
				case 1:
					const [[key, scope]] = entries;
					result.hasSecurity = true;
					result.arguments.push(`security: ${mapSecurityObject(key, scope)}`);
					result.body += 'const sec = security;\n';
					break;
				default:
					const obj = entries.map(([key, scope]): string => `${securityName(key)}: ${mapSecurityObject(key, scope)}`).join('; ');
					result.hasSecurity = true;
					result.arguments.push(`security: {${obj}}`);
					result.body += 'const sec = combinedSecurity(security);\n';

			}
			break;
		default:
			const obj = security.map((requirement): string => {
				return `{${Object.entries(requirement).map(([key, scope]): string => `${securityName(key)}: ${mapSecurityObject(key, scope)}`).join('; ')}}`;
			}).join(' | ');
			result.hasSecurity = true;
			result.arguments.push(`security: ${obj}`);
			result.body += 'const sec = combinedSecurity(security);\n';
			break;
	}
	// Path parameters go first
	result.arguments.push(...params.path.map((param) => mapBodyParam(param)));
	// Then the query parameters
	if (params.query.length > 0) {
		result.arguments.push(`query: {${params.query.map((param) => mapBodyParam(param, undefined, undefined, true)).join(', ')}}`);
		result.hasQuery = true;
	}
	if (requestBody) {
		const mappedBody = mapRequestBody(requestBody);
		if (requestBody.description) {
			result.documentation[REQUEST_BODY_NAME] = requestBody.description;
		}
		result.contentType = mappedBody.type;
		switch (mappedBody.type) {
			case 'application/json':
				result.hasClientBody = true;
				result.body += `const body = JSON.stringify(${REQUEST_BODY_NAME});`;
				break;
			case 'multipart/form-data':
				result.hasClientBody = true;
				result.body += 'const body = new FormData();\n';
				result.body += `for (const [key, value] of Object.entries(${REQUEST_BODY_NAME})) {\n`;
				result.body += '\tif (value !== null) {\n';
				result.body += '\t\tbody.append(key, value);\n';
				result.body += '\t}\n';
				result.body += '}\n';
				break;
			case 'application/x-www-form-urlencoded':
				result.hasClientBody = true;
				result.body += 'const url = new URLSearchParams();\n';
				result.body += `for (const [key, value] of Object.entries(${REQUEST_BODY_NAME})) {\n`;
				result.body += '\tif (value !== null) {\n';
				result.body += '\t\turl.set(key, value.toString());\n';
				result.body += '\t}\n';
				result.body += '}\n';
				result.body += 'const body = url.toString();\n';
				break;
			default:
				if (mappedBody.rawBody) {
					result.hasClientBody = true;
					result.body += `const body = ${REQUEST_BODY_NAME};\n`;
				} else {
					console.warn('Found unrecognised mime type: ' + mappedBody.type);
					result.hasClientBody = true;
					result.body = `// eslint-disable-next-line @typescript-eslint/no-explicit-any\n`;
					result.body += `const body = ${REQUEST_BODY_NAME} as any;\n`;
				}
				break;
		}
		// Followed by body parameters
		result.arguments.push(mappedBody.arg);
	}
	// Options is always last
	result.documentation.options = 'Extra request options';
	result.arguments.push('options: Options = {}');
	return result;
}

function makeOperationCode(path: string, method: string, definition: Operation, swagger: OpenApi, rootParameters: PathItem['parameters']): string {
	cli.debug('Generating [Operation]: ' + path + ':' + method)
	let output = '\t// OPERATION: ' + path + ':' + method + '\n';
	// Generate signature for current operation
	const functionName = calculateFunctionName(definition, method, path);
	// Construct function arguments

	const swaggerParameters = calculateFinalParameters(rootParameters, definition.parameters, swagger);
	const swaggerSecurity = swagger.security || definition.security || [];
	const functionArgs = makeFunctionArguments(
		swaggerParameters,
		definition.requestBody ? resolveRefs(swagger, definition.requestBody,) : null,
		swaggerSecurity,
		path
	);


	if (!definition.responses) {
		cli.error(`'responses' was missing from the swagger on route ${path}:${method}. This is a spec voilation!!`);
		return '';
	}
	// Generate return type
	const responses = getResponsesAsList(swagger, definition.responses);
	const statusReturnTypes: string[] = [];
	const statusParserTypes: string[] = [];
	const statusDocumentation: string[] = [];

	for (let k = 0; k < responses.length; k++) {
		const statusCode = responses[k][0];
		const result = mapResponseParam(statusCode, responses[k][1]);
		if (result) {
			statusReturnTypes.push(result.type);
			statusParserTypes.push(result.parser);
		}
		if (responses[k][1].description) {
			statusDocumentation.push(`${statusCode} ${responses[k][1].description}`);
		}
	}
	// Generate path
	const parsedPath = path.includes('{') || functionArgs.hasQuery ?
		`\`${path.replace(/{/g, '${')}${functionArgs.hasQuery ? '${objectToQueryString(query)}' : ''}\`` :
		`'${path}'`;
	// JSDoc
	output += '\t/**\n';
	if (definition.description || definition.summary) {
		output += `\t * ${definition.description || definition.summary}\n`;
		output += '\t *\n';
	}
	if (definition.deprecated) {
		output += '\t * @deprecated\n';
	}
	if (statusDocumentation.length > 0) {
		output += '\t * @return The response to the request:\n';
		for (let k = 0; k < statusDocumentation.length; k++) {
			output += `\t *     ${statusDocumentation[k]}\n`;
		}
	}
	output += '\t */\n';

	// Function signature
	output += `\tpublic ${functionName}(${functionArgs.arguments.join(', ')}): Promise<\n`;
	for (let k = 0; k < statusReturnTypes.length; k++) {
		output += `\t\t${indent(statusReturnTypes[k], '\t\t')}${statusReturnTypes.length - 1 === k ? '' : ' |'}\n`;
	}
	output += '\t> {\n';
	// Function body
	if (functionArgs.body) {
		output += `\t\t${functionArgs.body.replace(/\n/g, '\n\t\t').trim()}\n\n`;
	}
	const securityOption = functionArgs.hasSecurity ? ', sec' : '';
	output += `\t\treturn apiRequest(new Request(this.formatUri(${parsedPath}${securityOption}), {\n`;
	output += `\t\t\theaders: ${functionArgs.hasSecurity ? 'sec.updateHeaders(' : ''}{\n`;
	output += '\t\t\t\t...this.headers,\n';
	// We need a special case for multipart/form-data here, as its header value is complex, and is
	// automatically calculated once its missing
	if (functionArgs.contentType && functionArgs.contentType !== 'multipart/form-data') {
		output += `\t\t\t\t'content-type': '${functionArgs.contentType.replace('*', 'unknown')}',\n`;
	}
	output += '\t\t\t\t...options.headers,\n';
	output += `\t\t\t}${functionArgs.hasSecurity ? ')' : ''},\n`;
	output += '\t\t\tcache: options.cache,\n';
	if (functionArgs.hasClientBody) {
		output += '\t\t\tbody,\n';
	}
	output += `\t\t\tmethod: '${method}',\n`;
	output += '\t\t}), {\n';
	for (let k = 0; k < statusParserTypes.length; k++) {
		output += `\t\t\t${statusParserTypes[k]},\n`;
	}
	output += '\t\t});\n';
	output += '\t}\n';
	output += '\n';
	return output;
}

function mapHttpSecurityScheme(scheme: string): string {
	return scheme === "bearer" ? "Bearer" : scheme;
}

function createSecurity(swagger: OpenApi): string {
	cli.debug('Generating Security informations class...');
	let output = 'export const SecurityProviders = {\n';
	if (swagger.components && swagger.components.securitySchemes) {
		for (const [key, security] of Object.entries(swagger.components.securitySchemes)) {
			const name = securityName(key);
			output += `\t/**\n`
			if (security.description) {
				output += `\t * ${security.description}\n`;
				output += `\t *\n`;
			}
			switch (security.type) {
				case 'http':
					if (security.bearerFormat) {
						output += `\t * Bearer format: ${security.bearerFormat}\n`;
						output += `\t *\n`;
					}
					output += `\t * Scheme: ${security.scheme}\n`;
					output += `\t *\n`;
					output += `\t * @return The newly generated security token\n`;
					output += `\t */\n`;
					output += `\t${escapeKey(name)}(token: string): Security<'${name}', never> {\n`
					output += `\t\treturn new HttpAuthentication('${name}', token, '${mapHttpSecurityScheme(security.scheme)}');\n`
					output += `\t},\n`;
					break;
				case 'apiKey':
					output += `\t * In: ${security.in}\n`;
					output += `\t *\n`;
					output += `\t * Key: ${security.name}\n`;
					output += `\t *\n`;
					output += `\t * @return The newly generated security token\n`;
					output += `\t */\n`;
					output += `\t${escapeKey(name)}(token: string): Security<'${name}', never> {\n`
					output += `\t\treturn new ApiKeyAuthentication('${name}', '${security.in}', '${security.name}', token);\n`
					output += `\t},\n`;
					break;
				case 'oauth2':
				case 'openIdConnect':
					cli.error('Unsupported security operation: ' + security.type)
					output += `\t */\n`;
					output += `\t${escapeKey(name)}(): never {\n`
					output += `\t\tthrow new Error('Unsupported operation');\n`
					output += `\t},\n`;
					break;
				default:
					cli.error('Unsupported security operation: ' + security)
					output += `\t */\n`;
					output += `\t${escapeKey(name)}(): never {\n`
					output += `\t\tthrow new Error('Unsupported operation');\n`
					output += `\t},\n`;
			}
		}
	}
	output += '};\n';
	return output;
}

// Create the main entry point of the api
function createClass(swagger: OpenApi): string {
	cli.debug('Generating API class...')
	let output = '';
	output += `/**
 * ${swagger.info.title} v${swagger.info.version}
 *
 * ${swagger.info.description}\n`;
	if (swagger.info.termsOfService) {
		output += ` * Terms of service: ${swagger.info.termsOfService}\n`
		output += ` *\n`
	}
	if (swagger.info.contact) {
		output += ` * Contact information:\n`
		if (swagger.info.contact.name) {
			output += ` * ${swagger.info.contact.name}\n`
		}
		if (swagger.info.contact.url) {
			output += ` * ${swagger.info.contact.url}\n`
		}
		if (swagger.info.contact.email) {
			output += ` * ${swagger.info.contact.email}\n`
		}
		output += ` *\n`
	}
	if (swagger.info.license) {
		if (swagger.info.license.url) {
			output += ` * @license ${swagger.info.license.name} (${swagger.info.license.url})\n`
		} else {
			output += ` * @license ${swagger.info.license.name}\n`
		}
		output += ` *\n`
	}
	output += ` */
export default class Api {
	private readonly baseUrl: string;
	private readonly headers: Record<string, string>;

	public constructor(baseUrl: string, headers?: Record<string, string>) {
		this.baseUrl = baseUrl;
		this.headers = headers ? headers : {};
	}

	private formatUri(uri: string, sec: ResolvedSecurity = VoidSecurity): string {
		return sec.updateUrl(new URL(uri, this.baseUrl).href);
	}\n`;
	for (const [path, pathValues] of Object.entries(swagger.paths)) {
		for (const [method, definition] of getPathOperations(pathValues)) {
			output += makeOperationCode(path, method, definition, swagger, pathValues.parameters);
		}
	}
	output += '}\n';
	return output;
}

// Generates all the sections of the file
export default function swaggerToTS(swagger: OpenApi) {
	let output = '';
	output += '/* eslint-disable indent, max-len, @typescript-eslint/indent */\n';
	output += '// THIS IS A GENERATED FILE, DO NOT MODIFY\n';
	output += '// Boilerplate:\n';
	output += makeBoilerPlate();
	output += '\n// Types:\n';
	output += createDefinitions(swagger);
	output += '\n// ApiSecurity:\n';
	output += createSecurity(swagger);
	output += '\n// API:\n';
	output += createClass(swagger);
	output += '// THIS IS A GENERATED FILE, DO NOT MODIFY\n';
	return output;
}
