const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

function copyIcons() {
	// Copy any icons from nodes folders
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes');

	src(nodeSource).pipe(dest(nodeDestination));

	// Copy icons from icons folder to multiple locations for compatibility
	const iconSource = path.resolve('icons', '**', '*.{png,svg}');
	
	// Copy to dist/icons for one format
	src(iconSource).pipe(dest(path.resolve('dist', 'icons')));
	
	// Also copy to dist/nodes/JsonParser for file:jsonParser.svg reference
	return src(iconSource).pipe(dest(path.resolve('dist', 'nodes', 'JsonParser')));
}
