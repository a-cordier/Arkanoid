const {execFile} = require('child_process');
const fs = require('fs');
const path = require('path');

const chalk = require('chalk');

const is_nil = require('lodash.isnil');
const constant = require('lodash.constant');
const times = require('lodash.times');

const semver = require('semver');

function pad(str, len, ch) {
	return times(Math.max(0, len - str.length), constant(ch)).join('') + str;
}
exports.pad = pad;

function dispatch(...fns) {
	return (...args) => {
		for (let fn of fns) {
			const v = fn(...args);
			if (!is_nil(v)) {
				return v;
			}
		}
	};
}
exports.dispatch = dispatch;

function make_promise(fn, ...args) {
	return new Promise((resolve, reject) => {
		fn(...args, (err, ...rest) => {
			if (err) {
				reject(err);
			} else {
				resolve(...rest);
			}
		});
	});
}
exports.makePromise = make_promise;

function stat(pathname) {
	return make_promise(fs.stat, pathname)
		.then(stats => ({path: pathname, stats}))
		.catch(err => {
			if (err.code === 'ENOENT') {
				return {path: pathname};
			}
			throw err;
		});
}
exports.stat = stat;

function make_directory(dirpath) {
	return make_promise(fs.mkdir, dirpath, 0o755)
		.then(() => dirpath);
}
exports.makeDirectory = make_directory;

function load_file(input_filename) {
	return make_promise(fs.readFile, input_filename);
}
exports.loadFile = load_file;

function dump_file(output_filename, data) {
	return make_promise(fs.writeFile, output_filename, data);
}
exports.dumpFile = dump_file;

function list_directory(dirname) {
	return make_promise(fs.readdir, dirname)
		.then(files => {
			return files
				.map(file => path.join(dirname, file))
				.filter(file => path.extname(file) === '.json');
		});
}
exports.listDirectory = list_directory;

function load_JSON(input_filename) {
	return load_file(input_filename).then(data => JSON.parse(data.toString()));
}
exports.loadJSON = load_JSON;


function dump_JSON(output_filename, obj) {
	return dump_file(output_filename, JSON.stringify(obj, null, '  '));
}
exports.dumpJSON = dump_JSON;

function Package() {
	return load_JSON('package.json').then(pkg => ({
		get version() {
			return pkg.version;
		},
		set version(v) {
			pkg.version = v;
		},
		get branch() {
			return `release/${pkg.version}`;
		},
		get changelog() {
			return `changelogs/${pkg.version}.md`;
		},
		bump: dispatch(
			release => {
				const version = semver.valid(release);
				if (!is_nil(version) && semver.gt(version, pkg.version)) {
					return version;
				}
			},
			release => semver.inc(pkg.version, release),
			release => {
				throw new Error(`Invalid version ${release}`);
			}
		),
		dump() {
			return dump_JSON('package.json', pkg);
		}
	}));
}
exports.Package = Package;

exports.git = {
	stage(...files) {
		return make_promise(execFile, 'git', ['add', ...files]);
	},
	branch(branch) {
		return make_promise(execFile, 'git', ['checkout', '-b', branch]);
	},
	commit(message) {
		return make_promise(execFile, 'git', ['commit', '-m', message]);
	}
}

function log(msg) {
	process.stderr.write(msg);
}
exports.log = log;

function die(err) {
	process.stderr.write(err.message);
	process.exit(1);
}
exports.die = die;

function done() {
	log(chalk.green('✔︎\n'));
}
exports.done = done;

function fail(err) {
	log(chalk.red('✘\n'));
	throw err;
}
exports.fail = fail;