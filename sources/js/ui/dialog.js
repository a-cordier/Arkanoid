import {PushButton} from 'ui/button';
import Modal from 'ui/modal';
import View from 'ui/view';

import EventEmitter from 'events';

import identity from 'lodash.identity';
import is_nil from 'lodash.isnil';
import is_string from 'lodash.isstring';

export const DialogButtonRoles = {
	AcceptRole: 'ok',
	RejectRole: 'cancel',
	YesRole: 'yes',
	NoRole: 'no'
};

const ButtonLabels = {
	[DialogButtonRoles.AcceptRole]: 'Ok',
	[DialogButtonRoles.RejectRole]: 'Cancel',
	[DialogButtonRoles.YesRole]: 'Yes',
	[DialogButtonRoles.NoRole]: 'No'
};

export function DialogButtonBox(roles) {
	const buttons = roles.map(role => {
		return PushButton(is_string(role)
			? {role, label: ButtonLabels[role]}
			: role
		);
	});
	const emitter = new EventEmitter();

	for (let button of buttons) {
		button.on('click', role => emitter.emit('click', role));
	}

	return Object.assign(emitter, View({
		classNames: ['dialog-button-box'],
		tagName: 'div',
		onBeforeDestroy() {
			emitter.removeAllListeners();
		},
		onRender(el) {
			for (let button of buttons) {
				el.appendChild(button.render().el());
			}
		}
	}));
}

export default function Dialog({
	el = null,
	childView,
	classNames = [],
	buttons = [DialogButtonRoles.AcceptRole, DialogButtonRoles.RejectRole],
	aboutToClose = identity,
} = {}) {
	const parent_view_el = is_nil(el) ? document.querySelector('body') : el;
	const dialog_button_box = DialogButtonBox(buttons);
	const dialog = View({
		classNames: ['dialog'].concat(classNames),
		onBeforeDestroy() {
			dialog_button_box.destroy();
		},
		onRender(el) {
			el.appendChild(childView.render().el());
			el.appendChild(dialog_button_box.render().el());
		}
	});
	const modal = Modal({
		el: parent_view_el,
		childView: dialog
	});
	return {
		run() {
			modal.start();
			return new Promise(resolve => {
				dialog_button_box.once('click', role => {
					resolve(aboutToClose(role, childView));
					modal.stop();
				});
			});
		}
	};
}
