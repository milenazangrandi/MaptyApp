import Workout from './Workout';

export default class Running extends Workout {
	type = 'running';
	constructor(coords, distance, duration, cadence, editWorkout) {
		super(coords, distance, duration, editWorkout);
		this.cadence = cadence;
		this.calcPace();
		this._setDescription();
	}

	calcPace() {
		this.pace = this.duration / this.distance;
		return this.pace;
	}
}
