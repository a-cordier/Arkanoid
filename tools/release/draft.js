#! /usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');
const template = require('lodash.template');
const {die, done, fail, Git, log, makePromise, Package} = require('tools/common');

const git = Git(process.cwd());

const confirm_tmpl = template('Your repository will be modified:'
	+ '\n' + '  - version will be bumped to: <%= release %>'
	+ '\n' + '  - changelog changelogs/v<%= release %> will be drafted'
	+ '\n' + '  - branch release/v<%= release %> will be created'
);

const changelog_tmpl = template('---'
	+ '\n' + 'title: Release <%= releaseTag %>'
	+ '\n' + `date: ${(new Date()).toDateString()}`
	+ '\n' + '---'
	+ '\n' + '### Changes'
	+ '\n' + '- ...'
	+ '\n'
	+ '\n' + '### Fixes'
	+ '\n' + '- ...'
	+ '\n'
);

function check_branch() {
	return git.branch().then(branch => {
		if (branch !== 'develop') {
			throw new Error(
				'The current branch is not develop. '
				+ 'Checkout develop branch before anything.'
			);
		}
	});
}

function bump_version(pkg, {release}) {
	log('- bump package version ... ');
	pkg.version = release;
	return pkg.dump()
		.then(done)
		.catch(fail);
}

function create_changelog(pkg) {
	log('- creating changelog ... ');
	return makePromise(fs.writeFile, pkg.changelog, changelog_tmpl(pkg))
		.then(done)
		.catch(fail);
}

function create_branch(pkg, {release}) {
	const stage = () => {
		const files = ['package.json', pkg.changelog];
		log(`- stage ${files.join(', ')} ... `);
		return git.stage(...files).then(done);
	};

	const commit = () => {
		log('- commit release draft ... ');
		return git.commit(`draft release ${release}`).then(done);
	};

	const branch = () => {
		log(`- create branch ${pkg.releaseBranch} ... `);
		return git.branch(pkg.releaseBranch).then(done);
	};

	return Promise.resolve()
		.then(branch)
		.then(stage)
		.then(commit)
		.catch(fail);
}

function draft_release({pkg, draft}) {
	if (draft.confirmed) {
		return Promise.resolve()
			.then(() => bump_version(pkg, draft))
			.then(() => create_changelog(pkg, draft))
			.then(() => create_branch(pkg, draft));
	}
}

function prompt() {
	return Package().then(pkg => inquirer.prompt([{
		name: 'release',
		type: 'list',
		choices: ['major', 'minor', 'patch', 'custom'],
		default: 2,
		message: 'What kind of release are you drafting ?',
		filter: release => {
			if (release !== 'custom') {
				return pkg.bump(release);
			}
			return release;
		}
	}, {
		name: 'release',
		type: 'input',
		message: 'Please type the desired version you want: ',
		filter: version => pkg.bump(version),
		when: answers => answers.release === 'custom'
	}, {
		name: 'confirmed',
		type: 'confirm',
		default: false,
		message: answers => {
			const ui = new inquirer.ui.BottomBar();
			ui.log.write(chalk.yellow(confirm_tmpl(answers)));
			return 'Are you sure you want to continue ?';
		}
	}]).then(draft => ({draft, pkg})));
}

check_branch()
	.then(prompt)
	.then(draft_release)
	.catch(die);
