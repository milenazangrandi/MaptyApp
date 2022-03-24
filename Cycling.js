import Workout from './Workout';

export default class Cycling extends Workout {
	type = 'cycling';
	constructor(coords, distance, duration, elevationGain, editWorkout) {
		super(coords, distance, duration, editWorkout);
		this.elevationGain = elevationGain;
		this.calcSpeed();
        this._setDescription();
	}
	
	calcSpeed() {
		this.speed = this.distance / (this.duration / 60);
	}
}
