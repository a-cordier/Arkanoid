import { expect } from 'chai';
import create_amp from 'sound/synth/amp';
import create_audio_context from '../test-assets/audio-context_mock';
import sinon from 'sinon';

const context = {
	sandbox: sinon.sandbox.create()
};

describe('create_amp', () => {

	beforeEach(function() {
		context.audio_context =  create_audio_context(context.sandbox);
	});

	afterEach(() => {
		context.sandbox.restore();
	});

	it('returns an object', () => {
		const vca = create_amp(context);
		expect(vca).to.be.an('object');
	});

	it('returns an object with a input property', () => {
		const vca = create_amp(context);
		expect(vca).to.have.property('input');
	});

	it('returns an object with a gain property', () => {
		const vca = create_amp(context);
		expect(vca).to.have.property('gain');
	});

	it('returns an object with an input property', () => {
		const vca = create_amp(context);
		expect(vca).to.have.property('input');
	});

	it('returns an object with a connect method', () => {
		const vca = create_amp(context);
		expect(vca.connect).to.be.function;
	});


});
