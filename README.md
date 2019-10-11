This package allows you to generate TS API files from `openapi.json` (Swagger 3) files.

## Planned features

* Feature flags for other library support (Like Redux Saga cancellation)
* Automatic removal of code not used in the given swagger file
* Swagger 2 support
* Default swagger responses
* Optional query parameters
* Validation utilities
* Change lists that highlight the changes it made after every run (like git when pulling)


## Example:

    swagger-ts-api-gen -i examples/example.json -o src/examples-example.ts --debug client

## Input:

	{
	  "openapi": "3.0.0",
	  "info": {
		"version": "1.0.0",
		"title": "Swagger Petstore",
		"license": {
		  "name": "MIT"
		}
	  },
	  "servers": [
		{
		  "url": "http://petstore.swagger.io/v1"
		}
	  ],
	  "paths": {
		"/pets": {
		  "get": {
			"summary": "List all pets",
			"operationId": "listPets",
			"tags": [
			  "pets"
			],
			"parameters": [
			  {
				"name": "limit",
				"in": "query",
				"description": "How many items to return at one time (max 100)",
				"required": false,
				"schema": {
				  "type": "integer",
				  "format": "int32"
				}
			  }
			],
			"responses": {
			  "200": {
				"description": "A paged array of pets",
				"headers": {
				  "x-next": {
					"description": "A link to the next page of responses",
					"schema": {
					  "type": "string"
					}
				  }
				},
				"content": {
				  "application/json": {
					"schema": {
					  "$ref": "#/components/schemas/Pets"
					}
				  }
				}
			  },
			  "default": {
				"description": "unexpected error",
				"content": {
				  "application/json": {
					"schema": {
					  "$ref": "#/components/schemas/Error"
					}
				  }
				}
			  }
			}
		  },
		  "post": {
			"summary": "Create a pet",
			"operationId": "createPets",
			"tags": [
			  "pets"
			],
			"responses": {
			  "201": {
				"description": "Null response"
			  },
			  "default": {
				"description": "unexpected error",
				"content": {
				  "application/json": {
					"schema": {
					  "$ref": "#/components/schemas/Error"
					}
				  }
				}
			  }
			}
		  }
		},
		"/pets/{petId}": {
		  "get": {
			"summary": "Info for a specific pet",
			"operationId": "showPetById",
			"tags": [
			  "pets"
			],
			"parameters": [
			  {
				"name": "petId",
				"in": "path",
				"required": true,
				"description": "The id of the pet to retrieve",
				"schema": {
				  "type": "string"
				}
			  }
			],
			"responses": {
			  "200": {
				"description": "Expected response to a valid request",
				"content": {
				  "application/json": {
					"schema": {
					  "$ref": "#/components/schemas/Pet"
					}
				  }
				}
			  },
			  "default": {
				"description": "unexpected error",
				"content": {
				  "application/json": {
					"schema": {
					  "$ref": "#/components/schemas/Error"
					}
				  }
				}
			  }
			}
		  }
		}
	  },
	  "components": {
		"schemas": {
		  "Pet": {
			"type": "object",
			"required": [
			  "id",
			  "name"
			],
			"properties": {
			  "id": {
				"type": "integer",
				"format": "int64"
			  },
			  "name": {
				"type": "string"
			  },
			  "tag": {
				"type": "string"
			  }
			}
		  },
		  "Pets": {
			"type": "array",
			"items": {
			  "$ref": "#/components/schemas/Pet"
			}
		  },
		  "Error": {
			"type": "object",
			"required": [
			  "code",
			  "message"
			],
			"properties": {
			  "code": {
				"type": "integer",
				"format": "int32"
			  },
			  "message": {
				"type": "string"
			  }
			}
		  }
		}
	  }
	}

