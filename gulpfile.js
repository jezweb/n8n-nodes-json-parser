const path = require('path');
const { task, src, dest } = require('gulp');
const fs = require('fs');

task('build:icons', copyIcons);

function copyIcons() {
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes');

	src(nodeSource).pipe(dest(nodeDestination));

	// Copy main icons from icons folder
	const iconSource = path.resolve('icons', '**', '*.{png,svg}');
	const iconDestination = path.resolve('dist', 'icons');

	return src(iconSource).pipe(dest(iconDestination));
}
