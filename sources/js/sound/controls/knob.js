import Vector from 'maths/vector';
import Rect from 'maths/rect';
import EventEmitter from 'events';
import _clamp from 'lodash.clamp';
import { completeAssign as assign } from 'common/utils';
import ui from 'sound/controls/ui';

const View = state => {

  const screen = state.screen;

	return  {
		render(){
			screen.clear();
			screen.brush = '#2f1f2f';
			screen.save();
			screen.pen =1;
			screen.pen = '#fff';
			screen.beginPath();
			screen.arc(state.pos, state.outer_radius, 0, 2*Math.PI);
			screen.drawPath();
			screen.beginPath();
			screen.arc(state.pos, state.inner_radius, 0, 2*Math.PI);
			screen.drawPath();
			screen.pen = state.cursor_width;
			screen.pen = '#aba1ab';
			screen.beginPath();
			screen.arc(state.pos, state.cursor_radius, state.curve_start, state.curve_end);
			screen.drawPath();
			screen.restore();
			screen.save();
			screen.pen = '#700a2b';
			screen.pen = state.cursor_width;
			screen.beginPath();
			screen.arc(state.pos, state.cursor_radius, state.curve_start, state.angle);
			screen.drawPath();
			screen.restore();
		}
	};
}

const Controller = state => {

	function update(value){
		state.angle = state.curve_length*value - Math.PI/2;
	}
  function clamp(angle) {
    return _clamp(angle, state.curve_start, state.curve_end);
  }

  function get_angle_increment(event){
    switch(event.type){
      case 'mousewheel':
        return Math.sign(event.wheelDelta)*(state.curve_length/state.inc_factor);
      case 'DOMMouseScroll':
        return Math.sign(-event.detail)*(state.curve_length/state.inc_factor);
      case 'mousemove':
        return Math.sign(-event.movementY)*(state.curve_length/state.inc_factor);
    }
  }

  function tweak(event) {
    state.angle = clamp(state.angle + get_angle_increment(event));
    state.emitter.emit('change', (state.angle + Math.PI/2)/state.curve_length);
  }

  ui.bind_events({
    element: state.element,
    mousewheel: event => {
      state.isActive = true;
      tweak(event);
    }
  });

	state.emitter.on('change', value => state.param.value = value);

	return {
		set param(audio_param){
			audio_param.on('change', value => {
				if(!state.isActive){
					update(value);
				}
			});
			update(audio_param.value);
			state.param = audio_param;
		},
		get param(){
			return state.param;
		}
	};
}

export default ({element, screen})=> {
  const padding = 5;
	let radius = screen.width/2 - padding;
	let pos = {
		x: radius + padding,
		y: radius + padding
	};
	const offset = 0;
	const curve_start = -Math.PI/2 + offset;
	const curve_end = 2*Math.PI - Math.PI/2 - offset;
	const curve_length = curve_end - curve_start;
	const inc_factor = 25;
	const state = {
		element,
    screen,
		pos,
		padding,
		curve_start,
		curve_end,
		curve_length,
		inc_factor,
		outer_radius: radius,
		inner_radius: radius - radius*.64,
		cursor_radius: radius - radius*.32,
		cursor_width: radius*.4,
		bbox: Rect(Vector(pos).add({x: -radius, y: -radius}), {width: radius*2, height: radius*2}),
		angle: curve_start,
		isActive: false,
		param: {
			value: 0,
			on: () => {}
		},
		emitter: new EventEmitter()
	};
	return assign(state.emitter, View(state), Controller(state));
}
