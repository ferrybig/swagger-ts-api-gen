// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = NonNullable<any>;
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * This is the root document object of the OpenAPI document.
 */
export default interface OpenApi {
	/**
	 * This string MUST be the semantic version number of the OpenAPI Specification version that the OpenAPI document
	 * uses. The openapi field SHOULD be used by tooling specifications and clients to interpret the OpenAPI document.
	 * This is not related to the API info.version string.
	 */
	openapi: string;
	/**
	 * Provides metadata about the API. The metadata MAY be used by tooling as required.
	 */
	info: Info;
	/**
	 * An array of Server Objects, which provide connectivity information to a target server. If the servers property
	 * is not provided, or is an empty array, the default value would be a Server Object with a url value of /.
	 */
	servers?: Server[];
	/**
	 * The available paths and operations for the API.
	 */
	paths: Paths;
	/**
	 * An element to hold various schemas for the specification.
	 */
	components?: Component;
	/**
	 * A declaration of which security mechanisms can be used across the API. The list of values includes alternative
	 * security requirement objects that can be used. Only one of the security requirement objects need to be satisfied
	 * to authorize a request. Individual operations can override this definition.
	 */
	security?: SecurityRequirement[];
	/**
	 * A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect
	 * on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The
	 * tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list
	 * MUST be unique.
	 */
	tags?: Tag[];
	/**
	 * Additional external documentation.
	 */
	externalDocs?: ExternalDoc;
}
/**
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented
 * in editing or documentation generation tools for convenience.
 */
export interface Info {
	/**
	 * The title of the application.
	 */
	title: string;
	/**
	 * A short description of the application. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
	/**
	 * A URL to the Terms of Service for the API. MUST be in the format of a URL.
	 */
	termsOfService?: string;
	/**
	 * The contact information for the exposed API.
	 */
	contact?: Contact;
	/**
	 * The license information for the exposed API.
	 */
	license?: License;
	/**
	 * The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API
	 * implementation version).
	 */
	version: string;
}
/**
 * Contact information for the exposed API.
 */
export interface Contact {
	/**
	 * The identifying name of the contact person/organization.
	 */
	name?: string;
	/**
	 * The URL pointing to the contact information. MUST be in the format of a URL.
	 */
	url?: string;
	/**
	 * The email address of the contact person/organization. MUST be in the format of an email address.
	 */
	email?: string;
}
/**
 * License information for the exposed API.
 */
export interface License {
	/**
	 * The license name used for the API.
	 */
	name: string;
	/**
	 * A URL to the license used for the API. MUST be in the format of a URL.
	 */
	url?: string;
}
/**
 * An object representing a Server.
 */
export interface Server {
	/**
	 * A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host
	 * location is relative to the location where the OpenAPI document is being served. Variable substitutions will be
	 * made when a variable is named in {brackets}.
	 */
	url: string;
	/**
	 * An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text
	 * representation.
	 */
	description?: string;
	/**
	 * A map between a variable name and its value. The value is used for substitution in the server's URL template.
	 */
	variables?: Record<string, ServerVariable>;
}
/**
 * An object representing a Server Variable for server URL template substitution.
 */
