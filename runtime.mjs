import { createRequire } from "node:module";
import { existsSync, promises } from "fs";
import { ReadableStream as ReadableStream$1 } from "node:stream/web";
import { PassThrough, Readable, pipeline } from "node:stream";
import * as fs$1 from "node:fs/promises";
import fs, { open, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util$7;
(function(util) {
	util.assertEqual = (_) => {};
	function assertIs(_arg) {}
	util.assertIs = assertIs;
	function assertNever(_x) {
		throw new Error();
	}
	util.assertNever = assertNever;
	util.arrayToEnum = (items) => {
		const obj = {};
		for (const item of items) obj[item] = item;
		return obj;
	};
	util.getValidEnumValues = (obj) => {
		const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
		const filtered = {};
		for (const k of validKeys) filtered[k] = obj[k];
		return util.objectValues(filtered);
	};
	util.objectValues = (obj) => {
		return util.objectKeys(obj).map(function(e) {
			return obj[e];
		});
	};
	util.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
		const keys = [];
		for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
		return keys;
	};
	util.find = (arr, checker) => {
		for (const item of arr) if (checker(item)) return item;
	};
	util.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
	function joinValues(array, separator = " | ") {
		return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
	}
	util.joinValues = joinValues;
	util.jsonStringifyReplacer = (_, value) => {
		if (typeof value === "bigint") return value.toString();
		return value;
	};
})(util$7 || (util$7 = {}));
var objectUtil;
(function(objectUtil) {
	objectUtil.mergeShapes = (first, second) => {
		return {
			...first,
			...second
		};
	};
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util$7.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]);
const getParsedType = (data) => {
	switch (typeof data) {
		case "undefined": return ZodParsedType.undefined;
		case "string": return ZodParsedType.string;
		case "number": return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
		case "boolean": return ZodParsedType.boolean;
		case "function": return ZodParsedType.function;
		case "bigint": return ZodParsedType.bigint;
		case "symbol": return ZodParsedType.symbol;
		case "object":
			if (Array.isArray(data)) return ZodParsedType.array;
			if (data === null) return ZodParsedType.null;
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return ZodParsedType.promise;
			if (typeof Map !== "undefined" && data instanceof Map) return ZodParsedType.map;
			if (typeof Set !== "undefined" && data instanceof Set) return ZodParsedType.set;
			if (typeof Date !== "undefined" && data instanceof Date) return ZodParsedType.date;
			return ZodParsedType.object;
		default: return ZodParsedType.unknown;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
const ZodIssueCode = util$7.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]);
var ZodError = class ZodError extends Error {
	get errors() {
		return this.issues;
	}
	constructor(issues) {
		super();
		this.issues = [];
		this.addIssue = (sub) => {
			this.issues = [...this.issues, sub];
		};
		this.addIssues = (subs = []) => {
			this.issues = [...this.issues, ...subs];
		};
		const actualProto = new.target.prototype;
		if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
		else this.__proto__ = actualProto;
		this.name = "ZodError";
		this.issues = issues;
	}
	format(_mapper) {
		const mapper = _mapper || function(issue) {
			return issue.message;
		};
		const fieldErrors = { _errors: [] };
		const processError = (error) => {
			for (const issue of error.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
			else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
			else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
			else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < issue.path.length) {
					const el = issue.path[i];
					if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
					else {
						curr[el] = curr[el] || { _errors: [] };
						curr[el]._errors.push(mapper(issue));
					}
					curr = curr[el];
					i++;
				}
			}
		};
		processError(this);
		return fieldErrors;
	}
	static assert(value) {
		if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, util$7.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(mapper = (issue) => issue.message) {
		const fieldErrors = {};
		const formErrors = [];
		for (const sub of this.issues) if (sub.path.length > 0) {
			const firstEl = sub.path[0];
			fieldErrors[firstEl] = fieldErrors[firstEl] || [];
			fieldErrors[firstEl].push(mapper(sub));
		} else formErrors.push(mapper(sub));
		return {
			formErrors,
			fieldErrors
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
ZodError.create = (issues) => {
	return new ZodError(issues);
};
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
const errorMap = (issue, _ctx) => {
	let message;
	switch (issue.code) {
		case ZodIssueCode.invalid_type:
			if (issue.received === ZodParsedType.undefined) message = "Required";
			else message = `Expected ${issue.expected}, received ${issue.received}`;
			break;
		case ZodIssueCode.invalid_literal:
			message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util$7.jsonStringifyReplacer)}`;
			break;
		case ZodIssueCode.unrecognized_keys:
			message = `Unrecognized key(s) in object: ${util$7.joinValues(issue.keys, ", ")}`;
			break;
		case ZodIssueCode.invalid_union:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_union_discriminator:
			message = `Invalid discriminator value. Expected ${util$7.joinValues(issue.options)}`;
			break;
		case ZodIssueCode.invalid_enum_value:
			message = `Invalid enum value. Expected ${util$7.joinValues(issue.options)}, received '${issue.received}'`;
			break;
		case ZodIssueCode.invalid_arguments:
			message = `Invalid function arguments`;
			break;
		case ZodIssueCode.invalid_return_type:
			message = `Invalid function return type`;
			break;
		case ZodIssueCode.invalid_date:
			message = `Invalid date`;
			break;
		case ZodIssueCode.invalid_string:
			if (typeof issue.validation === "object") if ("includes" in issue.validation) {
				message = `Invalid input: must include "${issue.validation.includes}"`;
				if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
			} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
			else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
			else util$7.assertNever(issue.validation);
			else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
			else message = "Invalid";
			break;
		case ZodIssueCode.too_small:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "bigint") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.too_big:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.custom:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_intersection_types:
			message = `Intersection results could not be merged`;
			break;
		case ZodIssueCode.not_multiple_of:
			message = `Number must be a multiple of ${issue.multipleOf}`;
			break;
		case ZodIssueCode.not_finite:
			message = "Number must be finite";
			break;
		default:
			message = _ctx.defaultError;
			util$7.assertNever(issue);
	}
	return { message };
};
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
let overrideErrorMap = errorMap;
function getErrorMap() {
	return overrideErrorMap;
}
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
const makeIssue = (params) => {
	const { data, path, errorMaps, issueData } = params;
	const fullPath = [...path, ...issueData.path || []];
	const fullIssue = {
		...issueData,
		path: fullPath
	};
	if (issueData.message !== void 0) return {
		...issueData,
		path: fullPath,
		message: issueData.message
	};
	let errorMessage = "";
	const maps = errorMaps.filter((m) => !!m).slice().reverse();
	for (const map of maps) errorMessage = map(fullIssue, {
		data,
		defaultError: errorMessage
	}).message;
	return {
		...issueData,
		path: fullPath,
		message: errorMessage
	};
};
function addIssueToContext(ctx, issueData) {
	const overrideMap = getErrorMap();
	const issue = makeIssue({
		issueData,
		data: ctx.data,
		path: ctx.path,
		errorMaps: [
			ctx.common.contextualErrorMap,
			ctx.schemaErrorMap,
			overrideMap,
			overrideMap === errorMap ? void 0 : errorMap
		].filter((x) => !!x)
	});
	ctx.common.issues.push(issue);
}
var ParseStatus = class ParseStatus {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		if (this.value === "valid") this.value = "dirty";
	}
	abort() {
		if (this.value !== "aborted") this.value = "aborted";
	}
	static mergeArray(status, results) {
		const arrayValue = [];
		for (const s of results) {
			if (s.status === "aborted") return INVALID;
			if (s.status === "dirty") status.dirty();
			arrayValue.push(s.value);
		}
		return {
			status: status.value,
			value: arrayValue
		};
	}
	static async mergeObjectAsync(status, pairs) {
		const syncPairs = [];
		for (const pair of pairs) {
			const key = await pair.key;
			const value = await pair.value;
			syncPairs.push({
				key,
				value
			});
		}
		return ParseStatus.mergeObjectSync(status, syncPairs);
	}
	static mergeObjectSync(status, pairs) {
		const finalObject = {};
		for (const pair of pairs) {
			const { key, value } = pair;
			if (key.status === "aborted") return INVALID;
			if (value.status === "aborted") return INVALID;
			if (key.status === "dirty") status.dirty();
			if (value.status === "dirty") status.dirty();
			if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
		}
		return {
			status: status.value,
			value: finalObject
		};
	}
};
const INVALID = Object.freeze({ status: "aborted" });
const DIRTY = (value) => ({
	status: "dirty",
	value
});
const OK = (value) => ({
	status: "valid",
	value
});
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil) {
	errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
	errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
	constructor(parent, value, path, key) {
		this._cachedPath = [];
		this.parent = parent;
		this.data = value;
		this._path = path;
		this._key = key;
	}
	get path() {
		if (!this._cachedPath.length) if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
		else this._cachedPath.push(...this._path, this._key);
		return this._cachedPath;
	}
};
const handleResult = (ctx, result) => {
	if (isValid(result)) return {
		success: true,
		data: result.value
	};
	else {
		if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
		return {
			success: false,
			get error() {
				if (this._error) return this._error;
				this._error = new ZodError(ctx.common.issues);
				return this._error;
			}
		};
	}
};
function processCreateParams(params) {
	if (!params) return {};
	const { errorMap, invalid_type_error, required_error, description } = params;
	if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
	if (errorMap) return {
		errorMap,
		description
	};
	const customMap = (iss, ctx) => {
		const { message } = params;
		if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
		if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
		if (iss.code !== "invalid_type") return { message: ctx.defaultError };
		return { message: message ?? invalid_type_error ?? ctx.defaultError };
	};
	return {
		errorMap: customMap,
		description
	};
}
var ZodType = class {
	get description() {
		return this._def.description;
	}
	_getType(input) {
		return getParsedType(input.data);
	}
	_getOrReturnCtx(input, ctx) {
		return ctx || {
			common: input.parent.common,
			data: input.data,
			parsedType: getParsedType(input.data),
			schemaErrorMap: this._def.errorMap,
			path: input.path,
			parent: input.parent
		};
	}
	_processInputParams(input) {
		return {
			status: new ParseStatus(),
			ctx: {
				common: input.parent.common,
				data: input.data,
				parsedType: getParsedType(input.data),
				schemaErrorMap: this._def.errorMap,
				path: input.path,
				parent: input.parent
			}
		};
	}
	_parseSync(input) {
		const result = this._parse(input);
		if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
		return result;
	}
	_parseAsync(input) {
		const result = this._parse(input);
		return Promise.resolve(result);
	}
	parse(data, params) {
		const result = this.safeParse(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	safeParse(data, params) {
		const ctx = {
			common: {
				issues: [],
				async: params?.async ?? false,
				contextualErrorMap: params?.errorMap
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		return handleResult(ctx, this._parseSync({
			data,
			path: ctx.path,
			parent: ctx
		}));
	}
	"~validate"(data) {
		const ctx = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		if (!this["~standard"].async) try {
			const result = this._parseSync({
				data,
				path: [],
				parent: ctx
			});
			return isValid(result) ? { value: result.value } : { issues: ctx.common.issues };
		} catch (err) {
			if (err?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
			ctx.common = {
				issues: [],
				async: true
			};
		}
		return this._parseAsync({
			data,
			path: [],
			parent: ctx
		}).then((result) => isValid(result) ? { value: result.value } : { issues: ctx.common.issues });
	}
	async parseAsync(data, params) {
		const result = await this.safeParseAsync(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	async safeParseAsync(data, params) {
		const ctx = {
			common: {
				issues: [],
				contextualErrorMap: params?.errorMap,
				async: true
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		const maybeAsyncResult = this._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
		return handleResult(ctx, await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult)));
	}
	refine(check, message) {
		const getIssueProperties = (val) => {
			if (typeof message === "string" || typeof message === "undefined") return { message };
			else if (typeof message === "function") return message(val);
			else return message;
		};
		return this._refinement((val, ctx) => {
			const result = check(val);
			const setError = () => ctx.addIssue({
				code: ZodIssueCode.custom,
				...getIssueProperties(val)
			});
			if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
				if (!data) {
					setError();
					return false;
				} else return true;
			});
			if (!result) {
				setError();
				return false;
			} else return true;
		});
	}
	refinement(check, refinementData) {
		return this._refinement((val, ctx) => {
			if (!check(val)) {
				ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
				return false;
			} else return true;
		});
	}
	_refinement(refinement) {
		return new ZodEffects({
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "refinement",
				refinement
			}
		});
	}
	superRefine(refinement) {
		return this._refinement(refinement);
	}
	constructor(def) {
		/** Alias of safeParseAsync */
		this.spa = this.safeParseAsync;
		this._def = def;
		this.parse = this.parse.bind(this);
		this.safeParse = this.safeParse.bind(this);
		this.parseAsync = this.parseAsync.bind(this);
		this.safeParseAsync = this.safeParseAsync.bind(this);
		this.spa = this.spa.bind(this);
		this.refine = this.refine.bind(this);
		this.refinement = this.refinement.bind(this);
		this.superRefine = this.superRefine.bind(this);
		this.optional = this.optional.bind(this);
		this.nullable = this.nullable.bind(this);
		this.nullish = this.nullish.bind(this);
		this.array = this.array.bind(this);
		this.promise = this.promise.bind(this);
		this.or = this.or.bind(this);
		this.and = this.and.bind(this);
		this.transform = this.transform.bind(this);
		this.brand = this.brand.bind(this);
		this.default = this.default.bind(this);
		this.catch = this.catch.bind(this);
		this.describe = this.describe.bind(this);
		this.pipe = this.pipe.bind(this);
		this.readonly = this.readonly.bind(this);
		this.isNullable = this.isNullable.bind(this);
		this.isOptional = this.isOptional.bind(this);
		this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (data) => this["~validate"](data)
		};
	}
	optional() {
		return ZodOptional.create(this, this._def);
	}
	nullable() {
		return ZodNullable.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return ZodArray.create(this);
	}
	promise() {
		return ZodPromise.create(this, this._def);
	}
	or(option) {
		return ZodUnion.create([this, option], this._def);
	}
	and(incoming) {
		return ZodIntersection.create(this, incoming, this._def);
	}
	transform(transform) {
		return new ZodEffects({
			...processCreateParams(this._def),
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "transform",
				transform
			}
		});
	}
	default(def) {
		const defaultValueFunc = typeof def === "function" ? def : () => def;
		return new ZodDefault({
			...processCreateParams(this._def),
			innerType: this,
			defaultValue: defaultValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodDefault
		});
	}
	brand() {
		return new ZodBranded({
			typeName: ZodFirstPartyTypeKind.ZodBranded,
			type: this,
			...processCreateParams(this._def)
		});
	}
	catch(def) {
		const catchValueFunc = typeof def === "function" ? def : () => def;
		return new ZodCatch({
			...processCreateParams(this._def),
			innerType: this,
			catchValue: catchValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodCatch
		});
	}
	describe(description) {
		const This = this.constructor;
		return new This({
			...this._def,
			description
		});
	}
	pipe(target) {
		return ZodPipeline.create(this, target);
	}
	readonly() {
		return ZodReadonly.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
};
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
	let secondsRegexSource = `[0-5]\\d`;
	if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
	else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
	const secondsQuantifier = args.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
	return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
	let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
	const opts = [];
	opts.push(args.local ? `Z?` : `Z`);
	if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
	regex = `${regex}(${opts.join("|")})`;
	return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
	if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
	return false;
}
function isValidJWT(jwt, alg) {
	if (!jwtRegex.test(jwt)) return false;
	try {
		const [header] = jwt.split(".");
		if (!header) return false;
		const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
		const decoded = JSON.parse(atob(base64));
		if (typeof decoded !== "object" || decoded === null) return false;
		if ("typ" in decoded && decoded?.typ !== "JWT") return false;
		if (!decoded.alg) return false;
		if (alg && decoded.alg !== alg) return false;
		return true;
	} catch {
		return false;
	}
}
function isValidCidr(ip, version) {
	if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) return true;
	return false;
}
var ZodString = class ZodString extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = String(input.data);
		if (this._getType(input) !== ZodParsedType.string) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.string,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.length < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.length > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "length") {
			const tooBig = input.data.length > check.value;
			const tooSmall = input.data.length < check.value;
			if (tooBig || tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				if (tooBig) addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				else if (tooSmall) addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "email") {
			if (!emailRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "email",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "emoji") {
			if (!emojiRegex) emojiRegex = new RegExp(_emojiRegex, "u");
			if (!emojiRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "emoji",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "uuid") {
			if (!uuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "uuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "nanoid") {
			if (!nanoidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "nanoid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid") {
			if (!cuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid2") {
			if (!cuid2Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid2",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ulid") {
			if (!ulidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ulid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "url") try {
			new URL(input.data);
		} catch {
			ctx = this._getOrReturnCtx(input, ctx);
			addIssueToContext(ctx, {
				validation: "url",
				code: ZodIssueCode.invalid_string,
				message: check.message
			});
			status.dirty();
		}
		else if (check.kind === "regex") {
			check.regex.lastIndex = 0;
			if (!check.regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "regex",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "trim") input.data = input.data.trim();
		else if (check.kind === "includes") {
			if (!input.data.includes(check.value, check.position)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: {
						includes: check.value,
						position: check.position
					},
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
		else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
		else if (check.kind === "startsWith") {
			if (!input.data.startsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { startsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "endsWith") {
			if (!input.data.endsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { endsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "datetime") {
			if (!datetimeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "datetime",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "date") {
			if (!dateRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "date",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "time") {
			if (!timeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "time",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "duration") {
			if (!durationRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "duration",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ip") {
			if (!isValidIP(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ip",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "jwt") {
			if (!isValidJWT(input.data, check.alg)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "jwt",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cidr") {
			if (!isValidCidr(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cidr",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64") {
			if (!base64Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64url") {
			if (!base64urlRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64url",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else util$7.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_regex(regex, validation, message) {
		return this.refinement((data) => regex.test(data), {
			validation,
			code: ZodIssueCode.invalid_string,
			...errorUtil.errToObj(message)
		});
	}
	_addCheck(check) {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	email(message) {
		return this._addCheck({
			kind: "email",
			...errorUtil.errToObj(message)
		});
	}
	url(message) {
		return this._addCheck({
			kind: "url",
			...errorUtil.errToObj(message)
		});
	}
	emoji(message) {
		return this._addCheck({
			kind: "emoji",
			...errorUtil.errToObj(message)
		});
	}
	uuid(message) {
		return this._addCheck({
			kind: "uuid",
			...errorUtil.errToObj(message)
		});
	}
	nanoid(message) {
		return this._addCheck({
			kind: "nanoid",
			...errorUtil.errToObj(message)
		});
	}
	cuid(message) {
		return this._addCheck({
			kind: "cuid",
			...errorUtil.errToObj(message)
		});
	}
	cuid2(message) {
		return this._addCheck({
			kind: "cuid2",
			...errorUtil.errToObj(message)
		});
	}
	ulid(message) {
		return this._addCheck({
			kind: "ulid",
			...errorUtil.errToObj(message)
		});
	}
	base64(message) {
		return this._addCheck({
			kind: "base64",
			...errorUtil.errToObj(message)
		});
	}
	base64url(message) {
		return this._addCheck({
			kind: "base64url",
			...errorUtil.errToObj(message)
		});
	}
	jwt(options) {
		return this._addCheck({
			kind: "jwt",
			...errorUtil.errToObj(options)
		});
	}
	ip(options) {
		return this._addCheck({
			kind: "ip",
			...errorUtil.errToObj(options)
		});
	}
	cidr(options) {
		return this._addCheck({
			kind: "cidr",
			...errorUtil.errToObj(options)
		});
	}
	datetime(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "datetime",
			precision: null,
			offset: false,
			local: false,
			message: options
		});
		return this._addCheck({
			kind: "datetime",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			offset: options?.offset ?? false,
			local: options?.local ?? false,
			...errorUtil.errToObj(options?.message)
		});
	}
	date(message) {
		return this._addCheck({
			kind: "date",
			message
		});
	}
	time(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "time",
			precision: null,
			message: options
		});
		return this._addCheck({
			kind: "time",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			...errorUtil.errToObj(options?.message)
		});
	}
	duration(message) {
		return this._addCheck({
			kind: "duration",
			...errorUtil.errToObj(message)
		});
	}
	regex(regex, message) {
		return this._addCheck({
			kind: "regex",
			regex,
			...errorUtil.errToObj(message)
		});
	}
	includes(value, options) {
		return this._addCheck({
			kind: "includes",
			value,
			position: options?.position,
			...errorUtil.errToObj(options?.message)
		});
	}
	startsWith(value, message) {
		return this._addCheck({
			kind: "startsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	endsWith(value, message) {
		return this._addCheck({
			kind: "endsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	min(minLength, message) {
		return this._addCheck({
			kind: "min",
			value: minLength,
			...errorUtil.errToObj(message)
		});
	}
	max(maxLength, message) {
		return this._addCheck({
			kind: "max",
			value: maxLength,
			...errorUtil.errToObj(message)
		});
	}
	length(len, message) {
		return this._addCheck({
			kind: "length",
			value: len,
			...errorUtil.errToObj(message)
		});
	}
	/**
	* Equivalent to `.min(1)`
	*/
	nonempty(message) {
		return this.min(1, errorUtil.errToObj(message));
	}
	trim() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((ch) => ch.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((ch) => ch.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((ch) => ch.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((ch) => ch.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((ch) => ch.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((ch) => ch.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((ch) => ch.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((ch) => ch.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((ch) => ch.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((ch) => ch.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((ch) => ch.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((ch) => ch.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((ch) => ch.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((ch) => ch.kind === "base64url");
	}
	get minLength() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxLength() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodString.create = (params) => {
	return new ZodString({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodString,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepDecCount = (step.toString().split(".")[1] || "").length;
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
var ZodNumber = class ZodNumber extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
		this.step = this.multipleOf;
	}
	_parse(input) {
		if (this._def.coerce) input.data = Number(input.data);
		if (this._getType(input) !== ZodParsedType.number) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.number,
				received: ctx.parsedType
			});
			return INVALID;
		}
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "int") {
			if (!util$7.isInteger(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_type,
					expected: "integer",
					received: "float",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (floatSafeRemainder(input.data, check.value) !== 0) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "finite") {
			if (!Number.isFinite(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_finite,
					message: check.message
				});
				status.dirty();
			}
		} else util$7.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	int(message) {
		return this._addCheck({
			kind: "int",
			message: errorUtil.toString(message)
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	finite(message) {
		return this._addCheck({
			kind: "finite",
			message: errorUtil.toString(message)
		});
	}
	safe(message) {
		return this._addCheck({
			kind: "min",
			inclusive: true,
			value: Number.MIN_SAFE_INTEGER,
			message: errorUtil.toString(message)
		})._addCheck({
			kind: "max",
			inclusive: true,
			value: Number.MAX_SAFE_INTEGER,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
	get isInt() {
		return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util$7.isInteger(ch.value));
	}
	get isFinite() {
		let max = null;
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
		else if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		} else if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return Number.isFinite(min) && Number.isFinite(max);
	}
};
ZodNumber.create = (params) => {
	return new ZodNumber({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodNumber,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodBigInt = class ZodBigInt extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
	}
	_parse(input) {
		if (this._def.coerce) try {
			input.data = BigInt(input.data);
		} catch {
			return this._getInvalidInput(input);
		}
		if (this._getType(input) !== ZodParsedType.bigint) return this._getInvalidInput(input);
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					type: "bigint",
					minimum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					type: "bigint",
					maximum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (input.data % check.value !== BigInt(0)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else util$7.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_getInvalidInput(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.bigint,
			received: ctx.parsedType
		});
		return INVALID;
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodBigInt.create = (params) => {
	return new ZodBigInt({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodBigInt,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
var ZodBoolean = class extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = Boolean(input.data);
		if (this._getType(input) !== ZodParsedType.boolean) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.boolean,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodBoolean.create = (params) => {
	return new ZodBoolean({
		typeName: ZodFirstPartyTypeKind.ZodBoolean,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodDate = class ZodDate extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = new Date(input.data);
		if (this._getType(input) !== ZodParsedType.date) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.date,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (Number.isNaN(input.data.getTime())) {
			addIssueToContext(this._getOrReturnCtx(input), { code: ZodIssueCode.invalid_date });
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.getTime() < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					message: check.message,
					inclusive: true,
					exact: false,
					minimum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.getTime() > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					message: check.message,
					inclusive: true,
					exact: false,
					maximum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else util$7.assertNever(check);
		return {
			status: status.value,
			value: new Date(input.data.getTime())
		};
	}
	_addCheck(check) {
		return new ZodDate({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	min(minDate, message) {
		return this._addCheck({
			kind: "min",
			value: minDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	max(maxDate, message) {
		return this._addCheck({
			kind: "max",
			value: maxDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	get minDate() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min != null ? new Date(min) : null;
	}
	get maxDate() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max != null ? new Date(max) : null;
	}
};
ZodDate.create = (params) => {
	return new ZodDate({
		checks: [],
		coerce: params?.coerce || false,
		typeName: ZodFirstPartyTypeKind.ZodDate,
		...processCreateParams(params)
	});
};
var ZodSymbol = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.symbol) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.symbol,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodSymbol.create = (params) => {
	return new ZodSymbol({
		typeName: ZodFirstPartyTypeKind.ZodSymbol,
		...processCreateParams(params)
	});
};
var ZodUndefined = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.undefined,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodUndefined.create = (params) => {
	return new ZodUndefined({
		typeName: ZodFirstPartyTypeKind.ZodUndefined,
		...processCreateParams(params)
	});
};
var ZodNull = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.null) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.null,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodNull.create = (params) => {
	return new ZodNull({
		typeName: ZodFirstPartyTypeKind.ZodNull,
		...processCreateParams(params)
	});
};
var ZodAny = class extends ZodType {
	constructor() {
		super(...arguments);
		this._any = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodAny.create = (params) => {
	return new ZodAny({
		typeName: ZodFirstPartyTypeKind.ZodAny,
		...processCreateParams(params)
	});
};
var ZodUnknown = class extends ZodType {
	constructor() {
		super(...arguments);
		this._unknown = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodUnknown.create = (params) => {
	return new ZodUnknown({
		typeName: ZodFirstPartyTypeKind.ZodUnknown,
		...processCreateParams(params)
	});
};
var ZodNever = class extends ZodType {
	_parse(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.never,
			received: ctx.parsedType
		});
		return INVALID;
	}
};
ZodNever.create = (params) => {
	return new ZodNever({
		typeName: ZodFirstPartyTypeKind.ZodNever,
		...processCreateParams(params)
	});
};
var ZodVoid = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.void,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodVoid.create = (params) => {
	return new ZodVoid({
		typeName: ZodFirstPartyTypeKind.ZodVoid,
		...processCreateParams(params)
	});
};
var ZodArray = class ZodArray extends ZodType {
	_parse(input) {
		const { ctx, status } = this._processInputParams(input);
		const def = this._def;
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (def.exactLength !== null) {
			const tooBig = ctx.data.length > def.exactLength.value;
			const tooSmall = ctx.data.length < def.exactLength.value;
			if (tooBig || tooSmall) {
				addIssueToContext(ctx, {
					code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
					minimum: tooSmall ? def.exactLength.value : void 0,
					maximum: tooBig ? def.exactLength.value : void 0,
					type: "array",
					inclusive: true,
					exact: true,
					message: def.exactLength.message
				});
				status.dirty();
			}
		}
		if (def.minLength !== null) {
			if (ctx.data.length < def.minLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.minLength.message
				});
				status.dirty();
			}
		}
		if (def.maxLength !== null) {
			if (ctx.data.length > def.maxLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.maxLength.message
				});
				status.dirty();
			}
		}
		if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
			return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		})).then((result) => {
			return ParseStatus.mergeArray(status, result);
		});
		const result = [...ctx.data].map((item, i) => {
			return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		});
		return ParseStatus.mergeArray(status, result);
	}
	get element() {
		return this._def.type;
	}
	min(minLength, message) {
		return new ZodArray({
			...this._def,
			minLength: {
				value: minLength,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxLength, message) {
		return new ZodArray({
			...this._def,
			maxLength: {
				value: maxLength,
				message: errorUtil.toString(message)
			}
		});
	}
	length(len, message) {
		return new ZodArray({
			...this._def,
			exactLength: {
				value: len,
				message: errorUtil.toString(message)
			}
		});
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodArray.create = (schema, params) => {
	return new ZodArray({
		type: schema,
		minLength: null,
		maxLength: null,
		exactLength: null,
		typeName: ZodFirstPartyTypeKind.ZodArray,
		...processCreateParams(params)
	});
};
function deepPartialify(schema) {
	if (schema instanceof ZodObject) {
		const newShape = {};
		for (const key in schema.shape) {
			const fieldSchema = schema.shape[key];
			newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
		}
		return new ZodObject({
			...schema._def,
			shape: () => newShape
		});
	} else if (schema instanceof ZodArray) return new ZodArray({
		...schema._def,
		type: deepPartialify(schema.element)
	});
	else if (schema instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema.unwrap()));
	else if (schema instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema.unwrap()));
	else if (schema instanceof ZodTuple) return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
	else return schema;
}
var ZodObject = class ZodObject extends ZodType {
	constructor() {
		super(...arguments);
		this._cached = null;
		/**
		* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
		* If you want to pass through unknown properties, use `.passthrough()` instead.
		*/
		this.nonstrict = this.passthrough;
		/**
		* @deprecated Use `.extend` instead
		*  */
		this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		const shape = this._def.shape();
		this._cached = {
			shape,
			keys: util$7.objectKeys(shape)
		};
		return this._cached;
	}
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.object) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const { status, ctx } = this._processInputParams(input);
		const { shape, keys: shapeKeys } = this._getCached();
		const extraKeys = [];
		if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
			for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
		}
		const pairs = [];
		for (const key of shapeKeys) {
			const keyValidator = shape[key];
			const value = ctx.data[key];
			pairs.push({
				key: {
					status: "valid",
					value: key
				},
				value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
				alwaysSet: key in ctx.data
			});
		}
		if (this._def.catchall instanceof ZodNever) {
			const unknownKeys = this._def.unknownKeys;
			if (unknownKeys === "passthrough") for (const key of extraKeys) pairs.push({
				key: {
					status: "valid",
					value: key
				},
				value: {
					status: "valid",
					value: ctx.data[key]
				}
			});
			else if (unknownKeys === "strict") {
				if (extraKeys.length > 0) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.unrecognized_keys,
						keys: extraKeys
					});
					status.dirty();
				}
			} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
		} else {
			const catchall = this._def.catchall;
			for (const key of extraKeys) {
				const value = ctx.data[key];
				pairs.push({
					key: {
						status: "valid",
						value: key
					},
					value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
					alwaysSet: key in ctx.data
				});
			}
		}
		if (ctx.common.async) return Promise.resolve().then(async () => {
			const syncPairs = [];
			for (const pair of pairs) {
				const key = await pair.key;
				const value = await pair.value;
				syncPairs.push({
					key,
					value,
					alwaysSet: pair.alwaysSet
				});
			}
			return syncPairs;
		}).then((syncPairs) => {
			return ParseStatus.mergeObjectSync(status, syncPairs);
		});
		else return ParseStatus.mergeObjectSync(status, pairs);
	}
	get shape() {
		return this._def.shape();
	}
	strict(message) {
		errorUtil.errToObj;
		return new ZodObject({
			...this._def,
			unknownKeys: "strict",
			...message !== void 0 ? { errorMap: (issue, ctx) => {
				const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
				if (issue.code === "unrecognized_keys") return { message: errorUtil.errToObj(message).message ?? defaultError };
				return { message: defaultError };
			} } : {}
		});
	}
	strip() {
		return new ZodObject({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new ZodObject({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(augmentation) {
		return new ZodObject({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...augmentation
			})
		});
	}
	/**
	* Prior to zod@1.0.12 there was a bug in the
	* inferred type of merged objects. Please
	* upgrade if you are experiencing issues.
	*/
	merge(merging) {
		return new ZodObject({
			unknownKeys: merging._def.unknownKeys,
			catchall: merging._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...merging._def.shape()
			}),
			typeName: ZodFirstPartyTypeKind.ZodObject
		});
	}
	setKey(key, schema) {
		return this.augment({ [key]: schema });
	}
	catchall(index) {
		return new ZodObject({
			...this._def,
			catchall: index
		});
	}
	pick(mask) {
		const shape = {};
		for (const key of util$7.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	omit(mask) {
		const shape = {};
		for (const key of util$7.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	/**
	* @deprecated
	*/
	deepPartial() {
		return deepPartialify(this);
	}
	partial(mask) {
		const newShape = {};
		for (const key of util$7.objectKeys(this.shape)) {
			const fieldSchema = this.shape[key];
			if (mask && !mask[key]) newShape[key] = fieldSchema;
			else newShape[key] = fieldSchema.optional();
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	required(mask) {
		const newShape = {};
		for (const key of util$7.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
		else {
			let newField = this.shape[key];
			while (newField instanceof ZodOptional) newField = newField._def.innerType;
			newShape[key] = newField;
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	keyof() {
		return createZodEnum(util$7.objectKeys(this.shape));
	}
};
ZodObject.create = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.strictCreate = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strict",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate = (shape, params) => {
	return new ZodObject({
		shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
var ZodUnion = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const options = this._def.options;
		function handleResults(results) {
			for (const result of results) if (result.result.status === "valid") return result.result;
			for (const result of results) if (result.result.status === "dirty") {
				ctx.common.issues.push(...result.ctx.common.issues);
				return result.result;
			}
			const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
		if (ctx.common.async) return Promise.all(options.map(async (option) => {
			const childCtx = {
				...ctx,
				common: {
					...ctx.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await option._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				}),
				ctx: childCtx
			};
		})).then(handleResults);
		else {
			let dirty = void 0;
			const issues = [];
			for (const option of options) {
				const childCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					},
					parent: null
				};
				const result = option._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				});
				if (result.status === "valid") return result;
				else if (result.status === "dirty" && !dirty) dirty = {
					result,
					ctx: childCtx
				};
				if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
			}
			if (dirty) {
				ctx.common.issues.push(...dirty.ctx.common.issues);
				return dirty.result;
			}
			const unionErrors = issues.map((issues) => new ZodError(issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
	}
	get options() {
		return this._def.options;
	}
};
ZodUnion.create = (types, params) => {
	return new ZodUnion({
		options: types,
		typeName: ZodFirstPartyTypeKind.ZodUnion,
		...processCreateParams(params)
	});
};
const getDiscriminator = (type) => {
	if (type instanceof ZodLazy) return getDiscriminator(type.schema);
	else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
	else if (type instanceof ZodLiteral) return [type.value];
	else if (type instanceof ZodEnum) return type.options;
	else if (type instanceof ZodNativeEnum) return util$7.objectValues(type.enum);
	else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
	else if (type instanceof ZodUndefined) return [void 0];
	else if (type instanceof ZodNull) return [null];
	else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
	else return [];
};
var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const discriminator = this.discriminator;
		const discriminatorValue = ctx.data[discriminator];
		const option = this.optionsMap.get(discriminatorValue);
		if (!option) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union_discriminator,
				options: Array.from(this.optionsMap.keys()),
				path: [discriminator]
			});
			return INVALID;
		}
		if (ctx.common.async) return option._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
		else return option._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	/**
	* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
	* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
	* have a different value for each object in the union.
	* @param discriminator the name of the discriminator property
	* @param types an array of object schemas
	* @param params
	*/
	static create(discriminator, options, params) {
		const optionsMap = /* @__PURE__ */ new Map();
		for (const type of options) {
			const discriminatorValues = getDiscriminator(type.shape[discriminator]);
			if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
			for (const value of discriminatorValues) {
				if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
				optionsMap.set(value, type);
			}
		}
		return new ZodDiscriminatedUnion({
			typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
			discriminator,
			options,
			optionsMap,
			...processCreateParams(params)
		});
	}
};
function mergeValues(a, b) {
	const aType = getParsedType(a);
	const bType = getParsedType(b);
	if (a === b) return {
		valid: true,
		data: a
	};
	else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
		const bKeys = util$7.objectKeys(b);
		const sharedKeys = util$7.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return { valid: false };
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	} else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
		if (a.length !== b.length) return { valid: false };
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return { valid: false };
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	} else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) return {
		valid: true,
		data: a
	};
	else return { valid: false };
}
var ZodIntersection = class extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const handleParsed = (parsedLeft, parsedRight) => {
			if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
			const merged = mergeValues(parsedLeft.value, parsedRight.value);
			if (!merged.valid) {
				addIssueToContext(ctx, { code: ZodIssueCode.invalid_intersection_types });
				return INVALID;
			}
			if (isDirty(parsedLeft) || isDirty(parsedRight)) status.dirty();
			return {
				status: status.value,
				value: merged.data
			};
		};
		if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		})]).then(([left, right]) => handleParsed(left, right));
		else return handleParsed(this._def.left._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}));
	}
};
ZodIntersection.create = (left, right, params) => {
	return new ZodIntersection({
		left,
		right,
		typeName: ZodFirstPartyTypeKind.ZodIntersection,
		...processCreateParams(params)
	});
};
var ZodTuple = class ZodTuple extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (ctx.data.length < this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_small,
				minimum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			return INVALID;
		}
		if (!this._def.rest && ctx.data.length > this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_big,
				maximum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			status.dirty();
		}
		const items = [...ctx.data].map((item, itemIndex) => {
			const schema = this._def.items[itemIndex] || this._def.rest;
			if (!schema) return null;
			return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
		}).filter((x) => !!x);
		if (ctx.common.async) return Promise.all(items).then((results) => {
			return ParseStatus.mergeArray(status, results);
		});
		else return ParseStatus.mergeArray(status, items);
	}
	get items() {
		return this._def.items;
	}
	rest(rest) {
		return new ZodTuple({
			...this._def,
			rest
		});
	}
};
ZodTuple.create = (schemas, params) => {
	if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new ZodTuple({
		items: schemas,
		typeName: ZodFirstPartyTypeKind.ZodTuple,
		rest: null,
		...processCreateParams(params)
	});
};
var ZodRecord = class ZodRecord extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const pairs = [];
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		for (const key in ctx.data) pairs.push({
			key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
			value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
			alwaysSet: key in ctx.data
		});
		if (ctx.common.async) return ParseStatus.mergeObjectAsync(status, pairs);
		else return ParseStatus.mergeObjectSync(status, pairs);
	}
	get element() {
		return this._def.valueType;
	}
	static create(first, second, third) {
		if (second instanceof ZodType) return new ZodRecord({
			keyType: first,
			valueType: second,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(third)
		});
		return new ZodRecord({
			keyType: ZodString.create(),
			valueType: first,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(second)
		});
	}
};
var ZodMap = class extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.map) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.map,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		const pairs = [...ctx.data.entries()].map(([key, value], index) => {
			return {
				key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
				value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
			};
		});
		if (ctx.common.async) {
			const finalMap = /* @__PURE__ */ new Map();
			return Promise.resolve().then(async () => {
				for (const pair of pairs) {
					const key = await pair.key;
					const value = await pair.value;
					if (key.status === "aborted" || value.status === "aborted") return INVALID;
					if (key.status === "dirty" || value.status === "dirty") status.dirty();
					finalMap.set(key.value, value.value);
				}
				return {
					status: status.value,
					value: finalMap
				};
			});
		} else {
			const finalMap = /* @__PURE__ */ new Map();
			for (const pair of pairs) {
				const key = pair.key;
				const value = pair.value;
				if (key.status === "aborted" || value.status === "aborted") return INVALID;
				if (key.status === "dirty" || value.status === "dirty") status.dirty();
				finalMap.set(key.value, value.value);
			}
			return {
				status: status.value,
				value: finalMap
			};
		}
	}
};
ZodMap.create = (keyType, valueType, params) => {
	return new ZodMap({
		valueType,
		keyType,
		typeName: ZodFirstPartyTypeKind.ZodMap,
		...processCreateParams(params)
	});
};
var ZodSet = class ZodSet extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.set) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.set,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const def = this._def;
		if (def.minSize !== null) {
			if (ctx.data.size < def.minSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.minSize.message
				});
				status.dirty();
			}
		}
		if (def.maxSize !== null) {
			if (ctx.data.size > def.maxSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.maxSize.message
				});
				status.dirty();
			}
		}
		const valueType = this._def.valueType;
		function finalizeSet(elements) {
			const parsedSet = /* @__PURE__ */ new Set();
			for (const element of elements) {
				if (element.status === "aborted") return INVALID;
				if (element.status === "dirty") status.dirty();
				parsedSet.add(element.value);
			}
			return {
				status: status.value,
				value: parsedSet
			};
		}
		const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
		if (ctx.common.async) return Promise.all(elements).then((elements) => finalizeSet(elements));
		else return finalizeSet(elements);
	}
	min(minSize, message) {
		return new ZodSet({
			...this._def,
			minSize: {
				value: minSize,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxSize, message) {
		return new ZodSet({
			...this._def,
			maxSize: {
				value: maxSize,
				message: errorUtil.toString(message)
			}
		});
	}
	size(size, message) {
		return this.min(size, message).max(size, message);
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodSet.create = (valueType, params) => {
	return new ZodSet({
		valueType,
		minSize: null,
		maxSize: null,
		typeName: ZodFirstPartyTypeKind.ZodSet,
		...processCreateParams(params)
	});
};
var ZodFunction = class ZodFunction extends ZodType {
	constructor() {
		super(...arguments);
		this.validate = this.implement;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.function) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.function,
				received: ctx.parsedType
			});
			return INVALID;
		}
		function makeArgsIssue(args, error) {
			return makeIssue({
				data: args,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					errorMap
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_arguments,
					argumentsError: error
				}
			});
		}
		function makeReturnsIssue(returns, error) {
			return makeIssue({
				data: returns,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					errorMap
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_return_type,
					returnTypeError: error
				}
			});
		}
		const params = { errorMap: ctx.common.contextualErrorMap };
		const fn = ctx.data;
		if (this._def.returns instanceof ZodPromise) {
			const me = this;
			return OK(async function(...args) {
				const error = new ZodError([]);
				const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
					error.addIssue(makeArgsIssue(args, e));
					throw error;
				});
				const result = await Reflect.apply(fn, this, parsedArgs);
				return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
					error.addIssue(makeReturnsIssue(result, e));
					throw error;
				});
			});
		} else {
			const me = this;
			return OK(function(...args) {
				const parsedArgs = me._def.args.safeParse(args, params);
				if (!parsedArgs.success) throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
				const result = Reflect.apply(fn, this, parsedArgs.data);
				const parsedReturns = me._def.returns.safeParse(result, params);
				if (!parsedReturns.success) throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
				return parsedReturns.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...items) {
		return new ZodFunction({
			...this._def,
			args: ZodTuple.create(items).rest(ZodUnknown.create())
		});
	}
	returns(returnType) {
		return new ZodFunction({
			...this._def,
			returns: returnType
		});
	}
	implement(func) {
		return this.parse(func);
	}
	strictImplement(func) {
		return this.parse(func);
	}
	static create(args, returns, params) {
		return new ZodFunction({
			args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
			returns: returns || ZodUnknown.create(),
			typeName: ZodFirstPartyTypeKind.ZodFunction,
			...processCreateParams(params)
		});
	}
};
var ZodLazy = class extends ZodType {
	get schema() {
		return this._def.getter();
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		return this._def.getter()._parse({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
};
ZodLazy.create = (getter, params) => {
	return new ZodLazy({
		getter,
		typeName: ZodFirstPartyTypeKind.ZodLazy,
		...processCreateParams(params)
	});
};
var ZodLiteral = class extends ZodType {
	_parse(input) {
		if (input.data !== this._def.value) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_literal,
				expected: this._def.value
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
	get value() {
		return this._def.value;
	}
};
ZodLiteral.create = (value, params) => {
	return new ZodLiteral({
		value,
		typeName: ZodFirstPartyTypeKind.ZodLiteral,
		...processCreateParams(params)
	});
};
function createZodEnum(values, params) {
	return new ZodEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodEnum,
		...processCreateParams(params)
	});
}
var ZodEnum = class ZodEnum extends ZodType {
	_parse(input) {
		if (typeof input.data !== "string") {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				expected: util$7.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(this._def.values);
		if (!this._cache.has(input.data)) {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Values() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	extract(values, newDef = this._def) {
		return ZodEnum.create(values, {
			...this._def,
			...newDef
		});
	}
	exclude(values, newDef = this._def) {
		return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
			...this._def,
			...newDef
		});
	}
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
	_parse(input) {
		const nativeEnumValues = util$7.getValidEnumValues(this._def.values);
		const ctx = this._getOrReturnCtx(input);
		if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
			const expectedValues = util$7.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				expected: util$7.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(util$7.getValidEnumValues(this._def.values));
		if (!this._cache.has(input.data)) {
			const expectedValues = util$7.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get enum() {
		return this._def.values;
	}
};
ZodNativeEnum.create = (values, params) => {
	return new ZodNativeEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
		...processCreateParams(params)
	});
};
var ZodPromise = class extends ZodType {
	unwrap() {
		return this._def.type;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.promise,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK((ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data)).then((data) => {
			return this._def.type.parseAsync(data, {
				path: ctx.path,
				errorMap: ctx.common.contextualErrorMap
			});
		}));
	}
};
ZodPromise.create = (schema, params) => {
	return new ZodPromise({
		type: schema,
		typeName: ZodFirstPartyTypeKind.ZodPromise,
		...processCreateParams(params)
	});
};
var ZodEffects = class extends ZodType {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const effect = this._def.effect || null;
		const checkCtx = {
			addIssue: (arg) => {
				addIssueToContext(ctx, arg);
				if (arg.fatal) status.abort();
				else status.dirty();
			},
			get path() {
				return ctx.path;
			}
		};
		checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
		if (effect.type === "preprocess") {
			const processed = effect.transform(ctx.data, checkCtx);
			if (ctx.common.async) return Promise.resolve(processed).then(async (processed) => {
				if (status.value === "aborted") return INVALID;
				const result = await this._def.schema._parseAsync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			});
			else {
				if (status.value === "aborted") return INVALID;
				const result = this._def.schema._parseSync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			}
		}
		if (effect.type === "refinement") {
			const executeRefinement = (acc) => {
				const result = effect.refinement(acc, checkCtx);
				if (ctx.common.async) return Promise.resolve(result);
				if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return acc;
			};
			if (ctx.common.async === false) {
				const inner = this._def.schema._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				executeRefinement(inner.value);
				return {
					status: status.value,
					value: inner.value
				};
			} else return this._def.schema._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}).then((inner) => {
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				return executeRefinement(inner.value).then(() => {
					return {
						status: status.value,
						value: inner.value
					};
				});
			});
		}
		if (effect.type === "transform") if (ctx.common.async === false) {
			const base = this._def.schema._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (!isValid(base)) return INVALID;
			const result = effect.transform(base.value, checkCtx);
			if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
			return {
				status: status.value,
				value: result
			};
		} else return this._def.schema._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}).then((base) => {
			if (!isValid(base)) return INVALID;
			return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
				status: status.value,
				value: result
			}));
		});
		util$7.assertNever(effect);
	}
};
ZodEffects.create = (schema, effect, params) => {
	return new ZodEffects({
		schema,
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		effect,
		...processCreateParams(params)
	});
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
	return new ZodEffects({
		schema,
		effect: {
			type: "preprocess",
			transform: preprocess
		},
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		...processCreateParams(params)
	});
};
var ZodOptional = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.undefined) return OK(void 0);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodOptional.create = (type, params) => {
	return new ZodOptional({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodOptional,
		...processCreateParams(params)
	});
};
var ZodNullable = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.null) return OK(null);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodNullable.create = (type, params) => {
	return new ZodNullable({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodNullable,
		...processCreateParams(params)
	});
};
var ZodDefault = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		let data = ctx.data;
		if (ctx.parsedType === ZodParsedType.undefined) data = this._def.defaultValue();
		return this._def.innerType._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
ZodDefault.create = (type, params) => {
	return new ZodDefault({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodDefault,
		defaultValue: typeof params.default === "function" ? params.default : () => params.default,
		...processCreateParams(params)
	});
};
var ZodCatch = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const newCtx = {
			...ctx,
			common: {
				...ctx.common,
				issues: []
			}
		};
		const result = this._def.innerType._parse({
			data: newCtx.data,
			path: newCtx.path,
			parent: { ...newCtx }
		});
		if (isAsync(result)) return result.then((result) => {
			return {
				status: "valid",
				value: result.status === "valid" ? result.value : this._def.catchValue({
					get error() {
						return new ZodError(newCtx.common.issues);
					},
					input: newCtx.data
				})
			};
		});
		else return {
			status: "valid",
			value: result.status === "valid" ? result.value : this._def.catchValue({
				get error() {
					return new ZodError(newCtx.common.issues);
				},
				input: newCtx.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
ZodCatch.create = (type, params) => {
	return new ZodCatch({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodCatch,
		catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
		...processCreateParams(params)
	});
};
var ZodNaN = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.nan) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.nan,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
};
ZodNaN.create = (params) => {
	return new ZodNaN({
		typeName: ZodFirstPartyTypeKind.ZodNaN,
		...processCreateParams(params)
	});
};
var ZodBranded = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const data = ctx.data;
		return this._def.type._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	unwrap() {
		return this._def.type;
	}
};
var ZodPipeline = class ZodPipeline extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.common.async) {
			const handleAsync = async () => {
				const inResult = await this._def.in._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inResult.status === "aborted") return INVALID;
				if (inResult.status === "dirty") {
					status.dirty();
					return DIRTY(inResult.value);
				} else return this._def.out._parseAsync({
					data: inResult.value,
					path: ctx.path,
					parent: ctx
				});
			};
			return handleAsync();
		} else {
			const inResult = this._def.in._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (inResult.status === "aborted") return INVALID;
			if (inResult.status === "dirty") {
				status.dirty();
				return {
					status: "dirty",
					value: inResult.value
				};
			} else return this._def.out._parseSync({
				data: inResult.value,
				path: ctx.path,
				parent: ctx
			});
		}
	}
	static create(a, b) {
		return new ZodPipeline({
			in: a,
			out: b,
			typeName: ZodFirstPartyTypeKind.ZodPipeline
		});
	}
};
var ZodReadonly = class extends ZodType {
	_parse(input) {
		const result = this._def.innerType._parse(input);
		const freeze = (data) => {
			if (isValid(data)) data.value = Object.freeze(data.value);
			return data;
		};
		return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodReadonly.create = (type, params) => {
	return new ZodReadonly({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodReadonly,
		...processCreateParams(params)
	});
};
function cleanParams(params, data) {
	const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
	return typeof p === "string" ? { message: p } : p;
}
function custom(check, _params = {}, fatal) {
	if (check) return ZodAny.create().superRefine((data, ctx) => {
		const r = check(data);
		if (r instanceof Promise) return r.then((r) => {
			if (!r) {
				const params = cleanParams(_params, data);
				const _fatal = params.fatal ?? fatal ?? true;
				ctx.addIssue({
					code: "custom",
					...params,
					fatal: _fatal
				});
			}
		});
		if (!r) {
			const params = cleanParams(_params, data);
			const _fatal = params.fatal ?? fatal ?? true;
			ctx.addIssue({
				code: "custom",
				...params,
				fatal: _fatal
			});
		}
	});
	return ZodAny.create();
}
ZodObject.lazycreate;
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind) {
	ZodFirstPartyTypeKind["ZodString"] = "ZodString";
	ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
	ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
	ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
	ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
	ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
	ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
	ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
	ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
	ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
	ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
	ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
	ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
	ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
	ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
	ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
	ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
	ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
	ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
	ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
	ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
	ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
	ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
	ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
	ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
	ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
	ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
	ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
	ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
	ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
	ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
	ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
	ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
	ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
	ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
	ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (cls, params = { message: `Input not instance of ${cls.name}` }) => custom((data) => data instanceof cls, params);
ZodString.create;
const numberType = ZodNumber.create;
ZodNaN.create;
ZodBigInt.create;
const booleanType = ZodBoolean.create;
ZodDate.create;
ZodSymbol.create;
ZodUndefined.create;
ZodNull.create;
ZodAny.create;
ZodUnknown.create;
ZodNever.create;
ZodVoid.create;
ZodArray.create;
const objectType = ZodObject.create;
ZodObject.strictCreate;
const unionType = ZodUnion.create;
ZodDiscriminatedUnion.create;
ZodIntersection.create;
ZodTuple.create;
ZodRecord.create;
ZodMap.create;
ZodSet.create;
ZodFunction.create;
ZodLazy.create;
ZodLiteral.create;
ZodEnum.create;
ZodNativeEnum.create;
ZodPromise.create;
ZodEffects.create;
ZodOptional.create;
ZodNullable.create;
ZodEffects.createWithPreprocess;
ZodPipeline.create;
//#endregion
//#region ../../node_modules/.pnpm/@jimp+types@1.6.1/node_modules/@jimp/types/dist/esm/index.js
var Edge;
(function(Edge) {
	Edge[Edge["EXTEND"] = 1] = "EXTEND";
	Edge[Edge["WRAP"] = 2] = "WRAP";
	Edge[Edge["CROP"] = 3] = "CROP";
})(Edge || (Edge = {}));
objectType({ bitmap: objectType({
	data: unionType([instanceOfType(Buffer), instanceOfType(Uint8Array)]),
	width: numberType(),
	height: numberType()
}) });
//#endregion
//#region ../../node_modules/.pnpm/tinycolor2@1.6.0/node_modules/tinycolor2/esm/tinycolor.js
function _typeof(obj) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
		return typeof obj;
	} : function(obj) {
		return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	}, _typeof(obj);
}
var trimLeft = /^\s+/;
var trimRight = /\s+$/;
function tinycolor(color, opts) {
	color = color ? color : "";
	opts = opts || {};
	if (color instanceof tinycolor) return color;
	if (!(this instanceof tinycolor)) return new tinycolor(color, opts);
	var rgb = inputToRGB(color);
	this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, this._a = rgb.a, this._roundA = Math.round(100 * this._a) / 100, this._format = opts.format || rgb.format;
	this._gradientType = opts.gradientType;
	if (this._r < 1) this._r = Math.round(this._r);
	if (this._g < 1) this._g = Math.round(this._g);
	if (this._b < 1) this._b = Math.round(this._b);
	this._ok = rgb.ok;
}
tinycolor.prototype = {
	isDark: function isDark() {
		return this.getBrightness() < 128;
	},
	isLight: function isLight() {
		return !this.isDark();
	},
	isValid: function isValid() {
		return this._ok;
	},
	getOriginalInput: function getOriginalInput() {
		return this._originalInput;
	},
	getFormat: function getFormat() {
		return this._format;
	},
	getAlpha: function getAlpha() {
		return this._a;
	},
	getBrightness: function getBrightness() {
		var rgb = this.toRgb();
		return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1e3;
	},
	getLuminance: function getLuminance() {
		var rgb = this.toRgb();
		var RsRGB = rgb.r / 255, GsRGB = rgb.g / 255, BsRGB = rgb.b / 255, R, G, B;
		if (RsRGB <= .03928) R = RsRGB / 12.92;
		else R = Math.pow((RsRGB + .055) / 1.055, 2.4);
		if (GsRGB <= .03928) G = GsRGB / 12.92;
		else G = Math.pow((GsRGB + .055) / 1.055, 2.4);
		if (BsRGB <= .03928) B = BsRGB / 12.92;
		else B = Math.pow((BsRGB + .055) / 1.055, 2.4);
		return .2126 * R + .7152 * G + .0722 * B;
	},
	setAlpha: function setAlpha(value) {
		this._a = boundAlpha(value);
		this._roundA = Math.round(100 * this._a) / 100;
		return this;
	},
	toHsv: function toHsv() {
		var hsv = rgbToHsv(this._r, this._g, this._b);
		return {
			h: hsv.h * 360,
			s: hsv.s,
			v: hsv.v,
			a: this._a
		};
	},
	toHsvString: function toHsvString() {
		var hsv = rgbToHsv(this._r, this._g, this._b);
		var h = Math.round(hsv.h * 360), s = Math.round(hsv.s * 100), v = Math.round(hsv.v * 100);
		return this._a == 1 ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")";
	},
	toHsl: function toHsl() {
		var hsl = rgbToHsl(this._r, this._g, this._b);
		return {
			h: hsl.h * 360,
			s: hsl.s,
			l: hsl.l,
			a: this._a
		};
	},
	toHslString: function toHslString() {
		var hsl = rgbToHsl(this._r, this._g, this._b);
		var h = Math.round(hsl.h * 360), s = Math.round(hsl.s * 100), l = Math.round(hsl.l * 100);
		return this._a == 1 ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")";
	},
	toHex: function toHex(allow3Char) {
		return rgbToHex(this._r, this._g, this._b, allow3Char);
	},
	toHexString: function toHexString(allow3Char) {
		return "#" + this.toHex(allow3Char);
	},
	toHex8: function toHex8(allow4Char) {
		return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
	},
	toHex8String: function toHex8String(allow4Char) {
		return "#" + this.toHex8(allow4Char);
	},
	toRgb: function toRgb() {
		return {
			r: Math.round(this._r),
			g: Math.round(this._g),
			b: Math.round(this._b),
			a: this._a
		};
	},
	toRgbString: function toRgbString() {
		return this._a == 1 ? "rgb(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ")" : "rgba(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ", " + this._roundA + ")";
	},
	toPercentageRgb: function toPercentageRgb() {
		return {
			r: Math.round(bound01(this._r, 255) * 100) + "%",
			g: Math.round(bound01(this._g, 255) * 100) + "%",
			b: Math.round(bound01(this._b, 255) * 100) + "%",
			a: this._a
		};
	},
	toPercentageRgbString: function toPercentageRgbString() {
		return this._a == 1 ? "rgb(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%)" : "rgba(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
	},
	toName: function toName() {
		if (this._a === 0) return "transparent";
		if (this._a < 1) return false;
		return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
	},
	toFilter: function toFilter(secondColor) {
		var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a);
		var secondHex8String = hex8String;
		var gradientType = this._gradientType ? "GradientType = 1, " : "";
		if (secondColor) {
			var s = tinycolor(secondColor);
			secondHex8String = "#" + rgbaToArgbHex(s._r, s._g, s._b, s._a);
		}
		return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")";
	},
	toString: function toString(format) {
		var formatSet = !!format;
		format = format || this._format;
		var formattedString = false;
		var hasAlpha = this._a < 1 && this._a >= 0;
		if (!formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name")) {
			if (format === "name" && this._a === 0) return this.toName();
			return this.toRgbString();
		}
		if (format === "rgb") formattedString = this.toRgbString();
		if (format === "prgb") formattedString = this.toPercentageRgbString();
		if (format === "hex" || format === "hex6") formattedString = this.toHexString();
		if (format === "hex3") formattedString = this.toHexString(true);
		if (format === "hex4") formattedString = this.toHex8String(true);
		if (format === "hex8") formattedString = this.toHex8String();
		if (format === "name") formattedString = this.toName();
		if (format === "hsl") formattedString = this.toHslString();
		if (format === "hsv") formattedString = this.toHsvString();
		return formattedString || this.toHexString();
	},
	clone: function clone() {
		return tinycolor(this.toString());
	},
	_applyModification: function _applyModification(fn, args) {
		var color = fn.apply(null, [this].concat([].slice.call(args)));
		this._r = color._r;
		this._g = color._g;
		this._b = color._b;
		this.setAlpha(color._a);
		return this;
	},
	lighten: function lighten() {
		return this._applyModification(_lighten, arguments);
	},
	brighten: function brighten() {
		return this._applyModification(_brighten, arguments);
	},
	darken: function darken() {
		return this._applyModification(_darken, arguments);
	},
	desaturate: function desaturate() {
		return this._applyModification(_desaturate, arguments);
	},
	saturate: function saturate() {
		return this._applyModification(_saturate, arguments);
	},
	greyscale: function greyscale() {
		return this._applyModification(_greyscale, arguments);
	},
	spin: function spin() {
		return this._applyModification(_spin, arguments);
	},
	_applyCombination: function _applyCombination(fn, args) {
		return fn.apply(null, [this].concat([].slice.call(args)));
	},
	analogous: function analogous() {
		return this._applyCombination(_analogous, arguments);
	},
	complement: function complement() {
		return this._applyCombination(_complement, arguments);
	},
	monochromatic: function monochromatic() {
		return this._applyCombination(_monochromatic, arguments);
	},
	splitcomplement: function splitcomplement() {
		return this._applyCombination(_splitcomplement, arguments);
	},
	triad: function triad() {
		return this._applyCombination(polyad, [3]);
	},
	tetrad: function tetrad() {
		return this._applyCombination(polyad, [4]);
	}
};
tinycolor.fromRatio = function(color, opts) {
	if (_typeof(color) == "object") {
		var newColor = {};
		for (var i in color) if (color.hasOwnProperty(i)) if (i === "a") newColor[i] = color[i];
		else newColor[i] = convertToPercentage(color[i]);
		color = newColor;
	}
	return tinycolor(color, opts);
};
function inputToRGB(color) {
	var rgb = {
		r: 0,
		g: 0,
		b: 0
	};
	var a = 1;
	var s = null;
	var v = null;
	var l = null;
	var ok = false;
	var format = false;
	if (typeof color == "string") color = stringInputToObject(color);
	if (_typeof(color) == "object") {
		if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
			rgb = rgbToRgb(color.r, color.g, color.b);
			ok = true;
			format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
		} else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
			s = convertToPercentage(color.s);
			v = convertToPercentage(color.v);
			rgb = hsvToRgb(color.h, s, v);
			ok = true;
			format = "hsv";
		} else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
			s = convertToPercentage(color.s);
			l = convertToPercentage(color.l);
			rgb = hslToRgb(color.h, s, l);
			ok = true;
			format = "hsl";
		}
		if (color.hasOwnProperty("a")) a = color.a;
	}
	a = boundAlpha(a);
	return {
		ok,
		format: color.format || format,
		r: Math.min(255, Math.max(rgb.r, 0)),
		g: Math.min(255, Math.max(rgb.g, 0)),
		b: Math.min(255, Math.max(rgb.b, 0)),
		a
	};
}
function rgbToRgb(r, g, b) {
	return {
		r: bound01(r, 255) * 255,
		g: bound01(g, 255) * 255,
		b: bound01(b, 255) * 255
	};
}
function rgbToHsl(r, g, b) {
	r = bound01(r, 255);
	g = bound01(g, 255);
	b = bound01(b, 255);
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;
	if (max == min) h = s = 0;
	else {
		var d = max - min;
		s = l > .5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return {
		h,
		s,
		l
	};
}
function hslToRgb(h, s, l) {
	var r, g, b;
	h = bound01(h, 360);
	s = bound01(s, 100);
	l = bound01(l, 100);
	function hue2rgb(p, q, t) {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}
	if (s === 0) r = g = b = l;
	else {
		var q = l < .5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	return {
		r: r * 255,
		g: g * 255,
		b: b * 255
	};
}
function rgbToHsv(r, g, b) {
	r = bound01(r, 255);
	g = bound01(g, 255);
	b = bound01(b, 255);
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, v = max;
	var d = max - min;
	s = max === 0 ? 0 : d / max;
	if (max == min) h = 0;
	else {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return {
		h,
		s,
		v
	};
}
function hsvToRgb(h, s, v) {
	h = bound01(h, 360) * 6;
	s = bound01(s, 100);
	v = bound01(v, 100);
	var i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), mod = i % 6, r = [
		v,
		q,
		p,
		p,
		t,
		v
	][mod], g = [
		t,
		v,
		v,
		q,
		p,
		p
	][mod], b = [
		p,
		p,
		t,
		v,
		v,
		q
	][mod];
	return {
		r: r * 255,
		g: g * 255,
		b: b * 255
	};
}
function rgbToHex(r, g, b, allow3Char) {
	var hex = [
		pad2(Math.round(r).toString(16)),
		pad2(Math.round(g).toString(16)),
		pad2(Math.round(b).toString(16))
	];
	if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
	return hex.join("");
}
function rgbaToHex(r, g, b, a, allow4Char) {
	var hex = [
		pad2(Math.round(r).toString(16)),
		pad2(Math.round(g).toString(16)),
		pad2(Math.round(b).toString(16)),
		pad2(convertDecimalToHex(a))
	];
	if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
	return hex.join("");
}
function rgbaToArgbHex(r, g, b, a) {
	return [
		pad2(convertDecimalToHex(a)),
		pad2(Math.round(r).toString(16)),
		pad2(Math.round(g).toString(16)),
		pad2(Math.round(b).toString(16))
	].join("");
}
tinycolor.equals = function(color1, color2) {
	if (!color1 || !color2) return false;
	return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};
tinycolor.random = function() {
	return tinycolor.fromRatio({
		r: Math.random(),
		g: Math.random(),
		b: Math.random()
	});
};
function _desaturate(color, amount) {
	amount = amount === 0 ? 0 : amount || 10;
	var hsl = tinycolor(color).toHsl();
	hsl.s -= amount / 100;
	hsl.s = clamp01(hsl.s);
	return tinycolor(hsl);
}
function _saturate(color, amount) {
	amount = amount === 0 ? 0 : amount || 10;
	var hsl = tinycolor(color).toHsl();
	hsl.s += amount / 100;
	hsl.s = clamp01(hsl.s);
	return tinycolor(hsl);
}
function _greyscale(color) {
	return tinycolor(color).desaturate(100);
}
function _lighten(color, amount) {
	amount = amount === 0 ? 0 : amount || 10;
	var hsl = tinycolor(color).toHsl();
	hsl.l += amount / 100;
	hsl.l = clamp01(hsl.l);
	return tinycolor(hsl);
}
function _brighten(color, amount) {
	amount = amount === 0 ? 0 : amount || 10;
	var rgb = tinycolor(color).toRgb();
	rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
	rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
	rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
	return tinycolor(rgb);
}
function _darken(color, amount) {
	amount = amount === 0 ? 0 : amount || 10;
	var hsl = tinycolor(color).toHsl();
	hsl.l -= amount / 100;
	hsl.l = clamp01(hsl.l);
	return tinycolor(hsl);
}
function _spin(color, amount) {
	var hsl = tinycolor(color).toHsl();
	var hue = (hsl.h + amount) % 360;
	hsl.h = hue < 0 ? 360 + hue : hue;
	return tinycolor(hsl);
}
function _complement(color) {
	var hsl = tinycolor(color).toHsl();
	hsl.h = (hsl.h + 180) % 360;
	return tinycolor(hsl);
}
function polyad(color, number) {
	if (isNaN(number) || number <= 0) throw new Error("Argument to polyad must be a positive number");
	var hsl = tinycolor(color).toHsl();
	var result = [tinycolor(color)];
	var step = 360 / number;
	for (var i = 1; i < number; i++) result.push(tinycolor({
		h: (hsl.h + i * step) % 360,
		s: hsl.s,
		l: hsl.l
	}));
	return result;
}
function _splitcomplement(color) {
	var hsl = tinycolor(color).toHsl();
	var h = hsl.h;
	return [
		tinycolor(color),
		tinycolor({
			h: (h + 72) % 360,
			s: hsl.s,
			l: hsl.l
		}),
		tinycolor({
			h: (h + 216) % 360,
			s: hsl.s,
			l: hsl.l
		})
	];
}
function _analogous(color, results, slices) {
	results = results || 6;
	slices = slices || 30;
	var hsl = tinycolor(color).toHsl();
	var part = 360 / slices;
	var ret = [tinycolor(color)];
	for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360; --results;) {
		hsl.h = (hsl.h + part) % 360;
		ret.push(tinycolor(hsl));
	}
	return ret;
}
function _monochromatic(color, results) {
	results = results || 6;
	var hsv = tinycolor(color).toHsv();
	var h = hsv.h, s = hsv.s, v = hsv.v;
	var ret = [];
	var modification = 1 / results;
	while (results--) {
		ret.push(tinycolor({
			h,
			s,
			v
		}));
		v = (v + modification) % 1;
	}
	return ret;
}
tinycolor.mix = function(color1, color2, amount) {
	amount = amount === 0 ? 0 : amount || 50;
	var rgb1 = tinycolor(color1).toRgb();
	var rgb2 = tinycolor(color2).toRgb();
	var p = amount / 100;
	return tinycolor({
		r: (rgb2.r - rgb1.r) * p + rgb1.r,
		g: (rgb2.g - rgb1.g) * p + rgb1.g,
		b: (rgb2.b - rgb1.b) * p + rgb1.b,
		a: (rgb2.a - rgb1.a) * p + rgb1.a
	});
};
tinycolor.readability = function(color1, color2) {
	var c1 = tinycolor(color1);
	var c2 = tinycolor(color2);
	return (Math.max(c1.getLuminance(), c2.getLuminance()) + .05) / (Math.min(c1.getLuminance(), c2.getLuminance()) + .05);
};
tinycolor.isReadable = function(color1, color2, wcag2) {
	var readability = tinycolor.readability(color1, color2);
	var wcag2Parms, out = false;
	wcag2Parms = validateWCAG2Parms(wcag2);
	switch (wcag2Parms.level + wcag2Parms.size) {
		case "AAsmall":
		case "AAAlarge":
			out = readability >= 4.5;
			break;
		case "AAlarge":
			out = readability >= 3;
			break;
		case "AAAsmall":
			out = readability >= 7;
			break;
	}
	return out;
};
tinycolor.mostReadable = function(baseColor, colorList, args) {
	var bestColor = null;
	var bestScore = 0;
	var readability;
	var includeFallbackColors, level, size;
	args = args || {};
	includeFallbackColors = args.includeFallbackColors;
	level = args.level;
	size = args.size;
	for (var i = 0; i < colorList.length; i++) {
		readability = tinycolor.readability(baseColor, colorList[i]);
		if (readability > bestScore) {
			bestScore = readability;
			bestColor = tinycolor(colorList[i]);
		}
	}
	if (tinycolor.isReadable(baseColor, bestColor, {
		level,
		size
	}) || !includeFallbackColors) return bestColor;
	else {
		args.includeFallbackColors = false;
		return tinycolor.mostReadable(baseColor, ["#fff", "#000"], args);
	}
};
var names$1 = tinycolor.names = {
	aliceblue: "f0f8ff",
	antiquewhite: "faebd7",
	aqua: "0ff",
	aquamarine: "7fffd4",
	azure: "f0ffff",
	beige: "f5f5dc",
	bisque: "ffe4c4",
	black: "000",
	blanchedalmond: "ffebcd",
	blue: "00f",
	blueviolet: "8a2be2",
	brown: "a52a2a",
	burlywood: "deb887",
	burntsienna: "ea7e5d",
	cadetblue: "5f9ea0",
	chartreuse: "7fff00",
	chocolate: "d2691e",
	coral: "ff7f50",
	cornflowerblue: "6495ed",
	cornsilk: "fff8dc",
	crimson: "dc143c",
	cyan: "0ff",
	darkblue: "00008b",
	darkcyan: "008b8b",
	darkgoldenrod: "b8860b",
	darkgray: "a9a9a9",
	darkgreen: "006400",
	darkgrey: "a9a9a9",
	darkkhaki: "bdb76b",
	darkmagenta: "8b008b",
	darkolivegreen: "556b2f",
	darkorange: "ff8c00",
	darkorchid: "9932cc",
	darkred: "8b0000",
	darksalmon: "e9967a",
	darkseagreen: "8fbc8f",
	darkslateblue: "483d8b",
	darkslategray: "2f4f4f",
	darkslategrey: "2f4f4f",
	darkturquoise: "00ced1",
	darkviolet: "9400d3",
	deeppink: "ff1493",
	deepskyblue: "00bfff",
	dimgray: "696969",
	dimgrey: "696969",
	dodgerblue: "1e90ff",
	firebrick: "b22222",
	floralwhite: "fffaf0",
	forestgreen: "228b22",
	fuchsia: "f0f",
	gainsboro: "dcdcdc",
	ghostwhite: "f8f8ff",
	gold: "ffd700",
	goldenrod: "daa520",
	gray: "808080",
	green: "008000",
	greenyellow: "adff2f",
	grey: "808080",
	honeydew: "f0fff0",
	hotpink: "ff69b4",
	indianred: "cd5c5c",
	indigo: "4b0082",
	ivory: "fffff0",
	khaki: "f0e68c",
	lavender: "e6e6fa",
	lavenderblush: "fff0f5",
	lawngreen: "7cfc00",
	lemonchiffon: "fffacd",
	lightblue: "add8e6",
	lightcoral: "f08080",
	lightcyan: "e0ffff",
	lightgoldenrodyellow: "fafad2",
	lightgray: "d3d3d3",
	lightgreen: "90ee90",
	lightgrey: "d3d3d3",
	lightpink: "ffb6c1",
	lightsalmon: "ffa07a",
	lightseagreen: "20b2aa",
	lightskyblue: "87cefa",
	lightslategray: "789",
	lightslategrey: "789",
	lightsteelblue: "b0c4de",
	lightyellow: "ffffe0",
	lime: "0f0",
	limegreen: "32cd32",
	linen: "faf0e6",
	magenta: "f0f",
	maroon: "800000",
	mediumaquamarine: "66cdaa",
	mediumblue: "0000cd",
	mediumorchid: "ba55d3",
	mediumpurple: "9370db",
	mediumseagreen: "3cb371",
	mediumslateblue: "7b68ee",
	mediumspringgreen: "00fa9a",
	mediumturquoise: "48d1cc",
	mediumvioletred: "c71585",
	midnightblue: "191970",
	mintcream: "f5fffa",
	mistyrose: "ffe4e1",
	moccasin: "ffe4b5",
	navajowhite: "ffdead",
	navy: "000080",
	oldlace: "fdf5e6",
	olive: "808000",
	olivedrab: "6b8e23",
	orange: "ffa500",
	orangered: "ff4500",
	orchid: "da70d6",
	palegoldenrod: "eee8aa",
	palegreen: "98fb98",
	paleturquoise: "afeeee",
	palevioletred: "db7093",
	papayawhip: "ffefd5",
	peachpuff: "ffdab9",
	peru: "cd853f",
	pink: "ffc0cb",
	plum: "dda0dd",
	powderblue: "b0e0e6",
	purple: "800080",
	rebeccapurple: "663399",
	red: "f00",
	rosybrown: "bc8f8f",
	royalblue: "4169e1",
	saddlebrown: "8b4513",
	salmon: "fa8072",
	sandybrown: "f4a460",
	seagreen: "2e8b57",
	seashell: "fff5ee",
	sienna: "a0522d",
	silver: "c0c0c0",
	skyblue: "87ceeb",
	slateblue: "6a5acd",
	slategray: "708090",
	slategrey: "708090",
	snow: "fffafa",
	springgreen: "00ff7f",
	steelblue: "4682b4",
	tan: "d2b48c",
	teal: "008080",
	thistle: "d8bfd8",
	tomato: "ff6347",
	turquoise: "40e0d0",
	violet: "ee82ee",
	wheat: "f5deb3",
	white: "fff",
	whitesmoke: "f5f5f5",
	yellow: "ff0",
	yellowgreen: "9acd32"
};
var hexNames = tinycolor.hexNames = flip(names$1);
function flip(o) {
	var flipped = {};
	for (var i in o) if (o.hasOwnProperty(i)) flipped[o[i]] = i;
	return flipped;
}
function boundAlpha(a) {
	a = parseFloat(a);
	if (isNaN(a) || a < 0 || a > 1) a = 1;
	return a;
}
function bound01(n, max) {
	if (isOnePointZero(n)) n = "100%";
	var processPercent = isPercentage(n);
	n = Math.min(max, Math.max(0, parseFloat(n)));
	if (processPercent) n = parseInt(n * max, 10) / 100;
	if (Math.abs(n - max) < 1e-6) return 1;
	return n % max / parseFloat(max);
}
function clamp01(val) {
	return Math.min(1, Math.max(0, val));
}
function parseIntFromHex(val) {
	return parseInt(val, 16);
}
function isOnePointZero(n) {
	return typeof n == "string" && n.indexOf(".") != -1 && parseFloat(n) === 1;
}
function isPercentage(n) {
	return typeof n === "string" && n.indexOf("%") != -1;
}
function pad2(c) {
	return c.length == 1 ? "0" + c : "" + c;
}
function convertToPercentage(n) {
	if (n <= 1) n = n * 100 + "%";
	return n;
}
function convertDecimalToHex(d) {
	return Math.round(parseFloat(d) * 255).toString(16);
}
function convertHexToDecimal(h) {
	return parseIntFromHex(h) / 255;
}
var matchers = function() {
	var CSS_UNIT = "(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)";
	var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	return {
		CSS_UNIT: new RegExp(CSS_UNIT),
		rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
		rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
		hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
		hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
		hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
		hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
		hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
		hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
		hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
		hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	};
}();
function isValidCSSUnit(color) {
	return !!matchers.CSS_UNIT.exec(color);
}
function stringInputToObject(color) {
	color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
	var named = false;
	if (names$1[color]) {
		color = names$1[color];
		named = true;
	} else if (color == "transparent") return {
		r: 0,
		g: 0,
		b: 0,
		a: 0,
		format: "name"
	};
	var match;
	if (match = matchers.rgb.exec(color)) return {
		r: match[1],
		g: match[2],
		b: match[3]
	};
	if (match = matchers.rgba.exec(color)) return {
		r: match[1],
		g: match[2],
		b: match[3],
		a: match[4]
	};
	if (match = matchers.hsl.exec(color)) return {
		h: match[1],
		s: match[2],
		l: match[3]
	};
	if (match = matchers.hsla.exec(color)) return {
		h: match[1],
		s: match[2],
		l: match[3],
		a: match[4]
	};
	if (match = matchers.hsv.exec(color)) return {
		h: match[1],
		s: match[2],
		v: match[3]
	};
	if (match = matchers.hsva.exec(color)) return {
		h: match[1],
		s: match[2],
		v: match[3],
		a: match[4]
	};
	if (match = matchers.hex8.exec(color)) return {
		r: parseIntFromHex(match[1]),
		g: parseIntFromHex(match[2]),
		b: parseIntFromHex(match[3]),
		a: convertHexToDecimal(match[4]),
		format: named ? "name" : "hex8"
	};
	if (match = matchers.hex6.exec(color)) return {
		r: parseIntFromHex(match[1]),
		g: parseIntFromHex(match[2]),
		b: parseIntFromHex(match[3]),
		format: named ? "name" : "hex"
	};
	if (match = matchers.hex4.exec(color)) return {
		r: parseIntFromHex(match[1] + "" + match[1]),
		g: parseIntFromHex(match[2] + "" + match[2]),
		b: parseIntFromHex(match[3] + "" + match[3]),
		a: convertHexToDecimal(match[4] + "" + match[4]),
		format: named ? "name" : "hex8"
	};
	if (match = matchers.hex3.exec(color)) return {
		r: parseIntFromHex(match[1] + "" + match[1]),
		g: parseIntFromHex(match[2] + "" + match[2]),
		b: parseIntFromHex(match[3] + "" + match[3]),
		format: named ? "name" : "hex"
	};
	return false;
}
function validateWCAG2Parms(parms) {
	var level, size;
	parms = parms || {
		level: "AA",
		size: "small"
	};
	level = (parms.level || "AA").toUpperCase();
	size = (parms.size || "small").toLowerCase();
	if (level !== "AA" && level !== "AAA") level = "AA";
	if (size !== "small" && size !== "large") size = "small";
	return {
		level,
		size
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@jimp+utils@1.6.1/node_modules/@jimp/utils/dist/esm/index.js
function scan(image, xArg, yArg, wArg, hArg, cbArg) {
	let x;
	let y;
	let w;
	let h;
	let cb;
	if (typeof xArg === "function") {
		cb = xArg;
		x = 0;
		y = 0;
		w = image.bitmap.width;
		h = image.bitmap.height;
	} else {
		x = xArg;
		if (typeof yArg !== "number") throw new Error("y must be a number");
		y = yArg;
		if (typeof wArg !== "number") throw new Error("w must be a number");
		w = wArg;
		if (typeof hArg !== "number") throw new Error("h must be a number");
		h = hArg;
		if (typeof cbArg !== "function") throw new Error("cb must be a function");
		cb = cbArg;
	}
	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);
	const bound = cb.bind(image);
	for (let _y = y; _y < y + h; _y++) for (let _x = x; _x < x + w; _x++) {
		const idx = image.bitmap.width * _y + _x << 2;
		bound(_x, _y, idx);
	}
	return image;
}
function* scanIterator(image, x, y, w, h) {
	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);
	for (let _y = y; _y < y + h; _y++) for (let _x = x; _x < x + w; _x++) {
		const idx = image.bitmap.width * _y + _x << 2;
		yield {
			x: _x,
			y: _y,
			idx,
			image
		};
	}
}
/**
* A helper method that converts RGBA values to a single integer value
* @param i A single integer value representing an RGBA colour (e.g. 0xFF0000FF for red)
* @returns An object with the properties r, g, b and a representing RGBA values
* @example
* ```ts
* import { intToRGBA } from "@jimp/utils";
*
* intToRGBA(0xFF0000FF); // { r: 255, g: 0, b: 0, a:255 }
* ```
*/
function intToRGBA(i) {
	if (typeof i !== "number") throw new Error("i must be a number");
	const rgba = {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	};
	rgba.r = Math.floor(i / Math.pow(256, 3));
	rgba.g = Math.floor((i - rgba.r * Math.pow(256, 3)) / Math.pow(256, 2));
	rgba.b = Math.floor((i - rgba.r * Math.pow(256, 3) - rgba.g * Math.pow(256, 2)) / Math.pow(256, 1));
	rgba.a = Math.floor((i - rgba.r * Math.pow(256, 3) - rgba.g * Math.pow(256, 2) - rgba.b * Math.pow(256, 1)) / Math.pow(256, 0));
	return rgba;
}
/**
* Compute color difference
* 0 means no difference, 1 means maximum difference.
* Both parameters must be an color object `{ r:val, g:val, b:val, a:val }`
* Where `a` is optional and `val` is an integer between 0 and 255.
* @param rgba1 first color to compare.
* @param rgba2 second color to compare.
* @returns float between 0 and 1.
* @example
* ```ts
* import { colorDiff } from "@jimp/utils";
*
* colorDiff(
*  { r: 255, g: 0, b: 0, a: 0 },
*  { r: 0, g: 255, b: 0, a: 0 },
* ); // 0.5
*
* colorDiff(
*  { r: 0, g: 0, b: 0, },
*  { r: 255, g: 255, b: 255, }
* ); // 0.7
* ```
*/
function colorDiff(rgba1, rgba2) {
	const sq = (n) => Math.pow(n, 2);
	const { max } = Math;
	const maxVal = 65025 * 3;
	const rgba1A = "a" in rgba1 ? rgba1.a : 255;
	const rgba2A = "a" in rgba2 ? rgba2.a : 255;
	return (max(sq(rgba1.r - rgba2.r), sq(rgba1.r - rgba2.r - rgba1A + rgba2A)) + max(sq(rgba1.g - rgba2.g), sq(rgba1.g - rgba2.g - rgba1A + rgba2A)) + max(sq(rgba1.b - rgba2.b), sq(rgba1.b - rgba2.b - rgba1A + rgba2A))) / maxVal;
}
/**
* Limits a number to between 0 or 255
* @example
* ```ts
* import { limit255 } from "@jimp/utils";
*
* limit255(256); // 255
* limit255(-1); // 0
* ```
*/
function limit255(n) {
	n = Math.max(n, 0);
	n = Math.min(n, 255);
	return n;
}
/**
* Converts a css color (Hex, 8-digit (RGBA) Hex, RGB, RGBA, HSL, HSLA, HSV, HSVA, Named) to a hex number
* @returns A hex number representing a color
* @example
* ```ts
* import { cssColorToHex } from "@jimp/utils";
*
* cssColorToHex("rgba(255, 0, 0, 0.5)"); // "ff000080"
* ```
*/
function cssColorToHex(cssColor) {
	if (typeof cssColor === "number") return cssColor;
	return parseInt(tinycolor(cssColor).toHex8(), 16);
}
//#endregion
//#region ../../node_modules/.pnpm/@jimp+file-ops@1.6.1/node_modules/@jimp/file-ops/dist/esm/index.js
var import_await_to_js_umd = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : factory(global.awaitToJs = {});
	})(exports, (function(exports$1) {
		"use strict";
		/**
		* @param { Promise } promise
		* @param { Object= } errorExt - Additional Information you can pass to the err object
		* @return { Promise }
		*/
		function to(promise, errorExt) {
			return promise.then(function(data) {
				return [null, data];
			}).catch(function(err) {
				if (errorExt) Object.assign(err, errorExt);
				return [err, void 0];
			});
		}
		exports$1.to = to;
		exports$1["default"] = to;
		Object.defineProperty(exports$1, "__esModule", { value: true });
	}));
})))();
const readFile = promises.readFile;
const writeFile = promises.writeFile;
//#endregion
//#region ../../node_modules/.pnpm/mime@3.0.0/node_modules/mime/Mime.js
var require_Mime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* @param typeMap [Object] Map of MIME type -> Array[extensions]
	* @param ...
	*/
	function Mime() {
		this._types = Object.create(null);
		this._extensions = Object.create(null);
		for (let i = 0; i < arguments.length; i++) this.define(arguments[i]);
		this.define = this.define.bind(this);
		this.getType = this.getType.bind(this);
		this.getExtension = this.getExtension.bind(this);
	}
	/**
	* Define mimetype -> extension mappings.  Each key is a mime-type that maps
	* to an array of extensions associated with the type.  The first extension is
	* used as the default extension for the type.
	*
	* e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
	*
	* If a type declares an extension that has already been defined, an error will
	* be thrown.  To suppress this error and force the extension to be associated
	* with the new type, pass `force`=true.  Alternatively, you may prefix the
	* extension with "*" to map the type to extension, without mapping the
	* extension to the type.
	*
	* e.g. mime.define({'audio/wav', ['wav']}, {'audio/x-wav', ['*wav']});
	*
	*
	* @param map (Object) type definitions
	* @param force (Boolean) if true, force overriding of existing definitions
	*/
	Mime.prototype.define = function(typeMap, force) {
		for (let type in typeMap) {
			let extensions = typeMap[type].map(function(t) {
				return t.toLowerCase();
			});
			type = type.toLowerCase();
			for (let i = 0; i < extensions.length; i++) {
				const ext = extensions[i];
				if (ext[0] === "*") continue;
				if (!force && ext in this._types) throw new Error("Attempt to change mapping for \"" + ext + "\" extension from \"" + this._types[ext] + "\" to \"" + type + "\". Pass `force=true` to allow this, otherwise remove \"" + ext + "\" from the list of extensions for \"" + type + "\".");
				this._types[ext] = type;
			}
			if (force || !this._extensions[type]) {
				const ext = extensions[0];
				this._extensions[type] = ext[0] !== "*" ? ext : ext.substr(1);
			}
		}
	};
	/**
	* Lookup a mime type based on extension
	*/
	Mime.prototype.getType = function(path) {
		path = String(path);
		let last = path.replace(/^.*[/\\]/, "").toLowerCase();
		let ext = last.replace(/^.*\./, "").toLowerCase();
		let hasPath = last.length < path.length;
		return (ext.length < last.length - 1 || !hasPath) && this._types[ext] || null;
	};
	/**
	* Return file extension associated with a mime type
	*/
	Mime.prototype.getExtension = function(type) {
		type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
		return type && this._extensions[type.toLowerCase()] || null;
	};
	module.exports = Mime;
}));
//#endregion
//#region ../../node_modules/.pnpm/mime@3.0.0/node_modules/mime/types/standard.js
var require_standard = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"application/andrew-inset": ["ez"],
		"application/applixware": ["aw"],
		"application/atom+xml": ["atom"],
		"application/atomcat+xml": ["atomcat"],
		"application/atomdeleted+xml": ["atomdeleted"],
		"application/atomsvc+xml": ["atomsvc"],
		"application/atsc-dwd+xml": ["dwd"],
		"application/atsc-held+xml": ["held"],
		"application/atsc-rsat+xml": ["rsat"],
		"application/bdoc": ["bdoc"],
		"application/calendar+xml": ["xcs"],
		"application/ccxml+xml": ["ccxml"],
		"application/cdfx+xml": ["cdfx"],
		"application/cdmi-capability": ["cdmia"],
		"application/cdmi-container": ["cdmic"],
		"application/cdmi-domain": ["cdmid"],
		"application/cdmi-object": ["cdmio"],
		"application/cdmi-queue": ["cdmiq"],
		"application/cu-seeme": ["cu"],
		"application/dash+xml": ["mpd"],
		"application/davmount+xml": ["davmount"],
		"application/docbook+xml": ["dbk"],
		"application/dssc+der": ["dssc"],
		"application/dssc+xml": ["xdssc"],
		"application/ecmascript": ["es", "ecma"],
		"application/emma+xml": ["emma"],
		"application/emotionml+xml": ["emotionml"],
		"application/epub+zip": ["epub"],
		"application/exi": ["exi"],
		"application/express": ["exp"],
		"application/fdt+xml": ["fdt"],
		"application/font-tdpfr": ["pfr"],
		"application/geo+json": ["geojson"],
		"application/gml+xml": ["gml"],
		"application/gpx+xml": ["gpx"],
		"application/gxf": ["gxf"],
		"application/gzip": ["gz"],
		"application/hjson": ["hjson"],
		"application/hyperstudio": ["stk"],
		"application/inkml+xml": ["ink", "inkml"],
		"application/ipfix": ["ipfix"],
		"application/its+xml": ["its"],
		"application/java-archive": [
			"jar",
			"war",
			"ear"
		],
		"application/java-serialized-object": ["ser"],
		"application/java-vm": ["class"],
		"application/javascript": ["js", "mjs"],
		"application/json": ["json", "map"],
		"application/json5": ["json5"],
		"application/jsonml+json": ["jsonml"],
		"application/ld+json": ["jsonld"],
		"application/lgr+xml": ["lgr"],
		"application/lost+xml": ["lostxml"],
		"application/mac-binhex40": ["hqx"],
		"application/mac-compactpro": ["cpt"],
		"application/mads+xml": ["mads"],
		"application/manifest+json": ["webmanifest"],
		"application/marc": ["mrc"],
		"application/marcxml+xml": ["mrcx"],
		"application/mathematica": [
			"ma",
			"nb",
			"mb"
		],
		"application/mathml+xml": ["mathml"],
		"application/mbox": ["mbox"],
		"application/mediaservercontrol+xml": ["mscml"],
		"application/metalink+xml": ["metalink"],
		"application/metalink4+xml": ["meta4"],
		"application/mets+xml": ["mets"],
		"application/mmt-aei+xml": ["maei"],
		"application/mmt-usd+xml": ["musd"],
		"application/mods+xml": ["mods"],
		"application/mp21": ["m21", "mp21"],
		"application/mp4": ["mp4s", "m4p"],
		"application/msword": ["doc", "dot"],
		"application/mxf": ["mxf"],
		"application/n-quads": ["nq"],
		"application/n-triples": ["nt"],
		"application/node": ["cjs"],
		"application/octet-stream": [
			"bin",
			"dms",
			"lrf",
			"mar",
			"so",
			"dist",
			"distz",
			"pkg",
			"bpk",
			"dump",
			"elc",
			"deploy",
			"exe",
			"dll",
			"deb",
			"dmg",
			"iso",
			"img",
			"msi",
			"msp",
			"msm",
			"buffer"
		],
		"application/oda": ["oda"],
		"application/oebps-package+xml": ["opf"],
		"application/ogg": ["ogx"],
		"application/omdoc+xml": ["omdoc"],
		"application/onenote": [
			"onetoc",
			"onetoc2",
			"onetmp",
			"onepkg"
		],
		"application/oxps": ["oxps"],
		"application/p2p-overlay+xml": ["relo"],
		"application/patch-ops-error+xml": ["xer"],
		"application/pdf": ["pdf"],
		"application/pgp-encrypted": ["pgp"],
		"application/pgp-signature": ["asc", "sig"],
		"application/pics-rules": ["prf"],
		"application/pkcs10": ["p10"],
		"application/pkcs7-mime": ["p7m", "p7c"],
		"application/pkcs7-signature": ["p7s"],
		"application/pkcs8": ["p8"],
		"application/pkix-attr-cert": ["ac"],
		"application/pkix-cert": ["cer"],
		"application/pkix-crl": ["crl"],
		"application/pkix-pkipath": ["pkipath"],
		"application/pkixcmp": ["pki"],
		"application/pls+xml": ["pls"],
		"application/postscript": [
			"ai",
			"eps",
			"ps"
		],
		"application/provenance+xml": ["provx"],
		"application/pskc+xml": ["pskcxml"],
		"application/raml+yaml": ["raml"],
		"application/rdf+xml": ["rdf", "owl"],
		"application/reginfo+xml": ["rif"],
		"application/relax-ng-compact-syntax": ["rnc"],
		"application/resource-lists+xml": ["rl"],
		"application/resource-lists-diff+xml": ["rld"],
		"application/rls-services+xml": ["rs"],
		"application/route-apd+xml": ["rapd"],
		"application/route-s-tsid+xml": ["sls"],
		"application/route-usd+xml": ["rusd"],
		"application/rpki-ghostbusters": ["gbr"],
		"application/rpki-manifest": ["mft"],
		"application/rpki-roa": ["roa"],
		"application/rsd+xml": ["rsd"],
		"application/rss+xml": ["rss"],
		"application/rtf": ["rtf"],
		"application/sbml+xml": ["sbml"],
		"application/scvp-cv-request": ["scq"],
		"application/scvp-cv-response": ["scs"],
		"application/scvp-vp-request": ["spq"],
		"application/scvp-vp-response": ["spp"],
		"application/sdp": ["sdp"],
		"application/senml+xml": ["senmlx"],
		"application/sensml+xml": ["sensmlx"],
		"application/set-payment-initiation": ["setpay"],
		"application/set-registration-initiation": ["setreg"],
		"application/shf+xml": ["shf"],
		"application/sieve": ["siv", "sieve"],
		"application/smil+xml": ["smi", "smil"],
		"application/sparql-query": ["rq"],
		"application/sparql-results+xml": ["srx"],
		"application/srgs": ["gram"],
		"application/srgs+xml": ["grxml"],
		"application/sru+xml": ["sru"],
		"application/ssdl+xml": ["ssdl"],
		"application/ssml+xml": ["ssml"],
		"application/swid+xml": ["swidtag"],
		"application/tei+xml": ["tei", "teicorpus"],
		"application/thraud+xml": ["tfi"],
		"application/timestamped-data": ["tsd"],
		"application/toml": ["toml"],
		"application/trig": ["trig"],
		"application/ttml+xml": ["ttml"],
		"application/ubjson": ["ubj"],
		"application/urc-ressheet+xml": ["rsheet"],
		"application/urc-targetdesc+xml": ["td"],
		"application/voicexml+xml": ["vxml"],
		"application/wasm": ["wasm"],
		"application/widget": ["wgt"],
		"application/winhlp": ["hlp"],
		"application/wsdl+xml": ["wsdl"],
		"application/wspolicy+xml": ["wspolicy"],
		"application/xaml+xml": ["xaml"],
		"application/xcap-att+xml": ["xav"],
		"application/xcap-caps+xml": ["xca"],
		"application/xcap-diff+xml": ["xdf"],
		"application/xcap-el+xml": ["xel"],
		"application/xcap-ns+xml": ["xns"],
		"application/xenc+xml": ["xenc"],
		"application/xhtml+xml": ["xhtml", "xht"],
		"application/xliff+xml": ["xlf"],
		"application/xml": [
			"xml",
			"xsl",
			"xsd",
			"rng"
		],
		"application/xml-dtd": ["dtd"],
		"application/xop+xml": ["xop"],
		"application/xproc+xml": ["xpl"],
		"application/xslt+xml": ["*xsl", "xslt"],
		"application/xspf+xml": ["xspf"],
		"application/xv+xml": [
			"mxml",
			"xhvml",
			"xvml",
			"xvm"
		],
		"application/yang": ["yang"],
		"application/yin+xml": ["yin"],
		"application/zip": ["zip"],
		"audio/3gpp": ["*3gpp"],
		"audio/adpcm": ["adp"],
		"audio/amr": ["amr"],
		"audio/basic": ["au", "snd"],
		"audio/midi": [
			"mid",
			"midi",
			"kar",
			"rmi"
		],
		"audio/mobile-xmf": ["mxmf"],
		"audio/mp3": ["*mp3"],
		"audio/mp4": ["m4a", "mp4a"],
		"audio/mpeg": [
			"mpga",
			"mp2",
			"mp2a",
			"mp3",
			"m2a",
			"m3a"
		],
		"audio/ogg": [
			"oga",
			"ogg",
			"spx",
			"opus"
		],
		"audio/s3m": ["s3m"],
		"audio/silk": ["sil"],
		"audio/wav": ["wav"],
		"audio/wave": ["*wav"],
		"audio/webm": ["weba"],
		"audio/xm": ["xm"],
		"font/collection": ["ttc"],
		"font/otf": ["otf"],
		"font/ttf": ["ttf"],
		"font/woff": ["woff"],
		"font/woff2": ["woff2"],
		"image/aces": ["exr"],
		"image/apng": ["apng"],
		"image/avif": ["avif"],
		"image/bmp": ["bmp"],
		"image/cgm": ["cgm"],
		"image/dicom-rle": ["drle"],
		"image/emf": ["emf"],
		"image/fits": ["fits"],
		"image/g3fax": ["g3"],
		"image/gif": ["gif"],
		"image/heic": ["heic"],
		"image/heic-sequence": ["heics"],
		"image/heif": ["heif"],
		"image/heif-sequence": ["heifs"],
		"image/hej2k": ["hej2"],
		"image/hsj2": ["hsj2"],
		"image/ief": ["ief"],
		"image/jls": ["jls"],
		"image/jp2": ["jp2", "jpg2"],
		"image/jpeg": [
			"jpeg",
			"jpg",
			"jpe"
		],
		"image/jph": ["jph"],
		"image/jphc": ["jhc"],
		"image/jpm": ["jpm"],
		"image/jpx": ["jpx", "jpf"],
		"image/jxr": ["jxr"],
		"image/jxra": ["jxra"],
		"image/jxrs": ["jxrs"],
		"image/jxs": ["jxs"],
		"image/jxsc": ["jxsc"],
		"image/jxsi": ["jxsi"],
		"image/jxss": ["jxss"],
		"image/ktx": ["ktx"],
		"image/ktx2": ["ktx2"],
		"image/png": ["png"],
		"image/sgi": ["sgi"],
		"image/svg+xml": ["svg", "svgz"],
		"image/t38": ["t38"],
		"image/tiff": ["tif", "tiff"],
		"image/tiff-fx": ["tfx"],
		"image/webp": ["webp"],
		"image/wmf": ["wmf"],
		"message/disposition-notification": ["disposition-notification"],
		"message/global": ["u8msg"],
		"message/global-delivery-status": ["u8dsn"],
		"message/global-disposition-notification": ["u8mdn"],
		"message/global-headers": ["u8hdr"],
		"message/rfc822": ["eml", "mime"],
		"model/3mf": ["3mf"],
		"model/gltf+json": ["gltf"],
		"model/gltf-binary": ["glb"],
		"model/iges": ["igs", "iges"],
		"model/mesh": [
			"msh",
			"mesh",
			"silo"
		],
		"model/mtl": ["mtl"],
		"model/obj": ["obj"],
		"model/step+xml": ["stpx"],
		"model/step+zip": ["stpz"],
		"model/step-xml+zip": ["stpxz"],
		"model/stl": ["stl"],
		"model/vrml": ["wrl", "vrml"],
		"model/x3d+binary": ["*x3db", "x3dbz"],
		"model/x3d+fastinfoset": ["x3db"],
		"model/x3d+vrml": ["*x3dv", "x3dvz"],
		"model/x3d+xml": ["x3d", "x3dz"],
		"model/x3d-vrml": ["x3dv"],
		"text/cache-manifest": ["appcache", "manifest"],
		"text/calendar": ["ics", "ifb"],
		"text/coffeescript": ["coffee", "litcoffee"],
		"text/css": ["css"],
		"text/csv": ["csv"],
		"text/html": [
			"html",
			"htm",
			"shtml"
		],
		"text/jade": ["jade"],
		"text/jsx": ["jsx"],
		"text/less": ["less"],
		"text/markdown": ["markdown", "md"],
		"text/mathml": ["mml"],
		"text/mdx": ["mdx"],
		"text/n3": ["n3"],
		"text/plain": [
			"txt",
			"text",
			"conf",
			"def",
			"list",
			"log",
			"in",
			"ini"
		],
		"text/richtext": ["rtx"],
		"text/rtf": ["*rtf"],
		"text/sgml": ["sgml", "sgm"],
		"text/shex": ["shex"],
		"text/slim": ["slim", "slm"],
		"text/spdx": ["spdx"],
		"text/stylus": ["stylus", "styl"],
		"text/tab-separated-values": ["tsv"],
		"text/troff": [
			"t",
			"tr",
			"roff",
			"man",
			"me",
			"ms"
		],
		"text/turtle": ["ttl"],
		"text/uri-list": [
			"uri",
			"uris",
			"urls"
		],
		"text/vcard": ["vcard"],
		"text/vtt": ["vtt"],
		"text/xml": ["*xml"],
		"text/yaml": ["yaml", "yml"],
		"video/3gpp": ["3gp", "3gpp"],
		"video/3gpp2": ["3g2"],
		"video/h261": ["h261"],
		"video/h263": ["h263"],
		"video/h264": ["h264"],
		"video/iso.segment": ["m4s"],
		"video/jpeg": ["jpgv"],
		"video/jpm": ["*jpm", "jpgm"],
		"video/mj2": ["mj2", "mjp2"],
		"video/mp2t": ["ts"],
		"video/mp4": [
			"mp4",
			"mp4v",
			"mpg4"
		],
		"video/mpeg": [
			"mpeg",
			"mpg",
			"mpe",
			"m1v",
			"m2v"
		],
		"video/ogg": ["ogv"],
		"video/quicktime": ["qt", "mov"],
		"video/webm": ["webm"]
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@jimp+core@1.6.1/node_modules/@jimp/core/dist/esm/utils/constants.js
var import_lite = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = new (require_Mime())(require_standard());
})))(), 1);
var HorizontalAlign;
(function(HorizontalAlign) {
	HorizontalAlign[HorizontalAlign["LEFT"] = 1] = "LEFT";
	HorizontalAlign[HorizontalAlign["CENTER"] = 2] = "CENTER";
	HorizontalAlign[HorizontalAlign["RIGHT"] = 4] = "RIGHT";
})(HorizontalAlign || (HorizontalAlign = {}));
var VerticalAlign;
(function(VerticalAlign) {
	VerticalAlign[VerticalAlign["TOP"] = 8] = "TOP";
	VerticalAlign[VerticalAlign["MIDDLE"] = 16] = "MIDDLE";
	VerticalAlign[VerticalAlign["BOTTOM"] = 32] = "BOTTOM";
})(VerticalAlign || (VerticalAlign = {}));
/**
* How to blend two images together
*/
var BlendMode;
(function(BlendMode) {
	/**
	* Composite the source image over the destination image.
	* This is the default value. It represents the most intuitive case, where shapes are painted on top of what is below, with transparent areas showing the destination layer.
	*/
	BlendMode["SRC_OVER"] = "srcOver";
	/** Composite the source image under the destination image. */
	BlendMode["DST_OVER"] = "dstOver";
	/**
	* Multiply the color components of the source and destination images.
	* This can only result in the same or darker colors (multiplying by white, 1.0, results in no change; multiplying by black, 0.0, results in black).
	* When compositing two opaque images, this has similar effect to overlapping two transparencies on a projector.
	*
	* This mode is useful for coloring shadows.
	*/
	BlendMode["MULTIPLY"] = "multiply";
	/**
	* The Add mode adds the color information of the base layers and the blending layer.
	* In digital terms, adding color increases the brightness.
	*/
	BlendMode["ADD"] = "add";
	/**
	* Multiply the inverse of the components of the source and destination images, and inverse the result.
	* Inverting the components means that a fully saturated channel (opaque white) is treated as the value 0.0, and values normally treated as 0.0 (black, transparent) are treated as 1.0.
	* This is essentially the same as modulate blend mode, but with the values of the colors inverted before the multiplication and the result being inverted back before rendering.
	* This can only result in the same or lighter colors (multiplying by black, 1.0, results in no change; multiplying by white, 0.0, results in white). Similarly, in the alpha channel, it can only result in more opaque colors.
	* This has similar effect to two projectors displaying their images on the same screen simultaneously.
	*/
	BlendMode["SCREEN"] = "screen";
	/**
	* Multiply the components of the source and destination images after adjusting them to favor the destination.
	* Specifically, if the destination value is smaller, this multiplies it with the source value, whereas is the source value is smaller, it multiplies the inverse of the source value with the inverse of the destination value, then inverts the result.
	* Inverting the components means that a fully saturated channel (opaque white) is treated as the value 0.0, and values normally treated as 0.0 (black, transparent) are treated as 1.0.
	*
	* The Overlay mode behaves like Screen mode in bright areas, and like Multiply mode in darker areas.
	* With this mode, the bright areas will look brighter and the dark areas will look darker.
	*/
	BlendMode["OVERLAY"] = "overlay";
	/**
	* Composite the source and destination image by choosing the lowest value from each color channel.
	* The opacity of the output image is computed in the same way as for srcOver.
	*/
	BlendMode["DARKEN"] = "darken";
	/**
	* Composite the source and destination image by choosing the highest value from each color channel.
	* The opacity of the output image is computed in the same way as for srcOver.
	*/
	BlendMode["LIGHTEN"] = "lighten";
	/**
	* Multiply the components of the source and destination images after adjusting them to favor the source.
	* Specifically, if the source value is smaller, this multiplies it with the destination value, whereas is the destination value is smaller, it multiplies the inverse of the destination value with the inverse of the source value, then inverts the result.
	* Inverting the components means that a fully saturated channel (opaque white) is treated as the value 0.0, and values normally treated as 0.0 (black, transparent) are treated as 1.0.
	*
	* The effect of the Hard light mode depends on the density of the superimposed color. Using bright colors on the blending layer will create a brighter effect like the Screen modes, while dark colors will create darker colors like the Multiply mode.
	*/
	BlendMode["HARD_LIGHT"] = "hardLight";
	/**
	* Subtract the smaller value from the bigger value for each channel.
	* Compositing black has no effect; compositing white inverts the colors of the other image.
	* The opacity of the output image is computed in the same way as for srcOver.
	* The effect is similar to exclusion but harsher.
	*/
	BlendMode["DIFFERENCE"] = "difference";
	/**
	* Subtract double the product of the two images from the sum of the two images.
	* Compositing black has no effect; compositing white inverts the colors of the other image.
	* The opacity of the output image is computed in the same way as for srcOver.
	* The effect is similar to difference but softer.
	*/
	BlendMode["EXCLUSION"] = "exclusion";
})(BlendMode || (BlendMode = {}));
//#endregion
//#region ../../node_modules/.pnpm/@jimp+core@1.6.1/node_modules/@jimp/core/dist/esm/utils/composite-modes.js
var composite_modes_exports = /* @__PURE__ */ __exportAll({
	add: () => add,
	darken: () => darken,
	difference: () => difference,
	dstOver: () => dstOver,
	exclusion: () => exclusion,
	hardLight: () => hardLight,
	lighten: () => lighten,
	multiply: () => multiply,
	names: () => names,
	overlay: () => overlay,
	screen: () => screen,
	srcOver: () => srcOver
});
function srcOver(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	return {
		r: (src.r * src.a + dst.r * dst.a * (1 - src.a)) / a,
		g: (src.g * src.a + dst.g * dst.a * (1 - src.a)) / a,
		b: (src.b * src.a + dst.b * dst.a * (1 - src.a)) / a,
		a
	};
}
function dstOver(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	return {
		r: (dst.r * dst.a + src.r * src.a * (1 - dst.a)) / a,
		g: (dst.g * dst.a + src.g * src.a * (1 - dst.a)) / a,
		b: (dst.b * dst.a + src.b * src.a * (1 - dst.a)) / a,
		a
	};
}
function multiply(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (sra * dra + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
		g: (sga * dga + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
		b: (sba * dba + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
		a
	};
}
function add(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (sra + dra) / a,
		g: (sga + dga) / a,
		b: (sba + dba) / a,
		a
	};
}
function screen(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (sra * dst.a + dra * src.a - sra * dra + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
		g: (sga * dst.a + dga * src.a - sga * dga + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
		b: (sba * dst.a + dba * src.a - sba * dba + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
		a
	};
}
function overlay(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (2 * dra <= dst.a ? 2 * sra * dra + sra * (1 - dst.a) + dra * (1 - src.a) : sra * (1 + dst.a) + dra * (1 + src.a) - 2 * dra * sra - dst.a * src.a) / a,
		g: (2 * dga <= dst.a ? 2 * sga * dga + sga * (1 - dst.a) + dga * (1 - src.a) : sga * (1 + dst.a) + dga * (1 + src.a) - 2 * dga * sga - dst.a * src.a) / a,
		b: (2 * dba <= dst.a ? 2 * sba * dba + sba * (1 - dst.a) + dba * (1 - src.a) : sba * (1 + dst.a) + dba * (1 + src.a) - 2 * dba * sba - dst.a * src.a) / a,
		a
	};
}
function darken(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (Math.min(sra * dst.a, dra * src.a) + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
		g: (Math.min(sga * dst.a, dga * src.a) + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
		b: (Math.min(sba * dst.a, dba * src.a) + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
		a
	};
}
function lighten(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (Math.max(sra * dst.a, dra * src.a) + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
		g: (Math.max(sga * dst.a, dga * src.a) + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
		b: (Math.max(sba * dst.a, dba * src.a) + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
		a
	};
}
function hardLight(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (2 * sra <= src.a ? 2 * sra * dra + sra * (1 - dst.a) + dra * (1 - src.a) : sra * (1 + dst.a) + dra * (1 + src.a) - 2 * dra * sra - dst.a * src.a) / a,
		g: (2 * sga <= src.a ? 2 * sga * dga + sga * (1 - dst.a) + dga * (1 - src.a) : sga * (1 + dst.a) + dga * (1 + src.a) - 2 * dga * sga - dst.a * src.a) / a,
		b: (2 * sba <= src.a ? 2 * sba * dba + sba * (1 - dst.a) + dba * (1 - src.a) : sba * (1 + dst.a) + dba * (1 + src.a) - 2 * dba * sba - dst.a * src.a) / a,
		a
	};
}
function difference(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (sra + dra - 2 * Math.min(sra * dst.a, dra * src.a)) / a,
		g: (sga + dga - 2 * Math.min(sga * dst.a, dga * src.a)) / a,
		b: (sba + dba - 2 * Math.min(sba * dst.a, dba * src.a)) / a,
		a
	};
}
function exclusion(src, dst, ops = 1) {
	src.a *= ops;
	const a = dst.a + src.a - dst.a * src.a;
	const sra = src.r * src.a;
	const sga = src.g * src.a;
	const sba = src.b * src.a;
	const dra = dst.r * dst.a;
	const dga = dst.g * dst.a;
	const dba = dst.b * dst.a;
	return {
		r: (sra * dst.a + dra * src.a - 2 * sra * dra + sra * (1 - dst.a) + dra * (1 - src.a)) / a,
		g: (sga * dst.a + dga * src.a - 2 * sga * dga + sga * (1 - dst.a) + dga * (1 - src.a)) / a,
		b: (sba * dst.a + dba * src.a - 2 * sba * dba + sba * (1 - dst.a) + dba * (1 - src.a)) / a,
		a
	};
}
const names = [
	srcOver,
	dstOver,
	multiply,
	add,
	screen,
	overlay,
	darken,
	lighten,
	hardLight,
	difference,
	exclusion
];
//#endregion
//#region ../../node_modules/.pnpm/@jimp+core@1.6.1/node_modules/@jimp/core/dist/esm/utils/composite.js
function composite(baseImage, src, x = 0, y = 0, options = {}) {
	if (!(src instanceof baseImage.constructor)) throw new Error("The source must be a Jimp image");
	if (typeof x !== "number" || typeof y !== "number") throw new Error("x and y must be numbers");
	const { mode = BlendMode.SRC_OVER } = options;
	let { opacitySource = 1, opacityDest = 1 } = options;
	if (typeof opacitySource !== "number" || opacitySource < 0 || opacitySource > 1) opacitySource = 1;
	if (typeof opacityDest !== "number" || opacityDest < 0 || opacityDest > 1) opacityDest = 1;
	const blendmode = composite_modes_exports[mode];
	x = Math.round(x);
	y = Math.round(y);
	if (opacityDest !== 1) baseImage.scan((_, __, idx) => {
		const v = baseImage.bitmap.data[idx + 3] * opacityDest;
		baseImage.bitmap.data[idx + 3] = v;
	});
	src.scan((sx, sy, idx) => {
		const dstIdx = baseImage.getPixelIndex(x + sx, y + sy, Edge.CROP);
		if (dstIdx === -1) return;
		const blended = blendmode({
			r: src.bitmap.data[idx + 0] / 255,
			g: src.bitmap.data[idx + 1] / 255,
			b: src.bitmap.data[idx + 2] / 255,
			a: src.bitmap.data[idx + 3] / 255
		}, {
			r: baseImage.bitmap.data[dstIdx + 0] / 255,
			g: baseImage.bitmap.data[dstIdx + 1] / 255,
			b: baseImage.bitmap.data[dstIdx + 2] / 255,
			a: baseImage.bitmap.data[dstIdx + 3] / 255
		}, opacitySource);
		baseImage.bitmap.data[dstIdx + 0] = limit255(blended.r * 255);
		baseImage.bitmap.data[dstIdx + 1] = limit255(blended.g * 255);
		baseImage.bitmap.data[dstIdx + 2] = limit255(blended.b * 255);
		baseImage.bitmap.data[dstIdx + 3] = limit255(blended.a * 255);
	});
	return baseImage;
}
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/jpeg.js
var require_jpeg = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		parseSections: function(stream, iterator) {
			var len, markerType;
			stream.setBigEndian(true);
			while (stream.remainingLength() > 0 && markerType !== 218) {
				if (stream.nextUInt8() !== 255) throw new Error("Invalid JPEG section offset");
				markerType = stream.nextUInt8();
				if (markerType >= 208 && markerType <= 217 || markerType === 218) len = 0;
				else len = stream.nextUInt16() - 2;
				iterator(markerType, stream.branch(0, len));
				stream.skip(len);
			}
		},
		getSizeFromSOFSection: function(stream) {
			stream.skip(1);
			return {
				height: stream.nextUInt16(),
				width: stream.nextUInt16()
			};
		},
		getSectionName: function(markerType) {
			var name, index;
			switch (markerType) {
				case 216:
					name = "SOI";
					break;
				case 196:
					name = "DHT";
					break;
				case 219:
					name = "DQT";
					break;
				case 221:
					name = "DRI";
					break;
				case 218:
					name = "SOS";
					break;
				case 254:
					name = "COM";
					break;
				case 217:
					name = "EOI";
					break;
				default:
					if (markerType >= 224 && markerType <= 239) {
						name = "APP";
						index = markerType - 224;
					} else if (markerType >= 192 && markerType <= 207 && markerType !== 196 && markerType !== 200 && markerType !== 204) {
						name = "SOF";
						index = markerType - 192;
					} else if (markerType >= 208 && markerType <= 215) {
						name = "RST";
						index = markerType - 208;
					}
					break;
			}
			var nameStruct = { name };
			if (typeof index === "number") nameStruct.index = index;
			return nameStruct;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/exif.js
var require_exif = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function readExifValue(format, stream) {
		switch (format) {
			case 1: return stream.nextUInt8();
			case 3: return stream.nextUInt16();
			case 4: return stream.nextUInt32();
			case 5: return [stream.nextUInt32(), stream.nextUInt32()];
			case 6: return stream.nextInt8();
			case 8: return stream.nextUInt16();
			case 9: return stream.nextUInt32();
			case 10: return [stream.nextInt32(), stream.nextInt32()];
			case 11: return stream.nextFloat();
			case 12: return stream.nextDouble();
			default: throw new Error("Invalid format while decoding: " + format);
		}
	}
	function getBytesPerComponent(format) {
		switch (format) {
			case 1:
			case 2:
			case 6:
			case 7: return 1;
			case 3:
			case 8: return 2;
			case 4:
			case 9:
			case 11: return 4;
			case 5:
			case 10:
			case 12: return 8;
			default: return 0;
		}
	}
	function readExifTag(tiffMarker, stream) {
		var tagType = stream.nextUInt16(), format = stream.nextUInt16(), bytesPerComponent = getBytesPerComponent(format), components = stream.nextUInt32(), valueBytes = bytesPerComponent * components, values, c;
		if (valueBytes > 4) stream = tiffMarker.openWithOffset(stream.nextUInt32());
		if (format === 2) {
			values = stream.nextString(components);
			var lastNull = values.indexOf("\0");
			if (lastNull !== -1) values = values.substr(0, lastNull);
		} else if (format === 7) values = stream.nextBuffer(components);
		else if (format !== 0) {
			values = [];
			for (c = 0; c < components; ++c) values.push(readExifValue(format, stream));
		}
		if (valueBytes < 4) stream.skip(4 - valueBytes);
		return [
			tagType,
			values,
			format
		];
	}
	function readIFDSection(tiffMarker, stream, iterator) {
		var numberOfEntries = stream.nextUInt16(), tag, i;
		for (i = 0; i < numberOfEntries; ++i) {
			tag = readExifTag(tiffMarker, stream);
			iterator(tag[0], tag[1], tag[2]);
		}
	}
	function readHeader(stream) {
		if (stream.nextString(6) !== "Exif\0\0") throw new Error("Invalid EXIF header");
		var tiffMarker = stream.mark();
		var tiffHeader = stream.nextUInt16();
		if (tiffHeader === 18761) stream.setBigEndian(false);
		else if (tiffHeader === 19789) stream.setBigEndian(true);
		else throw new Error("Invalid TIFF header");
		if (stream.nextUInt16() !== 42) throw new Error("Invalid TIFF data");
		return tiffMarker;
	}
	module.exports = {
		IFD0: 1,
		IFD1: 2,
		GPSIFD: 3,
		SubIFD: 4,
		InteropIFD: 5,
		parseTags: function(stream, iterator) {
			var tiffMarker;
			try {
				tiffMarker = readHeader(stream);
			} catch (e) {
				return false;
			}
			var subIfdOffset, gpsOffset, interopOffset;
			var ifd0Stream = tiffMarker.openWithOffset(stream.nextUInt32()), IFD0 = this.IFD0;
			readIFDSection(tiffMarker, ifd0Stream, function(tagType, value, format) {
				switch (tagType) {
					case 34853:
						gpsOffset = value[0];
						break;
					case 34665:
						subIfdOffset = value[0];
						break;
					default:
						iterator(IFD0, tagType, value, format);
						break;
				}
			});
			var ifd1Offset = ifd0Stream.nextUInt32();
			if (ifd1Offset !== 0) {
				var ifd1Stream = tiffMarker.openWithOffset(ifd1Offset);
				readIFDSection(tiffMarker, ifd1Stream, iterator.bind(null, this.IFD1));
			}
			if (gpsOffset) {
				var gpsStream = tiffMarker.openWithOffset(gpsOffset);
				readIFDSection(tiffMarker, gpsStream, iterator.bind(null, this.GPSIFD));
			}
			if (subIfdOffset) {
				var subIfdStream = tiffMarker.openWithOffset(subIfdOffset), InteropIFD = this.InteropIFD;
				readIFDSection(tiffMarker, subIfdStream, function(tagType, value, format) {
					if (tagType === 40965) interopOffset = value[0];
					else iterator(InteropIFD, tagType, value, format);
				});
			}
			if (interopOffset) {
				var interopStream = tiffMarker.openWithOffset(interopOffset);
				readIFDSection(tiffMarker, interopStream, iterator.bind(null, this.InteropIFD));
			}
			return true;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/date.js
var require_date = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function parseNumber(s) {
		return parseInt(s, 10);
	}
	var hours = 3600;
	var minutes = 60;
	function parseDateTimeParts(dateParts, timeParts) {
		dateParts = dateParts.map(parseNumber);
		timeParts = timeParts.map(parseNumber);
		var year = dateParts[0];
		var month = dateParts[1] - 1;
		var day = dateParts[2];
		var hours = timeParts[0];
		var minutes = timeParts[1];
		var seconds = timeParts[2];
		return Date.UTC(year, month, day, hours, minutes, seconds, 0) / 1e3;
	}
	function parseDateWithTimezoneFormat(dateTimeStr) {
		var dateParts = dateTimeStr.substr(0, 10).split("-");
		var timeParts = dateTimeStr.substr(11, 8).split(":");
		var timezoneParts = dateTimeStr.substr(19, 6).split(":").map(parseNumber);
		var timezoneOffset = timezoneParts[0] * hours + timezoneParts[1] * minutes;
		var timestamp = parseDateTimeParts(dateParts, timeParts);
		timestamp -= timezoneOffset;
		if (typeof timestamp === "number" && !isNaN(timestamp)) return timestamp;
	}
	function parseDateWithSpecFormat(dateTimeStr) {
		var parts = dateTimeStr.split(" ");
		var timestamp = parseDateTimeParts(parts[0].split(":"), parts[1].split(":"));
		if (typeof timestamp === "number" && !isNaN(timestamp)) return timestamp;
	}
	function parseExifDate(dateTimeStr) {
		var isSpecFormat = dateTimeStr.length === 19 && dateTimeStr.charAt(4) === ":";
		if (dateTimeStr.length === 25 && dateTimeStr.charAt(10) === "T") return parseDateWithTimezoneFormat(dateTimeStr);
		else if (isSpecFormat) return parseDateWithSpecFormat(dateTimeStr);
	}
	module.exports = {
		parseDateWithSpecFormat,
		parseDateWithTimezoneFormat,
		parseExifDate
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/simplify.js
var require_simplify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var exif = require_exif();
	var date = require_date();
	var degreeTags = [{
		section: exif.GPSIFD,
		type: 2,
		name: "GPSLatitude",
		refType: 1,
		refName: "GPSLatitudeRef",
		posVal: "N"
	}, {
		section: exif.GPSIFD,
		type: 4,
		name: "GPSLongitude",
		refType: 3,
		refName: "GPSLongitudeRef",
		posVal: "E"
	}];
	var dateTags = [
		{
			section: exif.SubIFD,
			type: 306,
			name: "ModifyDate"
		},
		{
			section: exif.SubIFD,
			type: 36867,
			name: "DateTimeOriginal"
		},
		{
			section: exif.SubIFD,
			type: 36868,
			name: "CreateDate"
		},
		{
			section: exif.SubIFD,
			type: 306,
			name: "ModifyDate"
		}
	];
	module.exports = {
		castDegreeValues: function(getTagValue, setTagValue) {
			degreeTags.forEach(function(t) {
				var degreeVal = getTagValue(t);
				if (degreeVal) {
					var degreeNumRef = getTagValue({
						section: t.section,
						type: t.refType,
						name: t.refName
					}) === t.posVal ? 1 : -1;
					setTagValue(t, (degreeVal[0] + degreeVal[1] / 60 + degreeVal[2] / 3600) * degreeNumRef);
				}
			});
		},
		castDateValues: function(getTagValue, setTagValue) {
			dateTags.forEach(function(t) {
				var dateStrVal = getTagValue(t);
				if (dateStrVal) {
					var timestamp = date.parseExifDate(dateStrVal);
					if (typeof timestamp !== "undefined") setTagValue(t, timestamp);
				}
			});
		},
		simplifyValue: function(values, format) {
			if (Array.isArray(values)) {
				values = values.map(function(value) {
					if (format === 10 || format === 5) return value[0] / value[1];
					return value;
				});
				if (values.length === 1) values = values[0];
			}
			return values;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/exif-tags.js
var require_exif_tags = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		exif: {
			1: "InteropIndex",
			2: "InteropVersion",
			11: "ProcessingSoftware",
			254: "SubfileType",
			255: "OldSubfileType",
			256: "ImageWidth",
			257: "ImageHeight",
			258: "BitsPerSample",
			259: "Compression",
			262: "PhotometricInterpretation",
			263: "Thresholding",
			264: "CellWidth",
			265: "CellLength",
			266: "FillOrder",
			269: "DocumentName",
			270: "ImageDescription",
			271: "Make",
			272: "Model",
			273: "StripOffsets",
			274: "Orientation",
			277: "SamplesPerPixel",
			278: "RowsPerStrip",
			279: "StripByteCounts",
			280: "MinSampleValue",
			281: "MaxSampleValue",
			282: "XResolution",
			283: "YResolution",
			284: "PlanarConfiguration",
			285: "PageName",
			286: "XPosition",
			287: "YPosition",
			288: "FreeOffsets",
			289: "FreeByteCounts",
			290: "GrayResponseUnit",
			291: "GrayResponseCurve",
			292: "T4Options",
			293: "T6Options",
			296: "ResolutionUnit",
			297: "PageNumber",
			300: "ColorResponseUnit",
			301: "TransferFunction",
			305: "Software",
			306: "ModifyDate",
			315: "Artist",
			316: "HostComputer",
			317: "Predictor",
			318: "WhitePoint",
			319: "PrimaryChromaticities",
			320: "ColorMap",
			321: "HalftoneHints",
			322: "TileWidth",
			323: "TileLength",
			324: "TileOffsets",
			325: "TileByteCounts",
			326: "BadFaxLines",
			327: "CleanFaxData",
			328: "ConsecutiveBadFaxLines",
			330: "SubIFD",
			332: "InkSet",
			333: "InkNames",
			334: "NumberofInks",
			336: "DotRange",
			337: "TargetPrinter",
			338: "ExtraSamples",
			339: "SampleFormat",
			340: "SMinSampleValue",
			341: "SMaxSampleValue",
			342: "TransferRange",
			343: "ClipPath",
			344: "XClipPathUnits",
			345: "YClipPathUnits",
			346: "Indexed",
			347: "JPEGTables",
			351: "OPIProxy",
			400: "GlobalParametersIFD",
			401: "ProfileType",
			402: "FaxProfile",
			403: "CodingMethods",
			404: "VersionYear",
			405: "ModeNumber",
			433: "Decode",
			434: "DefaultImageColor",
			435: "T82Options",
			437: "JPEGTables",
			512: "JPEGProc",
			513: "ThumbnailOffset",
			514: "ThumbnailLength",
			515: "JPEGRestartInterval",
			517: "JPEGLosslessPredictors",
			518: "JPEGPointTransforms",
			519: "JPEGQTables",
			520: "JPEGDCTables",
			521: "JPEGACTables",
			529: "YCbCrCoefficients",
			530: "YCbCrSubSampling",
			531: "YCbCrPositioning",
			532: "ReferenceBlackWhite",
			559: "StripRowCounts",
			700: "ApplicationNotes",
			999: "USPTOMiscellaneous",
			4096: "RelatedImageFileFormat",
			4097: "RelatedImageWidth",
			4098: "RelatedImageHeight",
			18246: "Rating",
			18247: "XP_DIP_XML",
			18248: "StitchInfo",
			18249: "RatingPercent",
			32781: "ImageID",
			32931: "WangTag1",
			32932: "WangAnnotation",
			32933: "WangTag3",
			32934: "WangTag4",
			32995: "Matteing",
			32996: "DataType",
			32997: "ImageDepth",
			32998: "TileDepth",
			33405: "Model2",
			33421: "CFARepeatPatternDim",
			33422: "CFAPattern2",
			33423: "BatteryLevel",
			33424: "KodakIFD",
			33432: "Copyright",
			33434: "ExposureTime",
			33437: "FNumber",
			33445: "MDFileTag",
			33446: "MDScalePixel",
			33447: "MDColorTable",
			33448: "MDLabName",
			33449: "MDSampleInfo",
			33450: "MDPrepDate",
			33451: "MDPrepTime",
			33452: "MDFileUnits",
			33550: "PixelScale",
			33589: "AdventScale",
			33590: "AdventRevision",
			33628: "UIC1Tag",
			33629: "UIC2Tag",
			33630: "UIC3Tag",
			33631: "UIC4Tag",
			33723: "IPTC-NAA",
			33918: "IntergraphPacketData",
			33919: "IntergraphFlagRegisters",
			33920: "IntergraphMatrix",
			33921: "INGRReserved",
			33922: "ModelTiePoint",
			34016: "Site",
			34017: "ColorSequence",
			34018: "IT8Header",
			34019: "RasterPadding",
			34020: "BitsPerRunLength",
			34021: "BitsPerExtendedRunLength",
			34022: "ColorTable",
			34023: "ImageColorIndicator",
			34024: "BackgroundColorIndicator",
			34025: "ImageColorValue",
			34026: "BackgroundColorValue",
			34027: "PixelIntensityRange",
			34028: "TransparencyIndicator",
			34029: "ColorCharacterization",
			34030: "HCUsage",
			34031: "TrapIndicator",
			34032: "CMYKEquivalent",
			34118: "SEMInfo",
			34152: "AFCP_IPTC",
			34232: "PixelMagicJBIGOptions",
			34264: "ModelTransform",
			34306: "WB_GRGBLevels",
			34310: "LeafData",
			34377: "PhotoshopSettings",
			34665: "ExifOffset",
			34675: "ICC_Profile",
			34687: "TIFF_FXExtensions",
			34688: "MultiProfiles",
			34689: "SharedData",
			34690: "T88Options",
			34732: "ImageLayer",
			34735: "GeoTiffDirectory",
			34736: "GeoTiffDoubleParams",
			34737: "GeoTiffAsciiParams",
			34850: "ExposureProgram",
			34852: "SpectralSensitivity",
			34853: "GPSInfo",
			34855: "ISO",
			34856: "Opto-ElectricConvFactor",
			34857: "Interlace",
			34858: "TimeZoneOffset",
			34859: "SelfTimerMode",
			34864: "SensitivityType",
			34865: "StandardOutputSensitivity",
			34866: "RecommendedExposureIndex",
			34867: "ISOSpeed",
			34868: "ISOSpeedLatitudeyyy",
			34869: "ISOSpeedLatitudezzz",
			34908: "FaxRecvParams",
			34909: "FaxSubAddress",
			34910: "FaxRecvTime",
			34954: "LeafSubIFD",
			36864: "ExifVersion",
			36867: "DateTimeOriginal",
			36868: "CreateDate",
			37121: "ComponentsConfiguration",
			37122: "CompressedBitsPerPixel",
			37377: "ShutterSpeedValue",
			37378: "ApertureValue",
			37379: "BrightnessValue",
			37380: "ExposureCompensation",
			37381: "MaxApertureValue",
			37382: "SubjectDistance",
			37383: "MeteringMode",
			37384: "LightSource",
			37385: "Flash",
			37386: "FocalLength",
			37387: "FlashEnergy",
			37388: "SpatialFrequencyResponse",
			37389: "Noise",
			37390: "FocalPlaneXResolution",
			37391: "FocalPlaneYResolution",
			37392: "FocalPlaneResolutionUnit",
			37393: "ImageNumber",
			37394: "SecurityClassification",
			37395: "ImageHistory",
			37396: "SubjectArea",
			37397: "ExposureIndex",
			37398: "TIFF-EPStandardID",
			37399: "SensingMethod",
			37434: "CIP3DataFile",
			37435: "CIP3Sheet",
			37436: "CIP3Side",
			37439: "StoNits",
			37500: "MakerNote",
			37510: "UserComment",
			37520: "SubSecTime",
			37521: "SubSecTimeOriginal",
			37522: "SubSecTimeDigitized",
			37679: "MSDocumentText",
			37680: "MSPropertySetStorage",
			37681: "MSDocumentTextPosition",
			37724: "ImageSourceData",
			40091: "XPTitle",
			40092: "XPComment",
			40093: "XPAuthor",
			40094: "XPKeywords",
			40095: "XPSubject",
			40960: "FlashpixVersion",
			40961: "ColorSpace",
			40962: "ExifImageWidth",
			40963: "ExifImageHeight",
			40964: "RelatedSoundFile",
			40965: "InteropOffset",
			41483: "FlashEnergy",
			41484: "SpatialFrequencyResponse",
			41485: "Noise",
			41486: "FocalPlaneXResolution",
			41487: "FocalPlaneYResolution",
			41488: "FocalPlaneResolutionUnit",
			41489: "ImageNumber",
			41490: "SecurityClassification",
			41491: "ImageHistory",
			41492: "SubjectLocation",
			41493: "ExposureIndex",
			41494: "TIFF-EPStandardID",
			41495: "SensingMethod",
			41728: "FileSource",
			41729: "SceneType",
			41730: "CFAPattern",
			41985: "CustomRendered",
			41986: "ExposureMode",
			41987: "WhiteBalance",
			41988: "DigitalZoomRatio",
			41989: "FocalLengthIn35mmFormat",
			41990: "SceneCaptureType",
			41991: "GainControl",
			41992: "Contrast",
			41993: "Saturation",
			41994: "Sharpness",
			41995: "DeviceSettingDescription",
			41996: "SubjectDistanceRange",
			42016: "ImageUniqueID",
			42032: "OwnerName",
			42033: "SerialNumber",
			42034: "LensInfo",
			42035: "LensMake",
			42036: "LensModel",
			42037: "LensSerialNumber",
			42112: "GDALMetadata",
			42113: "GDALNoData",
			42240: "Gamma",
			44992: "ExpandSoftware",
			44993: "ExpandLens",
			44994: "ExpandFilm",
			44995: "ExpandFilterLens",
			44996: "ExpandScanner",
			44997: "ExpandFlashLamp",
			48129: "PixelFormat",
			48130: "Transformation",
			48131: "Uncompressed",
			48132: "ImageType",
			48256: "ImageWidth",
			48257: "ImageHeight",
			48258: "WidthResolution",
			48259: "HeightResolution",
			48320: "ImageOffset",
			48321: "ImageByteCount",
			48322: "AlphaOffset",
			48323: "AlphaByteCount",
			48324: "ImageDataDiscard",
			48325: "AlphaDataDiscard",
			50215: "OceScanjobDesc",
			50216: "OceApplicationSelector",
			50217: "OceIDNumber",
			50218: "OceImageLogic",
			50255: "Annotations",
			50341: "PrintIM",
			50560: "USPTOOriginalContentType",
			50706: "DNGVersion",
			50707: "DNGBackwardVersion",
			50708: "UniqueCameraModel",
			50709: "LocalizedCameraModel",
			50710: "CFAPlaneColor",
			50711: "CFALayout",
			50712: "LinearizationTable",
			50713: "BlackLevelRepeatDim",
			50714: "BlackLevel",
			50715: "BlackLevelDeltaH",
			50716: "BlackLevelDeltaV",
			50717: "WhiteLevel",
			50718: "DefaultScale",
			50719: "DefaultCropOrigin",
			50720: "DefaultCropSize",
			50721: "ColorMatrix1",
			50722: "ColorMatrix2",
			50723: "CameraCalibration1",
			50724: "CameraCalibration2",
			50725: "ReductionMatrix1",
			50726: "ReductionMatrix2",
			50727: "AnalogBalance",
			50728: "AsShotNeutral",
			50729: "AsShotWhiteXY",
			50730: "BaselineExposure",
			50731: "BaselineNoise",
			50732: "BaselineSharpness",
			50733: "BayerGreenSplit",
			50734: "LinearResponseLimit",
			50735: "CameraSerialNumber",
			50736: "DNGLensInfo",
			50737: "ChromaBlurRadius",
			50738: "AntiAliasStrength",
			50739: "ShadowScale",
			50740: "DNGPrivateData",
			50741: "MakerNoteSafety",
			50752: "RawImageSegmentation",
			50778: "CalibrationIlluminant1",
			50779: "CalibrationIlluminant2",
			50780: "BestQualityScale",
			50781: "RawDataUniqueID",
			50784: "AliasLayerMetadata",
			50827: "OriginalRawFileName",
			50828: "OriginalRawFileData",
			50829: "ActiveArea",
			50830: "MaskedAreas",
			50831: "AsShotICCProfile",
			50832: "AsShotPreProfileMatrix",
			50833: "CurrentICCProfile",
			50834: "CurrentPreProfileMatrix",
			50879: "ColorimetricReference",
			50898: "PanasonicTitle",
			50899: "PanasonicTitle2",
			50931: "CameraCalibrationSig",
			50932: "ProfileCalibrationSig",
			50933: "ProfileIFD",
			50934: "AsShotProfileName",
			50935: "NoiseReductionApplied",
			50936: "ProfileName",
			50937: "ProfileHueSatMapDims",
			50938: "ProfileHueSatMapData1",
			50939: "ProfileHueSatMapData2",
			50940: "ProfileToneCurve",
			50941: "ProfileEmbedPolicy",
			50942: "ProfileCopyright",
			50964: "ForwardMatrix1",
			50965: "ForwardMatrix2",
			50966: "PreviewApplicationName",
			50967: "PreviewApplicationVersion",
			50968: "PreviewSettingsName",
			50969: "PreviewSettingsDigest",
			50970: "PreviewColorSpace",
			50971: "PreviewDateTime",
			50972: "RawImageDigest",
			50973: "OriginalRawFileDigest",
			50974: "SubTileBlockSize",
			50975: "RowInterleaveFactor",
			50981: "ProfileLookTableDims",
			50982: "ProfileLookTableData",
			51008: "OpcodeList1",
			51009: "OpcodeList2",
			51022: "OpcodeList3",
			51041: "NoiseProfile",
			51043: "TimeCodes",
			51044: "FrameRate",
			51058: "TStop",
			51081: "ReelName",
			51089: "OriginalDefaultFinalSize",
			51090: "OriginalBestQualitySize",
			51091: "OriginalDefaultCropSize",
			51105: "CameraLabel",
			51107: "ProfileHueSatMapEncoding",
			51108: "ProfileLookTableEncoding",
			51109: "BaselineExposureOffset",
			51110: "DefaultBlackRender",
			51111: "NewRawImageDigest",
			51112: "RawToPreviewGain",
			51125: "DefaultUserCrop",
			59932: "Padding",
			59933: "OffsetSchema",
			65e3: "OwnerName",
			65001: "SerialNumber",
			65002: "Lens",
			65024: "KDC_IFD",
			65100: "RawFile",
			65101: "Converter",
			65102: "WhiteBalance",
			65105: "Exposure",
			65106: "Shadows",
			65107: "Brightness",
			65108: "Contrast",
			65109: "Saturation",
			65110: "Sharpness",
			65111: "Smoothness",
			65112: "MoireFilter"
		},
		gps: {
			0: "GPSVersionID",
			1: "GPSLatitudeRef",
			2: "GPSLatitude",
			3: "GPSLongitudeRef",
			4: "GPSLongitude",
			5: "GPSAltitudeRef",
			6: "GPSAltitude",
			7: "GPSTimeStamp",
			8: "GPSSatellites",
			9: "GPSStatus",
			10: "GPSMeasureMode",
			11: "GPSDOP",
			12: "GPSSpeedRef",
			13: "GPSSpeed",
			14: "GPSTrackRef",
			15: "GPSTrack",
			16: "GPSImgDirectionRef",
			17: "GPSImgDirection",
			18: "GPSMapDatum",
			19: "GPSDestLatitudeRef",
			20: "GPSDestLatitude",
			21: "GPSDestLongitudeRef",
			22: "GPSDestLongitude",
			23: "GPSDestBearingRef",
			24: "GPSDestBearing",
			25: "GPSDestDistanceRef",
			26: "GPSDestDistance",
			27: "GPSProcessingMethod",
			28: "GPSAreaInformation",
			29: "GPSDateStamp",
			30: "GPSDifferential",
			31: "GPSHPositioningError"
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/parser.js
var require_parser$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var jpeg = require_jpeg(), exif = require_exif(), simplify = require_simplify();
	function ExifResult(startMarker, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset) {
		this.startMarker = startMarker;
		this.tags = tags;
		this.imageSize = imageSize;
		this.thumbnailOffset = thumbnailOffset;
		this.thumbnailLength = thumbnailLength;
		this.thumbnailType = thumbnailType;
		this.app1Offset = app1Offset;
	}
	ExifResult.prototype = {
		hasThumbnail: function(mime) {
			if (!this.thumbnailOffset || !this.thumbnailLength) return false;
			if (typeof mime !== "string") return true;
			if (mime.toLowerCase().trim() === "image/jpeg") return this.thumbnailType === 6;
			if (mime.toLowerCase().trim() === "image/tiff") return this.thumbnailType === 1;
			return false;
		},
		getThumbnailOffset: function() {
			return this.app1Offset + 6 + this.thumbnailOffset;
		},
		getThumbnailLength: function() {
			return this.thumbnailLength;
		},
		getThumbnailBuffer: function() {
			return this._getThumbnailStream().nextBuffer(this.thumbnailLength);
		},
		_getThumbnailStream: function() {
			return this.startMarker.openWithOffset(this.getThumbnailOffset());
		},
		getImageSize: function() {
			return this.imageSize;
		},
		getThumbnailSize: function() {
			var stream = this._getThumbnailStream(), size;
			jpeg.parseSections(stream, function(sectionType, sectionStream) {
				if (jpeg.getSectionName(sectionType).name === "SOF") size = jpeg.getSizeFromSOFSection(sectionStream);
			});
			return size;
		}
	};
	function Parser(stream) {
		this.stream = stream;
		this.flags = {
			readBinaryTags: false,
			resolveTagNames: true,
			simplifyValues: true,
			imageSize: true,
			hidePointers: true,
			returnTags: true
		};
	}
	Parser.prototype = {
		enableBinaryFields: function(enable) {
			this.flags.readBinaryTags = !!enable;
			return this;
		},
		enablePointers: function(enable) {
			this.flags.hidePointers = !enable;
			return this;
		},
		enableTagNames: function(enable) {
			this.flags.resolveTagNames = !!enable;
			return this;
		},
		enableImageSize: function(enable) {
			this.flags.imageSize = !!enable;
			return this;
		},
		enableReturnTags: function(enable) {
			this.flags.returnTags = !!enable;
			return this;
		},
		enableSimpleValues: function(enable) {
			this.flags.simplifyValues = !!enable;
			return this;
		},
		parse: function() {
			var start = this.stream.mark(), stream = start.openWithOffset(0), flags = this.flags, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset, tagNames, getTagValue, setTagValue;
			if (flags.resolveTagNames) tagNames = require_exif_tags();
			if (flags.resolveTagNames) {
				tags = {};
				getTagValue = function(t) {
					return tags[t.name];
				};
				setTagValue = function(t, value) {
					tags[t.name] = value;
				};
			} else {
				tags = [];
				getTagValue = function(t) {
					var i;
					for (i = 0; i < tags.length; ++i) if (tags[i].type === t.type && tags[i].section === t.section) return tags.value;
				};
				setTagValue = function(t, value) {
					var i;
					for (i = 0; i < tags.length; ++i) if (tags[i].type === t.type && tags[i].section === t.section) {
						tags.value = value;
						return;
					}
				};
			}
			jpeg.parseSections(stream, function(sectionType, sectionStream) {
				var validExifHeaders, sectionOffset = sectionStream.offsetFrom(start);
				if (sectionType === 225) {
					validExifHeaders = exif.parseTags(sectionStream, function(ifdSection, tagType, value, format) {
						if (!flags.readBinaryTags && format === 7) return;
						if (tagType === 513) {
							thumbnailOffset = value[0];
							if (flags.hidePointers) return;
						} else if (tagType === 514) {
							thumbnailLength = value[0];
							if (flags.hidePointers) return;
						} else if (tagType === 259) {
							thumbnailType = value[0];
							if (flags.hidePointers) return;
						}
						if (!flags.returnTags) return;
						if (flags.simplifyValues) value = simplify.simplifyValue(value, format);
						if (flags.resolveTagNames) {
							var name = (ifdSection === exif.GPSIFD ? tagNames.gps : tagNames.exif)[tagType];
							if (!name) name = tagNames.exif[tagType];
							if (!tags.hasOwnProperty(name)) tags[name] = value;
						} else tags.push({
							section: ifdSection,
							type: tagType,
							value
						});
					});
					if (validExifHeaders) app1Offset = sectionOffset;
				} else if (flags.imageSize && jpeg.getSectionName(sectionType).name === "SOF") imageSize = jpeg.getSizeFromSOFSection(sectionStream);
			});
			if (flags.simplifyValues) {
				simplify.castDegreeValues(getTagValue, setTagValue);
				simplify.castDateValues(getTagValue, setTagValue);
			}
			return new ExifResult(start, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset);
		}
	};
	module.exports = Parser;
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/dom-bufferstream.js
var require_dom_bufferstream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function DOMBufferStream(arrayBuffer, offset, length, bigEndian, global, parentOffset) {
		this.global = global;
		offset = offset || 0;
		length = length || arrayBuffer.byteLength - offset;
		this.arrayBuffer = arrayBuffer.slice(offset, offset + length);
		this.view = new global.DataView(this.arrayBuffer, 0, this.arrayBuffer.byteLength);
		this.setBigEndian(bigEndian);
		this.offset = 0;
		this.parentOffset = (parentOffset || 0) + offset;
	}
	DOMBufferStream.prototype = {
		setBigEndian: function(bigEndian) {
			this.littleEndian = !bigEndian;
		},
		nextUInt8: function() {
			var value = this.view.getUint8(this.offset);
			this.offset += 1;
			return value;
		},
		nextInt8: function() {
			var value = this.view.getInt8(this.offset);
			this.offset += 1;
			return value;
		},
		nextUInt16: function() {
			var value = this.view.getUint16(this.offset, this.littleEndian);
			this.offset += 2;
			return value;
		},
		nextUInt32: function() {
			var value = this.view.getUint32(this.offset, this.littleEndian);
			this.offset += 4;
			return value;
		},
		nextInt16: function() {
			var value = this.view.getInt16(this.offset, this.littleEndian);
			this.offset += 2;
			return value;
		},
		nextInt32: function() {
			var value = this.view.getInt32(this.offset, this.littleEndian);
			this.offset += 4;
			return value;
		},
		nextFloat: function() {
			var value = this.view.getFloat32(this.offset, this.littleEndian);
			this.offset += 4;
			return value;
		},
		nextDouble: function() {
			var value = this.view.getFloat64(this.offset, this.littleEndian);
			this.offset += 8;
			return value;
		},
		nextBuffer: function(length) {
			var value = this.arrayBuffer.slice(this.offset, this.offset + length);
			this.offset += length;
			return value;
		},
		remainingLength: function() {
			return this.arrayBuffer.byteLength - this.offset;
		},
		nextString: function(length) {
			var value = this.arrayBuffer.slice(this.offset, this.offset + length);
			value = String.fromCharCode.apply(null, new this.global.Uint8Array(value));
			this.offset += length;
			return value;
		},
		mark: function() {
			var self = this;
			return {
				openWithOffset: function(offset) {
					offset = (offset || 0) + this.offset;
					return new DOMBufferStream(self.arrayBuffer, offset, self.arrayBuffer.byteLength - offset, !self.littleEndian, self.global, self.parentOffset);
				},
				offset: this.offset,
				getParentOffset: function() {
					return self.parentOffset;
				}
			};
		},
		offsetFrom: function(marker) {
			return this.parentOffset + this.offset - (marker.offset + marker.getParentOffset());
		},
		skip: function(amount) {
			this.offset += amount;
		},
		branch: function(offset, length) {
			length = typeof length === "number" ? length : this.arrayBuffer.byteLength - (this.offset + offset);
			return new DOMBufferStream(this.arrayBuffer, this.offset + offset, length, !this.littleEndian, this.global, this.parentOffset);
		}
	};
	module.exports = DOMBufferStream;
}));
//#endregion
//#region ../../node_modules/.pnpm/exif-parser@0.1.12/node_modules/exif-parser/lib/bufferstream.js
var require_bufferstream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function BufferStream(buffer, offset, length, bigEndian) {
		this.buffer = buffer;
		this.offset = offset || 0;
		length = typeof length === "number" ? length : buffer.length;
		this.endPosition = this.offset + length;
		this.setBigEndian(bigEndian);
	}
	BufferStream.prototype = {
		setBigEndian: function(bigEndian) {
			this.bigEndian = !!bigEndian;
		},
		nextUInt8: function() {
			var value = this.buffer.readUInt8(this.offset);
			this.offset += 1;
			return value;
		},
		nextInt8: function() {
			var value = this.buffer.readInt8(this.offset);
			this.offset += 1;
			return value;
		},
		nextUInt16: function() {
			var value = this.bigEndian ? this.buffer.readUInt16BE(this.offset) : this.buffer.readUInt16LE(this.offset);
			this.offset += 2;
			return value;
		},
		nextUInt32: function() {
			var value = this.bigEndian ? this.buffer.readUInt32BE(this.offset) : this.buffer.readUInt32LE(this.offset);
			this.offset += 4;
			return value;
		},
		nextInt16: function() {
			var value = this.bigEndian ? this.buffer.readInt16BE(this.offset) : this.buffer.readInt16LE(this.offset);
			this.offset += 2;
			return value;
		},
		nextInt32: function() {
			var value = this.bigEndian ? this.buffer.readInt32BE(this.offset) : this.buffer.readInt32LE(this.offset);
			this.offset += 4;
			return value;
		},
		nextFloat: function() {
			var value = this.bigEndian ? this.buffer.readFloatBE(this.offset) : this.buffer.readFloatLE(this.offset);
			this.offset += 4;
			return value;
		},
		nextDouble: function() {
			var value = this.bigEndian ? this.buffer.readDoubleBE(this.offset) : this.buffer.readDoubleLE(this.offset);
			this.offset += 8;
			return value;
		},
		nextBuffer: function(length) {
			var value = this.buffer.slice(this.offset, this.offset + length);
			this.offset += length;
			return value;
		},
		remainingLength: function() {
			return this.endPosition - this.offset;
		},
		nextString: function(length) {
			var value = this.buffer.toString("utf8", this.offset, this.offset + length);
			this.offset += length;
			return value;
		},
		mark: function() {
			var self = this;
			return {
				openWithOffset: function(offset) {
					offset = (offset || 0) + this.offset;
					return new BufferStream(self.buffer, offset, self.endPosition - offset, self.bigEndian);
				},
				offset: this.offset
			};
		},
		offsetFrom: function(marker) {
			return this.offset - marker.offset;
		},
		skip: function(amount) {
			this.offset += amount;
		},
		branch: function(offset, length) {
			length = typeof length === "number" ? length : this.endPosition - (this.offset + offset);
			return new BufferStream(this.buffer, this.offset + offset, length, this.bigEndian);
		}
	};
	module.exports = BufferStream;
}));
//#endregion
//#region ../../node_modules/.pnpm/@jimp+core@1.6.1/node_modules/@jimp/core/dist/esm/utils/image-bitmap.js
var import_exif_parser = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Parser = require_parser$1();
	function getGlobal() {
		return (0, eval)("this");
	}
	module.exports = { create: function(buffer, global) {
		global = global || getGlobal();
		if (buffer instanceof global.ArrayBuffer) return new Parser(new (require_dom_bufferstream())(buffer, 0, buffer.byteLength, true, global));
		else return new Parser(new (require_bufferstream())(buffer, 0, buffer.length, true));
	} };
})))(), 1);
/**
* Obtains image orientation from EXIF metadata.
*
* @param img a Jimp image object
* @returns a number 1-8 representing EXIF orientation,
*          in particular 1 if orientation tag is missing
*/
function getExifOrientation(img) {
	const _exif = img._exif;
	return _exif && _exif.tags && _exif.tags.Orientation || 1;
}
/**
* Returns a function which translates EXIF-rotated coordinates into
* non-rotated ones.
*
* Transformation reference: http://sylvana.net/jpegcrop/exif_orientation.html.
*
* @param img a Jimp image object
* @returns transformation function for transformBitmap().
*/
function getExifOrientationTransformation(img) {
	const w = img.bitmap.width;
	const h = img.bitmap.height;
	switch (getExifOrientation(img)) {
		case 1: return null;
		case 2: return function(x, y) {
			return [w - x - 1, y];
		};
		case 3: return function(x, y) {
			return [w - x - 1, h - y - 1];
		};
		case 4: return function(x, y) {
			return [x, h - y - 1];
		};
		case 5: return function(x, y) {
			return [y, x];
		};
		case 6: return function(x, y) {
			return [y, h - x - 1];
		};
		case 7: return function(x, y) {
			return [w - y - 1, h - x - 1];
		};
		case 8: return function(x, y) {
			return [w - y - 1, x];
		};
		default: return null;
	}
}
/**
* Transforms bitmap in place (moves pixels around) according to given
* transformation function.
*
* @param img a Jimp image object, which bitmap is supposed to
*        be transformed
* @param width bitmap width after the transformation
* @param height bitmap height after the transformation
* @param transformation transformation function which defines pixel
*        mapping between new and source bitmap. It takes a pair of coordinates
*        in the target, and returns a respective pair of coordinates in
*        the source bitmap, i.e. has following form:
*        `function(new_x, new_y) { return [src_x, src_y] }`.
*/
function transformBitmap(img, width, height, transformation) {
	const _data = img.bitmap.data;
	const _width = img.bitmap.width;
	const data = Buffer.alloc(_data.length);
	for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
		const [_x, _y] = transformation(x, y);
		const idx = width * y + x << 2;
		const _idx = _width * _y + _x << 2;
		const pixel = _data.readUInt32BE(_idx);
		data.writeUInt32BE(pixel, idx);
	}
	img.bitmap.data = data;
	img.bitmap.width = width;
	img.bitmap.height = height;
	img._exif.tags.Orientation = 1;
}
/**
* Automagically rotates an image based on its EXIF data (if present).
* @param img  a Jimp image object
*/
function exifRotate(img) {
	if (getExifOrientation(img) < 2) return;
	const transformation = getExifOrientationTransformation(img);
	const swapDimensions = getExifOrientation(img) > 4;
	const newWidth = swapDimensions ? img.bitmap.height : img.bitmap.width;
	const newHeight = swapDimensions ? img.bitmap.width : img.bitmap.height;
	if (transformation) transformBitmap(img, newWidth, newHeight, transformation);
}
async function attemptExifRotate(image, buffer) {
	try {
		image._exif = import_exif_parser.default.create(buffer).parse();
		exifRotate(image);
	} catch {}
}
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/Errors.js
var defaultMessages, EndOfStreamError, AbortError;
var init_Errors = __esmMin((() => {
	defaultMessages = "End-Of-Stream";
	EndOfStreamError = class extends Error {
		constructor() {
			super(defaultMessages);
			this.name = "EndOfStreamError";
		}
	};
	AbortError = class extends Error {
		constructor(message = "The operation was aborted") {
			super(message);
			this.name = "AbortError";
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/Deferred.js
var Deferred;
var init_Deferred = __esmMin((() => {
	Deferred = class {
		constructor() {
			this.resolve = () => null;
			this.reject = () => null;
			this.promise = new Promise((resolve, reject) => {
				this.reject = reject;
				this.resolve = resolve;
			});
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/AbstractStreamReader.js
var AbstractStreamReader;
var init_AbstractStreamReader = __esmMin((() => {
	init_Errors();
	AbstractStreamReader = class {
		constructor() {
			this.endOfStream = false;
			this.interrupted = false;
			/**
			* Store peeked data
			* @type {Array}
			*/
			this.peekQueue = [];
		}
		async peek(uint8Array, mayBeLess = false) {
			const bytesRead = await this.read(uint8Array, mayBeLess);
			this.peekQueue.push(uint8Array.subarray(0, bytesRead));
			return bytesRead;
		}
		async read(buffer, mayBeLess = false) {
			if (buffer.length === 0) return 0;
			let bytesRead = this.readFromPeekBuffer(buffer);
			if (!this.endOfStream) bytesRead += await this.readRemainderFromStream(buffer.subarray(bytesRead), mayBeLess);
			if (bytesRead === 0 && !mayBeLess) throw new EndOfStreamError();
			return bytesRead;
		}
		/**
		* Read chunk from stream
		* @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
		* @returns Number of bytes read
		*/
		readFromPeekBuffer(buffer) {
			let remaining = buffer.length;
			let bytesRead = 0;
			while (this.peekQueue.length > 0 && remaining > 0) {
				const peekData = this.peekQueue.pop();
				if (!peekData) throw new Error("peekData should be defined");
				const lenCopy = Math.min(peekData.length, remaining);
				buffer.set(peekData.subarray(0, lenCopy), bytesRead);
				bytesRead += lenCopy;
				remaining -= lenCopy;
				if (lenCopy < peekData.length) this.peekQueue.push(peekData.subarray(lenCopy));
			}
			return bytesRead;
		}
		async readRemainderFromStream(buffer, mayBeLess) {
			let bytesRead = 0;
			while (bytesRead < buffer.length && !this.endOfStream) {
				if (this.interrupted) throw new AbortError();
				const chunkLen = await this.readFromStream(buffer.subarray(bytesRead), mayBeLess);
				if (chunkLen === 0) break;
				bytesRead += chunkLen;
			}
			if (!mayBeLess && bytesRead < buffer.length) throw new EndOfStreamError();
			return bytesRead;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/StreamReader.js
var StreamReader;
var init_StreamReader = __esmMin((() => {
	init_Errors();
	init_Deferred();
	init_AbstractStreamReader();
	StreamReader = class extends AbstractStreamReader {
		constructor(s) {
			super();
			this.s = s;
			/**
			* Deferred used for postponed read request (as not data is yet available to read)
			*/
			this.deferred = null;
			if (!s.read || !s.once) throw new Error("Expected an instance of stream.Readable");
			this.s.once("end", () => {
				this.endOfStream = true;
				if (this.deferred) this.deferred.resolve(0);
			});
			this.s.once("error", (err) => this.reject(err));
			this.s.once("close", () => this.abort());
		}
		/**
		* Read chunk from stream
		* @param buffer Target Uint8Array (or Buffer) to store data read from stream in
		* @param mayBeLess - If true, may fill the buffer partially
		* @returns Number of bytes read
		*/
		async readFromStream(buffer, mayBeLess) {
			if (buffer.length === 0) return 0;
			const readBuffer = this.s.read(buffer.length);
			if (readBuffer) {
				buffer.set(readBuffer);
				return readBuffer.length;
			}
			const request = {
				buffer,
				mayBeLess,
				deferred: new Deferred()
			};
			this.deferred = request.deferred;
			this.s.once("readable", () => {
				this.readDeferred(request);
			});
			return request.deferred.promise;
		}
		/**
		* Process deferred read request
		* @param request Deferred read request
		*/
		readDeferred(request) {
			const readBuffer = this.s.read(request.buffer.length);
			if (readBuffer) {
				request.buffer.set(readBuffer);
				request.deferred.resolve(readBuffer.length);
				this.deferred = null;
			} else this.s.once("readable", () => {
				this.readDeferred(request);
			});
		}
		reject(err) {
			this.interrupted = true;
			if (this.deferred) {
				this.deferred.reject(err);
				this.deferred = null;
			}
		}
		async abort() {
			this.reject(new AbortError());
		}
		async close() {
			return this.abort();
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/WebStreamReader.js
var WebStreamReader;
var init_WebStreamReader = __esmMin((() => {
	init_AbstractStreamReader();
	WebStreamReader = class extends AbstractStreamReader {
		constructor(reader) {
			super();
			this.reader = reader;
		}
		async abort() {
			return this.close();
		}
		async close() {
			this.reader.releaseLock();
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/WebStreamByobReader.js
var WebStreamByobReader;
var init_WebStreamByobReader = __esmMin((() => {
	init_WebStreamReader();
	WebStreamByobReader = class extends WebStreamReader {
		/**
		* Read from stream
		* @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
		* @param mayBeLess - If true, may fill the buffer partially
		* @protected Bytes read
		*/
		async readFromStream(buffer, mayBeLess) {
			if (buffer.length === 0) return 0;
			const result = await this.reader.read(new Uint8Array(buffer.length), { min: mayBeLess ? void 0 : buffer.length });
			if (result.done) this.endOfStream = result.done;
			if (result.value) {
				buffer.set(result.value);
				return result.value.length;
			}
			return 0;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/WebStreamDefaultReader.js
var WebStreamDefaultReader;
var init_WebStreamDefaultReader = __esmMin((() => {
	init_Errors();
	init_AbstractStreamReader();
	WebStreamDefaultReader = class extends AbstractStreamReader {
		constructor(reader) {
			super();
			this.reader = reader;
			this.buffer = null;
		}
		/**
		* Copy chunk to target, and store the remainder in this.buffer
		*/
		writeChunk(target, chunk) {
			const written = Math.min(chunk.length, target.length);
			target.set(chunk.subarray(0, written));
			if (written < chunk.length) this.buffer = chunk.subarray(written);
			else this.buffer = null;
			return written;
		}
		/**
		* Read from stream
		* @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
		* @param mayBeLess - If true, may fill the buffer partially
		* @protected Bytes read
		*/
		async readFromStream(buffer, mayBeLess) {
			if (buffer.length === 0) return 0;
			let totalBytesRead = 0;
			if (this.buffer) totalBytesRead += this.writeChunk(buffer, this.buffer);
			while (totalBytesRead < buffer.length && !this.endOfStream) {
				const result = await this.reader.read();
				if (result.done) {
					this.endOfStream = true;
					break;
				}
				if (result.value) totalBytesRead += this.writeChunk(buffer.subarray(totalBytesRead), result.value);
			}
			if (!mayBeLess && totalBytesRead === 0 && this.endOfStream) throw new EndOfStreamError();
			return totalBytesRead;
		}
		abort() {
			this.interrupted = true;
			return this.reader.cancel();
		}
		async close() {
			await this.abort();
			this.reader.releaseLock();
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/WebStreamReaderFactory.js
function makeWebStreamReader(stream) {
	try {
		const reader = stream.getReader({ mode: "byob" });
		if (reader instanceof ReadableStreamDefaultReader) return new WebStreamDefaultReader(reader);
		return new WebStreamByobReader(reader);
	} catch (error) {
		if (error instanceof TypeError) return new WebStreamDefaultReader(stream.getReader());
		throw error;
	}
}
var init_WebStreamReaderFactory = __esmMin((() => {
	init_WebStreamByobReader();
	init_WebStreamDefaultReader();
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/stream/index.js
var init_stream = __esmMin((() => {
	init_Errors();
	init_StreamReader();
	init_WebStreamReaderFactory();
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/AbstractTokenizer.js
var AbstractTokenizer;
var init_AbstractTokenizer = __esmMin((() => {
	init_stream();
	AbstractTokenizer = class {
		/**
		* Constructor
		* @param options Tokenizer options
		* @protected
		*/
		constructor(options) {
			this.numBuffer = new Uint8Array(8);
			/**
			* Tokenizer-stream position
			*/
			this.position = 0;
			this.onClose = options?.onClose;
			if (options?.abortSignal) options.abortSignal.addEventListener("abort", () => {
				this.abort();
			});
		}
		/**
		* Read a token from the tokenizer-stream
		* @param token - The token to read
		* @param position - If provided, the desired position in the tokenizer-stream
		* @returns Promise with token data
		*/
		async readToken(token, position = this.position) {
			const uint8Array = new Uint8Array(token.len);
			if (await this.readBuffer(uint8Array, { position }) < token.len) throw new EndOfStreamError();
			return token.get(uint8Array, 0);
		}
		/**
		* Peek a token from the tokenizer-stream.
		* @param token - Token to peek from the tokenizer-stream.
		* @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
		* @returns Promise with token data
		*/
		async peekToken(token, position = this.position) {
			const uint8Array = new Uint8Array(token.len);
			if (await this.peekBuffer(uint8Array, { position }) < token.len) throw new EndOfStreamError();
			return token.get(uint8Array, 0);
		}
		/**
		* Read a numeric token from the stream
		* @param token - Numeric token
		* @returns Promise with number
		*/
		async readNumber(token) {
			if (await this.readBuffer(this.numBuffer, { length: token.len }) < token.len) throw new EndOfStreamError();
			return token.get(this.numBuffer, 0);
		}
		/**
		* Read a numeric token from the stream
		* @param token - Numeric token
		* @returns Promise with number
		*/
		async peekNumber(token) {
			if (await this.peekBuffer(this.numBuffer, { length: token.len }) < token.len) throw new EndOfStreamError();
			return token.get(this.numBuffer, 0);
		}
		/**
		* Ignore number of bytes, advances the pointer in under tokenizer-stream.
		* @param length - Number of bytes to ignore.  Must be ≥ 0.
		* @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
		*/
		async ignore(length) {
			if (length < 0) throw new RangeError("ignore length must be ≥ 0 bytes");
			if (this.fileInfo.size !== void 0) {
				const bytesLeft = this.fileInfo.size - this.position;
				if (length > bytesLeft) {
					this.position += bytesLeft;
					return bytesLeft;
				}
			}
			this.position += length;
			return length;
		}
		async close() {
			await this.abort();
			await this.onClose?.();
		}
		normalizeOptions(uint8Array, options) {
			if (!this.supportsRandomAccess() && options && options.position !== void 0 && options.position < this.position) throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
			return {
				mayBeLess: false,
				offset: 0,
				length: uint8Array.length,
				position: this.position,
				...options
			};
		}
		abort() {
			return Promise.resolve();
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/ReadStreamTokenizer.js
var maxBufferSize, ReadStreamTokenizer;
var init_ReadStreamTokenizer = __esmMin((() => {
	init_AbstractTokenizer();
	init_stream();
	maxBufferSize = 256e3;
	ReadStreamTokenizer = class extends AbstractTokenizer {
		/**
		* Constructor
		* @param streamReader stream-reader to read from
		* @param options Tokenizer options
		*/
		constructor(streamReader, options) {
			super(options);
			this.streamReader = streamReader;
			this.fileInfo = options?.fileInfo ?? {};
		}
		/**
		* Read buffer from tokenizer
		* @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
		* @param options - Read behaviour options
		* @returns Promise with number of bytes read
		*/
		async readBuffer(uint8Array, options) {
			const normOptions = this.normalizeOptions(uint8Array, options);
			const skipBytes = normOptions.position - this.position;
			if (skipBytes > 0) {
				await this.ignore(skipBytes);
				return this.readBuffer(uint8Array, options);
			}
			if (skipBytes < 0) throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
			if (normOptions.length === 0) return 0;
			const bytesRead = await this.streamReader.read(uint8Array.subarray(0, normOptions.length), normOptions.mayBeLess);
			this.position += bytesRead;
			if ((!options || !options.mayBeLess) && bytesRead < normOptions.length) throw new EndOfStreamError();
			return bytesRead;
		}
		/**
		* Peek (read ahead) buffer from tokenizer
		* @param uint8Array - Uint8Array (or Buffer) to write data to
		* @param options - Read behaviour options
		* @returns Promise with number of bytes peeked
		*/
		async peekBuffer(uint8Array, options) {
			const normOptions = this.normalizeOptions(uint8Array, options);
			let bytesRead = 0;
			if (normOptions.position) {
				const skipBytes = normOptions.position - this.position;
				if (skipBytes > 0) {
					const skipBuffer = new Uint8Array(normOptions.length + skipBytes);
					bytesRead = await this.peekBuffer(skipBuffer, { mayBeLess: normOptions.mayBeLess });
					uint8Array.set(skipBuffer.subarray(skipBytes));
					return bytesRead - skipBytes;
				}
				if (skipBytes < 0) throw new Error("Cannot peek from a negative offset in a stream");
			}
			if (normOptions.length > 0) {
				try {
					bytesRead = await this.streamReader.peek(uint8Array.subarray(0, normOptions.length), normOptions.mayBeLess);
				} catch (err) {
					if (options?.mayBeLess && err instanceof EndOfStreamError) return 0;
					throw err;
				}
				if (!normOptions.mayBeLess && bytesRead < normOptions.length) throw new EndOfStreamError();
			}
			return bytesRead;
		}
		/**
		* @param length Number of bytes to ignore. Must be ≥ 0.
		*/
		async ignore(length) {
			if (length < 0) throw new RangeError("ignore length must be ≥ 0 bytes");
			const bufSize = Math.min(maxBufferSize, length);
			const buf = new Uint8Array(bufSize);
			let totBytesRead = 0;
			while (totBytesRead < length) {
				const remaining = length - totBytesRead;
				const bytesRead = await this.readBuffer(buf, { length: Math.min(bufSize, remaining) });
				if (bytesRead < 0) return bytesRead;
				totBytesRead += bytesRead;
			}
			return totBytesRead;
		}
		abort() {
			return this.streamReader.abort();
		}
		async close() {
			return this.streamReader.close();
		}
		supportsRandomAccess() {
			return false;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/BufferTokenizer.js
var BufferTokenizer;
var init_BufferTokenizer = __esmMin((() => {
	init_stream();
	init_AbstractTokenizer();
	BufferTokenizer = class extends AbstractTokenizer {
		/**
		* Construct BufferTokenizer
		* @param uint8Array - Uint8Array to tokenize
		* @param options Tokenizer options
		*/
		constructor(uint8Array, options) {
			super(options);
			this.uint8Array = uint8Array;
			this.fileInfo = {
				...options?.fileInfo ?? {},
				size: uint8Array.length
			};
		}
		/**
		* Read buffer from tokenizer
		* @param uint8Array - Uint8Array to tokenize
		* @param options - Read behaviour options
		* @returns {Promise<number>}
		*/
		async readBuffer(uint8Array, options) {
			if (options?.position) this.position = options.position;
			const bytesRead = await this.peekBuffer(uint8Array, options);
			this.position += bytesRead;
			return bytesRead;
		}
		/**
		* Peek (read ahead) buffer from tokenizer
		* @param uint8Array
		* @param options - Read behaviour options
		* @returns {Promise<number>}
		*/
		async peekBuffer(uint8Array, options) {
			const normOptions = this.normalizeOptions(uint8Array, options);
			const bytes2read = Math.min(this.uint8Array.length - normOptions.position, normOptions.length);
			if (!normOptions.mayBeLess && bytes2read < normOptions.length) throw new EndOfStreamError();
			uint8Array.set(this.uint8Array.subarray(normOptions.position, normOptions.position + bytes2read));
			return bytes2read;
		}
		close() {
			return super.close();
		}
		supportsRandomAccess() {
			return true;
		}
		setPosition(position) {
			this.position = position;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/BlobTokenizer.js
var BlobTokenizer;
var init_BlobTokenizer = __esmMin((() => {
	init_stream();
	init_AbstractTokenizer();
	BlobTokenizer = class extends AbstractTokenizer {
		/**
		* Construct BufferTokenizer
		* @param blob - Uint8Array to tokenize
		* @param options Tokenizer options
		*/
		constructor(blob, options) {
			super(options);
			this.blob = blob;
			this.fileInfo = {
				...options?.fileInfo ?? {},
				size: blob.size,
				mimeType: blob.type
			};
		}
		/**
		* Read buffer from tokenizer
		* @param uint8Array - Uint8Array to tokenize
		* @param options - Read behaviour options
		* @returns {Promise<number>}
		*/
		async readBuffer(uint8Array, options) {
			if (options?.position) this.position = options.position;
			const bytesRead = await this.peekBuffer(uint8Array, options);
			this.position += bytesRead;
			return bytesRead;
		}
		/**
		* Peek (read ahead) buffer from tokenizer
		* @param buffer
		* @param options - Read behaviour options
		* @returns {Promise<number>}
		*/
		async peekBuffer(buffer, options) {
			const normOptions = this.normalizeOptions(buffer, options);
			const bytes2read = Math.min(this.blob.size - normOptions.position, normOptions.length);
			if (!normOptions.mayBeLess && bytes2read < normOptions.length) throw new EndOfStreamError();
			const arrayBuffer = await this.blob.slice(normOptions.position, normOptions.position + bytes2read).arrayBuffer();
			buffer.set(new Uint8Array(arrayBuffer));
			return bytes2read;
		}
		close() {
			return super.close();
		}
		supportsRandomAccess() {
			return true;
		}
		setPosition(position) {
			this.position = position;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/core.js
/**
* Construct ReadStreamTokenizer from given Stream.
* Will set fileSize, if provided given Stream has set the .path property/
* @param stream - Read from Node.js Stream.Readable
* @param options - Tokenizer options
* @returns ReadStreamTokenizer
*/
function fromStream$1(stream, options) {
	const streamReader = new StreamReader(stream);
	const _options = options ?? {};
	const chainedClose = _options.onClose;
	_options.onClose = async () => {
		await streamReader.close();
		if (chainedClose) return chainedClose();
	};
	return new ReadStreamTokenizer(streamReader, _options);
}
/**
* Construct ReadStreamTokenizer from given ReadableStream (WebStream API).
* Will set fileSize, if provided given Stream has set the .path property/
* @param webStream - Read from Node.js Stream.Readable (must be a byte stream)
* @param options - Tokenizer options
* @returns ReadStreamTokenizer
*/
function fromWebStream(webStream, options) {
	const webStreamReader = makeWebStreamReader(webStream);
	const _options = options ?? {};
	const chainedClose = _options.onClose;
	_options.onClose = async () => {
		await webStreamReader.close();
		if (chainedClose) return chainedClose();
	};
	return new ReadStreamTokenizer(webStreamReader, _options);
}
/**
* Construct ReadStreamTokenizer from given Buffer.
* @param uint8Array - Uint8Array to tokenize
* @param options - Tokenizer options
* @returns BufferTokenizer
*/
function fromBuffer(uint8Array, options) {
	return new BufferTokenizer(uint8Array, options);
}
/**
* Construct ReadStreamTokenizer from given Blob.
* @param blob - Uint8Array to tokenize
* @param options - Tokenizer options
* @returns BufferTokenizer
*/
function fromBlob(blob, options) {
	return new BlobTokenizer(blob, options);
}
var init_core$1 = __esmMin((() => {
	init_stream();
	init_ReadStreamTokenizer();
	init_BufferTokenizer();
	init_BlobTokenizer();
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/FileTokenizer.js
var FileTokenizer;
var init_FileTokenizer = __esmMin((() => {
	init_AbstractTokenizer();
	init_stream();
	FileTokenizer = class FileTokenizer extends AbstractTokenizer {
		/**
		* Create tokenizer from provided file path
		* @param sourceFilePath File path
		*/
		static async fromFile(sourceFilePath) {
			const fileHandle = await open(sourceFilePath, "r");
			return new FileTokenizer(fileHandle, { fileInfo: {
				path: sourceFilePath,
				size: (await fileHandle.stat()).size
			} });
		}
		constructor(fileHandle, options) {
			super(options);
			this.fileHandle = fileHandle;
			this.fileInfo = options.fileInfo;
		}
		/**
		* Read buffer from file
		* @param uint8Array - Uint8Array to write result to
		* @param options - Read behaviour options
		* @returns Promise number of bytes read
		*/
		async readBuffer(uint8Array, options) {
			const normOptions = this.normalizeOptions(uint8Array, options);
			this.position = normOptions.position;
			if (normOptions.length === 0) return 0;
			const res = await this.fileHandle.read(uint8Array, 0, normOptions.length, normOptions.position);
			this.position += res.bytesRead;
			if (res.bytesRead < normOptions.length && (!options || !options.mayBeLess)) throw new EndOfStreamError();
			return res.bytesRead;
		}
		/**
		* Peek buffer from file
		* @param uint8Array - Uint8Array (or Buffer) to write data to
		* @param options - Read behaviour options
		* @returns Promise number of bytes read
		*/
		async peekBuffer(uint8Array, options) {
			const normOptions = this.normalizeOptions(uint8Array, options);
			const res = await this.fileHandle.read(uint8Array, 0, normOptions.length, normOptions.position);
			if (!normOptions.mayBeLess && res.bytesRead < normOptions.length) throw new EndOfStreamError();
			return res.bytesRead;
		}
		async close() {
			await this.fileHandle.close();
			return super.close();
		}
		setPosition(position) {
			this.position = position;
		}
		supportsRandomAccess() {
			return true;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/strtok3@10.3.5/node_modules/strtok3/lib/index.js
/**
* Construct ReadStreamTokenizer from given Stream.
* Will set fileSize, if provided given Stream has set the .path property.
* @param stream - Node.js Stream.Readable
* @param options - Pass additional file information to the tokenizer
* @returns Tokenizer
*/
async function fromStream(stream, options) {
	const rst = fromStream$1(stream, options);
	if (stream.path) {
		const stat$1 = await stat(stream.path);
		rst.fileInfo.path = stream.path;
		rst.fileInfo.size = stat$1.size;
	}
	return rst;
}
var init_lib$3 = __esmMin((() => {
	init_core$1();
	init_FileTokenizer();
	init_core$1();
	FileTokenizer.fromFile;
}));
//#endregion
//#region ../../node_modules/.pnpm/@borewit+text-codec@0.2.2/node_modules/@borewit/text-codec/lib/index.js
function utf8Decoder() {
	if (typeof globalThis.TextDecoder === "undefined") return void 0;
	return _utf8Decoder !== null && _utf8Decoder !== void 0 ? _utf8Decoder : _utf8Decoder = new globalThis.TextDecoder("utf-8");
}
/**
* Decode text from binary data
*/
function textDecode(bytes, encoding = "utf-8") {
	switch (encoding.toLowerCase()) {
		case "utf-8":
		case "utf8": {
			const dec = utf8Decoder();
			return dec ? dec.decode(bytes) : decodeUTF8(bytes);
		}
		case "utf-16le": return decodeUTF16LE(bytes);
		case "us-ascii":
		case "ascii": return decodeASCII(bytes);
		case "latin1":
		case "iso-8859-1": return decodeLatin1(bytes);
		case "windows-1252": return decodeWindows1252(bytes);
		default: throw new RangeError(`Encoding '${encoding}' not supported`);
	}
}
function flushChunk(parts, chunk) {
	if (chunk.length === 0) return;
	parts.push(String.fromCharCode.apply(null, chunk));
	chunk.length = 0;
}
function pushCodeUnit(parts, chunk, codeUnit) {
	chunk.push(codeUnit);
	if (chunk.length >= CHUNK) flushChunk(parts, chunk);
}
function pushCodePoint(parts, chunk, cp) {
	if (cp <= 65535) {
		pushCodeUnit(parts, chunk, cp);
		return;
	}
	cp -= 65536;
	pushCodeUnit(parts, chunk, 55296 + (cp >> 10));
	pushCodeUnit(parts, chunk, 56320 + (cp & 1023));
}
function decodeUTF8(bytes) {
	const parts = [];
	const chunk = [];
	let i = 0;
	if (bytes.length >= 3 && bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) i = 3;
	while (i < bytes.length) {
		const b1 = bytes[i];
		if (b1 <= 127) {
			pushCodeUnit(parts, chunk, b1);
			i++;
			continue;
		}
		if (b1 < 194 || b1 > 244) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			i++;
			continue;
		}
		if (b1 <= 223) {
			if (i + 1 >= bytes.length) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			const b2 = bytes[i + 1];
			if ((b2 & 192) !== 128) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			pushCodeUnit(parts, chunk, (b1 & 31) << 6 | b2 & 63);
			i += 2;
			continue;
		}
		if (b1 <= 239) {
			if (i + 2 >= bytes.length) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			const b2 = bytes[i + 1];
			const b3 = bytes[i + 2];
			if (!((b2 & 192) === 128 && (b3 & 192) === 128 && !(b1 === 224 && b2 < 160) && !(b1 === 237 && b2 >= 160))) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			pushCodeUnit(parts, chunk, (b1 & 15) << 12 | (b2 & 63) << 6 | b3 & 63);
			i += 3;
			continue;
		}
		if (i + 3 >= bytes.length) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			i++;
			continue;
		}
		const b2 = bytes[i + 1];
		const b3 = bytes[i + 2];
		const b4 = bytes[i + 3];
		if (!((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128 && !(b1 === 240 && b2 < 144) && !(b1 === 244 && b2 > 143))) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			i++;
			continue;
		}
		pushCodePoint(parts, chunk, (b1 & 7) << 18 | (b2 & 63) << 12 | (b3 & 63) << 6 | b4 & 63);
		i += 4;
	}
	flushChunk(parts, chunk);
	return parts.join("");
}
function decodeUTF16LE(bytes) {
	const parts = [];
	const chunk = [];
	const len = bytes.length;
	let i = 0;
	while (i + 1 < len) {
		const u1 = bytes[i] | bytes[i + 1] << 8;
		i += 2;
		if (u1 >= 55296 && u1 <= 56319) {
			if (i + 1 < len) {
				const u2 = bytes[i] | bytes[i + 1] << 8;
				if (u2 >= 56320 && u2 <= 57343) {
					pushCodeUnit(parts, chunk, u1);
					pushCodeUnit(parts, chunk, u2);
					i += 2;
				} else pushCodeUnit(parts, chunk, REPLACEMENT);
			} else pushCodeUnit(parts, chunk, REPLACEMENT);
			continue;
		}
		if (u1 >= 56320 && u1 <= 57343) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			continue;
		}
		pushCodeUnit(parts, chunk, u1);
	}
	if (i < len) pushCodeUnit(parts, chunk, REPLACEMENT);
	flushChunk(parts, chunk);
	return parts.join("");
}
function decodeASCII(bytes) {
	const parts = [];
	for (let i = 0; i < bytes.length; i += CHUNK) {
		const end = Math.min(bytes.length, i + CHUNK);
		const codes = new Array(end - i);
		for (let j = i, k = 0; j < end; j++, k++) codes[k] = bytes[j] & 127;
		parts.push(String.fromCharCode.apply(null, codes));
	}
	return parts.join("");
}
function decodeLatin1(bytes) {
	const parts = [];
	for (let i = 0; i < bytes.length; i += CHUNK) {
		const end = Math.min(bytes.length, i + CHUNK);
		const codes = new Array(end - i);
		for (let j = i, k = 0; j < end; j++, k++) codes[k] = bytes[j];
		parts.push(String.fromCharCode.apply(null, codes));
	}
	return parts.join("");
}
function decodeWindows1252(bytes) {
	const parts = [];
	let out = "";
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		const extra = b >= 128 && b <= 159 ? WINDOWS_1252_EXTRA[b] : void 0;
		out += extra !== null && extra !== void 0 ? extra : String.fromCharCode(b);
		if (out.length >= CHUNK) {
			parts.push(out);
			out = "";
		}
	}
	if (out) parts.push(out);
	return parts.join("");
}
var WINDOWS_1252_EXTRA, WINDOWS_1252_REVERSE, _utf8Decoder, CHUNK, REPLACEMENT;
var init_lib$2 = __esmMin((() => {
	WINDOWS_1252_EXTRA = {
		128: "€",
		130: "‚",
		131: "ƒ",
		132: "„",
		133: "…",
		134: "†",
		135: "‡",
		136: "ˆ",
		137: "‰",
		138: "Š",
		139: "‹",
		140: "Œ",
		142: "Ž",
		145: "‘",
		146: "’",
		147: "“",
		148: "”",
		149: "•",
		150: "–",
		151: "—",
		152: "˜",
		153: "™",
		154: "š",
		155: "›",
		156: "œ",
		158: "ž",
		159: "Ÿ"
	};
	WINDOWS_1252_REVERSE = {};
	for (const [code, char] of Object.entries(WINDOWS_1252_EXTRA)) WINDOWS_1252_REVERSE[char] = Number.parseInt(code, 10);
	CHUNK = 32 * 1024;
	REPLACEMENT = 65533;
}));
//#endregion
//#region ../../node_modules/.pnpm/token-types@6.1.2/node_modules/token-types/lib/index.js
function dv(array) {
	return new DataView(array.buffer, array.byteOffset);
}
var UINT8, UINT16_LE, UINT16_BE, UINT32_LE, UINT32_BE, INT32_BE, UINT64_LE, StringType;
var init_lib$1 = __esmMin((() => {
	init_lib$2();
	UINT8 = {
		len: 1,
		get(array, offset) {
			return dv(array).getUint8(offset);
		},
		put(array, offset, value) {
			dv(array).setUint8(offset, value);
			return offset + 1;
		}
	};
	UINT16_LE = {
		len: 2,
		get(array, offset) {
			return dv(array).getUint16(offset, true);
		},
		put(array, offset, value) {
			dv(array).setUint16(offset, value, true);
			return offset + 2;
		}
	};
	UINT16_BE = {
		len: 2,
		get(array, offset) {
			return dv(array).getUint16(offset);
		},
		put(array, offset, value) {
			dv(array).setUint16(offset, value);
			return offset + 2;
		}
	};
	UINT32_LE = {
		len: 4,
		get(array, offset) {
			return dv(array).getUint32(offset, true);
		},
		put(array, offset, value) {
			dv(array).setUint32(offset, value, true);
			return offset + 4;
		}
	};
	UINT32_BE = {
		len: 4,
		get(array, offset) {
			return dv(array).getUint32(offset);
		},
		put(array, offset, value) {
			dv(array).setUint32(offset, value);
			return offset + 4;
		}
	};
	INT32_BE = {
		len: 4,
		get(array, offset) {
			return dv(array).getInt32(offset);
		},
		put(array, offset, value) {
			dv(array).setInt32(offset, value);
			return offset + 4;
		}
	};
	UINT64_LE = {
		len: 8,
		get(array, offset) {
			return dv(array).getBigUint64(offset, true);
		},
		put(array, offset, value) {
			dv(array).setBigUint64(offset, value, true);
			return offset + 8;
		}
	};
	StringType = class {
		constructor(len, encoding) {
			this.len = len;
			this.encoding = encoding;
		}
		get(data, offset = 0) {
			return textDecode(data.subarray(offset, offset + this.len), this.encoding);
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) if (template[templateIndex] === "*") {
				starIndex = templateIndex;
				matchIndex = searchIndex;
				templateIndex++;
			} else {
				searchIndex++;
				templateIndex++;
			}
			else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
//#endregion
//#region ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	const { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	const tty = __require("tty");
	const util$6 = __require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*/
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util$6.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = __require("supports-color");
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
	}
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		const { namespace: name, useColors } = this;
		if (useColors) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \u001B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	/**
	* Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
	*/
	function log(...args) {
		return process.stderr.write(util$6.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = require_common()(exports);
	const { formatters } = module.exports;
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util$6.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	/**
	* Map %O to `util.inspect()`, allowing multiple lines if needed.
	*/
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util$6.inspect(v, this.inspectOpts);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer / nwjs process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) module.exports = require_browser();
	else module.exports = require_node();
}));
//#endregion
//#region ../../node_modules/.pnpm/@tokenizer+inflate@0.4.1/node_modules/@tokenizer/inflate/lib/ZipToken.js
var Signature, DataDescriptor, LocalFileHeaderToken, EndOfCentralDirectoryRecordToken, FileHeader;
var init_ZipToken = __esmMin((() => {
	init_lib$1();
	Signature = {
		LocalFileHeader: 67324752,
		DataDescriptor: 134695760,
		CentralFileHeader: 33639248,
		EndOfCentralDirectory: 101010256
	};
	DataDescriptor = {
		get(array) {
			return {
				signature: UINT32_LE.get(array, 0),
				compressedSize: UINT32_LE.get(array, 8),
				uncompressedSize: UINT32_LE.get(array, 12)
			};
		},
		len: 16
	};
	LocalFileHeaderToken = {
		get(array) {
			const flags = UINT16_LE.get(array, 6);
			return {
				signature: UINT32_LE.get(array, 0),
				minVersion: UINT16_LE.get(array, 4),
				dataDescriptor: !!(flags & 8),
				compressedMethod: UINT16_LE.get(array, 8),
				compressedSize: UINT32_LE.get(array, 18),
				uncompressedSize: UINT32_LE.get(array, 22),
				filenameLength: UINT16_LE.get(array, 26),
				extraFieldLength: UINT16_LE.get(array, 28),
				filename: null
			};
		},
		len: 30
	};
	EndOfCentralDirectoryRecordToken = {
		get(array) {
			return {
				signature: UINT32_LE.get(array, 0),
				nrOfThisDisk: UINT16_LE.get(array, 4),
				nrOfThisDiskWithTheStart: UINT16_LE.get(array, 6),
				nrOfEntriesOnThisDisk: UINT16_LE.get(array, 8),
				nrOfEntriesOfSize: UINT16_LE.get(array, 10),
				sizeOfCd: UINT32_LE.get(array, 12),
				offsetOfStartOfCd: UINT32_LE.get(array, 16),
				zipFileCommentLength: UINT16_LE.get(array, 20)
			};
		},
		len: 22
	};
	FileHeader = {
		get(array) {
			const flags = UINT16_LE.get(array, 8);
			return {
				signature: UINT32_LE.get(array, 0),
				minVersion: UINT16_LE.get(array, 6),
				dataDescriptor: !!(flags & 8),
				compressedMethod: UINT16_LE.get(array, 10),
				compressedSize: UINT32_LE.get(array, 20),
				uncompressedSize: UINT32_LE.get(array, 24),
				filenameLength: UINT16_LE.get(array, 28),
				extraFieldLength: UINT16_LE.get(array, 30),
				fileCommentLength: UINT16_LE.get(array, 32),
				relativeOffsetOfLocalHeader: UINT32_LE.get(array, 42),
				filename: null
			};
		},
		len: 46
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@tokenizer+inflate@0.4.1/node_modules/@tokenizer/inflate/lib/ZipHandler.js
function signatureToArray(signature) {
	const signatureBytes = new Uint8Array(UINT32_LE.len);
	UINT32_LE.put(signatureBytes, 0, signature);
	return signatureBytes;
}
function indexOf(buffer, portion) {
	const bufferLength = buffer.length;
	const portionLength = portion.length;
	if (portionLength > bufferLength) return -1;
	for (let i = 0; i <= bufferLength - portionLength; i++) {
		let found = true;
		for (let j = 0; j < portionLength; j++) if (buffer[i + j] !== portion[j]) {
			found = false;
			break;
		}
		if (found) return i;
	}
	return -1;
}
function mergeArrays(chunks) {
	const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
	const mergedArray = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		mergedArray.set(chunk, offset);
		offset += chunk.length;
	}
	return mergedArray;
}
var import_src, debug, syncBufferSize, ddSignatureArray, eocdSignatureBytes, ZipHandler;
var init_ZipHandler = __esmMin((() => {
	init_lib$1();
	import_src = /* @__PURE__ */ __toESM(require_src(), 1);
	init_ZipToken();
	debug = (0, import_src.default)("tokenizer:inflate");
	syncBufferSize = 256 * 1024;
	ddSignatureArray = signatureToArray(Signature.DataDescriptor);
	eocdSignatureBytes = signatureToArray(Signature.EndOfCentralDirectory);
	ZipHandler = class ZipHandler {
		constructor(tokenizer) {
			this.tokenizer = tokenizer;
			this.syncBuffer = new Uint8Array(syncBufferSize);
		}
		async isZip() {
			return await this.peekSignature() === Signature.LocalFileHeader;
		}
		peekSignature() {
			return this.tokenizer.peekToken(UINT32_LE);
		}
		async findEndOfCentralDirectoryLocator() {
			const randomReadTokenizer = this.tokenizer;
			const chunkLength = Math.min(16 * 1024, randomReadTokenizer.fileInfo.size);
			const buffer = this.syncBuffer.subarray(0, chunkLength);
			await this.tokenizer.readBuffer(buffer, { position: randomReadTokenizer.fileInfo.size - chunkLength });
			for (let i = buffer.length - 4; i >= 0; i--) if (buffer[i] === eocdSignatureBytes[0] && buffer[i + 1] === eocdSignatureBytes[1] && buffer[i + 2] === eocdSignatureBytes[2] && buffer[i + 3] === eocdSignatureBytes[3]) return randomReadTokenizer.fileInfo.size - chunkLength + i;
			return -1;
		}
		async readCentralDirectory() {
			if (!this.tokenizer.supportsRandomAccess()) {
				debug("Cannot reading central-directory without random-read support");
				return;
			}
			debug("Reading central-directory...");
			const pos = this.tokenizer.position;
			const offset = await this.findEndOfCentralDirectoryLocator();
			if (offset > 0) {
				debug("Central-directory 32-bit signature found");
				const eocdHeader = await this.tokenizer.readToken(EndOfCentralDirectoryRecordToken, offset);
				const files = [];
				this.tokenizer.setPosition(eocdHeader.offsetOfStartOfCd);
				for (let n = 0; n < eocdHeader.nrOfEntriesOfSize; ++n) {
					const entry = await this.tokenizer.readToken(FileHeader);
					if (entry.signature !== Signature.CentralFileHeader) throw new Error("Expected Central-File-Header signature");
					entry.filename = await this.tokenizer.readToken(new StringType(entry.filenameLength, "utf-8"));
					await this.tokenizer.ignore(entry.extraFieldLength);
					await this.tokenizer.ignore(entry.fileCommentLength);
					files.push(entry);
					debug(`Add central-directory file-entry: n=${n + 1}/${files.length}: filename=${files[n].filename}`);
				}
				this.tokenizer.setPosition(pos);
				return files;
			}
			this.tokenizer.setPosition(pos);
		}
		async unzip(fileCb) {
			const entries = await this.readCentralDirectory();
			if (entries) return this.iterateOverCentralDirectory(entries, fileCb);
			let stop = false;
			do {
				const zipHeader = await this.readLocalFileHeader();
				if (!zipHeader) break;
				const next = fileCb(zipHeader);
				stop = !!next.stop;
				let fileData;
				await this.tokenizer.ignore(zipHeader.extraFieldLength);
				if (zipHeader.dataDescriptor && zipHeader.compressedSize === 0) {
					const chunks = [];
					let len = syncBufferSize;
					debug("Compressed-file-size unknown, scanning for next data-descriptor-signature....");
					let nextHeaderIndex = -1;
					while (nextHeaderIndex < 0 && len === syncBufferSize) {
						len = await this.tokenizer.peekBuffer(this.syncBuffer, { mayBeLess: true });
						nextHeaderIndex = indexOf(this.syncBuffer.subarray(0, len), ddSignatureArray);
						const size = nextHeaderIndex >= 0 ? nextHeaderIndex : len;
						if (next.handler) {
							const data = new Uint8Array(size);
							await this.tokenizer.readBuffer(data);
							chunks.push(data);
						} else await this.tokenizer.ignore(size);
					}
					debug(`Found data-descriptor-signature at pos=${this.tokenizer.position}`);
					if (next.handler) await this.inflate(zipHeader, mergeArrays(chunks), next.handler);
				} else if (next.handler) {
					debug(`Reading compressed-file-data: ${zipHeader.compressedSize} bytes`);
					fileData = new Uint8Array(zipHeader.compressedSize);
					await this.tokenizer.readBuffer(fileData);
					await this.inflate(zipHeader, fileData, next.handler);
				} else {
					debug(`Ignoring compressed-file-data: ${zipHeader.compressedSize} bytes`);
					await this.tokenizer.ignore(zipHeader.compressedSize);
				}
				debug(`Reading data-descriptor at pos=${this.tokenizer.position}`);
				if (zipHeader.dataDescriptor) {
					if ((await this.tokenizer.readToken(DataDescriptor)).signature !== 134695760) throw new Error(`Expected data-descriptor-signature at position ${this.tokenizer.position - DataDescriptor.len}`);
				}
			} while (!stop);
		}
		async iterateOverCentralDirectory(entries, fileCb) {
			for (const fileHeader of entries) {
				const next = fileCb(fileHeader);
				if (next.handler) {
					this.tokenizer.setPosition(fileHeader.relativeOffsetOfLocalHeader);
					const zipHeader = await this.readLocalFileHeader();
					if (zipHeader) {
						await this.tokenizer.ignore(zipHeader.extraFieldLength);
						const fileData = new Uint8Array(fileHeader.compressedSize);
						await this.tokenizer.readBuffer(fileData);
						await this.inflate(zipHeader, fileData, next.handler);
					}
				}
				if (next.stop) break;
			}
		}
		async inflate(zipHeader, fileData, cb) {
			if (zipHeader.compressedMethod === 0) return cb(fileData);
			if (zipHeader.compressedMethod !== 8) throw new Error(`Unsupported ZIP compression method: ${zipHeader.compressedMethod}`);
			debug(`Decompress filename=${zipHeader.filename}, compressed-size=${fileData.length}`);
			return cb(await ZipHandler.decompressDeflateRaw(fileData));
		}
		static async decompressDeflateRaw(data) {
			const input = new ReadableStream({ start(controller) {
				controller.enqueue(data);
				controller.close();
			} });
			const ds = new DecompressionStream("deflate-raw");
			const output = input.pipeThrough(ds);
			try {
				const buffer = await new Response(output).arrayBuffer();
				return new Uint8Array(buffer);
			} catch (err) {
				const message = err instanceof Error ? `Failed to deflate ZIP entry: ${err.message}` : "Unknown decompression error in ZIP entry";
				throw new TypeError(message);
			}
		}
		async readLocalFileHeader() {
			const signature = await this.tokenizer.peekToken(UINT32_LE);
			if (signature === Signature.LocalFileHeader) {
				const header = await this.tokenizer.readToken(LocalFileHeaderToken);
				header.filename = await this.tokenizer.readToken(new StringType(header.filenameLength, "utf-8"));
				return header;
			}
			if (signature === Signature.CentralFileHeader) return false;
			if (signature === 3759263696) throw new Error("Encrypted ZIP");
			throw new Error("Unexpected signature");
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@tokenizer+inflate@0.4.1/node_modules/@tokenizer/inflate/lib/GzipHandler.js
var GzipHandler;
var init_GzipHandler = __esmMin((() => {
	GzipHandler = class {
		constructor(tokenizer) {
			this.tokenizer = tokenizer;
		}
		inflate() {
			const tokenizer = this.tokenizer;
			return new ReadableStream({ async pull(controller) {
				const buffer = new Uint8Array(1024);
				const size = await tokenizer.readBuffer(buffer, { mayBeLess: true });
				if (size === 0) {
					controller.close();
					return;
				}
				controller.enqueue(buffer.subarray(0, size));
			} }).pipeThrough(new DecompressionStream("gzip"));
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@tokenizer+inflate@0.4.1/node_modules/@tokenizer/inflate/lib/index.js
var init_lib = __esmMin((() => {
	init_ZipHandler();
	init_GzipHandler();
}));
//#endregion
//#region ../../node_modules/.pnpm/uint8array-extras@1.5.0/node_modules/uint8array-extras/index.js
/**
@param {DataView} view
@returns {number}
*/
function getUintBE(view) {
	const { byteLength } = view;
	if (byteLength === 6) return view.getUint16(0) * 2 ** 32 + view.getUint32(2);
	if (byteLength === 5) return view.getUint8(0) * 2 ** 32 + view.getUint32(1);
	if (byteLength === 4) return view.getUint32(0);
	if (byteLength === 3) return view.getUint8(0) * 2 ** 16 + view.getUint16(1);
	if (byteLength === 2) return view.getUint16(0);
	if (byteLength === 1) return view.getUint8(0);
}
var init_uint8array_extras = __esmMin((() => {
	new globalThis.TextDecoder("utf8");
	new globalThis.TextEncoder();
	Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, "0"));
}));
//#endregion
//#region ../../node_modules/.pnpm/file-type@21.3.4/node_modules/file-type/util.js
function stringToBytes(string, encoding) {
	if (encoding === "utf-16le") {
		const bytes = [];
		for (let index = 0; index < string.length; index++) {
			const code = string.charCodeAt(index);
			bytes.push(code & 255, code >> 8 & 255);
		}
		return bytes;
	}
	if (encoding === "utf-16be") {
		const bytes = [];
		for (let index = 0; index < string.length; index++) {
			const code = string.charCodeAt(index);
			bytes.push(code >> 8 & 255, code & 255);
		}
		return bytes;
	}
	return [...string].map((character) => character.charCodeAt(0));
}
/**
Checks whether the TAR checksum is valid.

@param {Uint8Array} arrayBuffer - The TAR header `[offset ... offset + 512]`.
@param {number} offset - TAR header offset.
@returns {boolean} `true` if the TAR checksum is valid, otherwise `false`.
*/
function tarHeaderChecksumMatches(arrayBuffer, offset = 0) {
	const readSum = Number.parseInt(new StringType(6).get(arrayBuffer, 148).replace(/\0.*$/, "").trim(), 8);
	if (Number.isNaN(readSum)) return false;
	let sum = 256;
	for (let index = offset; index < offset + 148; index++) sum += arrayBuffer[index];
	for (let index = offset + 156; index < offset + 512; index++) sum += arrayBuffer[index];
	return readSum === sum;
}
var uint32SyncSafeToken;
var init_util = __esmMin((() => {
	init_lib$1();
	uint32SyncSafeToken = {
		get: (buffer, offset) => buffer[offset + 3] & 127 | buffer[offset + 2] << 7 | buffer[offset + 1] << 14 | buffer[offset] << 21,
		len: 4
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/file-type@21.3.4/node_modules/file-type/supported.js
var extensions, mimeTypes;
var init_supported = __esmMin((() => {
	extensions = [
		"jpg",
		"png",
		"apng",
		"gif",
		"webp",
		"flif",
		"xcf",
		"cr2",
		"cr3",
		"orf",
		"arw",
		"dng",
		"nef",
		"rw2",
		"raf",
		"tif",
		"bmp",
		"icns",
		"jxr",
		"psd",
		"indd",
		"zip",
		"tar",
		"rar",
		"gz",
		"bz2",
		"7z",
		"dmg",
		"mp4",
		"mid",
		"mkv",
		"webm",
		"mov",
		"avi",
		"mpg",
		"mp2",
		"mp3",
		"m4a",
		"oga",
		"ogg",
		"ogv",
		"opus",
		"flac",
		"wav",
		"spx",
		"amr",
		"pdf",
		"epub",
		"elf",
		"macho",
		"exe",
		"swf",
		"rtf",
		"wasm",
		"woff",
		"woff2",
		"eot",
		"ttf",
		"otf",
		"ttc",
		"ico",
		"flv",
		"ps",
		"xz",
		"sqlite",
		"nes",
		"crx",
		"xpi",
		"cab",
		"deb",
		"ar",
		"rpm",
		"Z",
		"lz",
		"cfb",
		"mxf",
		"mts",
		"blend",
		"bpg",
		"docx",
		"pptx",
		"xlsx",
		"3gp",
		"3g2",
		"j2c",
		"jp2",
		"jpm",
		"jpx",
		"mj2",
		"aif",
		"qcp",
		"odt",
		"ods",
		"odp",
		"xml",
		"mobi",
		"heic",
		"cur",
		"ktx",
		"ape",
		"wv",
		"dcm",
		"ics",
		"glb",
		"pcap",
		"dsf",
		"lnk",
		"alias",
		"voc",
		"ac3",
		"m4v",
		"m4p",
		"m4b",
		"f4v",
		"f4p",
		"f4b",
		"f4a",
		"mie",
		"asf",
		"ogm",
		"ogx",
		"mpc",
		"arrow",
		"shp",
		"aac",
		"mp1",
		"it",
		"s3m",
		"xm",
		"skp",
		"avif",
		"eps",
		"lzh",
		"pgp",
		"asar",
		"stl",
		"chm",
		"3mf",
		"zst",
		"jxl",
		"vcf",
		"jls",
		"pst",
		"dwg",
		"parquet",
		"class",
		"arj",
		"cpio",
		"ace",
		"avro",
		"icc",
		"fbx",
		"vsdx",
		"vtt",
		"apk",
		"drc",
		"lz4",
		"potx",
		"xltx",
		"dotx",
		"xltm",
		"ott",
		"ots",
		"otp",
		"odg",
		"otg",
		"xlsm",
		"docm",
		"dotm",
		"potm",
		"pptm",
		"jar",
		"jmp",
		"rm",
		"sav",
		"ppsm",
		"ppsx",
		"tar.gz",
		"reg",
		"dat"
	];
	mimeTypes = [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/flif",
		"image/x-xcf",
		"image/x-canon-cr2",
		"image/x-canon-cr3",
		"image/tiff",
		"image/bmp",
		"image/vnd.ms-photo",
		"image/vnd.adobe.photoshop",
		"application/x-indesign",
		"application/epub+zip",
		"application/x-xpinstall",
		"application/vnd.ms-powerpoint.slideshow.macroenabled.12",
		"application/vnd.oasis.opendocument.text",
		"application/vnd.oasis.opendocument.spreadsheet",
		"application/vnd.oasis.opendocument.presentation",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow",
		"application/zip",
		"application/x-tar",
		"application/x-rar-compressed",
		"application/gzip",
		"application/x-bzip2",
		"application/x-7z-compressed",
		"application/x-apple-diskimage",
		"application/vnd.apache.arrow.file",
		"video/mp4",
		"audio/midi",
		"video/matroska",
		"video/webm",
		"video/quicktime",
		"video/vnd.avi",
		"audio/wav",
		"audio/qcelp",
		"audio/x-ms-asf",
		"video/x-ms-asf",
		"application/vnd.ms-asf",
		"video/mpeg",
		"video/3gpp",
		"audio/mpeg",
		"audio/mp4",
		"video/ogg",
		"audio/ogg",
		"audio/ogg; codecs=opus",
		"application/ogg",
		"audio/flac",
		"audio/ape",
		"audio/wavpack",
		"audio/amr",
		"application/pdf",
		"application/x-elf",
		"application/x-mach-binary",
		"application/x-msdownload",
		"application/x-shockwave-flash",
		"application/rtf",
		"application/wasm",
		"font/woff",
		"font/woff2",
		"application/vnd.ms-fontobject",
		"font/ttf",
		"font/otf",
		"font/collection",
		"image/x-icon",
		"video/x-flv",
		"application/postscript",
		"application/eps",
		"application/x-xz",
		"application/x-sqlite3",
		"application/x-nintendo-nes-rom",
		"application/x-google-chrome-extension",
		"application/vnd.ms-cab-compressed",
		"application/x-deb",
		"application/x-unix-archive",
		"application/x-rpm",
		"application/x-compress",
		"application/x-lzip",
		"application/x-cfb",
		"application/x-mie",
		"application/mxf",
		"video/mp2t",
		"application/x-blender",
		"image/bpg",
		"image/j2c",
		"image/jp2",
		"image/jpx",
		"image/jpm",
		"image/mj2",
		"audio/aiff",
		"application/xml",
		"application/x-mobipocket-ebook",
		"image/heif",
		"image/heif-sequence",
		"image/heic",
		"image/heic-sequence",
		"image/icns",
		"image/ktx",
		"application/dicom",
		"audio/x-musepack",
		"text/calendar",
		"text/vcard",
		"text/vtt",
		"model/gltf-binary",
		"application/vnd.tcpdump.pcap",
		"audio/x-dsf",
		"application/x.ms.shortcut",
		"application/x.apple.alias",
		"audio/x-voc",
		"audio/vnd.dolby.dd-raw",
		"audio/x-m4a",
		"image/apng",
		"image/x-olympus-orf",
		"image/x-sony-arw",
		"image/x-adobe-dng",
		"image/x-nikon-nef",
		"image/x-panasonic-rw2",
		"image/x-fujifilm-raf",
		"video/x-m4v",
		"video/3gpp2",
		"application/x-esri-shape",
		"audio/aac",
		"audio/x-it",
		"audio/x-s3m",
		"audio/x-xm",
		"video/MP1S",
		"video/MP2P",
		"application/vnd.sketchup.skp",
		"image/avif",
		"application/x-lzh-compressed",
		"application/pgp-encrypted",
		"application/x-asar",
		"model/stl",
		"application/vnd.ms-htmlhelp",
		"model/3mf",
		"image/jxl",
		"application/zstd",
		"image/jls",
		"application/vnd.ms-outlook",
		"image/vnd.dwg",
		"application/vnd.apache.parquet",
		"application/java-vm",
		"application/x-arj",
		"application/x-cpio",
		"application/x-ace-compressed",
		"application/avro",
		"application/vnd.iccprofile",
		"application/x.autodesk.fbx",
		"application/vnd.visio",
		"application/vnd.android.package-archive",
		"application/vnd.google.draco",
		"application/x-lz4",
		"application/vnd.openxmlformats-officedocument.presentationml.template",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template",
		"application/vnd.ms-excel.template.macroenabled.12",
		"application/vnd.oasis.opendocument.text-template",
		"application/vnd.oasis.opendocument.spreadsheet-template",
		"application/vnd.oasis.opendocument.presentation-template",
		"application/vnd.oasis.opendocument.graphics",
		"application/vnd.oasis.opendocument.graphics-template",
		"application/vnd.ms-excel.sheet.macroenabled.12",
		"application/vnd.ms-word.document.macroenabled.12",
		"application/vnd.ms-word.template.macroenabled.12",
		"application/vnd.ms-powerpoint.template.macroenabled.12",
		"application/vnd.ms-powerpoint.presentation.macroenabled.12",
		"application/java-archive",
		"application/vnd.rn-realmedia",
		"application/x-spss-sav",
		"application/x-ms-regedit",
		"application/x-ft-windows-registry-hive",
		"application/x-jmp-data"
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/file-type@21.3.4/node_modules/file-type/core.js
function patchWebByobTokenizerClose(tokenizer) {
	const streamReader = tokenizer?.streamReader;
	if (streamReader?.constructor?.name !== "WebStreamByobReader") return tokenizer;
	const { reader } = streamReader;
	const cancelAndRelease = async () => {
		await reader.cancel();
		reader.releaseLock();
	};
	streamReader.close = cancelAndRelease;
	streamReader.abort = async () => {
		streamReader.interrupted = true;
		await cancelAndRelease();
	};
	return tokenizer;
}
function getSafeBound(value, maximum, reason) {
	if (!Number.isFinite(value) || value < 0 || value > maximum) throw new ParserHardLimitError(`${reason} has invalid size ${value} (maximum ${maximum} bytes)`);
	return value;
}
async function safeIgnore(tokenizer, length, { maximumLength = maximumUntrustedSkipSizeInBytes, reason = "skip" } = {}) {
	const safeLength = getSafeBound(length, maximumLength, reason);
	await tokenizer.ignore(safeLength);
}
async function safeReadBuffer(tokenizer, buffer, options, { maximumLength = buffer.length, reason = "read" } = {}) {
	const safeLength = getSafeBound(options?.length ?? buffer.length, maximumLength, reason);
	return tokenizer.readBuffer(buffer, {
		...options,
		length: safeLength
	});
}
async function decompressDeflateRawWithLimit(data, { maximumLength = maximumZipEntrySizeInBytes } = {}) {
	const reader = new ReadableStream({ start(controller) {
		controller.enqueue(data);
		controller.close();
	} }).pipeThrough(new DecompressionStream("deflate-raw")).getReader();
	const chunks = [];
	let totalLength = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			totalLength += value.length;
			if (totalLength > maximumLength) {
				await reader.cancel();
				throw new Error(`ZIP entry decompressed data exceeds ${maximumLength} bytes`);
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const uncompressedData = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		uncompressedData.set(chunk, offset);
		offset += chunk.length;
	}
	return uncompressedData;
}
function findZipDataDescriptorOffset(buffer, bytesConsumed) {
	if (buffer.length < zipDataDescriptorLengthInBytes) return -1;
	const lastPossibleDescriptorOffset = buffer.length - zipDataDescriptorLengthInBytes;
	for (let index = 0; index <= lastPossibleDescriptorOffset; index++) if (UINT32_LE.get(buffer, index) === zipDataDescriptorSignature && UINT32_LE.get(buffer, index + 8) === bytesConsumed + index) return index;
	return -1;
}
function isPngAncillaryChunk(type) {
	return (type.codePointAt(0) & 32) !== 0;
}
function mergeByteChunks(chunks, totalLength) {
	const merged = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.length;
	}
	return merged;
}
async function readZipDataDescriptorEntryWithLimit(zipHandler, { shouldBuffer, maximumLength = maximumZipEntrySizeInBytes } = {}) {
	const { syncBuffer } = zipHandler;
	const { length: syncBufferLength } = syncBuffer;
	const chunks = [];
	let bytesConsumed = 0;
	for (;;) {
		const length = await zipHandler.tokenizer.peekBuffer(syncBuffer, { mayBeLess: true });
		const dataDescriptorOffset = findZipDataDescriptorOffset(syncBuffer.subarray(0, length), bytesConsumed);
		const retainedLength = dataDescriptorOffset >= 0 ? 0 : length === syncBufferLength ? Math.min(zipDataDescriptorOverlapLengthInBytes, length - 1) : 0;
		const chunkLength = dataDescriptorOffset >= 0 ? dataDescriptorOffset : length - retainedLength;
		if (chunkLength === 0) break;
		bytesConsumed += chunkLength;
		if (bytesConsumed > maximumLength) throw new Error(`ZIP entry compressed data exceeds ${maximumLength} bytes`);
		if (shouldBuffer) {
			const data = new Uint8Array(chunkLength);
			await zipHandler.tokenizer.readBuffer(data);
			chunks.push(data);
		} else await zipHandler.tokenizer.ignore(chunkLength);
		if (dataDescriptorOffset >= 0) break;
	}
	if (!hasUnknownFileSize(zipHandler.tokenizer)) zipHandler.knownSizeDescriptorScannedBytes += bytesConsumed;
	if (!shouldBuffer) return;
	return mergeByteChunks(chunks, bytesConsumed);
}
function getRemainingZipScanBudget(zipHandler, startOffset) {
	if (hasUnknownFileSize(zipHandler.tokenizer)) return Math.max(0, maximumUntrustedSkipSizeInBytes - (zipHandler.tokenizer.position - startOffset));
	return Math.max(0, maximumZipEntrySizeInBytes - zipHandler.knownSizeDescriptorScannedBytes);
}
async function readZipEntryData(zipHandler, zipHeader, { shouldBuffer, maximumDescriptorLength = maximumZipEntrySizeInBytes } = {}) {
	if (zipHeader.dataDescriptor && zipHeader.compressedSize === 0) return readZipDataDescriptorEntryWithLimit(zipHandler, {
		shouldBuffer,
		maximumLength: maximumDescriptorLength
	});
	if (!shouldBuffer) {
		await safeIgnore(zipHandler.tokenizer, zipHeader.compressedSize, {
			maximumLength: hasUnknownFileSize(zipHandler.tokenizer) ? maximumZipEntrySizeInBytes : zipHandler.tokenizer.fileInfo.size,
			reason: "ZIP entry compressed data"
		});
		return;
	}
	const maximumLength = getMaximumZipBufferedReadLength(zipHandler.tokenizer);
	if (!Number.isFinite(zipHeader.compressedSize) || zipHeader.compressedSize < 0 || zipHeader.compressedSize > maximumLength) throw new Error(`ZIP entry compressed data exceeds ${maximumLength} bytes`);
	const fileData = new Uint8Array(zipHeader.compressedSize);
	await zipHandler.tokenizer.readBuffer(fileData);
	return fileData;
}
function createByteLimitedReadableStream(stream, maximumBytes) {
	const reader = stream.getReader();
	let emittedBytes = 0;
	let sourceDone = false;
	let sourceCanceled = false;
	const cancelSource = async (reason) => {
		if (sourceDone || sourceCanceled) return;
		sourceCanceled = true;
		await reader.cancel(reason);
	};
	return new ReadableStream({
		async pull(controller) {
			if (emittedBytes >= maximumBytes) {
				controller.close();
				await cancelSource();
				return;
			}
			const { done, value } = await reader.read();
			if (done || !value) {
				sourceDone = true;
				controller.close();
				return;
			}
			const remainingBytes = maximumBytes - emittedBytes;
			if (value.length > remainingBytes) {
				controller.enqueue(value.subarray(0, remainingBytes));
				emittedBytes += remainingBytes;
				controller.close();
				await cancelSource();
				return;
			}
			controller.enqueue(value);
			emittedBytes += value.length;
		},
		async cancel(reason) {
			await cancelSource(reason);
		}
	});
}
async function fileTypeFromBuffer(input, options) {
	return new FileTypeParser$1(options).fromBuffer(input);
}
async function fileTypeFromBlob(blob, options) {
	return new FileTypeParser$1(options).fromBlob(blob);
}
function getFileTypeFromMimeType(mimeType) {
	mimeType = mimeType.toLowerCase();
	switch (mimeType) {
		case "application/epub+zip": return {
			ext: "epub",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.text": return {
			ext: "odt",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.text-template": return {
			ext: "ott",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.spreadsheet": return {
			ext: "ods",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.spreadsheet-template": return {
			ext: "ots",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.presentation": return {
			ext: "odp",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.presentation-template": return {
			ext: "otp",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.graphics": return {
			ext: "odg",
			mime: mimeType
		};
		case "application/vnd.oasis.opendocument.graphics-template": return {
			ext: "otg",
			mime: mimeType
		};
		case "application/vnd.openxmlformats-officedocument.presentationml.slideshow": return {
			ext: "ppsx",
			mime: mimeType
		};
		case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": return {
			ext: "xlsx",
			mime: mimeType
		};
		case "application/vnd.ms-excel.sheet.macroenabled": return {
			ext: "xlsm",
			mime: "application/vnd.ms-excel.sheet.macroenabled.12"
		};
		case "application/vnd.openxmlformats-officedocument.spreadsheetml.template": return {
			ext: "xltx",
			mime: mimeType
		};
		case "application/vnd.ms-excel.template.macroenabled": return {
			ext: "xltm",
			mime: "application/vnd.ms-excel.template.macroenabled.12"
		};
		case "application/vnd.ms-powerpoint.slideshow.macroenabled": return {
			ext: "ppsm",
			mime: "application/vnd.ms-powerpoint.slideshow.macroenabled.12"
		};
		case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return {
			ext: "docx",
			mime: mimeType
		};
		case "application/vnd.ms-word.document.macroenabled": return {
			ext: "docm",
			mime: "application/vnd.ms-word.document.macroenabled.12"
		};
		case "application/vnd.openxmlformats-officedocument.wordprocessingml.template": return {
			ext: "dotx",
			mime: mimeType
		};
		case "application/vnd.ms-word.template.macroenabledtemplate": return {
			ext: "dotm",
			mime: "application/vnd.ms-word.template.macroenabled.12"
		};
		case "application/vnd.openxmlformats-officedocument.presentationml.template": return {
			ext: "potx",
			mime: mimeType
		};
		case "application/vnd.ms-powerpoint.template.macroenabled": return {
			ext: "potm",
			mime: "application/vnd.ms-powerpoint.template.macroenabled.12"
		};
		case "application/vnd.openxmlformats-officedocument.presentationml.presentation": return {
			ext: "pptx",
			mime: mimeType
		};
		case "application/vnd.ms-powerpoint.presentation.macroenabled": return {
			ext: "pptm",
			mime: "application/vnd.ms-powerpoint.presentation.macroenabled.12"
		};
		case "application/vnd.ms-visio.drawing": return {
			ext: "vsdx",
			mime: "application/vnd.visio"
		};
		case "application/vnd.ms-package.3dmanufacturing-3dmodel+xml": return {
			ext: "3mf",
			mime: "model/3mf"
		};
		default:
	}
}
function _check(buffer, headers, options) {
	options = {
		offset: 0,
		...options
	};
	for (const [index, header] of headers.entries()) if (options.mask) {
		if (header !== (options.mask[index] & buffer[index + options.offset])) return false;
	} else if (header !== buffer[index + options.offset]) return false;
	return true;
}
function normalizeSampleSize(sampleSize) {
	if (!Number.isFinite(sampleSize)) return reasonableDetectionSizeInBytes;
	return Math.max(1, Math.trunc(sampleSize));
}
function readByobReaderWithSignal(reader, buffer, signal) {
	if (signal === void 0) return reader.read(buffer);
	signal.throwIfAborted();
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			signal.removeEventListener("abort", onAbort);
		};
		const onAbort = () => {
			const abortReason = signal.reason;
			cleanup();
			(async () => {
				try {
					await reader.cancel(abortReason);
				} catch {}
			})();
			reject(abortReason);
		};
		signal.addEventListener("abort", onAbort, { once: true });
		(async () => {
			try {
				const result = await reader.read(buffer);
				cleanup();
				resolve(result);
			} catch (error) {
				cleanup();
				reject(error);
			}
		})();
	});
}
function normalizeMpegOffsetTolerance(mpegOffsetTolerance) {
	if (!Number.isFinite(mpegOffsetTolerance)) return 0;
	return Math.max(0, Math.min(maximumMpegOffsetTolerance, Math.trunc(mpegOffsetTolerance)));
}
function getKnownFileSizeOrMaximum(fileSize) {
	if (!Number.isFinite(fileSize)) return Number.MAX_SAFE_INTEGER;
	return Math.max(0, fileSize);
}
function hasUnknownFileSize(tokenizer) {
	const fileSize = tokenizer.fileInfo.size;
	return !Number.isFinite(fileSize) || fileSize === Number.MAX_SAFE_INTEGER;
}
function hasExceededUnknownSizeScanBudget(tokenizer, startOffset, maximumBytes) {
	return hasUnknownFileSize(tokenizer) && tokenizer.position - startOffset > maximumBytes;
}
function getMaximumZipBufferedReadLength(tokenizer) {
	const fileSize = tokenizer.fileInfo.size;
	const remainingBytes = Number.isFinite(fileSize) ? Math.max(0, fileSize - tokenizer.position) : Number.MAX_SAFE_INTEGER;
	return Math.min(remainingBytes, maximumZipBufferedReadSizeInBytes);
}
function isRecoverableZipError(error) {
	if (error instanceof EndOfStreamError) return true;
	if (error instanceof ParserHardLimitError) return true;
	if (!(error instanceof Error)) return false;
	if (recoverableZipErrorMessages.has(error.message)) return true;
	if (recoverableZipErrorCodes.has(error.code)) return true;
	for (const prefix of recoverableZipErrorMessagePrefixes) if (error.message.startsWith(prefix)) return true;
	return false;
}
function canReadZipEntryForDetection(zipHeader, maximumSize = maximumZipEntrySizeInBytes) {
	const sizes = [zipHeader.compressedSize, zipHeader.uncompressedSize];
	for (const size of sizes) if (!Number.isFinite(size) || size < 0 || size > maximumSize) return false;
	return true;
}
function createOpenXmlZipDetectionState() {
	return {
		hasContentTypesEntry: false,
		hasParsedContentTypesEntry: false,
		isParsingContentTypes: false,
		hasUnparseableContentTypes: false,
		hasWordDirectory: false,
		hasPresentationDirectory: false,
		hasSpreadsheetDirectory: false,
		hasThreeDimensionalModelEntry: false
	};
}
function updateOpenXmlZipDetectionStateFromFilename(openXmlState, filename) {
	if (filename.startsWith("word/")) openXmlState.hasWordDirectory = true;
	if (filename.startsWith("ppt/")) openXmlState.hasPresentationDirectory = true;
	if (filename.startsWith("xl/")) openXmlState.hasSpreadsheetDirectory = true;
	if (filename.startsWith("3D/") && filename.endsWith(".model")) openXmlState.hasThreeDimensionalModelEntry = true;
}
function getOpenXmlFileTypeFromZipEntries(openXmlState) {
	if (!openXmlState.hasContentTypesEntry || openXmlState.hasUnparseableContentTypes || openXmlState.isParsingContentTypes || openXmlState.hasParsedContentTypesEntry) return;
	if (openXmlState.hasWordDirectory) return {
		ext: "docx",
		mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	};
	if (openXmlState.hasPresentationDirectory) return {
		ext: "pptx",
		mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	};
	if (openXmlState.hasSpreadsheetDirectory) return {
		ext: "xlsx",
		mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	};
	if (openXmlState.hasThreeDimensionalModelEntry) return {
		ext: "3mf",
		mime: "model/3mf"
	};
}
function getOpenXmlMimeTypeFromContentTypesXml(xmlContent) {
	const endPosition = xmlContent.indexOf(".main+xml\"");
	if (endPosition === -1) {
		const mimeType = "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
		if (xmlContent.includes(`ContentType="${mimeType}"`)) return mimeType;
		return;
	}
	const truncatedContent = xmlContent.slice(0, endPosition);
	const firstQuotePosition = truncatedContent.lastIndexOf("\"");
	return truncatedContent.slice(firstQuotePosition + 1);
}
async function fileTypeFromTokenizer(tokenizer, options) {
	return new FileTypeParser$1(options).fromTokenizer(tokenizer);
}
var reasonableDetectionSizeInBytes, maximumMpegOffsetTolerance, maximumZipEntrySizeInBytes, maximumZipEntryCount, maximumZipBufferedReadSizeInBytes, maximumUntrustedSkipSizeInBytes, maximumUnknownSizePayloadProbeSizeInBytes, maximumZipTextEntrySizeInBytes, maximumNestedGzipDetectionSizeInBytes, maximumNestedGzipProbeDepth, unknownSizeGzipProbeTimeoutInMilliseconds, maximumId3HeaderSizeInBytes, maximumEbmlDocumentTypeSizeInBytes, maximumEbmlElementPayloadSizeInBytes, maximumEbmlElementCount, maximumPngChunkCount, maximumPngStreamScanBudgetInBytes, maximumAsfHeaderObjectCount, maximumTiffTagCount, maximumDetectionReentryCount, maximumPngChunkSizeInBytes, maximumAsfHeaderPayloadSizeInBytes, maximumTiffStreamIfdOffsetInBytes, maximumTiffIfdOffsetInBytes, recoverableZipErrorMessages, recoverableZipErrorMessagePrefixes, recoverableZipErrorCodes, ParserHardLimitError, zipDataDescriptorSignature, zipDataDescriptorLengthInBytes, zipDataDescriptorOverlapLengthInBytes, FileTypeParser$1, supportedExtensions, supportedMimeTypes;
var init_core = __esmMin((() => {
	init_lib$1();
	init_core$1();
	init_lib();
	init_uint8array_extras();
	init_util();
	init_supported();
	reasonableDetectionSizeInBytes = 4100;
	maximumMpegOffsetTolerance = reasonableDetectionSizeInBytes - 2;
	maximumZipEntrySizeInBytes = 1024 * 1024;
	maximumZipEntryCount = 1024;
	maximumZipBufferedReadSizeInBytes = 2 ** 31 - 1;
	maximumUntrustedSkipSizeInBytes = 16 * 1024 * 1024;
	maximumUnknownSizePayloadProbeSizeInBytes = maximumZipEntrySizeInBytes;
	maximumZipTextEntrySizeInBytes = maximumZipEntrySizeInBytes;
	maximumNestedGzipDetectionSizeInBytes = maximumUntrustedSkipSizeInBytes;
	maximumNestedGzipProbeDepth = 1;
	unknownSizeGzipProbeTimeoutInMilliseconds = 100;
	maximumId3HeaderSizeInBytes = maximumUntrustedSkipSizeInBytes;
	maximumEbmlDocumentTypeSizeInBytes = 64;
	maximumEbmlElementPayloadSizeInBytes = maximumUnknownSizePayloadProbeSizeInBytes;
	maximumEbmlElementCount = 256;
	maximumPngChunkCount = 512;
	maximumPngStreamScanBudgetInBytes = maximumUntrustedSkipSizeInBytes;
	maximumAsfHeaderObjectCount = 512;
	maximumTiffTagCount = 512;
	maximumDetectionReentryCount = 256;
	maximumPngChunkSizeInBytes = maximumUnknownSizePayloadProbeSizeInBytes;
	maximumAsfHeaderPayloadSizeInBytes = maximumUnknownSizePayloadProbeSizeInBytes;
	maximumTiffStreamIfdOffsetInBytes = maximumUnknownSizePayloadProbeSizeInBytes;
	maximumTiffIfdOffsetInBytes = maximumUntrustedSkipSizeInBytes;
	recoverableZipErrorMessages = new Set([
		"Unexpected signature",
		"Encrypted ZIP",
		"Expected Central-File-Header signature"
	]);
	recoverableZipErrorMessagePrefixes = [
		"ZIP entry count exceeds ",
		"Unsupported ZIP compression method:",
		"ZIP entry compressed data exceeds ",
		"ZIP entry decompressed data exceeds ",
		"Expected data-descriptor-signature at position "
	];
	recoverableZipErrorCodes = new Set([
		"Z_BUF_ERROR",
		"Z_DATA_ERROR",
		"ERR_INVALID_STATE"
	]);
	ParserHardLimitError = class extends Error {};
	zipDataDescriptorSignature = 134695760;
	zipDataDescriptorLengthInBytes = 16;
	zipDataDescriptorOverlapLengthInBytes = zipDataDescriptorLengthInBytes - 1;
	ZipHandler.prototype.inflate = async function(zipHeader, fileData, callback) {
		if (zipHeader.compressedMethod === 0) return callback(fileData);
		if (zipHeader.compressedMethod !== 8) throw new Error(`Unsupported ZIP compression method: ${zipHeader.compressedMethod}`);
		return callback(await decompressDeflateRawWithLimit(fileData, { maximumLength: maximumZipEntrySizeInBytes }));
	};
	ZipHandler.prototype.unzip = async function(fileCallback) {
		let stop = false;
		let zipEntryCount = 0;
		const zipScanStart = this.tokenizer.position;
		this.knownSizeDescriptorScannedBytes = 0;
		do {
			if (hasExceededUnknownSizeScanBudget(this.tokenizer, zipScanStart, maximumUntrustedSkipSizeInBytes)) throw new ParserHardLimitError(`ZIP stream probing exceeds ${maximumUntrustedSkipSizeInBytes} bytes`);
			const zipHeader = await this.readLocalFileHeader();
			if (!zipHeader) break;
			zipEntryCount++;
			if (zipEntryCount > maximumZipEntryCount) throw new Error(`ZIP entry count exceeds ${maximumZipEntryCount}`);
			const next = fileCallback(zipHeader);
			stop = Boolean(next.stop);
			await this.tokenizer.ignore(zipHeader.extraFieldLength);
			const fileData = await readZipEntryData(this, zipHeader, {
				shouldBuffer: Boolean(next.handler),
				maximumDescriptorLength: Math.min(maximumZipEntrySizeInBytes, getRemainingZipScanBudget(this, zipScanStart))
			});
			if (next.handler) await this.inflate(zipHeader, fileData, next.handler);
			if (zipHeader.dataDescriptor) {
				const dataDescriptor = new Uint8Array(zipDataDescriptorLengthInBytes);
				await this.tokenizer.readBuffer(dataDescriptor);
				if (UINT32_LE.get(dataDescriptor, 0) !== zipDataDescriptorSignature) throw new Error(`Expected data-descriptor-signature at position ${this.tokenizer.position - dataDescriptor.length}`);
			}
			if (hasExceededUnknownSizeScanBudget(this.tokenizer, zipScanStart, maximumUntrustedSkipSizeInBytes)) throw new ParserHardLimitError(`ZIP stream probing exceeds ${maximumUntrustedSkipSizeInBytes} bytes`);
		} while (!stop);
	};
	FileTypeParser$1 = class FileTypeParser$1 {
		constructor(options) {
			const normalizedMpegOffsetTolerance = normalizeMpegOffsetTolerance(options?.mpegOffsetTolerance);
			this.options = {
				...options,
				mpegOffsetTolerance: normalizedMpegOffsetTolerance
			};
			this.detectors = [
				...this.options.customDetectors ?? [],
				{
					id: "core",
					detect: this.detectConfident
				},
				{
					id: "core.imprecise",
					detect: this.detectImprecise
				}
			];
			this.tokenizerOptions = { abortSignal: this.options.signal };
			this.gzipProbeDepth = 0;
		}
		getTokenizerOptions() {
			return { ...this.tokenizerOptions };
		}
		createTokenizerFromWebStream(stream) {
			return patchWebByobTokenizerClose(fromWebStream(stream, this.getTokenizerOptions()));
		}
		async parseTokenizer(tokenizer, detectionReentryCount = 0) {
			this.detectionReentryCount = detectionReentryCount;
			const initialPosition = tokenizer.position;
			for (const detector of this.detectors) {
				let fileType;
				try {
					fileType = await detector.detect(tokenizer);
				} catch (error) {
					if (error instanceof EndOfStreamError) return;
					if (error instanceof ParserHardLimitError) return;
					throw error;
				}
				if (fileType) return fileType;
				if (initialPosition !== tokenizer.position) return;
			}
		}
		async fromTokenizer(tokenizer) {
			try {
				return await this.parseTokenizer(tokenizer);
			} finally {
				await tokenizer.close();
			}
		}
		async fromBuffer(input) {
			if (!(input instanceof Uint8Array || input instanceof ArrayBuffer)) throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof input}\``);
			const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);
			if (!(buffer?.length > 1)) return;
			return this.fromTokenizer(fromBuffer(buffer, this.getTokenizerOptions()));
		}
		async fromBlob(blob) {
			this.options.signal?.throwIfAborted();
			const tokenizer = fromBlob(blob, this.getTokenizerOptions());
			return this.fromTokenizer(tokenizer);
		}
		async fromStream(stream) {
			this.options.signal?.throwIfAborted();
			const tokenizer = this.createTokenizerFromWebStream(stream);
			return this.fromTokenizer(tokenizer);
		}
		async toDetectionStream(stream, options) {
			const sampleSize = normalizeSampleSize(options?.sampleSize ?? 4100);
			let detectedFileType;
			let firstChunk;
			const reader = stream.getReader({ mode: "byob" });
			try {
				const { value: chunk, done } = await readByobReaderWithSignal(reader, new Uint8Array(sampleSize), this.options.signal);
				firstChunk = chunk;
				if (!done && chunk) try {
					detectedFileType = await this.fromBuffer(chunk.subarray(0, sampleSize));
				} catch (error) {
					if (!(error instanceof EndOfStreamError)) throw error;
					detectedFileType = void 0;
				}
				firstChunk = chunk;
			} finally {
				reader.releaseLock();
			}
			const transformStream = new TransformStream({
				async start(controller) {
					controller.enqueue(firstChunk);
				},
				transform(chunk, controller) {
					controller.enqueue(chunk);
				}
			});
			const newStream = stream.pipeThrough(transformStream);
			newStream.fileType = detectedFileType;
			return newStream;
		}
		async detectGzip(tokenizer) {
			if (this.gzipProbeDepth >= maximumNestedGzipProbeDepth) return {
				ext: "gz",
				mime: "application/gzip"
			};
			const limitedInflatedStream = createByteLimitedReadableStream(new GzipHandler(tokenizer).inflate(), maximumNestedGzipDetectionSizeInBytes);
			const hasUnknownSize = hasUnknownFileSize(tokenizer);
			let timeout;
			let probeSignal;
			let probeParser;
			let compressedFileType;
			if (hasUnknownSize) {
				const timeoutController = new AbortController();
				timeout = setTimeout(() => {
					timeoutController.abort(new DOMException(`Operation timed out after ${unknownSizeGzipProbeTimeoutInMilliseconds} ms`, "TimeoutError"));
				}, unknownSizeGzipProbeTimeoutInMilliseconds);
				probeSignal = this.options.signal === void 0 ? timeoutController.signal : AbortSignal.any([this.options.signal, timeoutController.signal]);
				probeParser = new FileTypeParser$1({
					...this.options,
					signal: probeSignal
				});
				probeParser.gzipProbeDepth = this.gzipProbeDepth + 1;
			} else this.gzipProbeDepth++;
			try {
				compressedFileType = await (probeParser ?? this).fromStream(limitedInflatedStream);
			} catch (error) {
				if (error?.name === "AbortError" && probeSignal?.reason?.name !== "TimeoutError") throw error;
			} finally {
				clearTimeout(timeout);
				if (!hasUnknownSize) this.gzipProbeDepth--;
			}
			if (compressedFileType?.ext === "tar") return {
				ext: "tar.gz",
				mime: "application/gzip"
			};
			return {
				ext: "gz",
				mime: "application/gzip"
			};
		}
		check(header, options) {
			return _check(this.buffer, header, options);
		}
		checkString(header, options) {
			return this.check(stringToBytes(header, options?.encoding), options);
		}
		detectConfident = async (tokenizer) => {
			this.buffer = new Uint8Array(reasonableDetectionSizeInBytes);
			if (tokenizer.fileInfo.size === void 0) tokenizer.fileInfo.size = Number.MAX_SAFE_INTEGER;
			this.tokenizer = tokenizer;
			if (hasUnknownFileSize(tokenizer)) {
				await tokenizer.peekBuffer(this.buffer, {
					length: 3,
					mayBeLess: true
				});
				if (this.check([
					31,
					139,
					8
				])) return this.detectGzip(tokenizer);
			}
			await tokenizer.peekBuffer(this.buffer, {
				length: 32,
				mayBeLess: true
			});
			if (this.check([66, 77])) return {
				ext: "bmp",
				mime: "image/bmp"
			};
			if (this.check([11, 119])) return {
				ext: "ac3",
				mime: "audio/vnd.dolby.dd-raw"
			};
			if (this.check([120, 1])) return {
				ext: "dmg",
				mime: "application/x-apple-diskimage"
			};
			if (this.check([77, 90])) return {
				ext: "exe",
				mime: "application/x-msdownload"
			};
			if (this.check([37, 33])) {
				await tokenizer.peekBuffer(this.buffer, {
					length: 24,
					mayBeLess: true
				});
				if (this.checkString("PS-Adobe-", { offset: 2 }) && this.checkString(" EPSF-", { offset: 14 })) return {
					ext: "eps",
					mime: "application/eps"
				};
				return {
					ext: "ps",
					mime: "application/postscript"
				};
			}
			if (this.check([31, 160]) || this.check([31, 157])) return {
				ext: "Z",
				mime: "application/x-compress"
			};
			if (this.check([199, 113])) return {
				ext: "cpio",
				mime: "application/x-cpio"
			};
			if (this.check([96, 234])) return {
				ext: "arj",
				mime: "application/x-arj"
			};
			if (this.check([
				239,
				187,
				191
			])) {
				if (this.detectionReentryCount >= maximumDetectionReentryCount) return;
				this.detectionReentryCount++;
				await this.tokenizer.ignore(3);
				return this.detectConfident(tokenizer);
			}
			if (this.check([
				71,
				73,
				70
			])) return {
				ext: "gif",
				mime: "image/gif"
			};
			if (this.check([
				73,
				73,
				188
			])) return {
				ext: "jxr",
				mime: "image/vnd.ms-photo"
			};
			if (this.check([
				31,
				139,
				8
			])) return this.detectGzip(tokenizer);
			if (this.check([
				66,
				90,
				104
			])) return {
				ext: "bz2",
				mime: "application/x-bzip2"
			};
			if (this.checkString("ID3")) {
				await safeIgnore(tokenizer, 6, {
					maximumLength: 6,
					reason: "ID3 header prefix"
				});
				const id3HeaderLength = await tokenizer.readToken(uint32SyncSafeToken);
				const isUnknownFileSize = hasUnknownFileSize(tokenizer);
				if (!Number.isFinite(id3HeaderLength) || id3HeaderLength < 0 || isUnknownFileSize && (id3HeaderLength > maximumId3HeaderSizeInBytes || tokenizer.position + id3HeaderLength > maximumId3HeaderSizeInBytes)) return;
				if (tokenizer.position + id3HeaderLength > tokenizer.fileInfo.size) {
					if (isUnknownFileSize) return;
					return {
						ext: "mp3",
						mime: "audio/mpeg"
					};
				}
				try {
					await safeIgnore(tokenizer, id3HeaderLength, {
						maximumLength: isUnknownFileSize ? maximumId3HeaderSizeInBytes : tokenizer.fileInfo.size,
						reason: "ID3 payload"
					});
				} catch (error) {
					if (error instanceof EndOfStreamError) return;
					throw error;
				}
				if (this.detectionReentryCount >= maximumDetectionReentryCount) return;
				this.detectionReentryCount++;
				return this.parseTokenizer(tokenizer, this.detectionReentryCount);
			}
			if (this.checkString("MP+")) return {
				ext: "mpc",
				mime: "audio/x-musepack"
			};
			if ((this.buffer[0] === 67 || this.buffer[0] === 70) && this.check([87, 83], { offset: 1 })) return {
				ext: "swf",
				mime: "application/x-shockwave-flash"
			};
			if (this.check([
				255,
				216,
				255
			])) {
				if (this.check([247], { offset: 3 })) return {
					ext: "jls",
					mime: "image/jls"
				};
				return {
					ext: "jpg",
					mime: "image/jpeg"
				};
			}
			if (this.check([
				79,
				98,
				106,
				1
			])) return {
				ext: "avro",
				mime: "application/avro"
			};
			if (this.checkString("FLIF")) return {
				ext: "flif",
				mime: "image/flif"
			};
			if (this.checkString("8BPS")) return {
				ext: "psd",
				mime: "image/vnd.adobe.photoshop"
			};
			if (this.checkString("MPCK")) return {
				ext: "mpc",
				mime: "audio/x-musepack"
			};
			if (this.checkString("FORM")) return {
				ext: "aif",
				mime: "audio/aiff"
			};
			if (this.checkString("icns", { offset: 0 })) return {
				ext: "icns",
				mime: "image/icns"
			};
			if (this.check([
				80,
				75,
				3,
				4
			])) {
				let fileType;
				const openXmlState = createOpenXmlZipDetectionState();
				try {
					await new ZipHandler(tokenizer).unzip((zipHeader) => {
						updateOpenXmlZipDetectionStateFromFilename(openXmlState, zipHeader.filename);
						const isOpenXmlContentTypesEntry = zipHeader.filename === "[Content_Types].xml";
						const openXmlFileTypeFromEntries = getOpenXmlFileTypeFromZipEntries(openXmlState);
						if (!isOpenXmlContentTypesEntry && openXmlFileTypeFromEntries) {
							fileType = openXmlFileTypeFromEntries;
							return { stop: true };
						}
						switch (zipHeader.filename) {
							case "META-INF/mozilla.rsa":
								fileType = {
									ext: "xpi",
									mime: "application/x-xpinstall"
								};
								return { stop: true };
							case "META-INF/MANIFEST.MF":
								fileType = {
									ext: "jar",
									mime: "application/java-archive"
								};
								return { stop: true };
							case "mimetype":
								if (!canReadZipEntryForDetection(zipHeader, maximumZipTextEntrySizeInBytes)) return {};
								return {
									async handler(fileData) {
										fileType = getFileTypeFromMimeType(new TextDecoder("utf-8").decode(fileData).trim());
									},
									stop: true
								};
							case "[Content_Types].xml":
								openXmlState.hasContentTypesEntry = true;
								if (!canReadZipEntryForDetection(zipHeader, maximumZipTextEntrySizeInBytes)) {
									openXmlState.hasUnparseableContentTypes = true;
									return {};
								}
								openXmlState.isParsingContentTypes = true;
								return {
									async handler(fileData) {
										const mimeType = getOpenXmlMimeTypeFromContentTypesXml(new TextDecoder("utf-8").decode(fileData));
										if (mimeType) fileType = getFileTypeFromMimeType(mimeType);
										openXmlState.hasParsedContentTypesEntry = true;
										openXmlState.isParsingContentTypes = false;
									},
									stop: true
								};
							default:
								if (/classes\d*\.dex/.test(zipHeader.filename)) {
									fileType = {
										ext: "apk",
										mime: "application/vnd.android.package-archive"
									};
									return { stop: true };
								}
								return {};
						}
					});
				} catch (error) {
					if (!isRecoverableZipError(error)) throw error;
					if (openXmlState.isParsingContentTypes) {
						openXmlState.isParsingContentTypes = false;
						openXmlState.hasUnparseableContentTypes = true;
					}
				}
				return fileType ?? getOpenXmlFileTypeFromZipEntries(openXmlState) ?? {
					ext: "zip",
					mime: "application/zip"
				};
			}
			if (this.checkString("OggS")) {
				await tokenizer.ignore(28);
				const type = new Uint8Array(8);
				await tokenizer.readBuffer(type);
				if (_check(type, [
					79,
					112,
					117,
					115,
					72,
					101,
					97,
					100
				])) return {
					ext: "opus",
					mime: "audio/ogg; codecs=opus"
				};
				if (_check(type, [
					128,
					116,
					104,
					101,
					111,
					114,
					97
				])) return {
					ext: "ogv",
					mime: "video/ogg"
				};
				if (_check(type, [
					1,
					118,
					105,
					100,
					101,
					111,
					0
				])) return {
					ext: "ogm",
					mime: "video/ogg"
				};
				if (_check(type, [
					127,
					70,
					76,
					65,
					67
				])) return {
					ext: "oga",
					mime: "audio/ogg"
				};
				if (_check(type, [
					83,
					112,
					101,
					101,
					120,
					32,
					32
				])) return {
					ext: "spx",
					mime: "audio/ogg"
				};
				if (_check(type, [
					1,
					118,
					111,
					114,
					98,
					105,
					115
				])) return {
					ext: "ogg",
					mime: "audio/ogg"
				};
				return {
					ext: "ogx",
					mime: "application/ogg"
				};
			}
			if (this.check([80, 75]) && (this.buffer[2] === 3 || this.buffer[2] === 5 || this.buffer[2] === 7) && (this.buffer[3] === 4 || this.buffer[3] === 6 || this.buffer[3] === 8)) return {
				ext: "zip",
				mime: "application/zip"
			};
			if (this.checkString("MThd")) return {
				ext: "mid",
				mime: "audio/midi"
			};
			if (this.checkString("wOFF") && (this.check([
				0,
				1,
				0,
				0
			], { offset: 4 }) || this.checkString("OTTO", { offset: 4 }))) return {
				ext: "woff",
				mime: "font/woff"
			};
			if (this.checkString("wOF2") && (this.check([
				0,
				1,
				0,
				0
			], { offset: 4 }) || this.checkString("OTTO", { offset: 4 }))) return {
				ext: "woff2",
				mime: "font/woff2"
			};
			if (this.check([
				212,
				195,
				178,
				161
			]) || this.check([
				161,
				178,
				195,
				212
			])) return {
				ext: "pcap",
				mime: "application/vnd.tcpdump.pcap"
			};
			if (this.checkString("DSD ")) return {
				ext: "dsf",
				mime: "audio/x-dsf"
			};
			if (this.checkString("LZIP")) return {
				ext: "lz",
				mime: "application/x-lzip"
			};
			if (this.checkString("fLaC")) return {
				ext: "flac",
				mime: "audio/flac"
			};
			if (this.check([
				66,
				80,
				71,
				251
			])) return {
				ext: "bpg",
				mime: "image/bpg"
			};
			if (this.checkString("wvpk")) return {
				ext: "wv",
				mime: "audio/wavpack"
			};
			if (this.checkString("%PDF")) return {
				ext: "pdf",
				mime: "application/pdf"
			};
			if (this.check([
				0,
				97,
				115,
				109
			])) return {
				ext: "wasm",
				mime: "application/wasm"
			};
			if (this.check([73, 73])) {
				const fileType = await this.readTiffHeader(false);
				if (fileType) return fileType;
			}
			if (this.check([77, 77])) {
				const fileType = await this.readTiffHeader(true);
				if (fileType) return fileType;
			}
			if (this.checkString("MAC ")) return {
				ext: "ape",
				mime: "audio/ape"
			};
			if (this.check([
				26,
				69,
				223,
				163
			])) {
				async function readField() {
					const msb = await tokenizer.peekNumber(UINT8);
					let mask = 128;
					let ic = 0;
					while ((msb & mask) === 0 && mask !== 0) {
						++ic;
						mask >>= 1;
					}
					const id = new Uint8Array(ic + 1);
					await safeReadBuffer(tokenizer, id, void 0, {
						maximumLength: id.length,
						reason: "EBML field"
					});
					return id;
				}
				async function readElement() {
					const idField = await readField();
					const lengthField = await readField();
					lengthField[0] ^= 128 >> lengthField.length - 1;
					const nrLength = Math.min(6, lengthField.length);
					const idView = new DataView(idField.buffer);
					const lengthView = new DataView(lengthField.buffer, lengthField.length - nrLength, nrLength);
					return {
						id: getUintBE(idView),
						len: getUintBE(lengthView)
					};
				}
				async function readChildren(children) {
					let ebmlElementCount = 0;
					while (children > 0) {
						ebmlElementCount++;
						if (ebmlElementCount > maximumEbmlElementCount) return;
						if (hasExceededUnknownSizeScanBudget(tokenizer, ebmlScanStart, maximumUntrustedSkipSizeInBytes)) return;
						const previousPosition = tokenizer.position;
						const element = await readElement();
						if (element.id === 17026) {
							if (element.len > maximumEbmlDocumentTypeSizeInBytes) return;
							const documentTypeLength = getSafeBound(element.len, maximumEbmlDocumentTypeSizeInBytes, "EBML DocType");
							return (await tokenizer.readToken(new StringType(documentTypeLength))).replaceAll(/\00.*$/g, "");
						}
						if (hasUnknownFileSize(tokenizer) && (!Number.isFinite(element.len) || element.len < 0 || element.len > maximumEbmlElementPayloadSizeInBytes)) return;
						await safeIgnore(tokenizer, element.len, {
							maximumLength: hasUnknownFileSize(tokenizer) ? maximumEbmlElementPayloadSizeInBytes : tokenizer.fileInfo.size,
							reason: "EBML payload"
						});
						--children;
						if (tokenizer.position <= previousPosition) return;
					}
				}
				const rootElement = await readElement();
				const ebmlScanStart = tokenizer.position;
				switch (await readChildren(rootElement.len)) {
					case "webm": return {
						ext: "webm",
						mime: "video/webm"
					};
					case "matroska": return {
						ext: "mkv",
						mime: "video/matroska"
					};
					default: return;
				}
			}
			if (this.checkString("SQLi")) return {
				ext: "sqlite",
				mime: "application/x-sqlite3"
			};
			if (this.check([
				78,
				69,
				83,
				26
			])) return {
				ext: "nes",
				mime: "application/x-nintendo-nes-rom"
			};
			if (this.checkString("Cr24")) return {
				ext: "crx",
				mime: "application/x-google-chrome-extension"
			};
			if (this.checkString("MSCF") || this.checkString("ISc(")) return {
				ext: "cab",
				mime: "application/vnd.ms-cab-compressed"
			};
			if (this.check([
				237,
				171,
				238,
				219
			])) return {
				ext: "rpm",
				mime: "application/x-rpm"
			};
			if (this.check([
				197,
				208,
				211,
				198
			])) return {
				ext: "eps",
				mime: "application/eps"
			};
			if (this.check([
				40,
				181,
				47,
				253
			])) return {
				ext: "zst",
				mime: "application/zstd"
			};
			if (this.check([
				127,
				69,
				76,
				70
			])) return {
				ext: "elf",
				mime: "application/x-elf"
			};
			if (this.check([
				33,
				66,
				68,
				78
			])) return {
				ext: "pst",
				mime: "application/vnd.ms-outlook"
			};
			if (this.checkString("PAR1") || this.checkString("PARE")) return {
				ext: "parquet",
				mime: "application/vnd.apache.parquet"
			};
			if (this.checkString("ttcf")) return {
				ext: "ttc",
				mime: "font/collection"
			};
			if (this.check([
				254,
				237,
				250,
				206
			]) || this.check([
				254,
				237,
				250,
				207
			]) || this.check([
				206,
				250,
				237,
				254
			]) || this.check([
				207,
				250,
				237,
				254
			])) return {
				ext: "macho",
				mime: "application/x-mach-binary"
			};
			if (this.check([
				4,
				34,
				77,
				24
			])) return {
				ext: "lz4",
				mime: "application/x-lz4"
			};
			if (this.checkString("regf")) return {
				ext: "dat",
				mime: "application/x-ft-windows-registry-hive"
			};
			if (this.checkString("$FL2") || this.checkString("$FL3")) return {
				ext: "sav",
				mime: "application/x-spss-sav"
			};
			if (this.check([
				79,
				84,
				84,
				79,
				0
			])) return {
				ext: "otf",
				mime: "font/otf"
			};
			if (this.checkString("#!AMR")) return {
				ext: "amr",
				mime: "audio/amr"
			};
			if (this.checkString("{\\rtf")) return {
				ext: "rtf",
				mime: "application/rtf"
			};
			if (this.check([
				70,
				76,
				86,
				1
			])) return {
				ext: "flv",
				mime: "video/x-flv"
			};
			if (this.checkString("IMPM")) return {
				ext: "it",
				mime: "audio/x-it"
			};
			if (this.checkString("-lh0-", { offset: 2 }) || this.checkString("-lh1-", { offset: 2 }) || this.checkString("-lh2-", { offset: 2 }) || this.checkString("-lh3-", { offset: 2 }) || this.checkString("-lh4-", { offset: 2 }) || this.checkString("-lh5-", { offset: 2 }) || this.checkString("-lh6-", { offset: 2 }) || this.checkString("-lh7-", { offset: 2 }) || this.checkString("-lzs-", { offset: 2 }) || this.checkString("-lz4-", { offset: 2 }) || this.checkString("-lz5-", { offset: 2 }) || this.checkString("-lhd-", { offset: 2 })) return {
				ext: "lzh",
				mime: "application/x-lzh-compressed"
			};
			if (this.check([
				0,
				0,
				1,
				186
			])) {
				if (this.check([33], {
					offset: 4,
					mask: [241]
				})) return {
					ext: "mpg",
					mime: "video/MP1S"
				};
				if (this.check([68], {
					offset: 4,
					mask: [196]
				})) return {
					ext: "mpg",
					mime: "video/MP2P"
				};
			}
			if (this.checkString("ITSF")) return {
				ext: "chm",
				mime: "application/vnd.ms-htmlhelp"
			};
			if (this.check([
				202,
				254,
				186,
				190
			])) {
				const machOArchitectureCount = UINT32_BE.get(this.buffer, 4);
				const javaClassFileMajorVersion = UINT16_BE.get(this.buffer, 6);
				if (machOArchitectureCount > 0 && machOArchitectureCount <= 30) return {
					ext: "macho",
					mime: "application/x-mach-binary"
				};
				if (javaClassFileMajorVersion > 30) return {
					ext: "class",
					mime: "application/java-vm"
				};
			}
			if (this.checkString(".RMF")) return {
				ext: "rm",
				mime: "application/vnd.rn-realmedia"
			};
			if (this.checkString("DRACO")) return {
				ext: "drc",
				mime: "application/vnd.google.draco"
			};
			if (this.check([
				253,
				55,
				122,
				88,
				90,
				0
			])) return {
				ext: "xz",
				mime: "application/x-xz"
			};
			if (this.checkString("<?xml ")) return {
				ext: "xml",
				mime: "application/xml"
			};
			if (this.check([
				55,
				122,
				188,
				175,
				39,
				28
			])) return {
				ext: "7z",
				mime: "application/x-7z-compressed"
			};
			if (this.check([
				82,
				97,
				114,
				33,
				26,
				7
			]) && (this.buffer[6] === 0 || this.buffer[6] === 1)) return {
				ext: "rar",
				mime: "application/x-rar-compressed"
			};
			if (this.checkString("solid ")) return {
				ext: "stl",
				mime: "model/stl"
			};
			if (this.checkString("AC")) {
				const version = new StringType(4, "latin1").get(this.buffer, 2);
				if (version.match("^d*") && version >= 1e3 && version <= 1050) return {
					ext: "dwg",
					mime: "image/vnd.dwg"
				};
			}
			if (this.checkString("070707")) return {
				ext: "cpio",
				mime: "application/x-cpio"
			};
			if (this.checkString("BLENDER")) return {
				ext: "blend",
				mime: "application/x-blender"
			};
			if (this.checkString("!<arch>")) {
				await tokenizer.ignore(8);
				if (await tokenizer.readToken(new StringType(13, "ascii")) === "debian-binary") return {
					ext: "deb",
					mime: "application/x-deb"
				};
				return {
					ext: "ar",
					mime: "application/x-unix-archive"
				};
			}
			if (this.checkString("WEBVTT") && [
				"\n",
				"\r",
				"	",
				" ",
				"\0"
			].some((char7) => this.checkString(char7, { offset: 6 }))) return {
				ext: "vtt",
				mime: "text/vtt"
			};
			if (this.check([
				137,
				80,
				78,
				71,
				13,
				10,
				26,
				10
			])) {
				const pngFileType = {
					ext: "png",
					mime: "image/png"
				};
				const apngFileType = {
					ext: "apng",
					mime: "image/apng"
				};
				await tokenizer.ignore(8);
				async function readChunkHeader() {
					return {
						length: await tokenizer.readToken(INT32_BE),
						type: await tokenizer.readToken(new StringType(4, "latin1"))
					};
				}
				const isUnknownPngStream = hasUnknownFileSize(tokenizer);
				const pngScanStart = tokenizer.position;
				let pngChunkCount = 0;
				let hasSeenImageHeader = false;
				do {
					pngChunkCount++;
					if (pngChunkCount > maximumPngChunkCount) break;
					if (hasExceededUnknownSizeScanBudget(tokenizer, pngScanStart, maximumPngStreamScanBudgetInBytes)) break;
					const previousPosition = tokenizer.position;
					const chunk = await readChunkHeader();
					if (chunk.length < 0) return;
					if (chunk.type === "IHDR") {
						if (chunk.length !== 13) return;
						hasSeenImageHeader = true;
					}
					switch (chunk.type) {
						case "IDAT": return pngFileType;
						case "acTL": return apngFileType;
						default:
							if (!hasSeenImageHeader && chunk.type !== "CgBI") return;
							if (isUnknownPngStream && chunk.length > maximumPngChunkSizeInBytes) return hasSeenImageHeader && isPngAncillaryChunk(chunk.type) ? pngFileType : void 0;
							try {
								await safeIgnore(tokenizer, chunk.length + 4, {
									maximumLength: isUnknownPngStream ? maximumPngChunkSizeInBytes + 4 : tokenizer.fileInfo.size,
									reason: "PNG chunk payload"
								});
							} catch (error) {
								if (!isUnknownPngStream && (error instanceof ParserHardLimitError || error instanceof EndOfStreamError)) return pngFileType;
								throw error;
							}
					}
					if (tokenizer.position <= previousPosition) break;
				} while (tokenizer.position + 8 < tokenizer.fileInfo.size);
				return pngFileType;
			}
			if (this.check([
				65,
				82,
				82,
				79,
				87,
				49,
				0,
				0
			])) return {
				ext: "arrow",
				mime: "application/vnd.apache.arrow.file"
			};
			if (this.check([
				103,
				108,
				84,
				70,
				2,
				0,
				0,
				0
			])) return {
				ext: "glb",
				mime: "model/gltf-binary"
			};
			if (this.check([
				102,
				114,
				101,
				101
			], { offset: 4 }) || this.check([
				109,
				100,
				97,
				116
			], { offset: 4 }) || this.check([
				109,
				111,
				111,
				118
			], { offset: 4 }) || this.check([
				119,
				105,
				100,
				101
			], { offset: 4 })) return {
				ext: "mov",
				mime: "video/quicktime"
			};
			if (this.check([
				73,
				73,
				82,
				79,
				8,
				0,
				0,
				0,
				24
			])) return {
				ext: "orf",
				mime: "image/x-olympus-orf"
			};
			if (this.checkString("gimp xcf ")) return {
				ext: "xcf",
				mime: "image/x-xcf"
			};
			if (this.checkString("ftyp", { offset: 4 }) && (this.buffer[8] & 96) !== 0) {
				const brandMajor = new StringType(4, "latin1").get(this.buffer, 8).replace("\0", " ").trim();
				switch (brandMajor) {
					case "avif":
					case "avis": return {
						ext: "avif",
						mime: "image/avif"
					};
					case "mif1": return {
						ext: "heic",
						mime: "image/heif"
					};
					case "msf1": return {
						ext: "heic",
						mime: "image/heif-sequence"
					};
					case "heic":
					case "heix": return {
						ext: "heic",
						mime: "image/heic"
					};
					case "hevc":
					case "hevx": return {
						ext: "heic",
						mime: "image/heic-sequence"
					};
					case "qt": return {
						ext: "mov",
						mime: "video/quicktime"
					};
					case "M4V":
					case "M4VH":
					case "M4VP": return {
						ext: "m4v",
						mime: "video/x-m4v"
					};
					case "M4P": return {
						ext: "m4p",
						mime: "video/mp4"
					};
					case "M4B": return {
						ext: "m4b",
						mime: "audio/mp4"
					};
					case "M4A": return {
						ext: "m4a",
						mime: "audio/x-m4a"
					};
					case "F4V": return {
						ext: "f4v",
						mime: "video/mp4"
					};
					case "F4P": return {
						ext: "f4p",
						mime: "video/mp4"
					};
					case "F4A": return {
						ext: "f4a",
						mime: "audio/mp4"
					};
					case "F4B": return {
						ext: "f4b",
						mime: "audio/mp4"
					};
					case "crx": return {
						ext: "cr3",
						mime: "image/x-canon-cr3"
					};
					default:
						if (brandMajor.startsWith("3g")) {
							if (brandMajor.startsWith("3g2")) return {
								ext: "3g2",
								mime: "video/3gpp2"
							};
							return {
								ext: "3gp",
								mime: "video/3gpp"
							};
						}
						return {
							ext: "mp4",
							mime: "video/mp4"
						};
				}
			}
			if (this.checkString("REGEDIT4\r\n")) return {
				ext: "reg",
				mime: "application/x-ms-regedit"
			};
			if (this.check([
				82,
				73,
				70,
				70
			])) {
				if (this.checkString("WEBP", { offset: 8 })) return {
					ext: "webp",
					mime: "image/webp"
				};
				if (this.check([
					65,
					86,
					73
				], { offset: 8 })) return {
					ext: "avi",
					mime: "video/vnd.avi"
				};
				if (this.check([
					87,
					65,
					86,
					69
				], { offset: 8 })) return {
					ext: "wav",
					mime: "audio/wav"
				};
				if (this.check([
					81,
					76,
					67,
					77
				], { offset: 8 })) return {
					ext: "qcp",
					mime: "audio/qcelp"
				};
			}
			if (this.check([
				73,
				73,
				85,
				0,
				24,
				0,
				0,
				0,
				136,
				231,
				116,
				216
			])) return {
				ext: "rw2",
				mime: "image/x-panasonic-rw2"
			};
			if (this.check([
				48,
				38,
				178,
				117,
				142,
				102,
				207,
				17,
				166,
				217
			])) {
				let isMalformedAsf = false;
				try {
					async function readHeader() {
						const guid = new Uint8Array(16);
						await safeReadBuffer(tokenizer, guid, void 0, {
							maximumLength: guid.length,
							reason: "ASF header GUID"
						});
						return {
							id: guid,
							size: Number(await tokenizer.readToken(UINT64_LE))
						};
					}
					await safeIgnore(tokenizer, 30, {
						maximumLength: 30,
						reason: "ASF header prelude"
					});
					const isUnknownFileSize = hasUnknownFileSize(tokenizer);
					const asfHeaderScanStart = tokenizer.position;
					let asfHeaderObjectCount = 0;
					while (tokenizer.position + 24 < tokenizer.fileInfo.size) {
						asfHeaderObjectCount++;
						if (asfHeaderObjectCount > maximumAsfHeaderObjectCount) break;
						if (hasExceededUnknownSizeScanBudget(tokenizer, asfHeaderScanStart, maximumUntrustedSkipSizeInBytes)) break;
						const previousPosition = tokenizer.position;
						const header = await readHeader();
						let payload = header.size - 24;
						if (!Number.isFinite(payload) || payload < 0) {
							isMalformedAsf = true;
							break;
						}
						if (_check(header.id, [
							145,
							7,
							220,
							183,
							183,
							169,
							207,
							17,
							142,
							230,
							0,
							192,
							12,
							32,
							83,
							101
						])) {
							const typeId = new Uint8Array(16);
							payload -= await safeReadBuffer(tokenizer, typeId, void 0, {
								maximumLength: typeId.length,
								reason: "ASF stream type GUID"
							});
							if (_check(typeId, [
								64,
								158,
								105,
								248,
								77,
								91,
								207,
								17,
								168,
								253,
								0,
								128,
								95,
								92,
								68,
								43
							])) return {
								ext: "asf",
								mime: "audio/x-ms-asf"
							};
							if (_check(typeId, [
								192,
								239,
								25,
								188,
								77,
								91,
								207,
								17,
								168,
								253,
								0,
								128,
								95,
								92,
								68,
								43
							])) return {
								ext: "asf",
								mime: "video/x-ms-asf"
							};
							break;
						}
						if (isUnknownFileSize && payload > maximumAsfHeaderPayloadSizeInBytes) {
							isMalformedAsf = true;
							break;
						}
						await safeIgnore(tokenizer, payload, {
							maximumLength: isUnknownFileSize ? maximumAsfHeaderPayloadSizeInBytes : tokenizer.fileInfo.size,
							reason: "ASF header payload"
						});
						if (tokenizer.position <= previousPosition) {
							isMalformedAsf = true;
							break;
						}
					}
				} catch (error) {
					if (error instanceof EndOfStreamError || error instanceof ParserHardLimitError) {
						if (hasUnknownFileSize(tokenizer)) isMalformedAsf = true;
					} else throw error;
				}
				if (isMalformedAsf) return;
				return {
					ext: "asf",
					mime: "application/vnd.ms-asf"
				};
			}
			if (this.check([
				171,
				75,
				84,
				88,
				32,
				49,
				49,
				187,
				13,
				10,
				26,
				10
			])) return {
				ext: "ktx",
				mime: "image/ktx"
			};
			if ((this.check([
				126,
				16,
				4
			]) || this.check([
				126,
				24,
				4
			])) && this.check([
				48,
				77,
				73,
				69
			], { offset: 4 })) return {
				ext: "mie",
				mime: "application/x-mie"
			};
			if (this.check([
				39,
				10,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			], { offset: 2 })) return {
				ext: "shp",
				mime: "application/x-esri-shape"
			};
			if (this.check([
				255,
				79,
				255,
				81
			])) return {
				ext: "j2c",
				mime: "image/j2c"
			};
			if (this.check([
				0,
				0,
				0,
				12,
				106,
				80,
				32,
				32,
				13,
				10,
				135,
				10
			])) {
				await tokenizer.ignore(20);
				switch (await tokenizer.readToken(new StringType(4, "ascii"))) {
					case "jp2 ": return {
						ext: "jp2",
						mime: "image/jp2"
					};
					case "jpx ": return {
						ext: "jpx",
						mime: "image/jpx"
					};
					case "jpm ": return {
						ext: "jpm",
						mime: "image/jpm"
					};
					case "mjp2": return {
						ext: "mj2",
						mime: "image/mj2"
					};
					default: return;
				}
			}
			if (this.check([255, 10]) || this.check([
				0,
				0,
				0,
				12,
				74,
				88,
				76,
				32,
				13,
				10,
				135,
				10
			])) return {
				ext: "jxl",
				mime: "image/jxl"
			};
			if (this.check([254, 255])) {
				if (this.checkString("<?xml ", {
					offset: 2,
					encoding: "utf-16be"
				})) return {
					ext: "xml",
					mime: "application/xml"
				};
				return;
			}
			if (this.check([
				208,
				207,
				17,
				224,
				161,
				177,
				26,
				225
			])) return {
				ext: "cfb",
				mime: "application/x-cfb"
			};
			await tokenizer.peekBuffer(this.buffer, {
				length: Math.min(256, tokenizer.fileInfo.size),
				mayBeLess: true
			});
			if (this.check([
				97,
				99,
				115,
				112
			], { offset: 36 })) return {
				ext: "icc",
				mime: "application/vnd.iccprofile"
			};
			if (this.checkString("**ACE", { offset: 7 }) && this.checkString("**", { offset: 12 })) return {
				ext: "ace",
				mime: "application/x-ace-compressed"
			};
			if (this.checkString("BEGIN:")) {
				if (this.checkString("VCARD", { offset: 6 })) return {
					ext: "vcf",
					mime: "text/vcard"
				};
				if (this.checkString("VCALENDAR", { offset: 6 })) return {
					ext: "ics",
					mime: "text/calendar"
				};
			}
			if (this.checkString("FUJIFILMCCD-RAW")) return {
				ext: "raf",
				mime: "image/x-fujifilm-raf"
			};
			if (this.checkString("Extended Module:")) return {
				ext: "xm",
				mime: "audio/x-xm"
			};
			if (this.checkString("Creative Voice File")) return {
				ext: "voc",
				mime: "audio/x-voc"
			};
			if (this.check([
				4,
				0,
				0,
				0
			]) && this.buffer.length >= 16) {
				const jsonSize = new DataView(this.buffer.buffer).getUint32(12, true);
				if (jsonSize > 12 && this.buffer.length >= jsonSize + 16) try {
					const header = new TextDecoder().decode(this.buffer.subarray(16, jsonSize + 16));
					if (JSON.parse(header).files) return {
						ext: "asar",
						mime: "application/x-asar"
					};
				} catch {}
			}
			if (this.check([
				6,
				14,
				43,
				52,
				2,
				5,
				1,
				1,
				13,
				1,
				2,
				1,
				1,
				2
			])) return {
				ext: "mxf",
				mime: "application/mxf"
			};
			if (this.checkString("SCRM", { offset: 44 })) return {
				ext: "s3m",
				mime: "audio/x-s3m"
			};
			if (this.check([71]) && this.check([71], { offset: 188 })) return {
				ext: "mts",
				mime: "video/mp2t"
			};
			if (this.check([71], { offset: 4 }) && this.check([71], { offset: 196 })) return {
				ext: "mts",
				mime: "video/mp2t"
			};
			if (this.check([
				66,
				79,
				79,
				75,
				77,
				79,
				66,
				73
			], { offset: 60 })) return {
				ext: "mobi",
				mime: "application/x-mobipocket-ebook"
			};
			if (this.check([
				68,
				73,
				67,
				77
			], { offset: 128 })) return {
				ext: "dcm",
				mime: "application/dicom"
			};
			if (this.check([
				76,
				0,
				0,
				0,
				1,
				20,
				2,
				0,
				0,
				0,
				0,
				0,
				192,
				0,
				0,
				0,
				0,
				0,
				0,
				70
			])) return {
				ext: "lnk",
				mime: "application/x.ms.shortcut"
			};
			if (this.check([
				98,
				111,
				111,
				107,
				0,
				0,
				0,
				0,
				109,
				97,
				114,
				107,
				0,
				0,
				0,
				0
			])) return {
				ext: "alias",
				mime: "application/x.apple.alias"
			};
			if (this.checkString("Kaydara FBX Binary  \0")) return {
				ext: "fbx",
				mime: "application/x.autodesk.fbx"
			};
			if (this.check([76, 80], { offset: 34 }) && (this.check([
				0,
				0,
				1
			], { offset: 8 }) || this.check([
				1,
				0,
				2
			], { offset: 8 }) || this.check([
				2,
				0,
				2
			], { offset: 8 }))) return {
				ext: "eot",
				mime: "application/vnd.ms-fontobject"
			};
			if (this.check([
				6,
				6,
				237,
				245,
				216,
				29,
				70,
				229,
				189,
				49,
				239,
				231,
				254,
				116,
				183,
				29
			])) return {
				ext: "indd",
				mime: "application/x-indesign"
			};
			if (this.check([
				255,
				255,
				0,
				0,
				7,
				0,
				0,
				0,
				4,
				0,
				0,
				0,
				1,
				0,
				1,
				0
			]) || this.check([
				0,
				0,
				255,
				255,
				0,
				0,
				0,
				7,
				0,
				0,
				0,
				4,
				0,
				1,
				0,
				1
			])) return {
				ext: "jmp",
				mime: "application/x-jmp-data"
			};
			await tokenizer.peekBuffer(this.buffer, {
				length: Math.min(512, tokenizer.fileInfo.size),
				mayBeLess: true
			});
			if (this.checkString("ustar", { offset: 257 }) && (this.checkString("\0", { offset: 262 }) || this.checkString(" ", { offset: 262 })) || this.check([
				0,
				0,
				0,
				0,
				0,
				0
			], { offset: 257 }) && tarHeaderChecksumMatches(this.buffer)) return {
				ext: "tar",
				mime: "application/x-tar"
			};
			if (this.check([255, 254])) {
				const encoding = "utf-16le";
				if (this.checkString("<?xml ", {
					offset: 2,
					encoding
				})) return {
					ext: "xml",
					mime: "application/xml"
				};
				if (this.check([255, 14], { offset: 2 }) && this.checkString("SketchUp Model", {
					offset: 4,
					encoding
				})) return {
					ext: "skp",
					mime: "application/vnd.sketchup.skp"
				};
				if (this.checkString("Windows Registry Editor Version 5.00\r\n", {
					offset: 2,
					encoding
				})) return {
					ext: "reg",
					mime: "application/x-ms-regedit"
				};
				return;
			}
			if (this.checkString("-----BEGIN PGP MESSAGE-----")) return {
				ext: "pgp",
				mime: "application/pgp-encrypted"
			};
		};
		detectImprecise = async (tokenizer) => {
			this.buffer = new Uint8Array(reasonableDetectionSizeInBytes);
			const fileSize = getKnownFileSizeOrMaximum(tokenizer.fileInfo.size);
			await tokenizer.peekBuffer(this.buffer, {
				length: Math.min(8, fileSize),
				mayBeLess: true
			});
			if (this.check([
				0,
				0,
				1,
				186
			]) || this.check([
				0,
				0,
				1,
				179
			])) return {
				ext: "mpg",
				mime: "video/mpeg"
			};
			if (this.check([
				0,
				1,
				0,
				0,
				0
			])) return {
				ext: "ttf",
				mime: "font/ttf"
			};
			if (this.check([
				0,
				0,
				1,
				0
			])) return {
				ext: "ico",
				mime: "image/x-icon"
			};
			if (this.check([
				0,
				0,
				2,
				0
			])) return {
				ext: "cur",
				mime: "image/x-icon"
			};
			await tokenizer.peekBuffer(this.buffer, {
				length: Math.min(2 + this.options.mpegOffsetTolerance, fileSize),
				mayBeLess: true
			});
			if (this.buffer.length >= 2 + this.options.mpegOffsetTolerance) for (let depth = 0; depth <= this.options.mpegOffsetTolerance; ++depth) {
				const type = this.scanMpeg(depth);
				if (type) return type;
			}
		};
		async readTiffTag(bigEndian) {
			const tagId = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
			await this.tokenizer.ignore(10);
			switch (tagId) {
				case 50341: return {
					ext: "arw",
					mime: "image/x-sony-arw"
				};
				case 50706: return {
					ext: "dng",
					mime: "image/x-adobe-dng"
				};
				default:
			}
		}
		async readTiffIFD(bigEndian) {
			const numberOfTags = await this.tokenizer.readToken(bigEndian ? UINT16_BE : UINT16_LE);
			if (numberOfTags > maximumTiffTagCount) return;
			if (hasUnknownFileSize(this.tokenizer) && 2 + numberOfTags * 12 > maximumTiffIfdOffsetInBytes) return;
			for (let n = 0; n < numberOfTags; ++n) {
				const fileType = await this.readTiffTag(bigEndian);
				if (fileType) return fileType;
			}
		}
		async readTiffHeader(bigEndian) {
			const tiffFileType = {
				ext: "tif",
				mime: "image/tiff"
			};
			const version = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 2);
			const ifdOffset = (bigEndian ? UINT32_BE : UINT32_LE).get(this.buffer, 4);
			if (version === 42) {
				if (ifdOffset >= 6) {
					if (this.checkString("CR", { offset: 8 })) return {
						ext: "cr2",
						mime: "image/x-canon-cr2"
					};
					if (ifdOffset >= 8) {
						const someId1 = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 8);
						const someId2 = (bigEndian ? UINT16_BE : UINT16_LE).get(this.buffer, 10);
						if (someId1 === 28 && someId2 === 254 || someId1 === 31 && someId2 === 11) return {
							ext: "nef",
							mime: "image/x-nikon-nef"
						};
					}
				}
				if (hasUnknownFileSize(this.tokenizer) && ifdOffset > maximumTiffStreamIfdOffsetInBytes) return tiffFileType;
				const maximumTiffOffset = hasUnknownFileSize(this.tokenizer) ? maximumTiffIfdOffsetInBytes : this.tokenizer.fileInfo.size;
				try {
					await safeIgnore(this.tokenizer, ifdOffset, {
						maximumLength: maximumTiffOffset,
						reason: "TIFF IFD offset"
					});
				} catch (error) {
					if (error instanceof EndOfStreamError) return;
					throw error;
				}
				let fileType;
				try {
					fileType = await this.readTiffIFD(bigEndian);
				} catch (error) {
					if (error instanceof EndOfStreamError) return;
					throw error;
				}
				return fileType ?? tiffFileType;
			}
			if (version === 43) return tiffFileType;
		}
		/**
		Scan check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE).
		
		@param offset - Offset to scan for sync-preamble.
		@returns {{ext: string, mime: string}}
		*/
		scanMpeg(offset) {
			if (this.check([255, 224], {
				offset,
				mask: [255, 224]
			})) {
				if (this.check([16], {
					offset: offset + 1,
					mask: [22]
				})) {
					if (this.check([8], {
						offset: offset + 1,
						mask: [8]
					})) return {
						ext: "aac",
						mime: "audio/aac"
					};
					return {
						ext: "aac",
						mime: "audio/aac"
					};
				}
				if (this.check([2], {
					offset: offset + 1,
					mask: [6]
				})) return {
					ext: "mp3",
					mime: "audio/mpeg"
				};
				if (this.check([4], {
					offset: offset + 1,
					mask: [6]
				})) return {
					ext: "mp2",
					mime: "audio/mpeg"
				};
				if (this.check([6], {
					offset: offset + 1,
					mask: [6]
				})) return {
					ext: "mp1",
					mime: "audio/mpeg"
				};
			}
		}
	};
	supportedExtensions = new Set(extensions);
	supportedMimeTypes = new Set(mimeTypes);
}));
//#endregion
//#region ../../node_modules/.pnpm/file-type@21.3.4/node_modules/file-type/index.js
/**
Node.js specific entry point.
*/
var file_type_exports = /* @__PURE__ */ __exportAll({
	FileTypeParser: () => FileTypeParser,
	fileTypeFromBlob: () => fileTypeFromBlob,
	fileTypeFromBuffer: () => fileTypeFromBuffer,
	fileTypeFromFile: () => fileTypeFromFile,
	fileTypeFromStream: () => fileTypeFromStream,
	fileTypeFromTokenizer: () => fileTypeFromTokenizer,
	fileTypeStream: () => fileTypeStream,
	supportedExtensions: () => supportedExtensions,
	supportedMimeTypes: () => supportedMimeTypes
});
function isTokenizerStreamBoundsError(error) {
	if (!(error instanceof RangeError) || error.message !== "offset is out of bounds" || typeof error.stack !== "string") return false;
	return /strtok3[/\\]lib[/\\]stream[/\\]/.test(error.stack);
}
async function fileTypeFromFile(path, options) {
	return new FileTypeParser(options).fromFile(path, options);
}
async function fileTypeFromStream(stream, options) {
	return new FileTypeParser(options).fromStream(stream);
}
async function fileTypeStream(readableStream, options = {}) {
	return new FileTypeParser(options).toDetectionStream(readableStream, options);
}
var FileTypeParser;
var init_file_type = __esmMin((() => {
	init_lib$3();
	init_core();
	FileTypeParser = class extends FileTypeParser$1 {
		async fromStream(stream) {
			this.options.signal?.throwIfAborted();
			const tokenizer = await (stream instanceof ReadableStream$1 ? this.createTokenizerFromWebStream(stream) : fromStream(stream, this.getTokenizerOptions()));
			try {
				return await super.fromTokenizer(tokenizer);
			} catch (error) {
				if (isTokenizerStreamBoundsError(error)) return;
				throw error;
			} finally {
				if (stream instanceof Readable && !stream.destroyed) stream.destroy();
			}
		}
		async fromFile(path) {
			this.options.signal?.throwIfAborted();
			const fileHandle = await fs.open(path, constants.O_RDONLY | constants.O_NONBLOCK);
			const fileStat = await fileHandle.stat();
			if (!fileStat.isFile()) {
				await fileHandle.close();
				return;
			}
			const tokenizer = new FileTokenizer(fileHandle, {
				...this.getTokenizerOptions(),
				fileInfo: {
					path,
					size: fileStat.size
				}
			});
			return super.fromTokenizer(tokenizer);
		}
		async toDetectionStream(readableStream, options = {}) {
			if (!(readableStream instanceof Readable)) return super.toDetectionStream(readableStream, options);
			const { sampleSize = reasonableDetectionSizeInBytes } = options;
			const { signal } = this.options;
			const normalizedSampleSize = normalizeSampleSize(sampleSize);
			signal?.throwIfAborted();
			return new Promise((resolve, reject) => {
				let isSettled = false;
				const cleanup = () => {
					readableStream.off("error", onError);
					readableStream.off("readable", onReadable);
					signal?.removeEventListener("abort", onAbort);
				};
				const settle = (callback, value) => {
					if (isSettled) return;
					isSettled = true;
					cleanup();
					callback(value);
				};
				const onError = (error) => {
					settle(reject, error);
				};
				const onAbort = () => {
					if (!readableStream.destroyed) readableStream.destroy();
					settle(reject, signal.reason);
				};
				const onReadable = () => {
					(async () => {
						try {
							const pass = new PassThrough();
							const outputStream = pipeline ? pipeline(readableStream, pass, () => {}) : readableStream.pipe(pass);
							const chunk = readableStream.read(normalizedSampleSize) ?? readableStream.read() ?? new Uint8Array(0);
							try {
								pass.fileType = await this.fromBuffer(chunk);
							} catch (error) {
								if (error instanceof EndOfStreamError) pass.fileType = void 0;
								else settle(reject, error);
							}
							settle(resolve, outputStream);
						} catch (error) {
							settle(reject, error);
						}
					})();
				};
				readableStream.on("error", onError);
				readableStream.once("readable", onReadable);
				signal?.addEventListener("abort", onAbort, { once: true });
			});
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@jimp+core@1.6.1/node_modules/@jimp/core/dist/esm/index.js
const emptyBitmap = {
	data: Buffer.alloc(0),
	width: 0,
	height: 0
};
/**
* Prepare a Buffer object from the arrayBuffer.
*/
function bufferFromArrayBuffer(arrayBuffer) {
	const buffer = Buffer.alloc(arrayBuffer.byteLength);
	const view = new Uint8Array(arrayBuffer);
	for (let i = 0; i < buffer.length; ++i) buffer[i] = view[i];
	return buffer;
}
async function detectFileTypeFromBuffer(buffer) {
	const { fileTypeFromBuffer } = await Promise.resolve().then(() => (init_file_type(), file_type_exports));
	return fileTypeFromBuffer(buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
}
/**
* Create a Jimp class that support the given image formats and methods
*/
function createJimp({ plugins: pluginsArg, formats: formatsArg } = {}) {
	const plugins = pluginsArg || [];
	const formats = (formatsArg || []).map((format) => format());
	const CustomJimp = class Jimp {
		/**
		* The bitmap data of the image
		*/
		bitmap = emptyBitmap;
		/**  Default color to use for new pixels */
		background = 0;
		/** Formats that can be used with Jimp */
		formats = [];
		/** The original MIME type of the image */
		mime;
		constructor(options = emptyBitmap) {
			this.formats = formats;
			if ("data" in options) this.bitmap = options;
			else {
				this.bitmap = {
					data: Buffer.alloc(options.width * options.height * 4),
					width: options.width,
					height: options.height
				};
				if (options.color) {
					this.background = typeof options.color === "string" ? cssColorToHex(options.color) : options.color;
					for (let i = 0; i < this.bitmap.data.length; i += 4) this.bitmap.data.writeUInt32BE(this.background, i);
				}
			}
			for (const methods of plugins) for (const key in methods) this[key] = (...args) => {
				const result = methods[key]?.(this, ...args);
				if (typeof result === "object" && "bitmap" in result) {
					this.bitmap = result.bitmap;
					return this;
				}
				return result;
			};
		}
		/**
		* Create a Jimp instance from a URL, a file path, or a Buffer
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* // Read from a file path
		* const image = await Jimp.read("test/image.png");
		*
		* // Read from a URL
		* const image = await Jimp.read("https://upload.wikimedia.org/wikipedia/commons/0/01/Bot-Test.jpg");
		* ```
		*/
		static async read(url, options) {
			if (Buffer.isBuffer(url) || url instanceof ArrayBuffer) return this.fromBuffer(url);
			if (existsSync(url)) return this.fromBuffer(await readFile(url));
			const [fetchErr, response] = await (0, import_await_to_js_umd.to)(fetch(url));
			if (fetchErr) throw new Error(`Could not load Buffer from URL: ${url}`);
			if (!response.ok) throw new Error(`HTTP Status ${response.status} for url ${url}`);
			const [arrayBufferErr, data] = await (0, import_await_to_js_umd.to)(response.arrayBuffer());
			if (arrayBufferErr) throw new Error(`Could not load Buffer from ${url}`);
			const buffer = bufferFromArrayBuffer(data);
			return this.fromBuffer(buffer, options);
		}
		/**
		* Create a Jimp instance from a bitmap.
		* The difference between this and just using the constructor is that this will
		* convert raw image data into the bitmap format that Jimp uses.
		*
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = Jimp.fromBitmap({
		*   data: Buffer.from([
		*     0xffffffff, 0xffffffff, 0xffffffff,
		*     0xffffffff, 0xffffffff, 0xffffffff,
		*     0xffffffff, 0xffffffff, 0xffffffff,
		*   ]),
		*   width: 3,
		*   height: 3,
		* });
		* ```
		*/
		static fromBitmap(bitmap) {
			let data;
			if (bitmap.data instanceof Buffer) data = Buffer.from(bitmap.data);
			if (bitmap.data instanceof Uint8Array || bitmap.data instanceof Uint8ClampedArray) data = Buffer.from(bitmap.data.buffer);
			if (Array.isArray(bitmap.data)) data = Buffer.concat(bitmap.data.map((hex) => Buffer.from(hex.toString(16).padStart(8, "0"), "hex")));
			if (!data) throw new Error("data must be a Buffer");
			if (typeof bitmap.height !== "number" || typeof bitmap.width !== "number") throw new Error("bitmap must have width and height");
			return new CustomJimp({
				height: bitmap.height,
				width: bitmap.width,
				data
			});
		}
		/**
		* Parse a bitmap with the loaded image types.
		*
		* @param buffer Raw image data
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const buffer = await fs.readFile("test/image.png");
		* const image = await Jimp.fromBuffer(buffer);
		* ```
		*/
		static async fromBuffer(buffer, options) {
			const actualBuffer = buffer instanceof ArrayBuffer ? bufferFromArrayBuffer(buffer) : buffer;
			const mime = await detectFileTypeFromBuffer(actualBuffer);
			if (!mime || !mime.mime) throw new Error("Could not find MIME for Buffer");
			const format = formats.find((format) => format.mime === mime.mime);
			if (!format || !format.decode) throw new Error(`Mime type ${mime.mime} does not support decoding`);
			const image = new CustomJimp(await format.decode(actualBuffer, options?.[format.mime]));
			image.mime = mime.mime;
			attemptExifRotate(image, actualBuffer);
			return image;
		}
		/**
		* Nicely format Jimp object when sent to the console e.g. console.log(image)
		* @returns Pretty printed jimp object
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = await Jimp.read("test/image.png");
		*
		* console.log(image);
		* ```
		*/
		inspect() {
			return "<Jimp " + (this.bitmap === emptyBitmap ? "pending..." : this.bitmap.width + "x" + this.bitmap.height) + ">";
		}
		/**
		* Nicely format Jimp object when converted to a string
		* @returns pretty printed
		*/
		toString() {
			return "[object Jimp]";
		}
		/** Get the width of the image */
		get width() {
			return this.bitmap.width;
		}
		/** Get the height of the image */
		get height() {
			return this.bitmap.height;
		}
		/**
		* Converts the Jimp instance to an image buffer
		* @param mime The mime type to export to
		* @param options The options to use when exporting
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		* import { promises as fs } from "fs";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffff });
		*
		* await image.getBuffer("image/jpeg", {
		*   quality: 50,
		* });
		* ```
		*/
		async getBuffer(mime, options) {
			const format = this.formats.find((format) => format.mime === mime);
			if (!format || !format.encode) throw new Error(`Unsupported MIME type: ${mime}`);
			let outputImage;
			if (format.hasAlpha) outputImage = this;
			else {
				outputImage = new CustomJimp({
					width: this.bitmap.width,
					height: this.bitmap.height,
					color: this.background
				});
				composite(outputImage, this);
			}
			return format.encode(outputImage.bitmap, options);
		}
		/**
		* Converts the image to a base 64 string
		*
		* @param mime The mime type to export to
		* @param options The options to use when exporting
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = Jimp.fromBuffer(Buffer.from([
		*   0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
		*   0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
		*   0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
		* ]));
		*
		* const base64 = image.getBase64("image/jpeg", {
		*   quality: 50,
		* });
		* ```
		*/
		async getBase64(mime, options) {
			const data = await this.getBuffer(mime, options);
			return "data:" + mime + ";base64," + data.toString("base64");
		}
		/**
		* Write the image to a file
		* @param path the path to write the image to
		* @param options the options to use when writing the image
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = Jimp.fromBuffer(Buffer.from([
		*   0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
		*   0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
		*   0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00,
		* ]));
		*
		* await image.write("test/output.png");
		* ```
		*/
		async write(path, options) {
			const mimeType = import_lite.default.getType(path);
			await writeFile(path, await this.getBuffer(mimeType, options));
		}
		/**
		* Clone the image into a new Jimp instance.
		* @param this
		* @returns A new Jimp instance
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffff });
		*
		* const clone = image.clone();
		* ```
		*/
		clone() {
			return new CustomJimp({
				...this.bitmap,
				data: Buffer.from(this.bitmap.data)
			});
		}
		/**
		* Returns the offset of a pixel in the bitmap buffer
		* @param x the x coordinate
		* @param y the y coordinate
		* @param edgeHandling (optional) define how to sum pixels from outside the border
		* @returns the index of the pixel or -1 if not found
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffff });
		*
		* image.getPixelIndex(1, 1); // 2
		* ```
		*/
		getPixelIndex(x, y, edgeHandling) {
			let xi;
			let yi;
			if (!edgeHandling) edgeHandling = Edge.EXTEND;
			if (typeof x !== "number" || typeof y !== "number") throw new Error("x and y must be numbers");
			x = Math.round(x);
			y = Math.round(y);
			xi = x;
			yi = y;
			if (edgeHandling === Edge.EXTEND) {
				if (x < 0) xi = 0;
				if (x >= this.bitmap.width) xi = this.bitmap.width - 1;
				if (y < 0) yi = 0;
				if (y >= this.bitmap.height) yi = this.bitmap.height - 1;
			}
			if (edgeHandling === Edge.WRAP) {
				if (x < 0) xi = this.bitmap.width + x;
				if (x >= this.bitmap.width) xi = x % this.bitmap.width;
				if (y < 0) yi = this.bitmap.height + y;
				if (y >= this.bitmap.height) yi = y % this.bitmap.height;
			}
			let i = this.bitmap.width * yi + xi << 2;
			if (xi < 0 || xi >= this.bitmap.width) i = -1;
			if (yi < 0 || yi >= this.bitmap.height) i = -1;
			return i;
		}
		/**
		* Returns the hex color value of a pixel
		* @param x the x coordinate
		* @param y the y coordinate
		* @returns the color of the pixel
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffff });
		*
		* image.getPixelColor(1, 1); // 0xffffffff
		* ```
		*/
		getPixelColor(x, y) {
			if (typeof x !== "number" || typeof y !== "number") throw new Error("x and y must be numbers");
			const idx = this.getPixelIndex(x, y);
			return this.bitmap.data.readUInt32BE(idx);
		}
		/**
		* Sets the hex colour value of a pixel
		*
		* @param hex color to set
		* @param x the x coordinate
		* @param y the y coordinate
		*
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffff });
		*
		* image.setPixelColor(0xff0000ff, 0, 0);
		* ```
		*/
		setPixelColor(hex, x, y) {
			if (typeof hex !== "number" || typeof x !== "number" || typeof y !== "number") throw new Error("hex, x and y must be numbers");
			const idx = this.getPixelIndex(x, y);
			this.bitmap.data.writeUInt32BE(hex, idx);
			return this;
		}
		/**
		* Determine if the image contains opaque pixels.
		*
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffaa });
		* const image2 = new Jimp({ width: 3, height: 3, color: 0xff0000ff });
		*
		* image.hasAlpha(); // false
		* image2.hasAlpha(); // true
		* ```
		*/
		hasAlpha() {
			const { width, height, data } = this.bitmap;
			const byteLen = width * height << 2;
			for (let idx = 3; idx < byteLen; idx += 4) if (data[idx] !== 255) return true;
			return false;
		}
		/**
		* Composites a source image over to this image respecting alpha channels
		* @param src the source Jimp instance
		* @param x the x position to blit the image
		* @param y the y position to blit the image
		* @param options determine what mode to use
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 10, height: 10, color: 0xffffffff });
		* const image2 = new Jimp({ width: 3, height: 3, color: 0xff0000ff });
		*
		* image.composite(image2, 3, 3);
		* ```
		*/
		composite(src, x = 0, y = 0, options = {}) {
			return composite(this, src, x, y, options);
		}
		scan(x, y, w, h, f) {
			return scan(this, x, y, w, h, f);
		}
		/**
		* Iterate scan through a region of the bitmap
		* @param x the x coordinate to begin the scan at
		* @param y the y coordinate to begin the scan at
		* @param w the width of the scan region
		* @param h the height of the scan region
		* @example
		* ```ts
		* import { Jimp } from "jimp";
		*
		* const image = new Jimp({ width: 3, height: 3, color: 0xffffffff });
		*
		* for (const { x, y, idx, image } of j.scanIterator()) {
		*   // do something with the pixel
		* }
		* ```
		*/
		scanIterator(x = 0, y = 0, w = this.bitmap.width, h = this.bitmap.height) {
			if (typeof x !== "number" || typeof y !== "number") throw new Error("x and y must be numbers");
			if (typeof w !== "number" || typeof h !== "number") throw new Error("w and h must be numbers");
			return scanIterator(this, x, y, w, h);
		}
	};
	return CustomJimp;
}
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$5 = __require("util");
	let Stream$2 = __require("stream");
	let ChunkStream = module.exports = function() {
		Stream$2.call(this);
		this._buffers = [];
		this._buffered = 0;
		this._reads = [];
		this._paused = false;
		this._encoding = "utf8";
		this.writable = true;
	};
	util$5.inherits(ChunkStream, Stream$2);
	ChunkStream.prototype.read = function(length, callback) {
		this._reads.push({
			length: Math.abs(length),
			allowLess: length < 0,
			func: callback
		});
		process.nextTick(function() {
			this._process();
			if (this._paused && this._reads && this._reads.length > 0) {
				this._paused = false;
				this.emit("drain");
			}
		}.bind(this));
	};
	ChunkStream.prototype.write = function(data, encoding) {
		if (!this.writable) {
			this.emit("error", /* @__PURE__ */ new Error("Stream not writable"));
			return false;
		}
		let dataBuffer;
		if (Buffer.isBuffer(data)) dataBuffer = data;
		else dataBuffer = Buffer.from(data, encoding || this._encoding);
		this._buffers.push(dataBuffer);
		this._buffered += dataBuffer.length;
		this._process();
		if (this._reads && this._reads.length === 0) this._paused = true;
		return this.writable && !this._paused;
	};
	ChunkStream.prototype.end = function(data, encoding) {
		if (data) this.write(data, encoding);
		this.writable = false;
		if (!this._buffers) return;
		if (this._buffers.length === 0) this._end();
		else {
			this._buffers.push(null);
			this._process();
		}
	};
	ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
	ChunkStream.prototype._end = function() {
		if (this._reads.length > 0) this.emit("error", /* @__PURE__ */ new Error("Unexpected end of input"));
		this.destroy();
	};
	ChunkStream.prototype.destroy = function() {
		if (!this._buffers) return;
		this.writable = false;
		this._reads = null;
		this._buffers = null;
		this.emit("close");
	};
	ChunkStream.prototype._processReadAllowingLess = function(read) {
		this._reads.shift();
		let smallerBuf = this._buffers[0];
		if (smallerBuf.length > read.length) {
			this._buffered -= read.length;
			this._buffers[0] = smallerBuf.slice(read.length);
			read.func.call(this, smallerBuf.slice(0, read.length));
		} else {
			this._buffered -= smallerBuf.length;
			this._buffers.shift();
			read.func.call(this, smallerBuf);
		}
	};
	ChunkStream.prototype._processRead = function(read) {
		this._reads.shift();
		let pos = 0;
		let count = 0;
		let data = Buffer.alloc(read.length);
		while (pos < read.length) {
			let buf = this._buffers[count++];
			let len = Math.min(buf.length, read.length - pos);
			buf.copy(data, pos, 0, len);
			pos += len;
			if (len !== buf.length) this._buffers[--count] = buf.slice(len);
		}
		if (count > 0) this._buffers.splice(0, count);
		this._buffered -= read.length;
		read.func.call(this, data);
	};
	ChunkStream.prototype._process = function() {
		try {
			while (this._buffered > 0 && this._reads && this._reads.length > 0) {
				let read = this._reads[0];
				if (read.allowLess) this._processReadAllowingLess(read);
				else if (this._buffered >= read.length) this._processRead(read);
				else break;
			}
			if (this._buffers && !this.writable) this._end();
		} catch (ex) {
			this.emit("error", ex);
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/interlace.js
var require_interlace = /* @__PURE__ */ __commonJSMin(((exports) => {
	let imagePasses = [
		{
			x: [0],
			y: [0]
		},
		{
			x: [4],
			y: [0]
		},
		{
			x: [0, 4],
			y: [4]
		},
		{
			x: [2, 6],
			y: [0, 4]
		},
		{
			x: [
				0,
				2,
				4,
				6
			],
			y: [2, 6]
		},
		{
			x: [
				1,
				3,
				5,
				7
			],
			y: [
				0,
				2,
				4,
				6
			]
		},
		{
			x: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			y: [
				1,
				3,
				5,
				7
			]
		}
	];
	exports.getImagePasses = function(width, height) {
		let images = [];
		let xLeftOver = width % 8;
		let yLeftOver = height % 8;
		let xRepeats = (width - xLeftOver) / 8;
		let yRepeats = (height - yLeftOver) / 8;
		for (let i = 0; i < imagePasses.length; i++) {
			let pass = imagePasses[i];
			let passWidth = xRepeats * pass.x.length;
			let passHeight = yRepeats * pass.y.length;
			for (let j = 0; j < pass.x.length; j++) if (pass.x[j] < xLeftOver) passWidth++;
			else break;
			for (let j = 0; j < pass.y.length; j++) if (pass.y[j] < yLeftOver) passHeight++;
			else break;
			if (passWidth > 0 && passHeight > 0) images.push({
				width: passWidth,
				height: passHeight,
				index: i
			});
		}
		return images;
	};
	exports.getInterlaceIterator = function(width) {
		return function(x, y, pass) {
			let outerXLeftOver = x % imagePasses[pass].x.length;
			let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
			let outerYLeftOver = y % imagePasses[pass].y.length;
			let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
			return outerX * 4 + outerY * width * 4;
		};
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function paethPredictor(left, above, upLeft) {
		let paeth = left + above - upLeft;
		let pLeft = Math.abs(paeth - left);
		let pAbove = Math.abs(paeth - above);
		let pUpLeft = Math.abs(paeth - upLeft);
		if (pLeft <= pAbove && pLeft <= pUpLeft) return left;
		if (pAbove <= pUpLeft) return above;
		return upLeft;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let interlaceUtils = require_interlace();
	let paethPredictor = require_paeth_predictor();
	function getByteWidth(width, bpp, depth) {
		let byteWidth = width * bpp;
		if (depth !== 8) byteWidth = Math.ceil(byteWidth / (8 / depth));
		return byteWidth;
	}
	let Filter = module.exports = function(bitmapInfo, dependencies) {
		let width = bitmapInfo.width;
		let height = bitmapInfo.height;
		let interlace = bitmapInfo.interlace;
		let bpp = bitmapInfo.bpp;
		let depth = bitmapInfo.depth;
		this.read = dependencies.read;
		this.write = dependencies.write;
		this.complete = dependencies.complete;
		this._imageIndex = 0;
		this._images = [];
		if (interlace) {
			let passes = interlaceUtils.getImagePasses(width, height);
			for (let i = 0; i < passes.length; i++) this._images.push({
				byteWidth: getByteWidth(passes[i].width, bpp, depth),
				height: passes[i].height,
				lineIndex: 0
			});
		} else this._images.push({
			byteWidth: getByteWidth(width, bpp, depth),
			height,
			lineIndex: 0
		});
		if (depth === 8) this._xComparison = bpp;
		else if (depth === 16) this._xComparison = bpp * 2;
		else this._xComparison = 1;
	};
	Filter.prototype.start = function() {
		this.read(this._images[this._imageIndex].byteWidth + 1, this._reverseFilterLine.bind(this));
	};
	Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
		let xComparison = this._xComparison;
		let xBiggerThan = xComparison - 1;
		for (let x = 0; x < byteWidth; x++) unfilteredLine[x] = rawData[1 + x] + (x > xBiggerThan ? unfilteredLine[x - xComparison] : 0);
	};
	Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
		let lastLine = this._lastLine;
		for (let x = 0; x < byteWidth; x++) unfilteredLine[x] = rawData[1 + x] + (lastLine ? lastLine[x] : 0);
	};
	Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
		let xComparison = this._xComparison;
		let xBiggerThan = xComparison - 1;
		let lastLine = this._lastLine;
		for (let x = 0; x < byteWidth; x++) {
			let rawByte = rawData[1 + x];
			let f3Up = lastLine ? lastLine[x] : 0;
			let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
			unfilteredLine[x] = rawByte + Math.floor((f3Left + f3Up) / 2);
		}
	};
	Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
		let xComparison = this._xComparison;
		let xBiggerThan = xComparison - 1;
		let lastLine = this._lastLine;
		for (let x = 0; x < byteWidth; x++) {
			let rawByte = rawData[1 + x];
			let f4Up = lastLine ? lastLine[x] : 0;
			unfilteredLine[x] = rawByte + paethPredictor(x > xBiggerThan ? unfilteredLine[x - xComparison] : 0, f4Up, x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0);
		}
	};
	Filter.prototype._reverseFilterLine = function(rawData) {
		let filter = rawData[0];
		let unfilteredLine;
		let currentImage = this._images[this._imageIndex];
		let byteWidth = currentImage.byteWidth;
		if (filter === 0) unfilteredLine = rawData.slice(1, byteWidth + 1);
		else {
			unfilteredLine = Buffer.alloc(byteWidth);
			switch (filter) {
				case 1:
					this._unFilterType1(rawData, unfilteredLine, byteWidth);
					break;
				case 2:
					this._unFilterType2(rawData, unfilteredLine, byteWidth);
					break;
				case 3:
					this._unFilterType3(rawData, unfilteredLine, byteWidth);
					break;
				case 4:
					this._unFilterType4(rawData, unfilteredLine, byteWidth);
					break;
				default: throw new Error("Unrecognised filter type - " + filter);
			}
		}
		this.write(unfilteredLine);
		currentImage.lineIndex++;
		if (currentImage.lineIndex >= currentImage.height) {
			this._lastLine = null;
			this._imageIndex++;
			currentImage = this._images[this._imageIndex];
		} else this._lastLine = unfilteredLine;
		if (currentImage) this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
		else {
			this._lastLine = null;
			this.complete();
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$4 = __require("util");
	let ChunkStream = require_chunkstream();
	let Filter = require_filter_parse();
	let FilterAsync = module.exports = function(bitmapInfo) {
		ChunkStream.call(this);
		let buffers = [];
		let that = this;
		this._filter = new Filter(bitmapInfo, {
			read: this.read.bind(this),
			write: function(buffer) {
				buffers.push(buffer);
			},
			complete: function() {
				that.emit("complete", Buffer.concat(buffers));
			}
		});
		this._filter.start();
	};
	util$4.inherits(FilterAsync, ChunkStream);
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		PNG_SIGNATURE: [
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		],
		TYPE_IHDR: 1229472850,
		TYPE_IEND: 1229278788,
		TYPE_IDAT: 1229209940,
		TYPE_PLTE: 1347179589,
		TYPE_tRNS: 1951551059,
		TYPE_gAMA: 1732332865,
		COLORTYPE_GRAYSCALE: 0,
		COLORTYPE_PALETTE: 1,
		COLORTYPE_COLOR: 2,
		COLORTYPE_ALPHA: 4,
		COLORTYPE_PALETTE_COLOR: 3,
		COLORTYPE_COLOR_ALPHA: 6,
		COLORTYPE_TO_BPP_MAP: {
			0: 1,
			2: 3,
			3: 1,
			4: 2,
			6: 4
		},
		GAMMA_DIVISION: 1e5
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/crc.js
var require_crc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let crcTable = [];
	(function() {
		for (let i = 0; i < 256; i++) {
			let currentCrc = i;
			for (let j = 0; j < 8; j++) if (currentCrc & 1) currentCrc = 3988292384 ^ currentCrc >>> 1;
			else currentCrc = currentCrc >>> 1;
			crcTable[i] = currentCrc;
		}
	})();
	let CrcCalculator = module.exports = function() {
		this._crc = -1;
	};
	CrcCalculator.prototype.write = function(data) {
		for (let i = 0; i < data.length; i++) this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
		return true;
	};
	CrcCalculator.prototype.crc32 = function() {
		return this._crc ^ -1;
	};
	CrcCalculator.crc32 = function(buf) {
		let crc = -1;
		for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
		return crc ^ -1;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let constants = require_constants();
	let CrcCalculator = require_crc();
	let Parser = module.exports = function(options, dependencies) {
		this._options = options;
		options.checkCRC = options.checkCRC !== false;
		this._hasIHDR = false;
		this._hasIEND = false;
		this._emittedHeadersFinished = false;
		this._palette = [];
		this._colorType = 0;
		this._chunks = {};
		this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
		this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
		this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
		this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
		this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
		this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
		this.read = dependencies.read;
		this.error = dependencies.error;
		this.metadata = dependencies.metadata;
		this.gamma = dependencies.gamma;
		this.transColor = dependencies.transColor;
		this.palette = dependencies.palette;
		this.parsed = dependencies.parsed;
		this.inflateData = dependencies.inflateData;
		this.finished = dependencies.finished;
		this.simpleTransparency = dependencies.simpleTransparency;
		this.headersFinished = dependencies.headersFinished || function() {};
	};
	Parser.prototype.start = function() {
		this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
	};
	Parser.prototype._parseSignature = function(data) {
		let signature = constants.PNG_SIGNATURE;
		for (let i = 0; i < signature.length; i++) if (data[i] !== signature[i]) {
			this.error(/* @__PURE__ */ new Error("Invalid file signature"));
			return;
		}
		this.read(8, this._parseChunkBegin.bind(this));
	};
	Parser.prototype._parseChunkBegin = function(data) {
		let length = data.readUInt32BE(0);
		let type = data.readUInt32BE(4);
		let name = "";
		for (let i = 4; i < 8; i++) name += String.fromCharCode(data[i]);
		let ancillary = Boolean(data[4] & 32);
		if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
			this.error(/* @__PURE__ */ new Error("Expected IHDR on beggining"));
			return;
		}
		this._crc = new CrcCalculator();
		this._crc.write(Buffer.from(name));
		if (this._chunks[type]) return this._chunks[type](length);
		if (!ancillary) {
			this.error(/* @__PURE__ */ new Error("Unsupported critical chunk type " + name));
			return;
		}
		this.read(length + 4, this._skipChunk.bind(this));
	};
	Parser.prototype._skipChunk = function() {
		this.read(8, this._parseChunkBegin.bind(this));
	};
	Parser.prototype._handleChunkEnd = function() {
		this.read(4, this._parseChunkEnd.bind(this));
	};
	Parser.prototype._parseChunkEnd = function(data) {
		let fileCrc = data.readInt32BE(0);
		let calcCrc = this._crc.crc32();
		if (this._options.checkCRC && calcCrc !== fileCrc) {
			this.error(/* @__PURE__ */ new Error("Crc error - " + fileCrc + " - " + calcCrc));
			return;
		}
		if (!this._hasIEND) this.read(8, this._parseChunkBegin.bind(this));
	};
	Parser.prototype._handleIHDR = function(length) {
		this.read(length, this._parseIHDR.bind(this));
	};
	Parser.prototype._parseIHDR = function(data) {
		this._crc.write(data);
		let width = data.readUInt32BE(0);
		let height = data.readUInt32BE(4);
		let depth = data[8];
		let colorType = data[9];
		let compr = data[10];
		let filter = data[11];
		let interlace = data[12];
		if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
			this.error(/* @__PURE__ */ new Error("Unsupported bit depth " + depth));
			return;
		}
		if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
			this.error(/* @__PURE__ */ new Error("Unsupported color type"));
			return;
		}
		if (compr !== 0) {
			this.error(/* @__PURE__ */ new Error("Unsupported compression method"));
			return;
		}
		if (filter !== 0) {
			this.error(/* @__PURE__ */ new Error("Unsupported filter method"));
			return;
		}
		if (interlace !== 0 && interlace !== 1) {
			this.error(/* @__PURE__ */ new Error("Unsupported interlace method"));
			return;
		}
		this._colorType = colorType;
		let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
		this._hasIHDR = true;
		this.metadata({
			width,
			height,
			depth,
			interlace: Boolean(interlace),
			palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
			color: Boolean(colorType & constants.COLORTYPE_COLOR),
			alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
			bpp,
			colorType
		});
		this._handleChunkEnd();
	};
	Parser.prototype._handlePLTE = function(length) {
		this.read(length, this._parsePLTE.bind(this));
	};
	Parser.prototype._parsePLTE = function(data) {
		this._crc.write(data);
		let entries = Math.floor(data.length / 3);
		for (let i = 0; i < entries; i++) this._palette.push([
			data[i * 3],
			data[i * 3 + 1],
			data[i * 3 + 2],
			255
		]);
		this.palette(this._palette);
		this._handleChunkEnd();
	};
	Parser.prototype._handleTRNS = function(length) {
		this.simpleTransparency();
		this.read(length, this._parseTRNS.bind(this));
	};
	Parser.prototype._parseTRNS = function(data) {
		this._crc.write(data);
		if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
			if (this._palette.length === 0) {
				this.error(/* @__PURE__ */ new Error("Transparency chunk must be after palette"));
				return;
			}
			if (data.length > this._palette.length) {
				this.error(/* @__PURE__ */ new Error("More transparent colors than palette size"));
				return;
			}
			for (let i = 0; i < data.length; i++) this._palette[i][3] = data[i];
			this.palette(this._palette);
		}
		if (this._colorType === constants.COLORTYPE_GRAYSCALE) this.transColor([data.readUInt16BE(0)]);
		if (this._colorType === constants.COLORTYPE_COLOR) this.transColor([
			data.readUInt16BE(0),
			data.readUInt16BE(2),
			data.readUInt16BE(4)
		]);
		this._handleChunkEnd();
	};
	Parser.prototype._handleGAMA = function(length) {
		this.read(length, this._parseGAMA.bind(this));
	};
	Parser.prototype._parseGAMA = function(data) {
		this._crc.write(data);
		this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
		this._handleChunkEnd();
	};
	Parser.prototype._handleIDAT = function(length) {
		if (!this._emittedHeadersFinished) {
			this._emittedHeadersFinished = true;
			this.headersFinished();
		}
		this.read(-length, this._parseIDAT.bind(this, length));
	};
	Parser.prototype._parseIDAT = function(length, data) {
		this._crc.write(data);
		if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) throw new Error("Expected palette not found");
		this.inflateData(data);
		let leftOverLength = length - data.length;
		if (leftOverLength > 0) this._handleIDAT(leftOverLength);
		else this._handleChunkEnd();
	};
	Parser.prototype._handleIEND = function(length) {
		this.read(length, this._parseIEND.bind(this));
	};
	Parser.prototype._parseIEND = function(data) {
		this._crc.write(data);
		this._hasIEND = true;
		this._handleChunkEnd();
		if (this.finished) this.finished();
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = /* @__PURE__ */ __commonJSMin(((exports) => {
	let interlaceUtils = require_interlace();
	let pixelBppMapper = [
		function() {},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos === data.length) throw new Error("Ran out of data");
			let pixel = data[rawPos];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = 255;
		},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos + 1 >= data.length) throw new Error("Ran out of data");
			let pixel = data[rawPos];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = data[rawPos + 1];
		},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos + 2 >= data.length) throw new Error("Ran out of data");
			pxData[pxPos] = data[rawPos];
			pxData[pxPos + 1] = data[rawPos + 1];
			pxData[pxPos + 2] = data[rawPos + 2];
			pxData[pxPos + 3] = 255;
		},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos + 3 >= data.length) throw new Error("Ran out of data");
			pxData[pxPos] = data[rawPos];
			pxData[pxPos + 1] = data[rawPos + 1];
			pxData[pxPos + 2] = data[rawPos + 2];
			pxData[pxPos + 3] = data[rawPos + 3];
		}
	];
	let pixelBppCustomMapper = [
		function() {},
		function(pxData, pixelData, pxPos, maxBit) {
			let pixel = pixelData[0];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = maxBit;
		},
		function(pxData, pixelData, pxPos) {
			let pixel = pixelData[0];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = pixelData[1];
		},
		function(pxData, pixelData, pxPos, maxBit) {
			pxData[pxPos] = pixelData[0];
			pxData[pxPos + 1] = pixelData[1];
			pxData[pxPos + 2] = pixelData[2];
			pxData[pxPos + 3] = maxBit;
		},
		function(pxData, pixelData, pxPos) {
			pxData[pxPos] = pixelData[0];
			pxData[pxPos + 1] = pixelData[1];
			pxData[pxPos + 2] = pixelData[2];
			pxData[pxPos + 3] = pixelData[3];
		}
	];
	function bitRetriever(data, depth) {
		let leftOver = [];
		let i = 0;
		function split() {
			if (i === data.length) throw new Error("Ran out of data");
			let byte = data[i];
			i++;
			let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
			switch (depth) {
				default: throw new Error("unrecognised depth");
				case 16:
					byte2 = data[i];
					i++;
					leftOver.push((byte << 8) + byte2);
					break;
				case 4:
					byte2 = byte & 15;
					byte1 = byte >> 4;
					leftOver.push(byte1, byte2);
					break;
				case 2:
					byte4 = byte & 3;
					byte3 = byte >> 2 & 3;
					byte2 = byte >> 4 & 3;
					byte1 = byte >> 6 & 3;
					leftOver.push(byte1, byte2, byte3, byte4);
					break;
				case 1:
					byte8 = byte & 1;
					byte7 = byte >> 1 & 1;
					byte6 = byte >> 2 & 1;
					byte5 = byte >> 3 & 1;
					byte4 = byte >> 4 & 1;
					byte3 = byte >> 5 & 1;
					byte2 = byte >> 6 & 1;
					byte1 = byte >> 7 & 1;
					leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
					break;
			}
		}
		return {
			get: function(count) {
				while (leftOver.length < count) split();
				let returner = leftOver.slice(0, count);
				leftOver = leftOver.slice(count);
				return returner;
			},
			resetAfterLine: function() {
				leftOver.length = 0;
			},
			end: function() {
				if (i !== data.length) throw new Error("extra data found");
			}
		};
	}
	function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
		let imageWidth = image.width;
		let imageHeight = image.height;
		let imagePass = image.index;
		for (let y = 0; y < imageHeight; y++) for (let x = 0; x < imageWidth; x++) {
			let pxPos = getPxPos(x, y, imagePass);
			pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
			rawPos += bpp;
		}
		return rawPos;
	}
	function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
		let imageWidth = image.width;
		let imageHeight = image.height;
		let imagePass = image.index;
		for (let y = 0; y < imageHeight; y++) {
			for (let x = 0; x < imageWidth; x++) {
				let pixelData = bits.get(bpp);
				let pxPos = getPxPos(x, y, imagePass);
				pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
			}
			bits.resetAfterLine();
		}
	}
	exports.dataToBitMap = function(data, bitmapInfo) {
		let width = bitmapInfo.width;
		let height = bitmapInfo.height;
		let depth = bitmapInfo.depth;
		let bpp = bitmapInfo.bpp;
		let interlace = bitmapInfo.interlace;
		let bits;
		if (depth !== 8) bits = bitRetriever(data, depth);
		let pxData;
		if (depth <= 8) pxData = Buffer.alloc(width * height * 4);
		else pxData = new Uint16Array(width * height * 4);
		let maxBit = Math.pow(2, depth) - 1;
		let rawPos = 0;
		let images;
		let getPxPos;
		if (interlace) {
			images = interlaceUtils.getImagePasses(width, height);
			getPxPos = interlaceUtils.getInterlaceIterator(width, height);
		} else {
			let nonInterlacedPxPos = 0;
			getPxPos = function() {
				let returner = nonInterlacedPxPos;
				nonInterlacedPxPos += 4;
				return returner;
			};
			images = [{
				width,
				height
			}];
		}
		for (let imageIndex = 0; imageIndex < images.length; imageIndex++) if (depth === 8) rawPos = mapImage8Bit(images[imageIndex], pxData, getPxPos, bpp, data, rawPos);
		else mapImageCustomBit(images[imageIndex], pxData, getPxPos, bpp, bits, maxBit);
		if (depth === 8) {
			if (rawPos !== data.length) throw new Error("extra data found");
		} else bits.end();
		return pxData;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function dePalette(indata, outdata, width, height, palette) {
		let pxPos = 0;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let color = palette[indata[pxPos]];
			if (!color) throw new Error("index " + indata[pxPos] + " not in palette");
			for (let i = 0; i < 4; i++) outdata[pxPos + i] = color[i];
			pxPos += 4;
		}
	}
	function replaceTransparentColor(indata, outdata, width, height, transColor) {
		let pxPos = 0;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let makeTrans = false;
			if (transColor.length === 1) {
				if (transColor[0] === indata[pxPos]) makeTrans = true;
			} else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) makeTrans = true;
			if (makeTrans) for (let i = 0; i < 4; i++) outdata[pxPos + i] = 0;
			pxPos += 4;
		}
	}
	function scaleDepth(indata, outdata, width, height, depth) {
		let maxOutSample = 255;
		let maxInSample = Math.pow(2, depth) - 1;
		let pxPos = 0;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			for (let i = 0; i < 4; i++) outdata[pxPos + i] = Math.floor(indata[pxPos + i] * maxOutSample / maxInSample + .5);
			pxPos += 4;
		}
	}
	module.exports = function(indata, imageData, skipRescale = false) {
		let depth = imageData.depth;
		let width = imageData.width;
		let height = imageData.height;
		let colorType = imageData.colorType;
		let transColor = imageData.transColor;
		let palette = imageData.palette;
		let outdata = indata;
		if (colorType === 3) dePalette(indata, outdata, width, height, palette);
		else {
			if (transColor) replaceTransparentColor(indata, outdata, width, height, transColor);
			if (depth !== 8 && !skipRescale) {
				if (depth === 16) outdata = Buffer.alloc(width * height * 4);
				scaleDepth(indata, outdata, width, height, depth);
			}
		}
		return outdata;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser-async.js
var require_parser_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$3 = __require("util");
	let zlib$4 = __require("zlib");
	let ChunkStream = require_chunkstream();
	let FilterAsync = require_filter_parse_async();
	let Parser = require_parser();
	let bitmapper = require_bitmapper();
	let formatNormaliser = require_format_normaliser();
	let ParserAsync = module.exports = function(options) {
		ChunkStream.call(this);
		this._parser = new Parser(options, {
			read: this.read.bind(this),
			error: this._handleError.bind(this),
			metadata: this._handleMetaData.bind(this),
			gamma: this.emit.bind(this, "gamma"),
			palette: this._handlePalette.bind(this),
			transColor: this._handleTransColor.bind(this),
			finished: this._finished.bind(this),
			inflateData: this._inflateData.bind(this),
			simpleTransparency: this._simpleTransparency.bind(this),
			headersFinished: this._headersFinished.bind(this)
		});
		this._options = options;
		this.writable = true;
		this._parser.start();
	};
	util$3.inherits(ParserAsync, ChunkStream);
	ParserAsync.prototype._handleError = function(err) {
		this.emit("error", err);
		this.writable = false;
		this.destroy();
		if (this._inflate && this._inflate.destroy) this._inflate.destroy();
		if (this._filter) {
			this._filter.destroy();
			this._filter.on("error", function() {});
		}
		this.errord = true;
	};
	ParserAsync.prototype._inflateData = function(data) {
		if (!this._inflate) if (this._bitmapInfo.interlace) {
			this._inflate = zlib$4.createInflate();
			this._inflate.on("error", this.emit.bind(this, "error"));
			this._filter.on("complete", this._complete.bind(this));
			this._inflate.pipe(this._filter);
		} else {
			let imageSize = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1) * this._bitmapInfo.height;
			let chunkSize = Math.max(imageSize, zlib$4.Z_MIN_CHUNK);
			this._inflate = zlib$4.createInflate({ chunkSize });
			let leftToInflate = imageSize;
			let emitError = this.emit.bind(this, "error");
			this._inflate.on("error", function(err) {
				if (!leftToInflate) return;
				emitError(err);
			});
			this._filter.on("complete", this._complete.bind(this));
			let filterWrite = this._filter.write.bind(this._filter);
			this._inflate.on("data", function(chunk) {
				if (!leftToInflate) return;
				if (chunk.length > leftToInflate) chunk = chunk.slice(0, leftToInflate);
				leftToInflate -= chunk.length;
				filterWrite(chunk);
			});
			this._inflate.on("end", this._filter.end.bind(this._filter));
		}
		this._inflate.write(data);
	};
	ParserAsync.prototype._handleMetaData = function(metaData) {
		this._metaData = metaData;
		this._bitmapInfo = Object.create(metaData);
		this._filter = new FilterAsync(this._bitmapInfo);
	};
	ParserAsync.prototype._handleTransColor = function(transColor) {
		this._bitmapInfo.transColor = transColor;
	};
	ParserAsync.prototype._handlePalette = function(palette) {
		this._bitmapInfo.palette = palette;
	};
	ParserAsync.prototype._simpleTransparency = function() {
		this._metaData.alpha = true;
	};
	ParserAsync.prototype._headersFinished = function() {
		this.emit("metadata", this._metaData);
	};
	ParserAsync.prototype._finished = function() {
		if (this.errord) return;
		if (!this._inflate) this.emit("error", "No Inflate block");
		else this._inflate.end();
	};
	ParserAsync.prototype._complete = function(filteredData) {
		if (this.errord) return;
		let normalisedBitmapData;
		try {
			let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
			normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo, this._options.skipRescale);
			bitmapData = null;
		} catch (ex) {
			this._handleError(ex);
			return;
		}
		this.emit("parsed", normalisedBitmapData);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let constants = require_constants();
	module.exports = function(dataIn, width, height, options) {
		let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(options.colorType) !== -1;
		if (options.colorType === options.inputColorType) {
			let bigEndian = (function() {
				let buffer = /* @__PURE__ */ new ArrayBuffer(2);
				new DataView(buffer).setInt16(0, 256, true);
				return new Int16Array(buffer)[0] !== 256;
			})();
			if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) return dataIn;
		}
		let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
		let maxValue = 255;
		let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
		if (inBpp === 4 && !options.inputHasAlpha) inBpp = 3;
		let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
		if (options.bitDepth === 16) {
			maxValue = 65535;
			outBpp *= 2;
		}
		let outData = Buffer.alloc(width * height * outBpp);
		let inIndex = 0;
		let outIndex = 0;
		let bgColor = options.bgColor || {};
		if (bgColor.red === void 0) bgColor.red = maxValue;
		if (bgColor.green === void 0) bgColor.green = maxValue;
		if (bgColor.blue === void 0) bgColor.blue = maxValue;
		function getRGBA() {
			let red;
			let green;
			let blue;
			let alpha = maxValue;
			switch (options.inputColorType) {
				case constants.COLORTYPE_COLOR_ALPHA:
					alpha = data[inIndex + 3];
					red = data[inIndex];
					green = data[inIndex + 1];
					blue = data[inIndex + 2];
					break;
				case constants.COLORTYPE_COLOR:
					red = data[inIndex];
					green = data[inIndex + 1];
					blue = data[inIndex + 2];
					break;
				case constants.COLORTYPE_ALPHA:
					alpha = data[inIndex + 1];
					red = data[inIndex];
					green = red;
					blue = red;
					break;
				case constants.COLORTYPE_GRAYSCALE:
					red = data[inIndex];
					green = red;
					blue = red;
					break;
				default: throw new Error("input color type:" + options.inputColorType + " is not supported at present");
			}
			if (options.inputHasAlpha) {
				if (!outHasAlpha) {
					alpha /= maxValue;
					red = Math.min(Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0), maxValue);
					green = Math.min(Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0), maxValue);
					blue = Math.min(Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0), maxValue);
				}
			}
			return {
				red,
				green,
				blue,
				alpha
			};
		}
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let rgba = getRGBA(data, inIndex);
			switch (options.colorType) {
				case constants.COLORTYPE_COLOR_ALPHA:
				case constants.COLORTYPE_COLOR:
					if (options.bitDepth === 8) {
						outData[outIndex] = rgba.red;
						outData[outIndex + 1] = rgba.green;
						outData[outIndex + 2] = rgba.blue;
						if (outHasAlpha) outData[outIndex + 3] = rgba.alpha;
					} else {
						outData.writeUInt16BE(rgba.red, outIndex);
						outData.writeUInt16BE(rgba.green, outIndex + 2);
						outData.writeUInt16BE(rgba.blue, outIndex + 4);
						if (outHasAlpha) outData.writeUInt16BE(rgba.alpha, outIndex + 6);
					}
					break;
				case constants.COLORTYPE_ALPHA:
				case constants.COLORTYPE_GRAYSCALE: {
					let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
					if (options.bitDepth === 8) {
						outData[outIndex] = grayscale;
						if (outHasAlpha) outData[outIndex + 1] = rgba.alpha;
					} else {
						outData.writeUInt16BE(grayscale, outIndex);
						if (outHasAlpha) outData.writeUInt16BE(rgba.alpha, outIndex + 2);
					}
					break;
				}
				default: throw new Error("unrecognised color Type " + options.colorType);
			}
			inIndex += inBpp;
			outIndex += outBpp;
		}
		return outData;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let paethPredictor = require_paeth_predictor();
	function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
		for (let x = 0; x < byteWidth; x++) rawData[rawPos + x] = pxData[pxPos + x];
	}
	function filterSumNone(pxData, pxPos, byteWidth) {
		let sum = 0;
		let length = pxPos + byteWidth;
		for (let i = pxPos; i < length; i++) sum += Math.abs(pxData[i]);
		return sum;
	}
	function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let val = pxData[pxPos + x] - left;
			rawData[rawPos + x] = val;
		}
	}
	function filterSumSub(pxData, pxPos, byteWidth, bpp) {
		let sum = 0;
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let val = pxData[pxPos + x] - left;
			sum += Math.abs(val);
		}
		return sum;
	}
	function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
		for (let x = 0; x < byteWidth; x++) {
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let val = pxData[pxPos + x] - up;
			rawData[rawPos + x] = val;
		}
	}
	function filterSumUp(pxData, pxPos, byteWidth) {
		let sum = 0;
		let length = pxPos + byteWidth;
		for (let x = pxPos; x < length; x++) {
			let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
			let val = pxData[x] - up;
			sum += Math.abs(val);
		}
		return sum;
	}
	function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let val = pxData[pxPos + x] - (left + up >> 1);
			rawData[rawPos + x] = val;
		}
	}
	function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
		let sum = 0;
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let val = pxData[pxPos + x] - (left + up >> 1);
			sum += Math.abs(val);
		}
		return sum;
	}
	function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
			let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
			rawData[rawPos + x] = val;
		}
	}
	function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
		let sum = 0;
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
			let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
			sum += Math.abs(val);
		}
		return sum;
	}
	let filters = {
		0: filterNone,
		1: filterSub,
		2: filterUp,
		3: filterAvg,
		4: filterPaeth
	};
	let filterSums = {
		0: filterSumNone,
		1: filterSumSub,
		2: filterSumUp,
		3: filterSumAvg,
		4: filterSumPaeth
	};
	module.exports = function(pxData, width, height, options, bpp) {
		let filterTypes;
		if (!("filterType" in options) || options.filterType === -1) filterTypes = [
			0,
			1,
			2,
			3,
			4
		];
		else if (typeof options.filterType === "number") filterTypes = [options.filterType];
		else throw new Error("unrecognised filter types");
		if (options.bitDepth === 16) bpp *= 2;
		let byteWidth = width * bpp;
		let rawPos = 0;
		let pxPos = 0;
		let rawData = Buffer.alloc((byteWidth + 1) * height);
		let sel = filterTypes[0];
		for (let y = 0; y < height; y++) {
			if (filterTypes.length > 1) {
				let min = Infinity;
				for (let i = 0; i < filterTypes.length; i++) {
					let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
					if (sum < min) {
						sel = filterTypes[i];
						min = sum;
					}
				}
			}
			rawData[rawPos] = sel;
			rawPos++;
			filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
			rawPos += byteWidth;
			pxPos += byteWidth;
		}
		return rawData;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer.js
var require_packer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let constants = require_constants();
	let CrcStream = require_crc();
	let bitPacker = require_bitpacker();
	let filter = require_filter_pack();
	let zlib$3 = __require("zlib");
	let Packer = module.exports = function(options) {
		this._options = options;
		options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
		options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
		options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
		options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
		options.deflateFactory = options.deflateFactory || zlib$3.createDeflate;
		options.bitDepth = options.bitDepth || 8;
		options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
		options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
		if ([
			constants.COLORTYPE_GRAYSCALE,
			constants.COLORTYPE_COLOR,
			constants.COLORTYPE_COLOR_ALPHA,
			constants.COLORTYPE_ALPHA
		].indexOf(options.colorType) === -1) throw new Error("option color type:" + options.colorType + " is not supported at present");
		if ([
			constants.COLORTYPE_GRAYSCALE,
			constants.COLORTYPE_COLOR,
			constants.COLORTYPE_COLOR_ALPHA,
			constants.COLORTYPE_ALPHA
		].indexOf(options.inputColorType) === -1) throw new Error("option input color type:" + options.inputColorType + " is not supported at present");
		if (options.bitDepth !== 8 && options.bitDepth !== 16) throw new Error("option bit depth:" + options.bitDepth + " is not supported at present");
	};
	Packer.prototype.getDeflateOptions = function() {
		return {
			chunkSize: this._options.deflateChunkSize,
			level: this._options.deflateLevel,
			strategy: this._options.deflateStrategy
		};
	};
	Packer.prototype.createDeflate = function() {
		return this._options.deflateFactory(this.getDeflateOptions());
	};
	Packer.prototype.filterData = function(data, width, height) {
		let packedData = bitPacker(data, width, height, this._options);
		let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
		return filter(packedData, width, height, this._options, bpp);
	};
	Packer.prototype._packChunk = function(type, data) {
		let len = data ? data.length : 0;
		let buf = Buffer.alloc(len + 12);
		buf.writeUInt32BE(len, 0);
		buf.writeUInt32BE(type, 4);
		if (data) data.copy(buf, 8);
		buf.writeInt32BE(CrcStream.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
		return buf;
	};
	Packer.prototype.packGAMA = function(gamma) {
		let buf = Buffer.alloc(4);
		buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
		return this._packChunk(constants.TYPE_gAMA, buf);
	};
	Packer.prototype.packIHDR = function(width, height) {
		let buf = Buffer.alloc(13);
		buf.writeUInt32BE(width, 0);
		buf.writeUInt32BE(height, 4);
		buf[8] = this._options.bitDepth;
		buf[9] = this._options.colorType;
		buf[10] = 0;
		buf[11] = 0;
		buf[12] = 0;
		return this._packChunk(constants.TYPE_IHDR, buf);
	};
	Packer.prototype.packIDAT = function(data) {
		return this._packChunk(constants.TYPE_IDAT, data);
	};
	Packer.prototype.packIEND = function() {
		return this._packChunk(constants.TYPE_IEND, null);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer-async.js
var require_packer_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$2 = __require("util");
	let Stream$1 = __require("stream");
	let constants = require_constants();
	let Packer = require_packer();
	let PackerAsync = module.exports = function(opt) {
		Stream$1.call(this);
		this._packer = new Packer(opt || {});
		this._deflate = this._packer.createDeflate();
		this.readable = true;
	};
	util$2.inherits(PackerAsync, Stream$1);
	PackerAsync.prototype.pack = function(data, width, height, gamma) {
		this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
		this.emit("data", this._packer.packIHDR(width, height));
		if (gamma) this.emit("data", this._packer.packGAMA(gamma));
		let filteredData = this._packer.filterData(data, width, height);
		this._deflate.on("error", this.emit.bind(this, "error"));
		this._deflate.on("data", function(compressedData) {
			this.emit("data", this._packer.packIDAT(compressedData));
		}.bind(this));
		this._deflate.on("end", function() {
			this.emit("data", this._packer.packIEND());
			this.emit("end");
		}.bind(this));
		this._deflate.end(filteredData);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let assert = __require("assert").ok;
	let zlib$2 = __require("zlib");
	let util$1 = __require("util");
	let kMaxLength = __require("buffer").kMaxLength;
	function Inflate(opts) {
		if (!(this instanceof Inflate)) return new Inflate(opts);
		if (opts && opts.chunkSize < zlib$2.Z_MIN_CHUNK) opts.chunkSize = zlib$2.Z_MIN_CHUNK;
		zlib$2.Inflate.call(this, opts);
		this._offset = this._offset === void 0 ? this._outOffset : this._offset;
		this._buffer = this._buffer || this._outBuffer;
		if (opts && opts.maxLength != null) this._maxLength = opts.maxLength;
	}
	function createInflate(opts) {
		return new Inflate(opts);
	}
	function _close(engine, callback) {
		if (callback) process.nextTick(callback);
		if (!engine._handle) return;
		engine._handle.close();
		engine._handle = null;
	}
	Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
		if (typeof asyncCb === "function") return zlib$2.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
		let self = this;
		let availInBefore = chunk && chunk.length;
		let availOutBefore = this._chunkSize - this._offset;
		let leftToInflate = this._maxLength;
		let inOff = 0;
		let buffers = [];
		let nread = 0;
		let error;
		this.on("error", function(err) {
			error = err;
		});
		function handleChunk(availInAfter, availOutAfter) {
			if (self._hadError) return;
			let have = availOutBefore - availOutAfter;
			assert(have >= 0, "have should not go down");
			if (have > 0) {
				let out = self._buffer.slice(self._offset, self._offset + have);
				self._offset += have;
				if (out.length > leftToInflate) out = out.slice(0, leftToInflate);
				buffers.push(out);
				nread += out.length;
				leftToInflate -= out.length;
				if (leftToInflate === 0) return false;
			}
			if (availOutAfter === 0 || self._offset >= self._chunkSize) {
				availOutBefore = self._chunkSize;
				self._offset = 0;
				self._buffer = Buffer.allocUnsafe(self._chunkSize);
			}
			if (availOutAfter === 0) {
				inOff += availInBefore - availInAfter;
				availInBefore = availInAfter;
				return true;
			}
			return false;
		}
		assert(this._handle, "zlib binding closed");
		let res;
		do {
			res = this._handle.writeSync(flushFlag, chunk, inOff, availInBefore, this._buffer, this._offset, availOutBefore);
			res = res || this._writeState;
		} while (!this._hadError && handleChunk(res[0], res[1]));
		if (this._hadError) throw error;
		if (nread >= kMaxLength) {
			_close(this);
			throw new RangeError("Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes");
		}
		let buf = Buffer.concat(buffers, nread);
		_close(this);
		return buf;
	};
	util$1.inherits(Inflate, zlib$2.Inflate);
	function zlibBufferSync(engine, buffer) {
		if (typeof buffer === "string") buffer = Buffer.from(buffer);
		if (!(buffer instanceof Buffer)) throw new TypeError("Not a string or buffer");
		let flushFlag = engine._finishFlushFlag;
		if (flushFlag == null) flushFlag = zlib$2.Z_FINISH;
		return engine._processChunk(buffer, flushFlag);
	}
	function inflateSync(buffer, opts) {
		return zlibBufferSync(new Inflate(opts), buffer);
	}
	module.exports = exports = inflateSync;
	exports.Inflate = Inflate;
	exports.createInflate = createInflate;
	exports.inflateSync = inflateSync;
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let SyncReader = module.exports = function(buffer) {
		this._buffer = buffer;
		this._reads = [];
	};
	SyncReader.prototype.read = function(length, callback) {
		this._reads.push({
			length: Math.abs(length),
			allowLess: length < 0,
			func: callback
		});
	};
	SyncReader.prototype.process = function() {
		while (this._reads.length > 0 && this._buffer.length) {
			let read = this._reads[0];
			if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
				this._reads.shift();
				let buf = this._buffer;
				this._buffer = buf.slice(read.length);
				read.func.call(this, buf.slice(0, read.length));
			} else break;
		}
		if (this._reads.length > 0) throw new Error("There are some read requests waitng on finished stream");
		if (this._buffer.length > 0) throw new Error("unrecognised content at end of stream");
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = /* @__PURE__ */ __commonJSMin(((exports) => {
	let SyncReader = require_sync_reader();
	let Filter = require_filter_parse();
	exports.process = function(inBuffer, bitmapInfo) {
		let outBuffers = [];
		let reader = new SyncReader(inBuffer);
		new Filter(bitmapInfo, {
			read: reader.read.bind(reader),
			write: function(bufferPart) {
				outBuffers.push(bufferPart);
			},
			complete: function() {}
		}).start();
		reader.process();
		return Buffer.concat(outBuffers);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let hasSyncZlib = true;
	let zlib$1 = __require("zlib");
	let inflateSync = require_sync_inflate();
	if (!zlib$1.deflateSync) hasSyncZlib = false;
	let SyncReader = require_sync_reader();
	let FilterSync = require_filter_parse_sync();
	let Parser = require_parser();
	let bitmapper = require_bitmapper();
	let formatNormaliser = require_format_normaliser();
	module.exports = function(buffer, options) {
		if (!hasSyncZlib) throw new Error("To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0");
		let err;
		function handleError(_err_) {
			err = _err_;
		}
		let metaData;
		function handleMetaData(_metaData_) {
			metaData = _metaData_;
		}
		function handleTransColor(transColor) {
			metaData.transColor = transColor;
		}
		function handlePalette(palette) {
			metaData.palette = palette;
		}
		function handleSimpleTransparency() {
			metaData.alpha = true;
		}
		let gamma;
		function handleGamma(_gamma_) {
			gamma = _gamma_;
		}
		let inflateDataList = [];
		function handleInflateData(inflatedData) {
			inflateDataList.push(inflatedData);
		}
		let reader = new SyncReader(buffer);
		new Parser(options, {
			read: reader.read.bind(reader),
			error: handleError,
			metadata: handleMetaData,
			gamma: handleGamma,
			palette: handlePalette,
			transColor: handleTransColor,
			inflateData: handleInflateData,
			simpleTransparency: handleSimpleTransparency
		}).start();
		reader.process();
		if (err) throw err;
		let inflateData = Buffer.concat(inflateDataList);
		inflateDataList.length = 0;
		let inflatedData;
		if (metaData.interlace) inflatedData = zlib$1.inflateSync(inflateData);
		else {
			let imageSize = ((metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1) * metaData.height;
			inflatedData = inflateSync(inflateData, {
				chunkSize: imageSize,
				maxLength: imageSize
			});
		}
		inflateData = null;
		if (!inflatedData || !inflatedData.length) throw new Error("bad png - invalid inflate data response");
		let unfilteredData = FilterSync.process(inflatedData, metaData);
		inflateData = null;
		let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
		unfilteredData = null;
		let normalisedBitmapData = formatNormaliser(bitmapData, metaData, options.skipRescale);
		metaData.data = normalisedBitmapData;
		metaData.gamma = gamma || 0;
		return metaData;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let hasSyncZlib = true;
	let zlib = __require("zlib");
	if (!zlib.deflateSync) hasSyncZlib = false;
	let constants = require_constants();
	let Packer = require_packer();
	module.exports = function(metaData, opt) {
		if (!hasSyncZlib) throw new Error("To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0");
		let packer = new Packer(opt || {});
		let chunks = [];
		chunks.push(Buffer.from(constants.PNG_SIGNATURE));
		chunks.push(packer.packIHDR(metaData.width, metaData.height));
		if (metaData.gamma) chunks.push(packer.packGAMA(metaData.gamma));
		let filteredData = packer.filterData(metaData.data, metaData.width, metaData.height);
		let compressedData = zlib.deflateSync(filteredData, packer.getDeflateOptions());
		filteredData = null;
		if (!compressedData || !compressedData.length) throw new Error("bad png - invalid compressed data response");
		chunks.push(packer.packIDAT(compressedData));
		chunks.push(packer.packIEND());
		return Buffer.concat(chunks);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png-sync.js
var require_png_sync = /* @__PURE__ */ __commonJSMin(((exports) => {
	let parse = require_parser_sync();
	let pack = require_packer_sync();
	exports.read = function(buffer, options) {
		return parse(buffer, options || {});
	};
	exports.write = function(png, options) {
		return pack(png, options);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@jimp+js-png@1.6.1/node_modules/@jimp/js-png/dist/esm/constants.js
var import_png = (/* @__PURE__ */ __commonJSMin(((exports) => {
	let util = __require("util");
	let Stream = __require("stream");
	let Parser = require_parser_async();
	let Packer = require_packer_async();
	let PNGSync = require_png_sync();
	let PNG = exports.PNG = function(options) {
		Stream.call(this);
		options = options || {};
		this.width = options.width | 0;
		this.height = options.height | 0;
		this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
		if (options.fill && this.data) this.data.fill(0);
		this.gamma = 0;
		this.readable = this.writable = true;
		this._parser = new Parser(options);
		this._parser.on("error", this.emit.bind(this, "error"));
		this._parser.on("close", this._handleClose.bind(this));
		this._parser.on("metadata", this._metadata.bind(this));
		this._parser.on("gamma", this._gamma.bind(this));
		this._parser.on("parsed", function(data) {
			this.data = data;
			this.emit("parsed", data);
		}.bind(this));
		this._packer = new Packer(options);
		this._packer.on("data", this.emit.bind(this, "data"));
		this._packer.on("end", this.emit.bind(this, "end"));
		this._parser.on("close", this._handleClose.bind(this));
		this._packer.on("error", this.emit.bind(this, "error"));
	};
	util.inherits(PNG, Stream);
	PNG.sync = PNGSync;
	PNG.prototype.pack = function() {
		if (!this.data || !this.data.length) {
			this.emit("error", "No data provided");
			return this;
		}
		process.nextTick(function() {
			this._packer.pack(this.data, this.width, this.height, this.gamma);
		}.bind(this));
		return this;
	};
	PNG.prototype.parse = function(data, callback) {
		if (callback) {
			let onParsed, onError;
			onParsed = function(parsedData) {
				this.removeListener("error", onError);
				this.data = parsedData;
				callback(null, this);
			}.bind(this);
			onError = function(err) {
				this.removeListener("parsed", onParsed);
				callback(err, null);
			}.bind(this);
			this.once("parsed", onParsed);
			this.once("error", onError);
		}
		this.end(data);
		return this;
	};
	PNG.prototype.write = function(data) {
		this._parser.write(data);
		return true;
	};
	PNG.prototype.end = function(data) {
		this._parser.end(data);
	};
	PNG.prototype._metadata = function(metadata) {
		this.width = metadata.width;
		this.height = metadata.height;
		this.emit("metadata", metadata);
	};
	PNG.prototype._gamma = function(gamma) {
		this.gamma = gamma;
	};
	PNG.prototype._handleClose = function() {
		if (!this._parser.writable && !this._packer.readable) this.emit("close");
	};
	PNG.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) {
		srcX |= 0;
		srcY |= 0;
		width |= 0;
		height |= 0;
		deltaX |= 0;
		deltaY |= 0;
		if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) throw new Error("bitblt reading outside image");
		if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) throw new Error("bitblt writing outside image");
		for (let y = 0; y < height; y++) src.data.copy(dst.data, (deltaY + y) * dst.width + deltaX << 2, (srcY + y) * src.width + srcX << 2, (srcY + y) * src.width + srcX + width << 2);
	};
	PNG.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
		PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
		return this;
	};
	PNG.adjustGamma = function(src) {
		if (src.gamma) {
			for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
				let idx = src.width * y + x << 2;
				for (let i = 0; i < 3; i++) {
					let sample = src.data[idx + i] / 255;
					sample = Math.pow(sample, 1 / 2.2 / src.gamma);
					src.data[idx + i] = Math.round(sample * 255);
				}
			}
			src.gamma = 0;
		}
	};
	PNG.prototype.adjustGamma = function() {
		PNG.adjustGamma(this);
	};
})))();
/**
* Filter method is a single-byte integer that indicates the preprocessing method applied to the image data before compression.
*/
var PNGFilterType;
(function(PNGFilterType) {
	PNGFilterType[PNGFilterType["AUTO"] = -1] = "AUTO";
	/** scanline is transmitted unmodified */
	PNGFilterType[PNGFilterType["NONE"] = 0] = "NONE";
	/** filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel */
	PNGFilterType[PNGFilterType["SUB"] = 1] = "SUB";
	/** The Up() filter is just like the Sub() filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor. */
	PNGFilterType[PNGFilterType["UP"] = 2] = "UP";
	/** uses the average of the two neighboring pixels (left and above) to predict the value of a pixel */
	PNGFilterType[PNGFilterType["AVERAGE"] = 3] = "AVERAGE";
	/** computes a simple linear function of the three neighboring pixels (left, above, upper left), then chooses as predictor the neighboring pixel closest to the computed value. */
	PNGFilterType[PNGFilterType["PATH"] = 4] = "PATH";
})(PNGFilterType || (PNGFilterType = {}));
/**
* Color type is a single-byte integer that describes the interpretation of the image data.
* Color type codes represent sums of the following values:
*
* 1 (palette used), 2 (color used), and 4 (alpha channel used).
*/
var PNGColorType;
(function(PNGColorType) {
	PNGColorType[PNGColorType["GRAYSCALE"] = 0] = "GRAYSCALE";
	PNGColorType[PNGColorType["COLOR"] = 2] = "COLOR";
	PNGColorType[PNGColorType["GRAYSCALE_ALPHA"] = 4] = "GRAYSCALE_ALPHA";
	PNGColorType[PNGColorType["COLOR_ALPHA"] = 6] = "COLOR_ALPHA";
})(PNGColorType || (PNGColorType = {}));
//#endregion
//#region ../../node_modules/.pnpm/@jimp+js-png@1.6.1/node_modules/@jimp/js-png/dist/esm/index.js
function png() {
	return {
		mime: "image/png",
		hasAlpha: true,
		encode: (bitmap, { deflateLevel = 9, deflateStrategy = 3, filterType = PNGFilterType.AUTO, colorType, inputHasAlpha = true, ...options } = {}) => {
			const png = new import_png.PNG({
				width: bitmap.width,
				height: bitmap.height
			});
			png.data = bitmap.data;
			return import_png.PNG.sync.write(png, {
				...options,
				deflateLevel,
				deflateStrategy,
				filterType,
				colorType: typeof colorType !== "undefined" ? colorType : inputHasAlpha ? PNGColorType.COLOR_ALPHA : PNGColorType.COLOR,
				inputHasAlpha
			});
		},
		decode: (data, options) => {
			const result = import_png.PNG.sync.read(data, options);
			return {
				data: result.data,
				width: result.width,
				height: result.height
			};
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@jimp+plugin-crop@1.6.1/node_modules/@jimp/plugin-crop/dist/esm/index.js
const CropOptionsSchema = objectType({
	x: numberType(),
	y: numberType(),
	w: numberType(),
	h: numberType()
});
const AutocropComplexOptionsSchema = objectType({
	tolerance: numberType().min(0).max(1).optional(),
	cropOnlyFrames: booleanType().optional(),
	cropSymmetric: booleanType().optional(),
	leaveBorder: numberType().optional(),
	ignoreSides: objectType({
		north: booleanType().optional(),
		south: booleanType().optional(),
		east: booleanType().optional(),
		west: booleanType().optional()
	}).optional()
});
const methods = {
	crop(image, options) {
		let { x, y, w, h } = CropOptionsSchema.parse(options);
		x = Math.round(x);
		y = Math.round(y);
		w = Math.round(w);
		h = Math.round(h);
		if (x === 0 && w === image.bitmap.width) {
			const start = w * y + x << 2;
			const end = start + (h * w << 2);
			image.bitmap.data = image.bitmap.data.slice(start, end);
		} else {
			const bitmap = Buffer.allocUnsafe(w * h * 4);
			let offset = 0;
			scan(image, x, y, w, h, function(_, __, idx) {
				const data = image.bitmap.data.readUInt32BE(idx);
				bitmap.writeUInt32BE(data, offset);
				offset += 4;
			});
			image.bitmap.data = bitmap;
		}
		image.bitmap.width = w;
		image.bitmap.height = h;
		return image;
	},
	autocrop(image, options = {}) {
		const { tolerance = 2e-4, cropOnlyFrames = true, cropSymmetric = false, leaveBorder = 0, ignoreSides: ignoreSidesArg } = typeof options === "number" ? { tolerance: options } : AutocropComplexOptionsSchema.parse(options);
		const w = image.bitmap.width;
		const h = image.bitmap.height;
		const minPixelsPerSide = 1;
		const ignoreSides = {
			north: false,
			south: false,
			east: false,
			west: false,
			...ignoreSidesArg
		};
		/**
		* All borders must be of the same color as the top left pixel, to be cropped.
		* It should be possible to crop borders each with a different color,
		* but since there are many ways for corners to intersect, it would
		* introduce unnecessary complexity to the algorithm.
		*/
		let colorTarget = image.getPixelColor(0, 0);
		const rgba1 = intToRGBA(colorTarget);
		let northPixelsToCrop = 0;
		let eastPixelsToCrop = 0;
		let southPixelsToCrop = 0;
		let westPixelsToCrop = 0;
		colorTarget = image.getPixelColor(0, 0);
		if (!ignoreSides.north) north: for (let y = 0; y < h - minPixelsPerSide; y++) {
			for (let x = 0; x < w; x++) if (colorDiff(rgba1, intToRGBA(image.getPixelColor(x, y))) > tolerance) break north;
			northPixelsToCrop++;
		}
		colorTarget = image.getPixelColor(w, 0);
		if (!ignoreSides.west) west: for (let x = 0; x < w - minPixelsPerSide; x++) {
			for (let y = 0 + northPixelsToCrop; y < h; y++) if (colorDiff(rgba1, intToRGBA(image.getPixelColor(x, y))) > tolerance) break west;
			westPixelsToCrop++;
		}
		colorTarget = image.getPixelColor(0, h);
		if (!ignoreSides.south) south: for (let y = h - 1; y >= northPixelsToCrop + minPixelsPerSide; y--) {
			for (let x = w - eastPixelsToCrop - 1; x >= 0; x--) if (colorDiff(rgba1, intToRGBA(image.getPixelColor(x, y))) > tolerance) break south;
			southPixelsToCrop++;
		}
		colorTarget = image.getPixelColor(w, h);
		if (!ignoreSides.east) east: for (let x = w - 1; x >= 0 + westPixelsToCrop + minPixelsPerSide; x--) {
			for (let y = h - 1; y >= 0 + northPixelsToCrop; y--) if (colorDiff(rgba1, intToRGBA(image.getPixelColor(x, y))) > tolerance) break east;
			eastPixelsToCrop++;
		}
		let doCrop = false;
		westPixelsToCrop -= leaveBorder;
		eastPixelsToCrop -= leaveBorder;
		northPixelsToCrop -= leaveBorder;
		southPixelsToCrop -= leaveBorder;
		if (cropSymmetric) {
			const horizontal = Math.min(eastPixelsToCrop, westPixelsToCrop);
			const vertical = Math.min(northPixelsToCrop, southPixelsToCrop);
			westPixelsToCrop = horizontal;
			eastPixelsToCrop = horizontal;
			northPixelsToCrop = vertical;
			southPixelsToCrop = vertical;
		}
		westPixelsToCrop = westPixelsToCrop >= 0 ? westPixelsToCrop : 0;
		eastPixelsToCrop = eastPixelsToCrop >= 0 ? eastPixelsToCrop : 0;
		northPixelsToCrop = northPixelsToCrop >= 0 ? northPixelsToCrop : 0;
		southPixelsToCrop = southPixelsToCrop >= 0 ? southPixelsToCrop : 0;
		const widthOfRemainingPixels = w - (westPixelsToCrop + eastPixelsToCrop);
		const heightOfRemainingPixels = h - (southPixelsToCrop + northPixelsToCrop);
		if (cropOnlyFrames) doCrop = eastPixelsToCrop !== 0 && northPixelsToCrop !== 0 && westPixelsToCrop !== 0 && southPixelsToCrop !== 0;
		else doCrop = eastPixelsToCrop !== 0 || northPixelsToCrop !== 0 || westPixelsToCrop !== 0 || southPixelsToCrop !== 0;
		if (doCrop) this.crop(image, {
			x: westPixelsToCrop,
			y: northPixelsToCrop,
			w: widthOfRemainingPixels,
			h: heightOfRemainingPixels
		});
		return image;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/scanner.js
/**
* Creates a JSON scanner on the given text.
* If ignoreTrivia is set, whitespaces or comments are ignored.
*/
function createScanner$1(text, ignoreTrivia = false) {
	const len = text.length;
	let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
	function scanHexDigits(count, exact) {
		let digits = 0;
		let value = 0;
		while (digits < count || !exact) {
			let ch = text.charCodeAt(pos);
			if (ch >= 48 && ch <= 57) value = value * 16 + ch - 48;
			else if (ch >= 65 && ch <= 70) value = value * 16 + ch - 65 + 10;
			else if (ch >= 97 && ch <= 102) value = value * 16 + ch - 97 + 10;
			else break;
			pos++;
			digits++;
		}
		if (digits < count) value = -1;
		return value;
	}
	function setPosition(newPosition) {
		pos = newPosition;
		value = "";
		tokenOffset = 0;
		token = 16;
		scanError = 0;
	}
	function scanNumber() {
		let start = pos;
		if (text.charCodeAt(pos) === 48) pos++;
		else {
			pos++;
			while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
		}
		if (pos < text.length && text.charCodeAt(pos) === 46) {
			pos++;
			if (pos < text.length && isDigit(text.charCodeAt(pos))) {
				pos++;
				while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
			} else {
				scanError = 3;
				return text.substring(start, pos);
			}
		}
		let end = pos;
		if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
			pos++;
			if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) pos++;
			if (pos < text.length && isDigit(text.charCodeAt(pos))) {
				pos++;
				while (pos < text.length && isDigit(text.charCodeAt(pos))) pos++;
				end = pos;
			} else scanError = 3;
		}
		return text.substring(start, end);
	}
	function scanString() {
		let result = "", start = pos;
		while (true) {
			if (pos >= len) {
				result += text.substring(start, pos);
				scanError = 2;
				break;
			}
			const ch = text.charCodeAt(pos);
			if (ch === 34) {
				result += text.substring(start, pos);
				pos++;
				break;
			}
			if (ch === 92) {
				result += text.substring(start, pos);
				pos++;
				if (pos >= len) {
					scanError = 2;
					break;
				}
				switch (text.charCodeAt(pos++)) {
					case 34:
						result += "\"";
						break;
					case 92:
						result += "\\";
						break;
					case 47:
						result += "/";
						break;
					case 98:
						result += "\b";
						break;
					case 102:
						result += "\f";
						break;
					case 110:
						result += "\n";
						break;
					case 114:
						result += "\r";
						break;
					case 116:
						result += "	";
						break;
					case 117:
						const ch3 = scanHexDigits(4, true);
						if (ch3 >= 0) result += String.fromCharCode(ch3);
						else scanError = 4;
						break;
					default: scanError = 5;
				}
				start = pos;
				continue;
			}
			if (ch >= 0 && ch <= 31) if (isLineBreak(ch)) {
				result += text.substring(start, pos);
				scanError = 2;
				break;
			} else scanError = 6;
			pos++;
		}
		return result;
	}
	function scanNext() {
		value = "";
		scanError = 0;
		tokenOffset = pos;
		lineStartOffset = lineNumber;
		prevTokenLineStartOffset = tokenLineStartOffset;
		if (pos >= len) {
			tokenOffset = len;
			return token = 17;
		}
		let code = text.charCodeAt(pos);
		if (isWhiteSpace(code)) {
			do {
				pos++;
				value += String.fromCharCode(code);
				code = text.charCodeAt(pos);
			} while (isWhiteSpace(code));
			return token = 15;
		}
		if (isLineBreak(code)) {
			pos++;
			value += String.fromCharCode(code);
			if (code === 13 && text.charCodeAt(pos) === 10) {
				pos++;
				value += "\n";
			}
			lineNumber++;
			tokenLineStartOffset = pos;
			return token = 14;
		}
		switch (code) {
			case 123:
				pos++;
				return token = 1;
			case 125:
				pos++;
				return token = 2;
			case 91:
				pos++;
				return token = 3;
			case 93:
				pos++;
				return token = 4;
			case 58:
				pos++;
				return token = 6;
			case 44:
				pos++;
				return token = 5;
			case 34:
				pos++;
				value = scanString();
				return token = 10;
			case 47:
				const start = pos - 1;
				if (text.charCodeAt(pos + 1) === 47) {
					pos += 2;
					while (pos < len) {
						if (isLineBreak(text.charCodeAt(pos))) break;
						pos++;
					}
					value = text.substring(start, pos);
					return token = 12;
				}
				if (text.charCodeAt(pos + 1) === 42) {
					pos += 2;
					const safeLength = len - 1;
					let commentClosed = false;
					while (pos < safeLength) {
						const ch = text.charCodeAt(pos);
						if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
							pos += 2;
							commentClosed = true;
							break;
						}
						pos++;
						if (isLineBreak(ch)) {
							if (ch === 13 && text.charCodeAt(pos) === 10) pos++;
							lineNumber++;
							tokenLineStartOffset = pos;
						}
					}
					if (!commentClosed) {
						pos++;
						scanError = 1;
					}
					value = text.substring(start, pos);
					return token = 13;
				}
				value += String.fromCharCode(code);
				pos++;
				return token = 16;
			case 45:
				value += String.fromCharCode(code);
				pos++;
				if (pos === len || !isDigit(text.charCodeAt(pos))) return token = 16;
			case 48:
			case 49:
			case 50:
			case 51:
			case 52:
			case 53:
			case 54:
			case 55:
			case 56:
			case 57:
				value += scanNumber();
				return token = 11;
			default:
				while (pos < len && isUnknownContentCharacter(code)) {
					pos++;
					code = text.charCodeAt(pos);
				}
				if (tokenOffset !== pos) {
					value = text.substring(tokenOffset, pos);
					switch (value) {
						case "true": return token = 8;
						case "false": return token = 9;
						case "null": return token = 7;
					}
					return token = 16;
				}
				value += String.fromCharCode(code);
				pos++;
				return token = 16;
		}
	}
	function isUnknownContentCharacter(code) {
		if (isWhiteSpace(code) || isLineBreak(code)) return false;
		switch (code) {
			case 125:
			case 93:
			case 123:
			case 91:
			case 34:
			case 58:
			case 44:
			case 47: return false;
		}
		return true;
	}
	function scanNextNonTrivia() {
		let result;
		do
			result = scanNext();
		while (result >= 12 && result <= 15);
		return result;
	}
	return {
		setPosition,
		getPosition: () => pos,
		scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
		getToken: () => token,
		getTokenValue: () => value,
		getTokenOffset: () => tokenOffset,
		getTokenLength: () => pos - tokenOffset,
		getTokenStartLine: () => lineStartOffset,
		getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
		getTokenError: () => scanError
	};
}
function isWhiteSpace(ch) {
	return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
	return ch === 10 || ch === 13;
}
function isDigit(ch) {
	return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes) {
	CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
	CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
	CharacterCodes[CharacterCodes["space"] = 32] = "space";
	CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
	CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
	CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
	CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
	CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
	CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
	CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
	CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
	CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
	CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
	CharacterCodes[CharacterCodes["a"] = 97] = "a";
	CharacterCodes[CharacterCodes["b"] = 98] = "b";
	CharacterCodes[CharacterCodes["c"] = 99] = "c";
	CharacterCodes[CharacterCodes["d"] = 100] = "d";
	CharacterCodes[CharacterCodes["e"] = 101] = "e";
	CharacterCodes[CharacterCodes["f"] = 102] = "f";
	CharacterCodes[CharacterCodes["g"] = 103] = "g";
	CharacterCodes[CharacterCodes["h"] = 104] = "h";
	CharacterCodes[CharacterCodes["i"] = 105] = "i";
	CharacterCodes[CharacterCodes["j"] = 106] = "j";
	CharacterCodes[CharacterCodes["k"] = 107] = "k";
	CharacterCodes[CharacterCodes["l"] = 108] = "l";
	CharacterCodes[CharacterCodes["m"] = 109] = "m";
	CharacterCodes[CharacterCodes["n"] = 110] = "n";
	CharacterCodes[CharacterCodes["o"] = 111] = "o";
	CharacterCodes[CharacterCodes["p"] = 112] = "p";
	CharacterCodes[CharacterCodes["q"] = 113] = "q";
	CharacterCodes[CharacterCodes["r"] = 114] = "r";
	CharacterCodes[CharacterCodes["s"] = 115] = "s";
	CharacterCodes[CharacterCodes["t"] = 116] = "t";
	CharacterCodes[CharacterCodes["u"] = 117] = "u";
	CharacterCodes[CharacterCodes["v"] = 118] = "v";
	CharacterCodes[CharacterCodes["w"] = 119] = "w";
	CharacterCodes[CharacterCodes["x"] = 120] = "x";
	CharacterCodes[CharacterCodes["y"] = 121] = "y";
	CharacterCodes[CharacterCodes["z"] = 122] = "z";
	CharacterCodes[CharacterCodes["A"] = 65] = "A";
	CharacterCodes[CharacterCodes["B"] = 66] = "B";
	CharacterCodes[CharacterCodes["C"] = 67] = "C";
	CharacterCodes[CharacterCodes["D"] = 68] = "D";
	CharacterCodes[CharacterCodes["E"] = 69] = "E";
	CharacterCodes[CharacterCodes["F"] = 70] = "F";
	CharacterCodes[CharacterCodes["G"] = 71] = "G";
	CharacterCodes[CharacterCodes["H"] = 72] = "H";
	CharacterCodes[CharacterCodes["I"] = 73] = "I";
	CharacterCodes[CharacterCodes["J"] = 74] = "J";
	CharacterCodes[CharacterCodes["K"] = 75] = "K";
	CharacterCodes[CharacterCodes["L"] = 76] = "L";
	CharacterCodes[CharacterCodes["M"] = 77] = "M";
	CharacterCodes[CharacterCodes["N"] = 78] = "N";
	CharacterCodes[CharacterCodes["O"] = 79] = "O";
	CharacterCodes[CharacterCodes["P"] = 80] = "P";
	CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
	CharacterCodes[CharacterCodes["R"] = 82] = "R";
	CharacterCodes[CharacterCodes["S"] = 83] = "S";
	CharacterCodes[CharacterCodes["T"] = 84] = "T";
	CharacterCodes[CharacterCodes["U"] = 85] = "U";
	CharacterCodes[CharacterCodes["V"] = 86] = "V";
	CharacterCodes[CharacterCodes["W"] = 87] = "W";
	CharacterCodes[CharacterCodes["X"] = 88] = "X";
	CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
	CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
	CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
	CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
	CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
	CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
	CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
	CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
	CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
	CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
	CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
	CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
	CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
	CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
	CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
	CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
	CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));
new Array(20).fill(0).map((_, index) => {
	return " ".repeat(index);
});
const maxCachedValues = 200;
new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\n" + " ".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r" + " ".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r\n" + " ".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\n" + "	".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r" + "	".repeat(index);
}), new Array(maxCachedValues).fill(0).map((_, index) => {
	return "\r\n" + "	".repeat(index);
});
//#endregion
//#region ../../node_modules/.pnpm/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions) {
	ParseOptions.DEFAULT = { allowTrailingComma: false };
})(ParseOptions || (ParseOptions = {}));
/**
* Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
* Therefore always check the errors list to find out if the input was valid.
*/
function parse$1(text, errors = [], options = ParseOptions.DEFAULT) {
	let currentProperty = null;
	let currentParent = [];
	const previousParents = [];
	function onValue(value) {
		if (Array.isArray(currentParent)) currentParent.push(value);
		else if (currentProperty !== null) currentParent[currentProperty] = value;
	}
	visit$1(text, {
		onObjectBegin: () => {
			const object = {};
			onValue(object);
			previousParents.push(currentParent);
			currentParent = object;
			currentProperty = null;
		},
		onObjectProperty: (name) => {
			currentProperty = name;
		},
		onObjectEnd: () => {
			currentParent = previousParents.pop();
		},
		onArrayBegin: () => {
			const array = [];
			onValue(array);
			previousParents.push(currentParent);
			currentParent = array;
			currentProperty = null;
		},
		onArrayEnd: () => {
			currentParent = previousParents.pop();
		},
		onLiteralValue: onValue,
		onError: (error, offset, length) => {
			errors.push({
				error,
				offset,
				length
			});
		}
	}, options);
	return currentParent[0];
}
/**
* Gets the JSON path of the given JSON DOM node
*/
function getNodePath$1(node) {
	if (!node.parent || !node.parent.children) return [];
	const path = getNodePath$1(node.parent);
	if (node.parent.type === "property") {
		const key = node.parent.children[0].value;
		path.push(key);
	} else if (node.parent.type === "array") {
		const index = node.parent.children.indexOf(node);
		if (index !== -1) path.push(index);
	}
	return path;
}
/**
* Evaluates the JavaScript object of the given JSON DOM node
*/
function getNodeValue$1(node) {
	switch (node.type) {
		case "array": return node.children.map(getNodeValue$1);
		case "object":
			const obj = Object.create(null);
			for (let prop of node.children) {
				const valueNode = prop.children[1];
				if (valueNode) obj[prop.children[0].value] = getNodeValue$1(valueNode);
			}
			return obj;
		case "null":
		case "string":
		case "number":
		case "boolean": return node.value;
		default: return;
	}
}
function contains(node, offset, includeRightBound = false) {
	return offset >= node.offset && offset < node.offset + node.length || includeRightBound && offset === node.offset + node.length;
}
/**
* Finds the most inner node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
*/
function findNodeAtOffset$1(node, offset, includeRightBound = false) {
	if (contains(node, offset, includeRightBound)) {
		const children = node.children;
		if (Array.isArray(children)) for (let i = 0; i < children.length && children[i].offset <= offset; i++) {
			const item = findNodeAtOffset$1(children[i], offset, includeRightBound);
			if (item) return item;
		}
		return node;
	}
}
/**
* Parses the given text and invokes the visitor functions for each object, array and literal reached.
*/
function visit$1(text, visitor, options = ParseOptions.DEFAULT) {
	const _scanner = createScanner$1(text, false);
	const _jsonPath = [];
	let suppressedCallbacks = 0;
	function toNoArgVisit(visitFunction) {
		return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
	}
	function toOneArgVisit(visitFunction) {
		return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
	}
	function toOneArgVisitWithPath(visitFunction) {
		return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
	}
	function toBeginVisit(visitFunction) {
		return visitFunction ? () => {
			if (suppressedCallbacks > 0) suppressedCallbacks++;
			else if (visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) === false) suppressedCallbacks = 1;
		} : () => true;
	}
	function toEndVisit(visitFunction) {
		return visitFunction ? () => {
			if (suppressedCallbacks > 0) suppressedCallbacks--;
			if (suppressedCallbacks === 0) visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
		} : () => true;
	}
	const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
	const disallowComments = options && options.disallowComments;
	const allowTrailingComma = options && options.allowTrailingComma;
	function scanNext() {
		while (true) {
			const token = _scanner.scan();
			switch (_scanner.getTokenError()) {
				case 4:
					handleError(14);
					break;
				case 5:
					handleError(15);
					break;
				case 3:
					handleError(13);
					break;
				case 1:
					if (!disallowComments) handleError(11);
					break;
				case 2:
					handleError(12);
					break;
				case 6:
					handleError(16);
					break;
			}
			switch (token) {
				case 12:
				case 13:
					if (disallowComments) handleError(10);
					else onComment();
					break;
				case 16:
					handleError(1);
					break;
				case 15:
				case 14: break;
				default: return token;
			}
		}
	}
	function handleError(error, skipUntilAfter = [], skipUntil = []) {
		onError(error);
		if (skipUntilAfter.length + skipUntil.length > 0) {
			let token = _scanner.getToken();
			while (token !== 17) {
				if (skipUntilAfter.indexOf(token) !== -1) {
					scanNext();
					break;
				} else if (skipUntil.indexOf(token) !== -1) break;
				token = scanNext();
			}
		}
	}
	function parseString(isValue) {
		const value = _scanner.getTokenValue();
		if (isValue) onLiteralValue(value);
		else {
			onObjectProperty(value);
			_jsonPath.push(value);
		}
		scanNext();
		return true;
	}
	function parseLiteral() {
		switch (_scanner.getToken()) {
			case 11:
				const tokenValue = _scanner.getTokenValue();
				let value = Number(tokenValue);
				if (isNaN(value)) {
					handleError(2);
					value = 0;
				}
				onLiteralValue(value);
				break;
			case 7:
				onLiteralValue(null);
				break;
			case 8:
				onLiteralValue(true);
				break;
			case 9:
				onLiteralValue(false);
				break;
			default: return false;
		}
		scanNext();
		return true;
	}
	function parseProperty() {
		if (_scanner.getToken() !== 10) {
			handleError(3, [], [2, 5]);
			return false;
		}
		parseString(false);
		if (_scanner.getToken() === 6) {
			onSeparator(":");
			scanNext();
			if (!parseValue()) handleError(4, [], [2, 5]);
		} else handleError(5, [], [2, 5]);
		_jsonPath.pop();
		return true;
	}
	function parseObject() {
		onObjectBegin();
		scanNext();
		let needsComma = false;
		while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
			if (_scanner.getToken() === 5) {
				if (!needsComma) handleError(4, [], []);
				onSeparator(",");
				scanNext();
				if (_scanner.getToken() === 2 && allowTrailingComma) break;
			} else if (needsComma) handleError(6, [], []);
			if (!parseProperty()) handleError(4, [], [2, 5]);
			needsComma = true;
		}
		onObjectEnd();
		if (_scanner.getToken() !== 2) handleError(7, [2], []);
		else scanNext();
		return true;
	}
	function parseArray() {
		onArrayBegin();
		scanNext();
		let isFirstElement = true;
		let needsComma = false;
		while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
			if (_scanner.getToken() === 5) {
				if (!needsComma) handleError(4, [], []);
				onSeparator(",");
				scanNext();
				if (_scanner.getToken() === 4 && allowTrailingComma) break;
			} else if (needsComma) handleError(6, [], []);
			if (isFirstElement) {
				_jsonPath.push(0);
				isFirstElement = false;
			} else _jsonPath[_jsonPath.length - 1]++;
			if (!parseValue()) handleError(4, [], [4, 5]);
			needsComma = true;
		}
		onArrayEnd();
		if (!isFirstElement) _jsonPath.pop();
		if (_scanner.getToken() !== 4) handleError(8, [4], []);
		else scanNext();
		return true;
	}
	function parseValue() {
		switch (_scanner.getToken()) {
			case 3: return parseArray();
			case 1: return parseObject();
			case 10: return parseString(true);
			default: return parseLiteral();
		}
	}
	scanNext();
	if (_scanner.getToken() === 17) {
		if (options.allowEmptyContent) return true;
		handleError(4, [], []);
		return false;
	}
	if (!parseValue()) {
		handleError(4, [], []);
		return false;
	}
	if (_scanner.getToken() !== 17) handleError(9, [], []);
	return true;
}
var ScanError;
(function(ScanError) {
	ScanError[ScanError["None"] = 0] = "None";
	ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
	ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
	ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
	ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
	ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
	ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind) {
	SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
	SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
	SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
	SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
	SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
	SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
	SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
	SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
	SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
	SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
	SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
	SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
	SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
	SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
	SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
	SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
	SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
/**
* Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
* Therefore, always check the errors list to find out if the input was valid.
*/
const parse = parse$1;
var ParseErrorCode;
(function(ParseErrorCode) {
	ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
	ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
	ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
	ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
	ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
	ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
	ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
	ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
	ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
	ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
	ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
	ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
	ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
	ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
	ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
	ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
let localeDict = {
	"maa.pi.entry.switch-controller": "更改控制器",
	"maa.pi.entry.switch-resource": "更改资源",
	"maa.pi.entry.add-task": "添加任务",
	"maa.pi.entry.move-task": "移动任务",
	"maa.pi.entry.remove-task": "删除任务",
	"maa.pi.entry.launch": "执行",
	"maa.pi.title.choose-action": "选择操作",
	"maa.pi.title.select-controller": "选择控制台",
	"maa.pi.title.select-device": "选择设备",
	"maa.pi.title.select-window": "选择窗口",
	"maa.pi.title.select-resource": "选择资源",
	"maa.pi.title.select-task": "选择任务",
	"maa.pi.title.select-option": "选择选项 {0}",
	"maa.pi.title.input-image": "输入图片名称",
	"maa.pi.title.init-config": "初始化配置",
	"maa.pi.item.empty-config": "空配置",
	"maa.pi.item.interactive-setup-config": "交互式设置配置",
	"maa.pi.error.cannot-find-controller": "无法找到控制器 {0}",
	"maa.pi.error.cannot-find-adb-for-controller": "无法找到控制器 {0} 的 Adb 配置",
	"maa.pi.error.cannot-find-win32-for-controller": "无法找到控制器 {0} 的 Win32 配置",
	"maa.pi.error.cannot-find-hwnd-for-controller": "无法找到控制器 {0} 的 Win32/Gamepad 配置的 hwnd, 请重新配置控制器",
	"maa.pi.error.cannot-find-playcover-for-controller": "无法找到控制器 {0} 的 PlayCover 配置",
	"maa.pi.error.cannot-find-address-for-controller": "无法找到控制器 {0} 的 PlayCover 配置的 address, 请重新配置控制器",
	"maa.pi.error.cannot-find-gamepad-for-controller": "无法找到控制器 {0} 的 Gamepad 配置",
	"maa.pi.error.cannot-find-resource": "无法找到资源 {0}",
	"maa.pi.error.cannot-find-task": "无法找到任务 {0}",
	"maa.pi.error.cannot-find-option": "无法找到选项组 {0}",
	"maa.pi.error.cannot-find-option-from": "无法找到选项组 {0}, 由 {1} {2} 引入",
	"maa.pi.error.cannot-resolve-option": "无法计算选项组 {0}",
	"maa.pi.error.cannot-find-case-for-option": "无法找到选项组 {1} 的值 {0}",
	"maa.pi.error.no-devices-found": "未找到设备",
	"maa.pi.error.no-win32-config-provided": "未提供 Win32 配置",
	"maa.pi.error.load-interface-failed": "无法加载interface",
	"maa.pi.error.generate-runtime-failed": "生成配置失败: {0}",
	"maa.pi.warning.require-admin": "控制器需要管理员权限",
	"maa.debug.init-controller-failed": "初始化控制器失败",
	"maa.debug.init-resource-failed": "初始化资源失败",
	"maa.debug.init-instance-failed": "初始化实例失败",
	"maa.debug.init-instance-succeeded": "初始化实例成功",
	"maa.debug.task-started": "任务开始 {0} - {1}",
	"maa.debug.task-finished": "任务完成 {0} - {1}",
	"maa.debug.task-failed": "任务失败 {0} - {1}",
	"maa.pipeline.codelens.launch": "执行",
	"maa.pipeline.codelens.refs": "{0} 引用",
	"maa.pipeline.codelens.eval-task": "计算任务",
	"maa.pipeline.codelens.eval-expr": "计算 {0}",
	"maa.pipeline.codelens.resource-switch": "切换",
	"maa.pipeline.codelens.resource-activated": "已激活",
	"maa.pipeline.codelens.resource-disabled": "已禁用",
	"maa.pipeline.codelens.language-switch": "切换",
	"maa.pipeline.codelens.language-activated": "已激活",
	"maa.pipeline.codeaction.extract-locale": "提取国际化文案",
	"maa.pipeline.codeaction.input-key": "输入国际化键",
	"maa.pipeline.codeaction.key-exists": "已存在",
	"maa.pipeline.codeaction.switch-to-v1": "切换到 V1",
	"maa.pipeline.codeaction.switch-to-v2": "切换到 V2",
	"maa.pipeline.error.no-interface-found": "未找到interface",
	"maa.pipeline.error.not-exists": "{0} 不存在",
	"maa.pipeline.error.conflict-task": "冲突任务 {0}, 上一个定义在 {1}",
	"maa.pipeline.error.unknown-task": "未知任务 {0}",
	"maa.pipeline.error.color-filter-invalid": "color_filter 任务 {0} 非法, 识别类型为 {1}",
	"maa.pipeline.error.unknown-image": "未知图片 {0}",
	"maa.pipeline.error.unknown-anchor": "未知Anchor {0}",
	"maa.pipeline.error.unknown-attr": "未知属性 {0}",
	"maa.pipeline.error.duplicate-next": "重复路由 {0}",
	"maa.pipeline.error.unknown-locale": "未知国际化键 {0}",
	"maa.pipeline.error.missing-locale": "国际化键 {0} 缺少语言 {1} 的翻译",
	"maa.pipeline.warning.mpe-config": "检测到 MPE 配置",
	"maa.pipeline.error.conflict-controller": "冲突控制器 {0}, 上一个定义在 {1}",
	"maa.pipeline.error.unknown-controller": "未知控制器 {0}",
	"maa.pipeline.error.conflict-resource": "冲突资源 {0}, 上一个定义在 {1}",
	"maa.pipeline.error.unknown-resource": "未知资源 {0}",
	"maa.pipeline.error.conflict-group": "冲突分组 {0}, 上一个定义在 {1}",
	"maa.pipeline.error.unknown-group": "未知分组 {0}",
	"maa.pipeline.error.conflict-option": "冲突选项 {0}, 上一个定义在 {1}",
	"maa.pipeline.error.unknown-option": "未知选项 {0}",
	"maa.pipeline.error.conflict-case": "选项 {1} 冲突选项值 {0}, 上一个定义在 {2}",
	"maa.pipeline.error.unknown-case": "选项 {1} 未知的选项值 {0}",
	"maa.pipeline.error.switch-name-invalid": "开关名无效, 应使用 Yes 或 No",
	"maa.pipeline.error.switch-missing-yes": "开关选项缺少 Yes",
	"maa.pipeline.error.switch-missing-no": "开关选项缺少 No",
	"maa.pipeline.error.switch-missing-all": "开关选项缺少 Yes 和 No",
	"maa.pipeline.warning.switch-name-should-fixed": "开关名应使用 Yes 或 No",
	"maa.pipeline.error.preset-type-error": "选项 {0} 预设的类型错误, 预期为 {1}",
	"maa.pipeline.error.unknown-entry-task": "未知入口任务 {0}",
	"maa.pipeline.error.override-unknown-task": "覆盖未知任务 {0}",
	"maa.pipeline.warning.image-path-backslash": "图片路径中包含反斜杠, 应使用正斜杠",
	"maa.pipeline.warning.image-path-dot-slash": "图片路径中包含 ./ , 应移除",
	"maa.pipeline.warning.image-path-missing-png": "图片路径不应省略.png",
	"maa.pipeline.warning.image-path-dynamic": "检测到动态图片路径",
	"maa.native.in-use": "正在使用",
	"maa.native.downloaded": "已下载",
	"maa.native.extension-expected-version": "插件预期版本",
	"maa.native.auto": "自动",
	"maa.native.use-extension-expected-version": "自动使用插件预期版本",
	"maa.native.switch-mirror": "切换下载源",
	"maa.native.switch-maafw": "切换 MaaFramework 版本",
	"maa.native.fetching-index": "获取索引中",
	"maa.native.download.preparing-folder": "准备目录中",
	"maa.native.download.downloading-scripts": "下载 MaaFramework {0} 脚本中",
	"maa.native.download.downloading-binary": "下载 MaaFramework {0} 二进制中",
	"maa.native.download.moving-folder": "移动目录中",
	"maa.native.loaded-ver": "加载版本",
	"maa.native.ext-int-ver": "接口版本",
	"maa.status.checking-task": "MaaSupport 检查任务中",
	"maa.status.not-loaded": "未加载",
	"maa.status.service-disconnected": "服务已断开",
	"maa.status.service-connected": "服务已连接",
	"maa.core.cannot-find-log": "无法找到日志文件: {0}",
	"maa.core.load-maafw-failed": "加载 MaaFramework 失败",
	"maa.crop.warning.no-resource": "未配置interface的资源, 将直接保存",
	"maa.screencap.no-runtime": "未找到可截图的运行资源项目",
	"maa.screencap.multiple-resources": "运行中的 Maa 实例属于多个资源项目，无法确定截图目标",
	"maa.screencap.failed": "截图失败",
	"maa.screencap.saved": "截图已保存: {0}",
	"maa.shortcut.no-target": "未激活全局快捷键目标，请在 Maa 控制面板中激活当前窗口",
	"maa.shortcut.no-instances": "当前快捷键目标窗口中没有运行中的 Maa 实例",
	"maa.eval.input-task": "输入任务",
	"maa.eval.eval-failed": "计算失败!",
	"maa.eval.loop-detected": "检测到循环",
	"maa.eval.cannot-find-task-base": "无法找到任务模板 {0}",
	"maa.eval.json.eval-task": "计算任务",
	"maa.eval.json.eval-list": "计算列表",
	"maa.eval.json.stripped": "已去重",
	"maa.eval.json.expanded-from": "展开自"
};
function t(key, ...args) {
	let str = localeDict[key];
	for (const [idx, arg] of Object.entries(args)) str = str.replaceAll(`{${idx}}`, arg);
	return str;
}
//#endregion
//#region ../../node_modules/.pnpm/@nekosu+maa-pipeline-manager@1.0.12/node_modules/@nekosu/maa-pipeline-manager/dist/logic/index.mjs
function buildControllerRuntime(data, config) {
	if (config.controller === "$fixed") {
		if (!config.vscFixed) return "No vscFixed for controller";
		if (!config.vscFixed.image) return "No vscFixed image for controller";
		return {
			name: "$fixed",
			type: "vscFixed",
			args: [config.vscFixed.image],
			display_raw: true
		};
	}
	const ctrlInfo = data.controller?.find((x) => x.name === config.controller);
	if (!ctrlInfo) return t("maa.pi.error.cannot-find-controller", config.controller ?? "<unknown>");
	const fixNum = (v, dic) => {
		if (typeof v === "number") return `${v}`;
		else if (dic && typeof v === "string" && v in dic) return dic[v];
		else return v;
	};
	const baseOption = {
		name: ctrlInfo.name,
		display_short_side: ctrlInfo.display_short_side,
		display_long_side: ctrlInfo.display_long_side,
		display_raw: ctrlInfo.display_raw,
		permission_required: ctrlInfo.permission_required,
		attach_resource_path: ctrlInfo.attach_resource_path?.map((x) => x.replaceAll("{PROJECT_DIR}", ".")),
		option: ctrlInfo.option
	};
	if (ctrlInfo.type === "Adb") {
		if (!config.adb) return t("maa.pi.error.cannot-find-adb-for-controller", config.controller ?? "<unknown>");
		return {
			type: "adb",
			args: [
				config.adb.adb_path,
				config.adb.address,
				config.adb.screencap,
				config.adb.input,
				JSON.stringify(config.adb.config)
			],
			...baseOption
		};
	} else if (ctrlInfo.type === "Win32") {
		if (!config.win32) return t("maa.pi.error.cannot-find-win32-for-controller", config.controller ?? "<unknown>");
		if (!config.win32.hwnd) return t("maa.pi.error.cannot-find-hwnd-for-controller", config.controller ?? "<unknown>");
		return {
			type: "win32",
			args: [
				config.win32.hwnd,
				fixNum(ctrlInfo.win32?.screencap, maa.Win32ScreencapMethod) ?? maa.Win32ScreencapMethod.FramePool,
				fixNum(ctrlInfo.win32?.mouse, maa.Win32InputMethod) ?? maa.Win32InputMethod.SendMessageWithCursorPos,
				fixNum(ctrlInfo.win32?.keyboard, maa.Win32InputMethod) ?? maa.Win32InputMethod.SendMessage
			],
			...baseOption
		};
	} else if (ctrlInfo.type === "PlayCover") {
		if (!config.playcover) return t("maa.pi.error.cannot-find-playcover-for-controller", config.controller ?? "<unknown>");
		if (!config.playcover?.address) return t("maa.pi.error.cannot-find-address-for-controller", config.controller ?? "<unknown>");
		return {
			type: "playcover",
			args: [config.playcover.address, "maa.playcover"],
			...baseOption
		};
	} else if (ctrlInfo.type === "Gamepad") {
		if (!config.gamepad) return t("maa.pi.error.cannot-find-gamepad-for-controller", config.controller ?? "<unknown>");
		if (!config.gamepad.hwnd) return t("maa.pi.error.cannot-find-hwnd-for-controller", config.controller ?? "<unknown>");
		return {
			type: "gamepad",
			args: [
				config.gamepad.hwnd,
				fixNum(ctrlInfo.gamepad?.screencap, maa.Win32ScreencapMethod) ?? maa.Win32ScreencapMethod.FramePool,
				fixNum(ctrlInfo.gamepad?.gamepad_type, maa.GamepadType) ?? maa.GamepadType.Xbox360
			],
			...baseOption
		};
	}
	return `Unknown controller type ${ctrlInfo?.type}`;
}
function buildResourceRuntime(data, config) {
	const resInfo = data.resource?.find((info) => info.name === config.resource);
	if (!resInfo) return t("maa.pi.error.cannot-find-resource", config.resource ?? "");
	const paths = (typeof resInfo.path === "string" ? [resInfo.path] : resInfo.path).map((x) => x.replaceAll("{PROJECT_DIR}", "."));
	return {
		name: resInfo.name,
		paths,
		option: resInfo.option
	};
}
function isStringArray(arr) {
	return Array.isArray(arr) && !arr.find((x) => typeof x !== "string");
}
function isStringStringObject(obj) {
	return typeof obj === "object" && obj !== null && !Object.values(obj).find((x) => typeof x !== "string");
}
function resolveOptionConfig(task, option, type) {
	const val = task.option?.[option];
	switch (type) {
		case "select":
		case "switch": return typeof val === "string" ? val : void 0;
		case "checkbox": return isStringArray(val) ? val : void 0;
		case "input": return isStringStringObject(val) ? val : void 0;
	}
}
function resolveSelect(task, option, optMeta) {
	const cfg = resolveOptionConfig(task, option, "select") ?? optMeta.default_case ?? optMeta.cases?.[0].name;
	if (!cfg) return null;
	return optMeta.cases?.find((x) => x.name === cfg) ?? null;
}
function resolveCheckbox(task, option, optMeta) {
	const cfg = resolveOptionConfig(task, option, "checkbox") ?? optMeta.default_case ?? [];
	return optMeta.cases?.filter((x) => cfg.includes(x.name)) ?? null;
}
function buildOption(data, task, ctrlRt, resRt) {
	const taskInfo = data.task?.find((x) => x.name === task.name);
	if (!taskInfo) return t("maa.pi.error.cannot-find-task", task.name);
	const pending = [];
	for (const opt of data.global_option ?? []) pending.push({
		name: opt,
		from: "global",
		origin: ""
	});
	for (const opt of ctrlRt.option ?? []) pending.push({
		name: opt,
		from: "controller",
		origin: ctrlRt.name
	});
	for (const opt of resRt.option ?? []) pending.push({
		name: opt,
		from: "resource",
		origin: resRt.name
	});
	for (const opt of taskInfo.option ?? []) pending.push({
		name: opt,
		from: "task",
		origin: taskInfo.name
	});
	const resolved = [];
	const resolvedOption = /* @__PURE__ */ new Set();
	while (pending.length > 0) {
		const opt = pending.shift();
		if (resolvedOption.has(opt.name)) continue;
		resolved.push(opt);
		resolvedOption.add(opt.name);
		const optMeta = data.option?.[opt.name];
		if (!optMeta) return t("maa.pi.error.cannot-find-option-from", opt.name, opt.from, opt.origin);
		if (ctrlRt.name !== "$fixed" && optMeta.controller && !optMeta.controller.includes(ctrlRt.name)) continue;
		if (optMeta.resource && !optMeta.resource.includes(resRt.name)) continue;
		if (!optMeta.type || optMeta.type === "select" || optMeta.type === "switch") {
			const caseMeta = resolveSelect(task, opt.name, optMeta);
			if (!caseMeta) return t("maa.pi.error.cannot-resolve-option", opt.name);
			for (const sub of caseMeta.option ?? []) pending.push({
				name: sub,
				from: "option",
				origin: opt.name
			});
		} else if (optMeta.type === "checkbox") {
			const caseMetas = resolveCheckbox(task, opt.name, optMeta);
			if (!caseMetas) return t("maa.pi.error.cannot-resolve-option", opt.name);
			for (const caseMeta of caseMetas) for (const sub of caseMeta.option ?? []) pending.push({
				name: sub,
				from: "option",
				origin: opt.name
			});
		}
	}
	return resolved;
}
function buildTask(data, task, ctrlRt, resRt) {
	const overrides = [(data.task?.find((x) => x.name === task.name))?.pipeline_override ?? {}];
	const options = buildOption(data, task, ctrlRt, resRt);
	if (typeof options === "string") return options;
	for (const opt of options) {
		const optMeta = data.option?.[opt.name];
		if (!optMeta) return t("maa.pi.error.cannot-find-option-from", opt.name, opt.from, opt.origin);
		if (!optMeta.type || optMeta.type === "select" || optMeta.type === "switch") {
			const caseMeta = resolveSelect(task, opt.name, optMeta);
			if (caseMeta?.pipeline_override) overrides.push(caseMeta.pipeline_override);
		} else if (optMeta.type === "checkbox") {
			const caseMetas = resolveCheckbox(task, opt.name, optMeta);
			for (const caseMeta of caseMetas ?? []) if (caseMeta?.pipeline_override) overrides.push(caseMeta.pipeline_override);
		} else if (optMeta.type === "input") {
			const vals = resolveOptionConfig(task, opt.name, "input") ?? {};
			const updateOverride = (v) => {
				if (Array.isArray(v)) return v.map(updateOverride);
				else if (typeof v === "object" && v !== null) {
					const obj = v;
					return Object.fromEntries(Object.entries(obj).map(([key, val]) => {
						return [key, updateOverride(val)];
					}));
				} else if (typeof v === "string") {
					let finalType = void 0;
					let result = v;
					for (const subOpt of optMeta.inputs ?? []) if (result.indexOf(`{${subOpt.name}}`) !== -1) {
						const expectType = subOpt.pipeline_type ?? "string";
						if (finalType && finalType !== expectType) throw "input type mismatch!";
						finalType = expectType;
						result = result.replaceAll(`{${subOpt.name}}`, vals[subOpt.name] ?? subOpt.default ?? "");
					}
					switch (finalType) {
						case "string": return result;
						case "int": return parseInt(result);
						case "bool": return result === "true";
					}
					return v;
				} else return v;
			};
			try {
				overrides.push(updateOverride(optMeta.pipeline_override ?? {}));
			} catch (err) {
				return `${err}`;
			}
		}
	}
	return overrides;
}
function buildTaskRuntime(data, config, ctrlRt, resRt) {
	const taskRt = { tasks: [] };
	for (const task of config.task ?? []) {
		const taskInfo = data.task?.find((x) => x.name === task.name);
		if (!taskInfo) return t("maa.pi.error.cannot-find-task", task.name);
		const info = buildTask(data, task, ctrlRt, resRt);
		if (typeof info === "string") return info;
		taskRt.tasks.push({
			name: task.name,
			entry: taskInfo.entry,
			pipeline_override: info
		});
	}
	return taskRt;
}
//#endregion
//#region src/runtime.ts
let native = null;
let session = null;
let paused = false;
let resume = null;
let stopped = false;
let runtimeStatus = "idle";
let currentTask = null;
let breakTasks = /* @__PURE__ */ new Set();
let toolSequence = 0;
const history = [];
const Jimp = createJimp({
	plugins: [methods],
	formats: [png]
});
function send(message) {
	process.stdout.write(`${JSON.stringify(message)}\n`);
}
function notify(event, params) {
	history.push({
		event,
		params
	});
	if (history.length > 500) history.splice(0, history.length - 500);
	send({
		event,
		params
	});
}
async function loadJson(file) {
	return parse(await fs$1.readFile(file, "utf8")) ?? {};
}
async function waitWhilePaused() {
	if (!paused) return;
	await new Promise((resolve) => {
		resume = resolve;
	});
}
async function pushNotify(message) {
	notify("tasker", message);
	if (typeof message === "object" && message !== null && "name" in message && typeof message.name === "string" && "msg" in message && typeof message.msg === "string" && message.msg.endsWith(".Starting") && breakTasks.has(message.name)) {
		paused = true;
		runtimeStatus = "paused";
		notify("breakpoint", {
			task: message.name,
			message: message.msg
		});
		notify("state", {
			status: runtimeStatus,
			reason: "breakpoint",
			task: message.name
		});
	}
	await waitWhilePaused();
}
function createController(runtime) {
	if (!native) throw new Error("MaaFramework is not loaded");
	switch (runtime.type) {
		case "adb": return new native.AdbController(...runtime.args);
		case "win32": return new native.Win32Controller(...runtime.args);
		case "playcover": return new native.PlayCoverController(...runtime.args);
		case "gamepad": return new native.GamepadController(...runtime.args);
		default: throw new Error(`Unsupported controller type ${runtime.type}`);
	}
}
async function destroySession() {
	if (!session) return;
	try {
		await (session.tasker.post_stop?.())?.wait?.();
	} catch {}
	await stopAgents();
	session.tasker.destroy();
	session.resource.destroy();
	session.controller.destroy();
	session = null;
	currentTask = null;
}
async function stopAgents() {
	const agents = session?.agents ?? [];
	if (session) session.agents = [];
	for (const agent of agents) {
		agent.client.destroy();
		if (agent.child.exitCode === null) agent.child.kill();
		notify("agent", {
			status: "stopped",
			identifier: agent.identifier
		});
	}
}
async function setupAgents(data, project, resource, resourcePaths, timeout) {
	if (!native) return [];
	const configs = Array.isArray(data.agent) ? data.agent : data.agent ? [data.agent] : [];
	const agents = [];
	for (const config of configs) {
		if (!config.child_exec) continue;
		const executable = config.child_exec.replaceAll("{PROJECT_DIR}", project);
		const client = new native.Client(config.identifier);
		const identifier = String(client.identifier ?? config.identifier ?? "maa-sublime-agent");
		const child = spawn(executable, (config.child_args ?? []).map((argument) => argument.replaceAll("{PROJECT_DIR}", project)).concat(identifier), {
			cwd: project,
			env: {
				...process.env,
				VSCODE_MAAFW_AGENT: "1",
				VSCODE_MAAFW_AGENT_ROOT: project,
				VSCODE_MAAFW_AGENT_RESOURCE: resourcePaths.map((relative) => path.resolve(project, relative)).join(path.delimiter),
				PI_INTERFACE_VERSION: "v2.5.0",
				PI_CLIENT_NAME: "SublimeText",
				PI_CLIENT_LANGUAGE: "en-us",
				PI_CLIENT_MAAFW_VERSION: String(native.Global.version ?? "")
			},
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		child.stdout?.setEncoding("utf8");
		child.stderr?.setEncoding("utf8");
		child.stdout?.on("data", (output) => notify("agentOutput", {
			identifier,
			category: "stdout",
			output
		}));
		child.stderr?.on("data", (output) => notify("agentOutput", {
			identifier,
			category: "stderr",
			output
		}));
		client.timeout = String(timeout);
		client.bind_resource(resource);
		const stopped = new Promise((resolve) => {
			child.once("exit", () => resolve(false));
			child.once("error", () => resolve(false));
		});
		if (!(await Promise.race([client.connect().then(() => true), stopped]) && client.connected && client.alive)) {
			client.destroy();
			if (child.exitCode === null) child.kill();
			throw new Error(`Cannot connect MaaFramework agent ${identifier}`);
		}
		client.timeout = String(Number.MAX_SAFE_INTEGER);
		agents.push({
			child,
			client,
			identifier
		});
		child.once("exit", (code) => notify("agent", {
			status: "exited",
			identifier,
			code
		}));
		notify("agent", {
			status: "connected",
			identifier,
			pid: child.pid
		});
	}
	return agents;
}
async function setup(params) {
	const modulePath = params.modulePath;
	const project = params.project;
	if (typeof modulePath !== "string" || typeof project !== "string") throw new Error("modulePath and project are required");
	await destroySession();
	await import(pathToFileURL(path.join(modulePath, "@maaxyz", "maa-node", "dist", "index-client.js")).href);
	native = globalThis.maa ?? null;
	if (!native) throw new Error("MaaFramework native module did not expose globalThis.maa");
	const global = native.Global;
	global.debug_mode = params.debugMode !== false;
	global.save_draw = params.saveDraw === true;
	if (typeof params.logDir === "string") global.log_dir = params.logDir;
	const data = await loadJson(await findInterface(project));
	const config = await loadJson(path.join(project, "config", "maa_pi_config.json"));
	if (!data.resource?.some((resource) => resource.name === config.resource)) config.resource = data.resource?.[0]?.name;
	const controllerRuntime = buildControllerRuntime(data, config);
	if (typeof controllerRuntime === "string") throw new Error(controllerRuntime);
	const resourceRuntime = buildResourceRuntime(data, config);
	if (typeof resourceRuntime === "string") throw new Error(resourceRuntime);
	const taskRuntime = buildTaskRuntime(data, config, controllerRuntime, resourceRuntime);
	if (typeof taskRuntime === "string") throw new Error(taskRuntime);
	const controller = createController(controllerRuntime);
	if (controllerRuntime.display_short_side) controller.screenshot_target_short_side = controllerRuntime.display_short_side;
	else if (controllerRuntime.display_long_side) controller.screenshot_target_long_side = controllerRuntime.display_long_side;
	else if (controllerRuntime.display_raw) controller.screenshot_use_raw_size = true;
	controller.add_sink?.((_id, message) => notify("controller", message));
	await controller.post_connection().wait();
	if (!controller.connected) {
		controller.destroy();
		throw new Error(`Cannot connect controller ${controllerRuntime.name}`);
	}
	const resource = new native.Resource();
	resource.add_sink?.((_id, message) => notify("resource", message));
	for (const relative of [...resourceRuntime.paths, ...controllerRuntime.attach_resource_path ?? []]) await resource.post_bundle(path.resolve(project, relative)).wait();
	const tasker = new native.Tasker();
	tasker.add_sink?.((_id, message) => pushNotify(message));
	tasker.add_context_sink?.((_id, message) => pushNotify(message));
	tasker.controller = controller;
	tasker.resource = resource;
	let agents = [];
	try {
		agents = await setupAgents(data, project, resource, resourceRuntime.paths, typeof params.agentTimeout === "number" ? params.agentTimeout : 3e4);
		for (const agent of agents) {
			agent.client.register_controller_sink(controller);
			agent.client.register_resource_sink(resource);
			agent.client.register_tasker_sink(tasker);
		}
	} catch (error) {
		for (const agent of agents) {
			agent.client.destroy();
			agent.child.kill();
		}
		tasker.destroy();
		resource.destroy();
		controller.destroy();
		throw error;
	}
	if (!tasker.inited) {
		for (const agent of agents) {
			agent.client.destroy();
			agent.child.kill();
		}
		tasker.destroy();
		resource.destroy();
		controller.destroy();
		throw new Error("Cannot initialize MaaFramework Tasker");
	}
	session = {
		controller,
		resource,
		tasker,
		tasks: taskRuntime.tasks,
		agents
	};
	history.length = 0;
	breakTasks = new Set(Array.isArray(params.breakTasks) ? params.breakTasks.filter((task) => typeof task === "string") : []);
	paused = false;
	stopped = false;
	runtimeStatus = "ready";
	return {
		controller: controllerRuntime.name,
		resource: resourceRuntime.name,
		tasks: taskRuntime.tasks.map((task) => task.name),
		agents: agents.map((agent) => agent.identifier),
		version: native.Global.version ?? null
	};
}
async function findInterface(project) {
	for (const name of ["interface.json", "interface.jsonc"]) {
		const file = path.join(project, name);
		try {
			await fs$1.access(file);
			return file;
		} catch {}
	}
	throw new Error(`Cannot find interface in ${project}`);
}
async function runQueue() {
	const current = session;
	if (!current) return;
	runtimeStatus = "running";
	notify("state", {
		status: runtimeStatus,
		queue: current.tasks.map((task) => task.name)
	});
	try {
		for (const task of current.tasks) {
			if (stopped || current !== session) break;
			await waitWhilePaused();
			currentTask = task.name;
			notify("task", {
				status: "starting",
				name: task.name,
				entry: task.entry
			});
			const result = await current.tasker.post_task(task.entry, task.pipeline_override).wait();
			notify("task", {
				status: result.succeeded ? "succeeded" : "failed",
				name: task.name,
				entry: task.entry
			});
			if (!result.succeeded) break;
		}
		currentTask = null;
		runtimeStatus = stopped ? "stopped" : "finished";
		notify("state", { status: runtimeStatus });
	} catch (error) {
		currentTask = null;
		runtimeStatus = "failed";
		notify("state", {
			status: runtimeStatus,
			error: String(error)
		});
	}
}
function imageDataUrl(value) {
	const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
	return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}
async function screenshotImage() {
	if (!session) throw new Error("MaaFramework runtime is not started");
	const image = await session.controller.post_screencap().wait().get();
	if (!image) throw new Error("Controller did not return a screenshot");
	return image;
}
async function screenshot() {
	return imageDataUrl(await screenshotImage());
}
async function cropScreenshot(rect) {
	if (!Array.isArray(rect) || rect.length !== 4 || !rect.every((value) => Number.isInteger(value))) throw new Error("Crop rectangle must contain four integers");
	const [x, y, width, height] = rect;
	if (x < 0 || y < 0 || width <= 0 || height <= 0) throw new Error("Crop rectangle must use non-negative coordinates and positive dimensions");
	const source = await screenshot();
	const image = await Jimp.read(Buffer.from(source.slice(source.indexOf(",") + 1), "base64"));
	if (x + width > image.width || y + height > image.height) throw new Error(`Crop rectangle exceeds screenshot bounds ${image.width}x${image.height}`);
	image.crop({
		x,
		y,
		w: width,
		h: height
	});
	return imageDataUrl(await image.getBuffer("image/png"));
}
function dataUrlImage(value) {
	if (typeof value !== "string" || !/^data:image\/png;base64,/.test(value)) throw new Error("Template must be a PNG data URL");
	const buffer = Buffer.from(value.slice(value.indexOf(",") + 1), "base64");
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
function recognitionResult(detail) {
	if (!detail) return null;
	const info = { ...detail };
	delete info.raw;
	delete info.draws;
	return {
		info,
		raw: detail.raw ? imageDataUrl(detail.raw) : null,
		draws: Array.isArray(detail.draws) ? detail.draws.map(imageDataUrl) : []
	};
}
async function runRecognition(task, image, override) {
	if (!session) throw new Error("MaaFramework runtime is not started");
	if (runtimeStatus === "running" || runtimeStatus === "paused") throw new Error("Wait for the task queue to finish before running a recognition test");
	const action = `@sublime/recognition/${++toolSequence}`;
	let result = null;
	session.resource.register_custom_action(action, async (self) => {
		result = await self.context.run_recognition(task, image, override);
		return true;
	});
	if (!(await session.tasker.post_task(action, { [action]: {
		action: "Custom",
		custom_action: action
	} }).wait()).succeeded) throw new Error("MaaFramework recognition test task failed");
	const formatted = recognitionResult(result);
	notify("recognitionTest", {
		task,
		result: formatted?.info ?? null
	});
	return formatted;
}
async function testOcr(params) {
	const image = await screenshotImage();
	const decoded = await Jimp.read(Buffer.from(image));
	const roi = Array.isArray(params.roi) ? params.roi : [
		0,
		0,
		decoded.width,
		decoded.height
	];
	return runRecognition("@sublime/ocr", image, { "@sublime/ocr": {
		recognition: "OCR",
		roi,
		only_rec: params.onlyRec === true
	} });
}
async function testTemplateMatch(params) {
	if (!session) throw new Error("MaaFramework runtime is not started");
	const image = await screenshotImage();
	const templateName = `@sublime/template/${++toolSequence}`;
	session.resource.override_image(templateName, dataUrlImage(params.template));
	return runRecognition("@sublime/template-match", image, { "@sublime/template-match": {
		recognition: "TemplateMatch",
		template: templateName,
		method: 5,
		threshold: .7,
		green_mask: false
	} });
}
async function testPipelineRecognition(params) {
	if (typeof params.task !== "string" || !params.task) throw new Error("Pipeline recognition task is required");
	return runRecognition(params.task, await screenshotImage());
}
function recognitionDetail(id) {
	if (!session || typeof id !== "string" && typeof id !== "number") return null;
	const detail = session.tasker.recognition_detail(String(id));
	if (!detail) return null;
	const info = { ...detail };
	delete info.raw;
	delete info.draws;
	return {
		info,
		raw: imageDataUrl(detail.raw),
		draws: detail.draws.map(imageDataUrl)
	};
}
async function handle(request) {
	switch (request.method) {
		case "start": {
			const result = await setup(request.params ?? {});
			runQueue();
			return result;
		}
		case "pause":
			paused = true;
			runtimeStatus = "paused";
			notify("state", { status: runtimeStatus });
			return true;
		case "continue":
			paused = false;
			resume?.();
			resume = null;
			runtimeStatus = "running";
			notify("state", { status: runtimeStatus });
			return true;
		case "stop":
			stopped = true;
			paused = false;
			resume?.();
			resume = null;
			if (session) await session.tasker.post_stop().wait();
			runtimeStatus = "stopped";
			notify("state", { status: runtimeStatus });
			return true;
		case "status": return {
			status: runtimeStatus,
			currentTask,
			queue: session?.tasks.map((task) => task.name) ?? [],
			agents: session?.agents.map((agent) => ({
				identifier: agent.identifier,
				pid: agent.child.pid,
				running: agent.child.exitCode === null
			})) ?? [],
			history
		};
		case "recognitionDetail": return recognitionDetail(request.params?.id);
		case "actionDetail": return session && request.params ? session.tasker.action_detail(String(request.params.id)) ?? null : null;
		case "nodeDetail": return session && typeof request.params?.task === "string" ? session.resource.get_node_data(request.params.task) ?? null : null;
		case "screenshot": return screenshot();
		case "cropScreenshot": return cropScreenshot(request.params?.rect);
		case "testOcr": return testOcr(request.params ?? {});
		case "testTemplateMatch": return testTemplateMatch(request.params ?? {});
		case "testPipelineRecognition": return testPipelineRecognition(request.params ?? {});
		case "setBreakpoints":
			breakTasks = new Set(Array.isArray(request.params?.tasks) ? request.params.tasks.filter((task) => typeof task === "string") : []);
			return [...breakTasks];
		case "stopAgents":
			await stopAgents();
			return true;
		case "shutdown":
			await destroySession();
			return true;
		default: throw new Error(`Unknown runtime method ${request.method}`);
	}
}
let input = "";
let queue = Promise.resolve();
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
	input += chunk;
	while (true) {
		const newline = input.indexOf("\n");
		if (newline < 0) return;
		const line = input.slice(0, newline).trim();
		input = input.slice(newline + 1);
		if (!line) continue;
		queue = queue.then(async () => {
			let request = null;
			try {
				request = JSON.parse(line);
				const result = await handle(request);
				send({
					id: request.id,
					result
				});
				if (request.method === "shutdown") process.exit(0);
			} catch (error) {
				send({
					id: request?.id ?? null,
					error: String(error)
				});
			}
		});
	}
});
process.on("SIGTERM", () => {
	destroySession().finally(() => process.exit(0));
});
//#endregion
export {};
