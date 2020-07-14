#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var cli_1 = __importDefault(require("cli"));
var swaggerToTs_1 = __importDefault(require("./swaggerToTs"));
cli_1.default.setApp('swagger-ts-api-gen', '1.0.0');
cli_1.default.enable('status', 'version', 'help');
var options = cli_1.default.parse({
    input: ['i', 'A file to process', 'file', false],
    output: ['o', 'An access time', 'file', false],
}, ['client']);
function readFile(file, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    return new Promise(function (resolve, reject) { return fs_1.default.readFile(file, { encoding: encoding }, function (err, buf) {
        if (err) {
            reject(err);
        }
        else {
            resolve(buf);
        }
    }); });
}
function writeFile(file, contents, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    return new Promise(function (resolve, reject) { return fs_1.default.writeFile(file, contents, { encoding: encoding }, function (err) {
        if (err) {
            reject(err);
        }
        else {
            resolve();
        }
    }); });
}
function run(inputFile, outputFile) {
    return __awaiter(this, void 0, void 0, function () {
        var fileContents, _a, _b, converted;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    cli_1.default.info('Creating typescript definitions based on swagger file...');
                    _b = (_a = JSON).parse;
                    return [4, readFile(inputFile)];
                case 1:
                    fileContents = _b.apply(_a, [_c.sent()]);
                    converted = swaggerToTs_1.default(fileContents);
                    return [4, writeFile(outputFile, converted)];
                case 2:
                    _c.sent();
                    cli_1.default.info('Done!');
                    return [2];
            }
        });
    });
}
switch (cli_1.default.command) {
    case 'client':
        run(options.input, options.output).catch(function (e) {
            console.error(e);
            cli_1.default.fatal('Unexpected error during generation of TS API: ' + e);
        });
        break;
    default:
        cli_1.default.fatal('Invalid command, expected: client, see --help');
        break;
}
//# sourceMappingURL=main.js.map