export interface ServerVariable {
	/**
	 * An enumeration of string values to be used if the substitution options are from a limited set.
	 */
	enum?: string[];
	/**
	 * The default value to use for substitution, which SHALL be sent if an alternate value is not supplied. Note this
	 * behavior is different than the Schema Object's treatment of default values, because in those cases parameter
	 * values are optional.
	 */
	default: string;
	/**
	 * An optional description for the server variable. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
}
/**
 * Holds a set of reusable objects for different aspects of the OAS. All objects defined within the components object
 * will have no effect on the API unless they are explicitly referenced from properties outside the components object.
 */
export interface Component {
	schemas?: Record<string, Schema>;
	responses?: Record<string, MediaType>;
	parameters?: Record<string, Parameter>;
	examples?: Record<string, Example>;
	requestBodies?: Record<string, RequestBody>;
	securitySchemes?: Record<string, Security>;
	links?: Record<string, Link>;
	callbacks?: Record<string, Callback>;
}
/**
 * Holds the relative paths to the individual endpoints and their operations. The path is appended to the URL from the
 * Server Object in order to construct the full URL. The Paths MAY be empty, due to ACL constraints.
 */
export interface Paths {
	/**
	 * A relative path to an individual endpoint. The field name MUST begin with a slash. The path is appended (no
	 * relative URL resolution) to the expanded URL from the Server Object's url field in order to construct the full
	 * URL. Path templating is allowed. When matching URLs, concrete (non-templated) paths would be matched before
	 * their templated counterparts. Templated paths with the same hierarchy but different templated names MUST NOT
	 * exist as they are identical. In case of ambiguous matching, it's up to the tooling to decide which one to use.
	 */
	[path: string]: PathItem;
}
/**
 * Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path
 * itself is still exposed to the documentation viewer but they will not know which operations and parameters are
 * available.
 */
export interface PathItem {
	/**
	 * An optional, string summary, intended to apply to all operations in this path.
	 */
	summary?: string;
	/**
	 * An optional, string description, intended to apply to all operations in this path. CommonMark syntax MAY be used
	 * for rich text representation.
	 */
	description?: string;
	options?: Operation;
	get?: Operation;
	post?: Operation;
	put?: Operation;
	patch?: Operation;
	delete?: Operation;
	trace?: Operation;
	head?: Operation;
	/**
	 * An alternative server array to service all operations in this path.
	 */
	servers?: Server[];
	/**
	 * A list of parameters that are applicable for all the operations described under this path. These parameters can
	 * be overridden at the operation level, but cannot be removed there. The list MUST NOT include duplicated
	 * parameters. A unique parameter is defined by a combination of a name and location. The list can use the
	 * Reference Object to link to parameters that are defined at the OpenAPI Object's components/parameters.
	 */
	parameters?: (Parameter | Ref)[];
}
/**
 * Describes a single API operation on a path.
 */
export interface Operation {
	/**
	 * A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources
	 * or any other qualifier.
	 */
	tags?: string[];
	/**
	 * A short summary of what the operation does.
	 */
	summary?: string;
	/**
	 * A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
	/**
	 * Additional external documentation for this operation.
	 */
	externalDocs?: ExternalDoc;
	/**
	 * Unique string used to identify the operation. The id MUST be unique among all operations described in the API.
	 * The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an
	 * operation, therefore, it is RECOMMENDED to follow common programming naming conventions.
	 */
	operationId?: string;
	/**
	 * A list of parameters that are applicable for this operation. If a parameter is already defined at the Path Item,
	 * the new definition will override it but can never remove it. The list MUST NOT include duplicated parameters. A
	 * unique parameter is defined by a combination of a name and location. The list can use the Reference Object to
	 * link to parameters that are defined at the OpenAPI Object's components/parameters.
	 */
	parameters?: (Parameter | Ref)[];
	/**
	 * The request body applicable for this operation. The requestBody is only supported in HTTP methods where the HTTP
	 * 1.1 specification RFC7231 has explicitly defined semantics for request bodies. In other cases where the HTTP
	 * spec is vague, requestBody SHALL be ignored by consumers.
	 */
	requestBody?: RequestBody | Ref;
	/**
	 * The list of possible responses as they are returned from executing this operation.
	 */
	responses: Responses;
	/**
	 * A map of possible out-of band callbacks related to the parent operation. The key is a unique identifier for the
	 * Callback Object. Each value in the map is a Callback Object that describes a request that may be initiated by
	 * the API provider and the expected responses. The key value used to identify the callback object is an
	 * expression, evaluated at runtime, that identifies a URL to use for the callback operation.
	 */
	callbacks?: Record<string, Callback | Ref>;
	/**
	 * Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default
	 * value is false.
	 */
	deprecated?: boolean;
	/**
	 * A declaration of which security mechanisms can be used for this operation. The list of values includes
	 * alternative security requirement objects that can be used. Only one of the security requirement objects need to
	 * be satisfied to authorize a request. This definition overrides any declared top-level security. To remove a
	 * top-level security declaration, an empty array can be used.
	 */
	security?: SecurityRequirement[];
	/**
	 * An alternative server array to service this operation. If an alternative server object is specified at the Path
	 * Item Object or Root level, it will be overridden by this value.
	 */
	servers?: Server[];
}
/**
 * Allows referencing an external resource for extended documentation.
 */
export interface ExternalDoc {
	/**
	 * A short description of the target documentation. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
	/**
	 * The URL for the target documentation. Value MUST be in the format of a URL.
	 */
	url: string;
}
/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 */
export interface AbstractParameter {
	/**
	 * The name of the parameter. Parameter names are case sensitive.
	 *
     * If in is "path", the name field MUST correspond to the associated path segment from the path field in the Paths
	 * Object. See Path Templating for further information.
	 *
     * If in is "header" and the name field is "Accept", "Content-Type" or "Authorization", the parameter definition
	 * SHALL be ignored.
	 *
     * For all other cases, the name corresponds to the parameter name used by the in property.
	 */
	name: string;
	/**
	 * The location of the parameter. Possible values are "query", "header", "path" or "cookie".
	 */
	in: 'path' | 'query' | 'header' | 'cookie';
	/**
	 * A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich
	 * text representation.
	 */
	description?: string;
	/**
	 * Determines whether this parameter is mandatory. If the parameter location is "path", this property is REQUIRED
	 * and its value MUST be true. Otherwise, the property MAY be included and its default value is false.
	 */
	required?: boolean;
	/**
	 * Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.
	 */
	deprecated?: boolean;
	/**
	 * Sets the ability to pass empty-valued parameters. This is valid only for query parameters and allows sending a
	 * parameter with an empty value. Default value is false. If style is used, and if behavior is n/a (cannot be
	 * serialized), the value of allowEmptyValue SHALL be ignored. Use of this property is NOT RECOMMENDED, as it is
	 * likely to be removed in a later revision.
	 */
	allowEmptyValue?: boolean;
}
export interface SchemaParameter extends AbstractParameter {
	/**
	 * The schema defining the type used for the parameter.
	 */
	schema: Schema | Ref;
	/**
	 * Describes how the parameter value will be serialized depending on the type of the parameter value. Default
	 * values (based on value of in): for query - form; for path - simple; for header - simple; for cookie - form.
	 */
	style?: SchemaParamterStyle;
	/**
	 *  When this is true, parameter values of type array or object generate separate parameters for each value of the
	 *  array or key-value pair of the map. For other types of parameters this property has no effect. When style is
	 *  form, the default value is true. For all other styles, the default value is false.
	 */
	explode?: boolean;
	/**
	 * Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986
	 * :/?#[]@!$&'()*+,;= to be included without percent-encoding. This property only applies to parameters with an
	 * in value of query. The default value is false.
	 */
	allowReserved?: boolean;
	/**
	 * Example of the media type. The example SHOULD match the specified schema and encoding properties if present. The
	 * example field is mutually exclusive of the examples field. Furthermore, if referencing a schema which contains
	 * an example, the example value SHALL override the example provided by the schema. To represent examples of media
	 * types that cannot naturally be represented in JSON or YAML, a string value can contain the example with escaping
	 * where necessary.
	 */
	example?: Any;
	/**
	 * Examples of the media type. Each example SHOULD contain a value in the correct format as specified in the
	 * parameter encoding. The examples field is mutually exclusive of the example field. Furthermore, if referencing
	 * a schema which contains an example, the examples value SHALL override the example provided by the schema.
	 */
	examples?: Record<string, Example | Ref>;
}
export interface ContentParameter extends AbstractParameter {
	/**
	 * A map containing the representations for the parameter. The key is the media type and the value describes it.
	 * The map MUST only contain one entry.
	 */
	content: Record<string, MediaType>;
}

export type SchemaParamterStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' |
'deepObject'

export type Parameter = SchemaParameter | ContentParameter;

export interface RequestBody {
	content: Record<string, MediaType>;
	description?: string;
	required?: boolean;
}

export interface MediaType {
	/**
	 * The schema defining the content of the request, response, or parameter.
	 */
	schema: Schema | Ref;
	/**
	 * Example of the media type. The example object SHOULD be in the correct format as specified by the media type.
	 * The example field is mutually exclusive of the examples field. Furthermore, if referencing a schema which
	 * contains an example, the example value SHALL override the example provided by the schema.
	 */
	example?: Any;
	/**
	 * Examples of the media type. Each example object SHOULD match the media type and specified schema if present. The
	 * examples field is mutually exclusive of the example field. Furthermore, if referencing a schema which contains
	 * an example, the examples value SHALL override the example provided by the schema.
	 */
	examples?: Record<string, Example | Ref>;
	/**
	 * A map between a property name and its encoding information. The key, being the property name, MUST exist in the
	 * schema as a property. The encoding object SHALL only apply to requestBody objects when the media type is
	 * multipart or application/x-www-form-urlencoded.
	 */
	encoding?: Record<string, Encoding>;
}

export interface Encoding {
	/**
	 * The Content-Type for encoding a specific property. Default value depends on the property type: for string with
	 * format being binary – application/octet-stream; for other primitive types – text/plain; for object -
	 * application/json; for array – the default is defined based on the inner type. The value can be a specific media
	 * type (e.g. application/json), a wildcard media type (e.g. image/*), or a comma-separated list of the two types.
	 */
	contentType?: string;
	/**
	 * A map allowing additional information to be provided as headers, for example Content-Disposition. Content-Type
	 * is described separately and SHALL be ignored in this section. This property SHALL be ignored if the request body
	 * media type is not a multipart.
	 */
	headers?: Record<string, Ref | Header>;
	/**
	 * Describes how a specific property value will be serialized depending on its type. See Parameter Object for
	 * details on the style property. The behavior follows the same values as query parameters, including default
	 * values. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded.
	 */
	style?: SchemaParamterStyle;
	/**
	 * When this is true, property values of type array or object generate separate parameters for each value of the
	 * array, or key-value-pair of the map. For other types of properties this property has no effect. When style is
	 * form, the default value is true. For all other styles, the default value is false. This property SHALL be
	 * ignored if the request body media type is not application/x-www-form-urlencoded.
	 */
	explode?: boolean;
	/**
	 * Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986
	 * :/?#[]@!$&'()*+,;= to be included without percent-encoding. The default value is false. This property SHALL be
	 * ignored if the request body media type is not application/x-www-form-urlencoded.
	 */
	allowReserved?: boolean;
}

export interface Responses {
	/**
	 * The documentation of responses other than the ones declared for specific HTTP response codes. Use this field to
	 * cover undeclared responses. A Reference Object can link to a response that the OpenAPI Object's
	 * components/responses section defines.
	 */
	default: Response | Ref;
	/**
	 * Any HTTP status code can be used as the property name, but only one property per code, to describe the expected
	 * response for that HTTP status code. A Reference Object can link to a response that is defined in the OpenAPI
	 * Object's components/responses section. This field MUST be enclosed in quotation marks (for example, "200") for
	 * compatibility between JSON and YAML. To define a range of response codes, this field MAY contain the uppercase
	 * wildcard character X. For example, 2XX represents all response codes between [200-299]. Only the following range
	 * definitions are allowed: 1XX, 2XX, 3XX, 4XX, and 5XX. If a response is defined using an explicit code, the
	 * explicit code definition takes precedence over the range definition for that code.
	 */
	[key: number]: Response | Ref;
}

export interface Response {
	/**
	 * A short description of the response. CommonMark syntax MAY be used for rich text representation.
	 */
	description: string;
	/**
	 * Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is
	 * defined with the name "Content-Type", it SHALL be ignored.
	 */
	headers?: Record<string, Header | Ref>;
	/**
	 * A map containing descriptions of potential response payloads. The key is a media type or media type range and
	 * the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g.
	 * text/plain overrides text/*
	 */
	content?: Record<string, MediaType>;
	/**
	 * A map of operations links that can be followed from the response. The key of the map is a short name for the
	 * link, following the naming constraints of the names for Component Objects.
	 */
	links?: Record<string, Link | Ref>;
}

export interface Callback {
	/**
	 * A Path Item Object used to define a callback request and expected responses. A complete example is available.
	 * (https://github.com/OAI/OpenAPI-Specification/blob/master/examples/v3.0/callback-example.yaml)
	 */
	[expression: string]: Operation;
}

export interface Example {
	/**
	 * Short description for the example.
	 */
	summary?: string;
	/**
	 * Long description for the example. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
	/**
	 * Embedded literal example. The value field and externalValue field are mutually exclusive. To represent examples
	 * of media types that cannot naturally represented in JSON or YAML, use a string value to contain the example,
	 * escaping where necessary.
	 */
	value?: Any;
	/**
	 * A URL that points to the literal example. This provides the capability to reference examples that cannot easily
	 * be included in JSON or YAML documents. The value field and externalValue field are mutually exclusive.
	 */
	externalValue?: string;
}

/**
 * The Link object represents a possible design-time link for a response. The presence of a link does not guarantee the
 * caller's ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between
 * responses and other operations.
 *
 * Unlike dynamic links (i.e. links provided in the response payload), the OAS linking mechanism does not require link
 * information in the runtime response.
 *
 * For computing links, and providing instructions to execute them, a runtime expression is used for accessing values
 * in an operation and using them as parameters while invoking the linked operation.
 */
export interface Link {
	/**
	 * A relative or absolute reference to an OAS operation. This field is mutually exclusive of the operationId field,
	 * and MUST point to an Operation Object. Relative operationRef values MAY be used to locate an existing Operation
	 * Object in the OpenAPI definition.
	 */
	operationRef?: string;
	/**
	 * The name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually
	 * exclusive of the operationRef field.
	 */
	operationId?: string;
	/**
	 * A map representing parameters to pass to an operation as specified with operationId or identified via
	 * operationRef. The key is the parameter name to be used, whereas the value can be a constant or an expression to
	 * be evaluated and passed to the linked operation. The parameter name can be qualified using the parameter
	 * location [{in}.]{name} for operations that use the same parameter name in different locations (e.g. path.id).
	 */
	parameters?: Record<string, Any>;
	/**
	 * A literal value or {expression} to use as a request body when calling the target operation.
	 */
	requestBody?: Any;
	/**
	 * A description of the link. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
	/**
	 * A server object to be used by the target operation.
	 */
	server?: Server;
}

// TODO: Use Omit to remove `in` and `name` from Parameter
export type Header = Omit<SchemaParameter, 'in' | 'name'> | Omit<ContentParameter, 'in' | 'name'>;

/**
 * Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag
 * defined in the Operation Object instances.
 */
export interface Tag {
	/**
	 * The name of the tag.
	 */
	name: string;
	/**
	 * A short description for the tag. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
	/**
	 * Additional external documentation for this tag.
	 */
	externalDocs?: ExternalDoc;
}

/**
 * A simple object to allow referencing other components in the specification, internally and externally.
 *
 * The Reference Object is defined by JSON Reference and follows the same structure, behavior and rules.
 *
 * For this specification, reference resolution is accomplished as defined by the JSON Reference specification and not
 * by the JSON Schema specification.
 */
export interface Ref {
	/**
	 * The reference string.
	 */
	$ref: string;
}

export interface BasicSchema {
	/**
	 * Allows sending a null value for the defined schema. Default value is false.
	 */
	nullable?: boolean;
	/**
	 * Adds support for polymorphism. The discriminator is an object name that is used to differentiate between other
	 * schemas which may satisfy the payload description. See Composition and Inheritance for more details.
	 */
	discriminator?: Discriminator;
	/**
	 *  Relevant only for Schema "properties" definitions. Declares the property as "read only". This means that it MAY
	 *  be sent as part of a response but SHOULD NOT be sent as part of the request. If the property is marked as
	 *  readOnly being true and is in the required list, the required will take effect on the response only. A property
	 *  MUST NOT be marked as both readOnly and writeOnly being true. Default value is false.
	 */
	readOnly?: boolean;
	/**
	 * Relevant only for Schema "properties" definitions. Declares the property as "write only". Therefore, it MAY be
	 * sent as part of a request but SHOULD NOT be sent as part of the response. If the property is marked as writeOnly
	 * being true and is in the required list, the required will take effect on the request only. A property MUST NOT
	 * be marked as both readOnly and writeOnly being true. Default value is false.
	 */
	writeOnly?: boolean;
	description?: string;
	/**
	 * This MAY be used only on properties schemas. It has no effect on root schemas. Adds additional metadata to
	 * describe the XML representation of this property.
	 */
	xml?: XML;
	/**
	 * Additional external documentation for this schema.
	 */
	externalDocs?: ExternalDoc;
	/**
	 * A free-form property to include an example of an instance for this schema. To represent examples that cannot be
	 * naturally represented in JSON or YAML, a string value can be used to contain the example with escaping where
	 * necessary.
	 */
	example?: Any;
	/**
	 * Specifies that a schema is deprecated and SHOULD be transitioned out of usage. Default value is false.
	 */
	deprecated?: boolean;
}

export interface ArraySchema extends BasicSchema {
	type: 'array';
	items: (Schema | Ref);
	minItems?: number;
	maxItems?: number;
	uniqueItems?: boolean;
}

export interface ObjectSchema extends BasicSchema {
	type: 'object';
	required?: string[];
	properties: Record<string, (Schema | Ref)>;
	minProperties?: number;
	maxProperties?: number;
	additionalProperties?: true | (Schema | Ref);
}

export interface StringSchema extends BasicSchema {
	type: 'string';
	format?: 'date' | 'date-time' | 'password' | 'byte' | 'binary' | 'email' | 'uuid' | 'uri' | 'hostname' |
	'ipv4' | 'ipv6' | 'ip' | 'jwt';
	enum?: string[];
	minLength?: number;
	maxLength?: number;
	pattern?: string;
}
export interface DecimalSchema extends BasicSchema {
	minimum?: number;
	exclusiveMinimum?: boolean;
	maximum?: number;
	exclusiveMaximum?: boolean;
	multipleOf?: number;
}

export interface NumberSchema extends DecimalSchema {
	type: 'number';
	format?: 'float' | 'double';
}

export interface IntegerSchema extends DecimalSchema {
	type: 'integer';
	format?: 'int32' | 'int64';
}

export interface BooleanSchema extends BasicSchema {
	type: 'boolean';
}

export interface NullableSchema extends BasicSchema {
	nullable: true;
}

export interface OneOfSchema {
	oneOf: (Schema | Ref)[];
}

export interface AnyOfSchema {
	anyOf: (Schema | Ref)[];
}

export interface AllOfSchema {
	allOf: (Schema | Ref)[];
}

export type Schema = ArraySchema | ObjectSchema | StringSchema | NumberSchema | IntegerSchema |
BooleanSchema | OneOfSchema | AnyOfSchema | AllOfSchema | NullableSchema;

/**
 * When request bodies or response payloads may be one of a number of different schemas, a discriminator object can be
 * used to aid in serialization, deserialization, and validation. The discriminator is a specific object in a schema
 * which is used to inform the consumer of the specification of an alternative schema based on the value associated
 * with it.
 */
export interface Discriminator {
	/**
	 * The name of the property in the payload that will hold the discriminator value.
	 */
	propertyName: string;
	/**
	 * An object to hold mappings between payload values and schema names or references.
	 */
	mapping: Record<string, string>;
}

/**
 * A metadata object that allows for more fine-tuned XML model definitions.
 *
 * When using arrays, XML element names are not inferred (for singular/plural forms) and the name property SHOULD be
 * used to add that information. See examples for expected behavior.
 */
export interface XML {
	/**
	 * Replaces the name of the element/attribute used for the described schema property. When defined within items,
	 * it will affect the name of the individual XML elements within the list. When defined alongside type being array
	 * (outside the items), it will affect the wrapping element and only if wrapped is true. If wrapped is false,
	 * it will be ignored.
	 */
	name?: string;
	/**
	 * The URI of the namespace definition. Value MUST be in the form of an absolute URI.
	 */
	namespace?: string;
	/**
	 * The prefix to be used for the name.
	 */
	prefix?: string;
	/**
	 * Declares whether the property definition translates to an attribute instead of an element. Default value is
	 * false.
	 */
	attribute?: boolean;
	/**
	 * MAY be used only for an array definition. Signifies whether the array is wrapped (for example,
	 * <books><book/><book/></books>) or unwrapped (<book/><book/>). Default value is false. The definition takes
	 * effect only when defined alongside type being array (outside the items).
	 */
	wrapped?: boolean;

}

export interface BaseSecurity {
	/**
	 * A short description for security scheme. CommonMark syntax MAY be used for rich text representation.
	 */
	description?: string;
}

export interface ApiKeySecurity extends BaseSecurity {
	/**
	 * The type of the security scheme.
	 */
	type: 'apiKey';
	/**
	 * The name of the header, query or cookie parameter to be used.
	 */
	name: string;
	/**
	 * The location of the API key
	 */
	in: 'query' | 'header' | 'cookie';
}

export interface HttpSecurity extends BaseSecurity {
	/**
	 * The type of the security scheme.
	 */
	type: 'http';
	/**
	 * The name of the HTTP Authorization scheme to be used in the Authorization header as defined in RFC7235.
	 */
	scheme: string;
	/**
	 * A hint to the client to identify how the bearer token is formatted. Bearer tokens are usually generated by an
	 * authorization server, so this information is primarily for documentation purposes.
	 */
	bearerFormat?: string;
}

export interface Oauth2Security extends BaseSecurity {
	/**
	 * The type of the security scheme.
	 */
	type: 'oauth2';
	/**
	 * An object containing configuration information for the flow types supported.
	 */
	flows: OauthFlows;
}
export interface OpenIdConnectSecurity extends BaseSecurity {
	/**
	 * The type of the security scheme.
	 */
	type: 'openIdConnect';
	/**
	 * An object containing configuration information for the flow types supported.
	 */
	openIdConnectUrl: string;
}

/**
 * Defines a security scheme that can be used by the operations. Supported schemes are HTTP authentication, an API key
 * (either as a header, a cookie parameter or as a query parameter), OAuth2's common flows (implicit, password,
 * application and access code) as defined in RFC6749, and OpenID Connect Discovery.
 */
export type Security = ApiKeySecurity | HttpSecurity | Oauth2Security | OpenIdConnectSecurity;

/**
 * Allows configuration of the supported OAuth Flows.
 */
export interface OauthFlows {
	/**
	 * Configuration for the OAuth Implicit flow
	 */
	implicit?: Omit<OauthFlow, 'tokenUrl'>;
	/**
	 * Configuration for the OAuth Resource Owner Password flow
	 */
	 password?: Omit<OauthFlow, 'authorizationUrl'>;
	/**
	 * Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0.
	 */
	clientCredentials?: Omit<OauthFlow, 'authorizationUrl'>;
	/**
	 * Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0.
	 */
	authorizationCode?: OauthFlow;
}
export interface OauthFlow {
	 /**
	  * The authorization URL to be used for this flow. This MUST be in the form of a URL.
	  */
	 authorizationUrl: string;
	 /**
	  * The token URL to be used for this flow. This MUST be in the form of a URL.
	  */
	 tokenUrl: string;
	 /**
	  * The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL.
	  */
	 refreshUrl?: string;
	 /**
	  * The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for
	  * it.
	  */
	 scopes: Record<string, string>;
}

/**
  * Lists the required security schemes to execute this operation. The name used for each property MUST correspond to a
  * security scheme declared in the Security Schemas under the Components Object.
  *
  * Security Requirement Objects that contain multiple schemes require that all schemes MUST be satisfied for a request
  * to be authorized. This enables support for scenarios where multiple query parameters or HTTP headers are required
  * to convey security information.
  *
  * When a list of Security Requirement Objects is defined on the OpenAPI Object or Operation Object, only one of the
  * Security Requirement Objects in the list needs to be satisfied to authorize the request.
  */
export interface SecurityRequirement {
	 /**
	  * Each name MUST correspond to a security scheme which is declared in the Security Schemas under the Components
	  * Object. If the security scheme is of type "oauth2" or "openIdConnect", then the value is a list of scope names
	  * required for the execution. For other security scheme types, the array MUST be empty.
	  */
	 [key: string]: string[];
}