## Output:

	/* eslint-disable indent, max-len, @typescript-eslint/indent */
	// THIS IS A GENERATED FILE, DO NOT MODIFY
	// Boilerplate:

	interface CancelablePromise<T> extends Promise<T> {
		'@@redux-saga/CANCEL_PROMISE': () => void;
	}

	function makeCancelablePromise<T>(promise: Promise<T>, onCancel: () => void): CancelablePromise<T> {
		const castedPromise = promise as CancelablePromise<T>;
		castedPromise['@@redux-saga/CANCEL_PROMISE'] = onCancel;
		return castedPromise;
	}

	export class FetchResponse<S extends number, R> {
		status: S;
		result: R;
		url: Response['url'];
		type: Response['type'];
		headers: Response['headers'];
		statusText: Response['statusText'];
		redirected: Response['redirected'];
		ok: S extends 200 ? true : S extends 201 ? true : S extends 204 ? true : false;
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
		expectSuccess(): S extends 200 ? R : S extends 201 ? R : S extends 204 ? R : never {
			if (this.ok) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return this.result as any;
			}
			throw new Error('Response was not OK');
		}
		expect<E extends S>(code: E | E[]): S extends E ? R : never {
			if (Array.isArray(code) ? (code as number[]).includes(this.status) : this.status === code) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return this.result as any;
			}
			throw new Error(`Expected HTTP status code to be ${code}, but it was ${this.status}`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function toJson(response: Response): Promise<any> {
		return response.json();
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function toResponse(response: Response): Promise<Response> {
		return Promise.resolve(response);
	}

	export interface ResolvedSecurity {
		updateUrl(url: string): string,
		updateHeaders(headers: Record<string, string>): Record<string, string>
	}
	export interface Security<N extends string, S extends string> extends ResolvedSecurity {
		readonly name: N,
		readonly scope: S[],
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	class HttpAuthentication<N extends string> implements Security<N, never> {
		public readonly name: N;
		public readonly scope: never[] = [];
		public readonly token: string;
		public readonly schema: string;
		constructor(name: N, token: string, schema: string) {
			this.name = name
			this.token = token;
			this.schema = schema;
		}
		updateUrl(url: string): string {
			return url;
		}
		updateHeaders(headers: Record<string, string>): Record<string, string> {
			return {
				...headers,
				'Authentication': `${this.schema} ${this.token}`,
			}
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	class ApiKeyAuthentication<N extends string> implements Security<N, never> {
		public readonly name: N;
		public readonly scope: never[] = [];
		public readonly token: string;
		public readonly key: string;
		public readonly in: 'query' | 'header' | 'cookie';
		constructor(name: N, inType: 'query' | 'header' | 'cookie', key: string, token: string) {
			this.name = name
			this.token = token;
			this.in = inType;
			this.key = key;
		}
		updateUrl(url: string): string {
			if (this.in === 'query') {
				const arg = `${encodeURIComponent(this.key)}=${encodeURIComponent(this.token)}`
				if (url.includes('?')) {
					return `${url}&${arg}`;
				} else {
					return `${url}?${arg}`;
				}
			}
			return url;
		}
		updateHeaders(headers: Record<string, string>): Record<string, string> {
			if (this.in === 'header') {
				return {
					...headers,
					[this.key]: this.token,
				}
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
		}
	}

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
				updateHeaders(headers) {
					for (const security of array) {
						headers = security.updateHeaders(headers);
					}
					return headers;
				}
			};
		}
	}

	type ObjectValues<O> = O[keyof O];
	type Unpromisify<F extends (...args: any[]) => Promise<any>> = F extends (...args: []) => Promise<infer R> ? R : never;
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
				throw new Error(`Undocumented HTTP status code: ${status}`);
			}
			return parser(response).then((decoded): ResponseMapToReturnType<R> => {
				const result = new FetchResponse(response, decoded, status);
				return result as unknown as ResponseMapToReturnType<R>;
			});
		}), (): void => controller.abort());
	}

	interface Options {
		cache?: Request['cache'];
		headers?: Record<string, string>;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function objectToQueryString(input: Record<string, string | number | null | undefined>): string {
		const entries = Object.entries(input).filter((entry): entry is [string, string | number] => entry[1] !== null && entry[1] !== undefined);
		if (entries.length === 0) {
			return '';
		}
		return `?${entries
			.map(([key, value]): string => `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`).join()}`;
	}

	// Types:
	// DEFINITION: ApiPet
	export interface ApiPet {
		/**
		 * This number should have no decimals
		 * This should be in the following format: int64
		 */
		id: number;
		name: string;
		tag: string | null;
	}
	// DEFINITION: ApiPets
	export type ApiPets = ApiPet[]
	// DEFINITION: ApiError
	export interface ApiError {
		/**
		 * This number should have no decimals
		 * This should be in the following format: int32
		 */
		code: number;
		message: string;
	}
	// ApiSecurity:
	export const SecurityProviders = {
	}

	// API:
	/**
	 * Swagger Petstore v1.0.0
	 * 
	 * undefined
	 * @license MIT
	 *
	 */
	export default class Api {
		private readonly baseUrl: string;
		private readonly headers: Record<string, string>;

		public constructor(baseUrl: string, headers?: Record<string, string>) {
			this.baseUrl = baseUrl;
			this.headers = headers ? headers : {};
		}

		private formatUri(uri: string, sec: ResolvedSecurity = VoidSecurity): string {
			return sec.updateUrl(new URL(uri, this.baseUrl).href);
		}
		// OPERATION: /pets:get
		/**
		 * List all pets
		 *
		 * @return The response to the request:
		 *     200 A paged array of pets
		 */
		public petList(query: {limit?: number}, options: Options = {}): Promise<
			FetchResponse<200, ApiPets>
		> {
			return apiRequest(new Request(this.formatUri(`/pets${objectToQueryString(query)}`), {
				headers: {
					...this.headers,
					...options.headers,
				},
				cache: options.cache,
				method: 'get',
			}), {
				200: toJson,
			});
		}

		// OPERATION: /pets:post
		/**
		 * Create a pet
		 *
		 * @return The response to the request:
		 *     201 Null response
		 */
		public petCreate(options: Options = {}): Promise<
			FetchResponse<201, Response>
		> {
			return apiRequest(new Request(this.formatUri('/pets'), {
				headers: {
					...this.headers,
					...options.headers,
				},
				cache: options.cache,
				method: 'post',
			}), {
				201: toResponse,
			});
		}

		// OPERATION: /pets/{petId}:get
		/**
		 * Info for a specific pet
		 *
		 * @return The response to the request:
		 *     200 Expected response to a valid request
		 */
		public petShowById(petId: string, options: Options = {}): Promise<
			FetchResponse<200, ApiPet>
		> {
			return apiRequest(new Request(this.formatUri(`/pets/${petId}`), {
				headers: {
					...this.headers,
					...options.headers,
				},
				cache: options.cache,
				method: 'get',
			}), {
				200: toJson,
			});
		}

	}
	// THIS IS A GENERATED FILE, DO NOT MODIFY

## Consumation example

    const api = new Api('http://localhost');

    async function loadPet(petId: string) {
        const result = await api.petShowById(petId); // Function arguments are automatically calculated
		const response = result.expect(200); // 200 is type checked here
		console.log('Pet name: ' + response.name);
    }
