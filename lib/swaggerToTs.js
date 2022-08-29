'use strict';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cli_1 = __importDefault(require("cli"));
function g(typeString) {
    return /[^a-zA-Z0-9[\]/*\\]/.test(typeString) ? "(" + typeString + ")" : typeString;
}
function trimWS(s) {
    return s.replace(/\/\*.*?\*\//sgm, '').replace(/\s+/g, ' ').trim();
}
function getEntityName(name) {
    return "Api" + name.replace('dto', '');
}
function refToType(ref) {
    var _a = ref.split('/'), hash = _a[0], components = _a[1], partition = _a[2], name = _a[3];
    if (hash !== '#') {
        cli_1.default.error('Invalid ref discovered: ' + ref);
    }
    if (components !== 'components') {
        cli_1.default.error('Invalid ref discovered: ' + ref);
    }
    if (partition !== 'schemas') {
        cli_1.default.error('Invalid ref discovered: ' + ref);
    }
    return getEntityName(name);
}
function indent(input, padding) {
    return input.replace(/\n/g, "\n" + padding);
}
function escapeKey(input) {
    if ((/^[a-zA-Z_]$/i.test(input[0]) && /^[a-zA-Z0-9_]+$/.test(input)) || input.startsWith('[')) {
        return input;
    }
    return "'" + input.replace('\\', '\\\\').replace('\'', '\\\'') + "'";
}
function writeDefinition(key, _a, padding, mapOptionalAsPartial) {
    var text = _a.text, description = _a.description, enumValues = _a.enumValues, simpleObject = _a.simpleObject;
    if (mapOptionalAsPartial === void 0) { mapOptionalAsPartial = false; }
    var keyOutput;
    if (padding && mapOptionalAsPartial) {
        var isOptional = text.endsWith(' | null');
        var orNull = isOptional ? '?' : '';
        if (isOptional) {
            text = text.substring(0, text.length - ' | null'.length);
        }
        keyOutput = "" + escapeKey(key) + orNull + ": ";
    }
    else if (padding) {
        keyOutput = escapeKey(key) + ": ";
    }
    else if (typeof simpleObject === 'string') {
        keyOutput = "export interface " + key + " extends " + simpleObject + " ";
    }
    else if (simpleObject) {
        keyOutput = "export interface " + key + " ";
    }
    else {
        keyOutput = "export type " + key + " = ";
    }
    var output = '';
    if (!padding) {
        cli_1.default.debug('Generating [definition]: ' + key);
        output += "// DEFINITION: " + key + "\n";
    }
    if (description && description.length > 0) {
        output += '/**\n';
        for (var _i = 0, description_1 = description; _i < description_1.length; _i++) {
            var line = description_1[_i];
            output += " * " + indent(line.replace('*/', '* /'), ' * ') + "\n";
        }
        output += ' */\n';
    }
    if (enumValues && padding === undefined) {
        output += 'export enum ${key} {\n';
        for (var _b = 0, enumValues_1 = enumValues; _b < enumValues_1.length; _b++) {
            var line = enumValues_1[_b];
            output += "\t" + line + " = '" + line + "',\n";
        }
        output += '}';
    }
    else {
        output += keyOutput + text;
    }
    if (padding !== undefined) {
        output = indent(output, padding);
    }
    return output;
}
function makeEntityDefinition(prop, optional, mapOptionalAsPartial) {
    if (mapOptionalAsPartial === void 0) { mapOptionalAsPartial = false; }
    var orNull = optional ? ' | null' : '';
    var description = [];
    var output = '';
    var enumValues = null;
    if (prop === true) {
        return {
            description: description,
            text: 'any',
            enumValues: null,
            simpleObject: false,
        };
    }
    if ('$ref' in prop) {
        return {
            text: "" + refToType(prop.$ref) + orNull,
            description: [],
            enumValues: null,
            simpleObject: false,
        };
    }
    if ('description' in prop && prop.description) {
        description.push.apply(description, prop.description.split('\n\n').map(function (line) { return line.replace('\n', ''); }));
    }
    if ('readOnly' in prop) {
        description.push('This value is server --> client only, and thus ignored by the server');
    }
    if ('writeOnly' in prop) {
        description.push('This value is client --> server only, and thus ignored by the server');
    }
    if ('oneOf' in prop) {
        for (var _i = 0, _a = prop.oneOf; _i < _a.length; _i++) {
            var oneOf = _a[_i];
            output += g(makeEntityDefinition(oneOf, false).text) + ' | ';
        }
        output = output.substring(0, output.length - 3) + orNull;
        return {
            description: description,
            text: output,
            enumValues: null,
            simpleObject: false,
        };
    }
    if ('anyOf' in prop) {
        for (var _b = 0, _c = prop.anyOf; _b < _c.length; _b++) {
            var oneOf = _c[_b];
            output += g(makeEntityDefinition(oneOf, false).text) + ' | ';
        }
        output = output.substring(0, output.length - 3) + orNull;
        return {
            description: description,
            text: output,
            enumValues: null,
            simpleObject: false,
        };
    }
    if ('allOf' in prop) {
        var isSimpleAllOf = prop.allOf.every(function (d) { return '$ref' in d || 'type' in d && d.type === 'object'; }) && !optional;
        if (isSimpleAllOf) {
            var extendsList = [];
            var baseObject = {
                description: description,
                text: output,
                enumValues: null,
                simpleObject: true,
            };
            for (var _d = 0, _e = prop.allOf; _d < _e.length; _d++) {
                var obj = _e[_d];
                if ('$ref' in obj) {
                    extendsList.push(refToType(obj.$ref));
                }
                else {
                    baseObject = makeEntityDefinition(obj, false);
                }
            }
            return __assign(__assign({}, baseObject), { simpleObject: extendsList.join(', ') });
        }
        else {
            for (var _f = 0, _g = prop.allOf; _f < _g.length; _f++) {
                var allOf = _g[_f];
                output += g(makeEntityDefinition(allOf, false).text) + ' & ';
            }
            output = output.substring(0, output.length - 3);
            if (optional) {
                output = "" + g(output) + orNull;
            }
            return {
                description: description,
                text: output,
                enumValues: null,
                simpleObject: false,
            };
        }
    }
    if (!('type' in prop)) {
        return {
            description: description,
            text: 'null',
            enumValues: null,
            simpleObject: false,
        };
    }
    switch (prop.type) {
        case 'integer':
        case 'number':
            output = "number" + orNull;
            if ('multipleOf' in prop) {
                description.push('This number should be a multiple of ' + prop.multipleOf);
            }
            else if (prop.type === 'integer') {
                description.push('This number should have no decimals');
            }
            if ('minimum' in prop) {
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
                output = prop.enum.map(function (e) { return "'" + e + "'"; }).join(' | ') + orNull;
                enumValues = prop.enum;
            }
            else if (prop.format === 'binary') {
                output = "Blob" + orNull;
            }
            else {
                output = "string" + orNull;
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
            output = "boolean" + orNull;
            break;
        case 'object':
            output += '{\n';
            if (prop.properties) {
                output += Object.entries(prop.properties).map(function (_a) {
                    var key = _a[0], value = _a[1];
                    var required = prop.required && prop.required.find(function (name) { return name === key; });
                    return "\t" + writeDefinition(key, makeEntityDefinition(value, !required), '\t', mapOptionalAsPartial) + ";\n";
                }).join('');
            }
            if (prop.additionalProperties) {
                output += "\t" + writeDefinition('[key: string]', makeEntityDefinition(prop.additionalProperties, false), '\t') + ";\n";
            }
            output += "}";
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
            output = g(makeEntity(prop.items, false)) + "[]" + orNull;
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
            throw new Error("Unknown type: " + prop + " on node " + JSON.stringify(prop));
    }
    return {
        description: description,
        text: output,
        enumValues: enumValues,
        simpleObject: prop.type === 'object',
    };
}
function makeEntity(prop, optional, mapOptionalAsPartial) {
    if (mapOptionalAsPartial === void 0) { mapOptionalAsPartial = false; }
    return makeEntityDefinition(prop, optional, mapOptionalAsPartial).text;
}
function makeBoilerPlate() {
    var urlencode = 'encodeURIComponent';
    return "\ninterface CancelablePromise<T> extends Promise<T> {\n\t'@@redux-saga/CANCEL_PROMISE': () => void;\n}\n\nfunction makeCancelablePromise<T>(promise: Promise<T>, onCancel: () => void): CancelablePromise<T> {\n\tconst castedPromise = promise as CancelablePromise<T>;\n\tcastedPromise['@@redux-saga/CANCEL_PROMISE'] = onCancel;\n\treturn castedPromise;\n}\n\nexport class FetchResponse<S extends number, R> {\n\tpublic status: S;\n\tpublic result: R;\n\tpublic url: Response['url'];\n\tpublic type: Response['type'];\n\tpublic headers: Response['headers'];\n\tpublic statusText: Response['statusText'];\n\tpublic redirected: Response['redirected'];\n\tpublic ok: S extends 200 ? true : S extends 201 ? true : S extends 204 ? true : false;\n\tpublic constructor(response: Response, status: S, result: R) {\n\t\tthis.status = status;\n\t\tthis.result = result;\n\t\tthis.url = response.url;\n\t\tthis.type = response.type;\n\t\tthis.headers = response.headers;\n\t\tthis.statusText = response.statusText;\n\t\tthis.redirected = response.redirected;\n\t\t// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\t\tthis.ok = (status === 200 || status === 201 || status === 204) as any;\n\t}\n\tpublic expectSuccess(): S extends 200 ? R : S extends 201 ? R : S extends 204 ? R : never {\n\t\tif (this.ok) {\n\t\t\t// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\t\t\treturn this.result as any;\n\t\t}\n\t\tconst stringifiedResponse = JSON.stringify(this.result, null, 2);\n\t\tthrow new Error(`Response was not OK.\\nResponse body:\\n${stringifiedResponse}`);\n\t}\n\tpublic expect<E extends S>(code: E | E[]): S extends E ? R : never {\n\t\tif (Array.isArray(code) ? (code as number[]).includes(this.status) : this.status === code) {\n\t\t\t// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\t\t\treturn this.result as any;\n\t\t}\n\t\tconst stringifiedResponse = JSON.stringify(this.result, null, 2);\n\t\tthrow new Error(\n\t\t\t`Expected HTTP status code to be ${code}, but it was ${this.status}.\\n" +
        ("Response body:\\n${stringifiedResponse}`\n\t\t);\n\t}\n}\n\n// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any\nfunction toJson(response: Response): Promise<any> {\n\treturn response.json();\n}\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nfunction toResponse(response: Response): Promise<Response> {\n\treturn Promise.resolve(response);\n}\n\nexport interface ResolvedSecurity {\n\tupdateUrl(url: string): string;\n\tupdateHeaders(headers: Record<string, string>): Record<string, string>;\n}\nexport interface Security<N extends string, S extends string> extends ResolvedSecurity {\n\treadonly name: N;\n\treadonly scope: S[];\n}\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nclass HttpAuthentication<N extends string> implements Security<N, never> {\n\tpublic readonly name: N;\n\tpublic readonly scope: never[] = [];\n\tpublic readonly token: string;\n\tpublic readonly schema: string;\n\tpublic constructor(name: N, token: string, schema: string) {\n\t\tthis.name = name;\n\t\tthis.token = token;\n\t\tthis.schema = schema;\n\t}\n\tpublic updateUrl(url: string): string {\n\t\treturn url;\n\t}\n\tpublic updateHeaders(headers: Record<string, string>): Record<string, string> {\n\t\treturn {\n\t\t\t...headers,\n\t\t\t'Authorization': `${this.schema} ${this.token}`,\n\t\t};\n\t}\n}\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nclass ApiKeyAuthentication<N extends string> implements Security<N, never> {\n\tpublic readonly name: N;\n\tpublic readonly scope: never[] = [];\n\tpublic readonly token: string;\n\tpublic readonly key: string;\n\tpublic readonly in: 'query' | 'header' | 'cookie';\n\tpublic constructor(name: N, inType: 'query' | 'header' | 'cookie', key: string, token: string) {\n\t\tthis.name = name;\n\t\tthis.token = token;\n\t\tthis.in = inType;\n\t\tthis.key = key;\n\t}\n\tpublic updateUrl(url: string): string {\n\t\tif (this.in === 'query') {\n\t\t\tconst arg = `${encodeURIComponent(this.key)}=${encodeURIComponent(this.token)}`;\n\t\t\tif (url.includes('?')) {\n\t\t\t\treturn `${url}&${arg}`;\n\t\t\t} else {\n\t\t\t\treturn `${url}?${arg}`;\n\t\t\t}\n\t\t}\n\t\treturn url;\n\t}\n\tpublic updateHeaders(headers: Record<string, string>): Record<string, string> {\n\t\tif (this.in === 'header') {\n\t\t\treturn {\n\t\t\t\t...headers,\n\t\t\t\t[this.key]: this.token,\n\t\t\t};\n\t\t}\n\t\treturn headers;\n\t}\n}\n\nconst VoidSecurity: ResolvedSecurity = {\n\tupdateUrl(url): string {\n\t\treturn url;\n\t},\n\tupdateHeaders(headers): Record<string, string> {\n\t\treturn headers;\n\t},\n};\n\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nfunction combinedSecurity<S extends Record<string, ResolvedSecurity>>(sec: S): ResolvedSecurity {\n\tconst array = Object.values(sec);\n\tswitch (array.length) {\n\t\tcase 0:\n\t\t\treturn VoidSecurity;\n\t\tcase 1:\n\t\t\treturn array[0];\n\t\tdefault: return {\n\t\t\tupdateUrl(url): string {\n\t\t\t\tfor (const security of array) {\n\t\t\t\t\turl = security.updateUrl(url);\n\t\t\t\t}\n\t\t\t\treturn url;\n\t\t\t},\n\t\t\tupdateHeaders(headers): Record<string, string> {\n\t\t\t\tfor (const security of array) {\n\t\t\t\t\theaders = security.updateHeaders(headers);\n\t\t\t\t}\n\t\t\t\treturn headers;\n\t\t\t},\n\t\t};\n\t}\n}\n\ntype ObjectValues<O> = O[keyof O];\n// eslint-disable-next-line @typescript-eslint/no-explicit-any\ntype Unpromisify<F extends (...args: any[]) => Promise<any>> = F extends (...args: []) => Promise<infer R> ? R : never;\n// eslint-disable-next-line @typescript-eslint/no-explicit-any\ntype ResponseMapToReturnType<R extends {[key: number]: (...args: any[]) => Promise<any>}> =\n\tObjectValues<{ [K in keyof R]: K extends number ? FetchResponse<K, Unpromisify<R[K]>> : never }>\n// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars\ntype JsonAny = any;\n\n// eslint-disable-next-line @typescript-eslint/no-explicit-any\nfunction apiRequest<R extends {[key: number]: (response: Response) => Promise<any>}>(\n\trequest: Request,\n\tstatusCodes: R,\n): CancelablePromise<ResponseMapToReturnType<R>> {\n\tconst controller = new AbortController();\n\tconst newRequest = new Request(request, {\n\t\tsignal: controller.signal,\n\t\tcredentials: 'omit',\n\t});\n\treturn makeCancelablePromise(fetch(newRequest).then((response): Promise<ResponseMapToReturnType<R>> => {\n\t\tconst status = response.status;\n\t\tconst parser = statusCodes[status];\n\t\tif (!parser) {\n\t\t\tthrow new Error(`Undocumented HTTP status code: ${status}`);\n\t\t}\n\t\treturn parser(response).then((decoded): ResponseMapToReturnType<R> => {\n\t\t\tconst result = new FetchResponse(response, status, decoded);\n\t\t\treturn result as ResponseMapToReturnType<R>;\n\t\t});\n\t}), (): void => controller.abort());\n}\n\ninterface Options {\n\tcache?: Request['cache'];\n\theaders?: Record<string, string>;\n}\n\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\nfunction objectToQueryString(input: Record<string, string | number | boolean | null | undefined>): string {\n\tconst entries = Object.entries(input).filter((entry): entry is [string, string | number | boolean] => entry[1] !== null && entry[1] !== undefined);\n\tif (entries.length === 0) {\n\t\treturn '';\n\t}\n\treturn `?${entries\n\t\t.map(([key, value]): string => `${" + urlencode + "(key)}=${" + urlencode + "(value.toString())}`).join()}`;\n}\n");
}
function createDefinitions(swagger) {
    if (swagger.components && swagger.components.schemas) {
        return Object
            .entries(swagger.components.schemas)
            .map(function (_a) {
            var key = _a[0], definition = _a[1];
            return writeDefinition(getEntityName(key), makeEntityDefinition(definition, false), '');
        }).join('\n');
    }
    return '';
}
function mapBodyParam(def, name, isOptional, mapOptionalAsPartial) {
    if (name === void 0) { name = undefined; }
    if (isOptional === void 0) { isOptional = undefined; }
    if (mapOptionalAsPartial === void 0) { mapOptionalAsPartial = false; }
    var optional = isOptional === undefined ? !def.required : isOptional;
    if ('schema' in def) {
        var schema = trimWS(makeEntity(def.schema, optional, mapOptionalAsPartial)).replace(/; }$/, ' }');
        if (mapOptionalAsPartial) {
            var isOptional_1 = schema.endsWith(' | null');
            if (isOptional_1) {
                return (name || def.name) + "?: " + schema.substring(0, schema.length - ' | null'.length);
            }
        }
        return (name || def.name) + ": " + schema;
    }
    else {
        return (name || def.name) + ": BodyInit";
    }
}
var REQUEST_BODY_NAME = 'requestBody';
function mapRequestBody(def) {
    var optional = !def.required;
    var entries = Object.entries(def.content);
    if (entries.length !== 1) {
        console.error('definition.content had multiple keys, this is not supported yet!', def);
        return {
            arg: REQUEST_BODY_NAME + ": never",
            type: 'never',
            rawBody: false,
        };
    }
    var _a = entries[0], type = _a[0], body = _a[1];
    if ('type' in body.schema && body.schema.type === 'string' && body.schema.format === 'binary') {
        return {
            arg: REQUEST_BODY_NAME + ": BodyInit",
            type: type,
            rawBody: true,
        };
    }
    return {
        arg: mapBodyParam({
            schema: body.schema,
            name: REQUEST_BODY_NAME,
            in: 'path'
        }, REQUEST_BODY_NAME, optional),
        type: type,
        rawBody: false,
    };
}
function mapResponseParam(statusCode, def) {
    if (def.content && def.content['application/json']) {
        return {
            type: "FetchResponse<" + statusCode + ", " + makeEntity(def.content['application/json'].schema, false) + ">",
            parser: statusCode + ": toJson",
        };
    }
    else if (statusCode.startsWith('2')) {
        return {
            type: "FetchResponse<" + statusCode + ", Response>",
            parser: statusCode + ": toResponse",
        };
    }
    else {
        return null;
    }
}
function singular(input) {
    if (input.endsWith('ies')) {
        return input.substring(0, input.length - 3) + 'y';
    }
    if (input.endsWith('s')) {
        return input.substring(0, input.length - 1);
    }
    return input;
}
function capitalize(input) {
    return input.length === 0 ? input : input[0].toUpperCase() + input.substring(1);
}
function unCapitalize(input) {
    return input.length === 0 ? input : input[0].toLowerCase() + input.substring(1);
}
function stringToCamelCase(input) {
    var split = input.split(/[ _-]/);
    if (split.length > 1) {
        var output = '';
        for (var _i = 0, split_1 = split; _i < split_1.length; _i++) {
            var chunk = split_1[_i];
            output += capitalize(chunk);
        }
        return unCapitalize(output);
    }
    return input;
}
function calculateFunctionName(definition, method, path) {
    var baseName = stringToCamelCase(definition.operationId ||
        definition.summary ||
        path.replace(/(\{[^}]*\})|\//, '') + capitalize(method));
    var tagName = definition.tags && definition.tags.length > 0 ? stringToCamelCase(definition.tags[0]) : undefined;
    if (!tagName) {
        return unCapitalize(baseName);
    }
    var tagNameSingular = singular(tagName.toLowerCase());
    var convertedBasename = baseName
        .replace(new RegExp(tagName, 'ig'), '')
        .replace(new RegExp(tagNameSingular, 'ig'), '');
    return tagNameSingular + capitalize(convertedBasename);
}
function getPathOperations(pathItem) {
    var items = [];
    if (pathItem.get)
        items.push(['get', pathItem.get]);
    if (pathItem.post)
        items.push(['post', pathItem.post]);
    if (pathItem.put)
        items.push(['put', pathItem.put]);
    if (pathItem.options)
        items.push(['options', pathItem.options]);
    if (pathItem.delete)
        items.push(['delete', pathItem.delete]);
    if (pathItem.patch)
        items.push(['patch', pathItem.patch]);
    if (items.length === 0) {
        console.warn('PathItem object contained no Operations!');
    }
    return items;
}
function resolveRefs(swagger, obj) {
    if ('$ref' in obj) {
        if (!swagger.components) {
            throw new Error('Entry referred to ref while components was undefined');
        }
        var ref = obj.$ref;
        var _a = ref.split('/'), hash = _a[0], components = _a[1], partition = _a[2], name_1 = _a[3];
        if (hash !== '#' || components !== 'components') {
            throw new Error('Invalid ref discovered: ' + ref);
        }
        var castedPartition = partition;
        var slice = swagger.components[castedPartition];
        if (!slice) {
            throw new Error('Entry referred to ref while components.' + partition + ' was undefined');
        }
        var result = slice[name_1];
        if (!slice) {
            throw new Error('Entry referred to ref while components.' + partition + '.' + name_1 + ' was undefined');
        }
        return result;
    }
    return obj;
}
function getResponsesAsList(swagger, responses) {
    var numberKeys = Object.keys(responses).filter(function (key) { return !Number.isNaN(Number(key)); });
    if (numberKeys.length > 0) {
        var result = [];
        for (var _i = 0, numberKeys_1 = numberKeys; _i < numberKeys_1.length; _i++) {
            var key = numberKeys_1[_i];
            result.push(["" + key, resolveRefs(swagger, responses[key])]);
        }
        return result;
    }
    return [];
}
function calculateFinalParameters(root, local, swagger) {
    var map = {};
    if (root) {
        for (var _i = 0, root_1 = root; _i < root_1.length; _i++) {
            var param = root_1[_i];
            var resolved = resolveRefs(swagger, param);
            map[resolved.in + resolved.name] = resolved;
        }
    }
    if (local) {
        for (var _a = 0, local_1 = local; _a < local_1.length; _a++) {
            var param = local_1[_a];
            var resolved = resolveRefs(swagger, param);
            map[resolved.in + resolved.name] = resolved;
        }
    }
    return Object.values(map);
}
function securityName(input) {
    return stringToCamelCase(input);
}
function mapSecurityObject(key, scope) {
    return "Security<'" + key + "', " + (scope.map(function (e) { return "'" + securityName(e) + "'"; }).join(' | ') || 'never') + ">";
}
function makeFunctionArguments(parameters, requestBody, security, path) {
    var _a;
    var params = {
        path: parameters.filter(function (i) { return i.in === 'path'; }).sort(function (a, b) {
            var valA = path.indexOf(a.name);
            var valB = path.indexOf(b.name);
            if (valA < valB) {
                return 1;
            }
            if (valB < valA) {
                return -1;
            }
            return 0;
        }),
        query: parameters.filter(function (i) { return i.in === 'query'; }),
        header: parameters.filter(function (i) { return i.in === 'header'; }),
        cookie: parameters.filter(function (i) { return i.in === 'cookie'; }),
    };
    var result = {
        arguments: [],
        documentation: {},
        body: '',
        contentType: null,
        hasQuery: false,
        hasSecurity: false,
        hasClientBody: false,
    };
    switch (security.length) {
        case 0:
            break;
        case 1:
            var entries = Object.entries(security[0]);
            switch (entries.length) {
                case 0:
                    cli_1.default.error('Empty security requirement object spotted!');
                    break;
                case 1:
                    var _b = entries[0], key = _b[0], scope = _b[1];
                    result.hasSecurity = true;
                    result.arguments.push("security: " + mapSecurityObject(key, scope));
                    result.body += 'const sec = security;\n';
                    break;
                default:
                    var obj_1 = entries.map(function (_a) {
                        var key = _a[0], scope = _a[1];
                        return securityName(key) + ": " + mapSecurityObject(key, scope);
                    }).join('; ');
                    result.hasSecurity = true;
                    result.arguments.push("security: {" + obj_1 + "}");
                    result.body += 'const sec = combinedSecurity(security);\n';
            }
            break;
        default:
            var obj = security.map(function (requirement) {
                return "{" + Object.entries(requirement).map(function (_a) {
                    var key = _a[0], scope = _a[1];
                    return securityName(key) + ": " + mapSecurityObject(key, scope);
                }).join('; ') + "}";
            }).join(' | ');
            result.hasSecurity = true;
            result.arguments.push("security: " + obj);
            result.body += 'const sec = combinedSecurity(security);\n';
            break;
    }
    (_a = result.arguments).push.apply(_a, params.path.map(function (param) { return mapBodyParam(param); }));
    if (params.query.length > 0) {
        result.arguments.push("query: {" + params.query.map(function (param) { return mapBodyParam(param, undefined, undefined, true); }).join(', ') + "}");
        result.hasQuery = true;
    }
    if (requestBody) {
        var mappedBody = mapRequestBody(requestBody);
        if (requestBody.description) {
            result.documentation[REQUEST_BODY_NAME] = requestBody.description;
        }
        result.contentType = mappedBody.type;
        switch (mappedBody.type) {
            case 'application/json':
                result.hasClientBody = true;
                result.body += "const body = JSON.stringify(" + REQUEST_BODY_NAME + ");";
                break;
            case 'multipart/form-data':
                result.hasClientBody = true;
                result.body += 'const body = new FormData();\n';
                result.body += "for (const [key, value] of Object.entries(" + REQUEST_BODY_NAME + ")) {\n";
                result.body += '\tif (value !== null) {\n';
                result.body += '\t\tbody.append(key, value);\n';
                result.body += '\t}\n';
                result.body += '}\n';
                break;
            case 'application/x-www-form-urlencoded':
                result.hasClientBody = true;
                result.body += 'const url = new URLSearchParams();\n';
                result.body += "for (const [key, value] of Object.entries(" + REQUEST_BODY_NAME + ")) {\n";
                result.body += '\tif (value !== null) {\n';
                result.body += '\t\turl.set(key, value.toString());\n';
                result.body += '\t}\n';
                result.body += '}\n';
                result.body += 'const body = url.toString();\n';
                break;
            default:
                if (mappedBody.rawBody) {
                    result.hasClientBody = true;
                    result.body += "const body = " + REQUEST_BODY_NAME + ";\n";
                }
                else {
                    console.warn('Found unrecognised mime type: ' + mappedBody.type);
                    result.hasClientBody = true;
                    result.body = "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n";
                    result.body += "const body = " + REQUEST_BODY_NAME + " as any;\n";
                }
                break;
        }
        result.arguments.push(mappedBody.arg);
    }
    result.documentation.options = 'Extra request options';
    result.arguments.push('options: Options = {}');
    return result;
}
function makeOperationCode(path, method, definition, swagger, rootParameters) {
    cli_1.default.debug('Generating [Operation]: ' + path + ':' + method);
    var output = '\t// OPERATION: ' + path + ':' + method + '\n';
    var functionName = calculateFunctionName(definition, method, path);
    var swaggerParameters = calculateFinalParameters(rootParameters, definition.parameters, swagger);
    var swaggerSecurity = swagger.security || definition.security || [];
    var functionArgs = makeFunctionArguments(swaggerParameters, definition.requestBody ? resolveRefs(swagger, definition.requestBody) : null, swaggerSecurity, path);
    if (!definition.responses) {
        cli_1.default.error("'responses' was missing from the swagger on route " + path + ":" + method + ". This is a spec voilation!!");
        return '';
    }
    var responses = getResponsesAsList(swagger, definition.responses);
    var statusReturnTypes = [];
    var statusParserTypes = [];
    var statusDocumentation = [];
    for (var k = 0; k < responses.length; k++) {
        var statusCode = responses[k][0];
        var result = mapResponseParam(statusCode, responses[k][1]);
        if (result) {
            statusReturnTypes.push(result.type);
            statusParserTypes.push(result.parser);
        }
        if (responses[k][1].description) {
            statusDocumentation.push(statusCode + " " + responses[k][1].description);
        }
    }
    var parsedPath = path.includes('{') || functionArgs.hasQuery ?
        "`" + path.replace(/{/g, '${') + (functionArgs.hasQuery ? '${objectToQueryString(query)}' : '') + "`" :
        "'" + path + "'";
    output += '\t/**\n';
    if (definition.description || definition.summary) {
        output += "\t * " + (definition.description || definition.summary) + "\n";
        output += '\t *\n';
    }
    if (definition.deprecated) {
        output += '\t * @deprecated\n';
    }
    if (statusDocumentation.length > 0) {
        output += '\t * @return The response to the request:\n';
        for (var k = 0; k < statusDocumentation.length; k++) {
            output += "\t *     " + statusDocumentation[k] + "\n";
        }
    }
    output += '\t */\n';
    output += "\tpublic " + functionName + "(" + functionArgs.arguments.join(', ') + "): Promise<\n";
    for (var k = 0; k < statusReturnTypes.length; k++) {
        output += "\t\t" + indent(statusReturnTypes[k], '\t\t') + (statusReturnTypes.length - 1 === k ? '' : ' |') + "\n";
    }
    output += '\t> {\n';
    if (functionArgs.body) {
        output += "\t\t" + functionArgs.body.replace(/\n/g, '\n\t\t').trim() + "\n\n";
    }
    var securityOption = functionArgs.hasSecurity ? ', sec' : '';
    output += "\t\treturn apiRequest(new Request(this.formatUri(" + parsedPath + securityOption + "), {\n";
    output += "\t\t\theaders: " + (functionArgs.hasSecurity ? 'sec.updateHeaders(' : '') + "{\n";
    output += '\t\t\t\t...this.headers,\n';
    if (functionArgs.contentType && functionArgs.contentType !== 'multipart/form-data') {
        output += "\t\t\t\t'content-type': '" + functionArgs.contentType.replace('*', 'unknown') + "',\n";
    }
    output += '\t\t\t\t...options.headers,\n';
    output += "\t\t\t}" + (functionArgs.hasSecurity ? ')' : '') + ",\n";
    output += '\t\t\tcache: options.cache,\n';
    if (functionArgs.hasClientBody) {
        output += '\t\t\tbody,\n';
    }
    output += "\t\t\tmethod: '" + method + "',\n";
    output += '\t\t}), {\n';
    for (var k = 0; k < statusParserTypes.length; k++) {
        output += "\t\t\t" + statusParserTypes[k] + ",\n";
    }
    output += '\t\t});\n';
    output += '\t}\n';
    output += '\n';
    return output;
}
function mapHttpSecurityScheme(scheme) {
    return scheme === "bearer" ? "Bearer" : scheme;
}
function createSecurity(swagger) {
    cli_1.default.debug('Generating Security informations class...');
    var output = 'export const SecurityProviders = {\n';
    if (swagger.components && swagger.components.securitySchemes) {
        for (var _i = 0, _a = Object.entries(swagger.components.securitySchemes); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], security = _b[1];
            var name_2 = securityName(key);
            output += "\t/**\n";
            if (security.description) {
                output += "\t * " + security.description + "\n";
                output += "\t *\n";
            }
            switch (security.type) {
                case 'http':
                    if (security.bearerFormat) {
                        output += "\t * Bearer format: " + security.bearerFormat + "\n";
                        output += "\t *\n";
                    }
                    output += "\t * Scheme: " + security.scheme + "\n";
                    output += "\t *\n";
                    output += "\t * @return The newly generated security token\n";
                    output += "\t */\n";
                    output += "\t" + escapeKey(name_2) + "(token: string): Security<'" + name_2 + "', never> {\n";
                    output += "\t\treturn new HttpAuthentication('" + name_2 + "', token, '" + mapHttpSecurityScheme(security.scheme) + "');\n";
                    output += "\t},\n";
                    break;
                case 'apiKey':
                    output += "\t * In: " + security.in + "\n";
                    output += "\t *\n";
                    output += "\t * Key: " + security.name + "\n";
                    output += "\t *\n";
                    output += "\t * @return The newly generated security token\n";
                    output += "\t */\n";
                    output += "\t" + escapeKey(name_2) + "(token: string): Security<'" + name_2 + "', never> {\n";
                    output += "\t\treturn new ApiKeyAuthentication('" + name_2 + "', '" + security.in + "', '" + security.name + "', token);\n";
                    output += "\t},\n";
                    break;
                case 'oauth2':
                case 'openIdConnect':
                    cli_1.default.error('Unsupported security operation: ' + security.type);
                    output += "\t */\n";
                    output += "\t" + escapeKey(name_2) + "(): never {\n";
                    output += "\t\tthrow new Error('Unsupported operation');\n";
                    output += "\t},\n";
                    break;
                default:
                    cli_1.default.error('Unsupported security operation: ' + security);
                    output += "\t */\n";
                    output += "\t" + escapeKey(name_2) + "(): never {\n";
                    output += "\t\tthrow new Error('Unsupported operation');\n";
                    output += "\t},\n";
            }
        }
    }
    output += '};\n';
    return output;
}
function createClass(swagger) {
    cli_1.default.debug('Generating API class...');
    var output = '';
    output += "/**\n * " + swagger.info.title + " v" + swagger.info.version + "\n *\n * " + swagger.info.description + "\n";
    if (swagger.info.termsOfService) {
        output += " * Terms of service: " + swagger.info.termsOfService + "\n";
        output += " *\n";
    }
    if (swagger.info.contact) {
        output += " * Contact information:\n";
        if (swagger.info.contact.name) {
            output += " * " + swagger.info.contact.name + "\n";
        }
        if (swagger.info.contact.url) {
            output += " * " + swagger.info.contact.url + "\n";
        }
        if (swagger.info.contact.email) {
            output += " * " + swagger.info.contact.email + "\n";
        }
        output += " *\n";
    }
    if (swagger.info.license) {
        if (swagger.info.license.url) {
            output += " * @license " + swagger.info.license.name + " (" + swagger.info.license.url + ")\n";
        }
        else {
            output += " * @license " + swagger.info.license.name + "\n";
        }
        output += " *\n";
    }
    output += " */\nexport default class Api {\n\tprivate readonly baseUrl: string;\n\tprivate readonly headers: Record<string, string>;\n\n\tpublic constructor(baseUrl: string, headers?: Record<string, string>) {\n\t\tthis.baseUrl = baseUrl;\n\t\tthis.headers = headers ? headers : {};\n\t}\n\n\tprivate formatUri(uri: string, sec: ResolvedSecurity = VoidSecurity): string {\n\t\treturn sec.updateUrl(new URL(uri, this.baseUrl).href);\n\t}\n";
    for (var _i = 0, _a = Object.entries(swagger.paths); _i < _a.length; _i++) {
        var _b = _a[_i], path = _b[0], pathValues = _b[1];
        for (var _c = 0, _d = getPathOperations(pathValues); _c < _d.length; _c++) {
            var _e = _d[_c], method = _e[0], definition = _e[1];
            output += makeOperationCode(path, method, definition, swagger, pathValues.parameters);
        }
    }
    output += '}\n';
    return output;
}
function swaggerToTS(swagger) {
    var output = '';
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
exports.default = swaggerToTS;
//# sourceMappingURL=swaggerToTs.js.map