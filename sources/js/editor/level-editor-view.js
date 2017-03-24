import MouseDropMark from 'editor/mouse-drop-mark';

import Coordinates from 'graphics/coordinates';
import Grid from 'graphics/grid';
import Scene from 'graphics/scene';

import {default as createBricks, Brick} from 'game/entities/brick';
import createWalls from 'game/entities/wall';

import Vector from 'maths/vector';

import {default as GraphicsView, MouseEventsHandler} from 'ui/graphics-view';
import {eventCoordinates} from 'ui/utils';

import is_nil from 'lodash.isnil';

const editor_bg_color = 'hsl(210, 50%, 13%)';
const editor_grid1_color = 'hsl(210, 50%, 25%)';
const editor_grid2_color = 'hsl(210, 50%, 33%)';

const size = {
	width: 224*2,
	height: 256*2
};
const scale = Math.round((size.width/14)/2);
const columns = size.width/scale;
const rows = size.height/scale;

function event_coordinate(el, ev) {
	const {x, y} = eventCoordinates(el, ev);
	return Vector({
		x: Math.floor(x/scale - .25),
		y: Math.floor(y/scale - .25)
	}).add({x: -1, y: -1});
}

export default function LevelEditorView(levelModel) {
	let brickColor;
	const editorSize = {
		width:  columns - 2,
		height: rows - 1
	};
	const editorScene = Scene(Coordinates(editorSize, {x: 1, y: 1}), {
		backgroundColor: editor_bg_color
	});
	const levelScene  = Scene(Coordinates(editorSize, {x: 0, y: 0}), {
		backgroundColor: 'rgba(0, 0, 0, 0)'
	});
	const mouseDropMark = MouseDropMark();
	const view = GraphicsView({
		canvas: document.querySelector('#screen'),
		model: levelModel,
		events: MouseEventsHandler({
			onClick(view, ev) {
				const el = view.el();
				const pos = event_coordinate(el, ev);
				if (levelScene.localRect().contains(pos)) {
					if (levelModel.containsBrickAt(pos)) {
						// Ok, we know that there is some bricks under the
						// drop mark. But we want to remove the one which is
						// exactly under the given position.
						const brick = levelModel.brickAt(pos);
						if (!is_nil(brick)) {
							levelScene.remove(brick);
							levelModel.remove(brick);
						}
					} else if (!is_nil(brickColor)) {
						const brick = Brick(pos, brickColor, 1);
						brick.setZIndex(1);
						levelScene.add(brick);
						levelModel.add(brick);
					}
				}
			},
			onMouseEnter(view) {
				mouseDropMark.show();
				view.render();
			},
			onMouseLeave(view) {
				mouseDropMark.hide();
				view.render();
			},
			onMouseMove(view, ev) {
				const el = view.el();
				mouseDropMark.setPosition(event_coordinate(el, ev));
				view.render();
			}
		})
	});
	mouseDropMark.hide();
	view
		.screen()
		.setSize(size)
		.setScale(scale)
		.add(...createWalls(columns - 1, rows))
		.add(
			editorScene
				.add(
					Grid( columns - 2,     rows - 1,    1, editor_grid1_color),
					Grid((columns - 2)/2, (rows - 1)/2, 2, editor_grid2_color),
					levelScene,
					mouseDropMark
				)
		);
	return Object.assign(view, {
		reset(level) {
			const bricks = createBricks(level);
			levelScene.reset(bricks);
			levelModel.reset(bricks);
		},
		setColor(color) {
			brickColor = color;
		}
	});
}