import fs from 'fs';
import cli from 'cli';
import swaggerToTS from './swaggerToTs';

cli.setApp('swagger-ts-api-gen', '1.0.0')
cli.enable('status', 'version', 'help');
const options = cli.parse({
    input: [ 'i', 'A file to process', 'file', false],
    output: [ 'o', 'An access time', 'file', false],
}, ['client']);

function readFile(file: string, encoding: string = 'utf-8'): Promise<string> {
	return new Promise<string>((resolve, reject): void => fs.readFile(file, { encoding }, (err, buf) => {
		if (err) {
			reject(err);
		} else {
			resolve(buf);
		}
	}));
}
function writeFile(file: string, contents: string, encoding: string = 'utf-8'): Promise<void> {
	return new Promise<void>((resolve, reject): void => fs.writeFile(file, contents, { encoding }, (err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	}));
}


async function run(inputFile: string, outputFile: string) {
	cli.info('Creating typescript definitions based on swagger file...');

	const fileContents = JSON.parse(await readFile(inputFile));

	const converted = swaggerToTS(fileContents);

	await writeFile(outputFile, converted);
	cli.info('Done!');
}

switch (cli.command) {
	case 'client':
		run(options.input, options.output).catch(e => {
			console.error(e);
			cli.fatal('Unexpected error during generation of TS API: ' + e);
		});
		break;
	default:
		cli.fatal('Invalid command, expected: client, see --help');
		break;
}
