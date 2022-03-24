export default class Workout {
	date = new Date();
	id = Date.now() + '';
	clicks = 0;
	constructor(coords, distance, duration, editWorkout) {
		
		// Overwrite workout data
		if(editWorkout){
			this.id = editWorkout.id
			this.clicks = editWorkout.clicks
		}

		this.coords = coords; // [lat, lng]
		this.distance = distance; // in km
		this.duration = duration; // in min
	}

	_setDescription() {
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		console.log(this.date)
		this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()} at ${this.date.getMinutes()}`;
	}


	// method just to try inheritance
	clica() {
		this.clicks++;
	}
}
