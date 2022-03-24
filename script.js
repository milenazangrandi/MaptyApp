'use strict';
import L, { bind } from 'leaflet';
import Running from './Running.js';
import Cycling from './Cycling.js';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const buttonDeleteAll = document.querySelector('#bt_deleteAll');
const bt_viewAllMarkers = document.querySelector('#bt_viewAllMarkers');

class App {
	#map;
	#mapZoomLevel = 12;
	#mapEvent;
	#workouts = [];
	#markers = [];
	#editWorkout;

	constructor() {
		// Get user's position
		this._getPosition();

		// Get saved workouts
		this._getLocalStorage();

		// Attatch event handlers
		form.addEventListener('submit', this._newWorkout.bind(this));
		inputType.addEventListener('change', this._toggleElevationField);
		containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
		buttonDeleteAll.addEventListener('click', this._deleteAllWorkouts.bind(this));
		bt_viewAllMarkers.addEventListener('click', this._displayAllMarkers.bind(this));
	}

	_getPosition() {
		if (navigator.geolocation) {
			const teste = navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
				alert('Could not get your position');
			});
		}
	}

	_loadMap(position) {
		const { latitude, longitude } = position.coords;

		this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
		L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.#map);
			
		// Handling clicks on map
		this.#map.on('click', this._showForm.bind(this));
		this.#workouts.forEach(work => this._renderWorkoutMarker(work));
		return position.coords
	}

	_showForm(evt) {
		// call from edit button
		if (!(evt.type === 'click')) this.#editWorkout = evt;
		// clear editWorkout
		else this.#editWorkout = '';

		// call click on map
		this.#mapEvent = evt;
		form.classList.remove('hidden');
		inputDistance.focus();
	}

	_hideForm() {
		inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
		form.classList.add('hidden');
	}

	_toggleElevationField() {
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
	}

	_newWorkout(evt) {
		if (buttonDeleteAll.disabled) buttonDeleteAll.disabled = false;
		const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
		const allPositive = (...inputs) => inputs.every(input => input > 0);

		evt.preventDefault();

		// Get data from form
		const type = inputType.value;
		const distance = +inputDistance.value; // convert to a number with '+' operator
		const duration = +inputDuration.value;
		let coords;

		if (this.#editWorkout) coords = this.#editWorkout.coords;
		else coords = Object.values(this.#mapEvent.latlng);
		let workout;

		// If workout running, create running object
		if (type === 'running') {
			const cadence = +inputCadence.value;
			// Check if data is valid
			if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
				return alert('Inputs have to be positive numbers');

			workout = new Running(coords, distance, duration, cadence, this.#editWorkout);
		}

		// If workout cyclng, create cycling object
		else {
			const elevation = +inputElevation.value;

			// Check if data is valid
			if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
				return alert('Inputs have to be positive numbers');
			workout = new Cycling(coords, distance, duration, elevation, this.#editWorkout);
		}

		if (this.#editWorkout) {
			this.#workouts.forEach((w, index, arr) => {
				if (w.id === this.#editWorkout.id) {
					// Replace workout in workouts array
					arr[index] = workout;

					// Remove marker
					this._removeMarker(arr[index].coords);

					// Remove DOM element
					let element = document.querySelector(`[data-id="${workout.id}"]`);
					element.remove();
				}
			});

			this.#editWorkout = '';
		} else this.#workouts.push(workout);

		// Render workout on map as marker
		this._renderWorkoutMarker(workout);

		// Render workout list
		this._renderWorkoutList(workout);

		// Hide form + clear input fields
		this._hideForm();

		// Set local storage to all workouts
		this._setLocalStorage();
	}

	_renderWorkoutMarker(workout) {
		// Display marker
		console.log('WORKOUT', workout);
		const marker = new L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`, {
				maxWidth: 250,
				minWidth: 100,
				autoClose: false,
				closeOnClick: false,
				className: `${workout.type}-popup`,
			})
			.openPopup();
		this.#markers.push(marker);
	}

	_renderWorkoutList(workout) {
		let html = `
		<div class ="workout-wrapper"  data-id="${workout.id}">
        <li class="workout workout--${workout.type}">
			<h2 class="workout__title">${workout.description}</h2>
			<div class="workout__details">
				<span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
				<span class="workout__value">${workout.distance}</span>
				<span class="workout__unit">km</span>
			</div>
			<div class="workout__details">
				<span class="workout__icon">⏱</span>
				<span class="workout__value">${workout.duration}</span>
				<span class="workout__unit">min</span>
			</div>`;

		if (workout.type === 'running')
			html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>`;
		else
			html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>`;

		html += `
		</li> 
			<button class = "close delete"></button>
			<button class = "close edit"></button>
		</div>`;

		form.insertAdjacentHTML('afterend', html);
		const bt_delete = document.querySelector(`.delete`);
		const bt_edit = document.querySelector(`.edit`);
		bt_delete.addEventListener('click', this._confirmBox.bind(this));
		bt_edit.addEventListener('click', this._editWorkout.bind(this));
	}

	_moveToPopup(evt) {
		const workoutElement = evt.target.closest('.workout-wrapper');
		if (!workoutElement) return;

		const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id);
		if (!workout) return;
		this.#map.setView(workout.coords, this.#mapZoomLevel, {
			Animation: true,
			pan: {
				duration: 1,
			},
		});
		// Using public interface
		console.dir(workout);
		workout.clica();
		this._setLocalStorage(); // guarda clicks counter
	}

	_setLocalStorage() {
		console.log('beforeeee', this.#workouts);
		localStorage.setItem('workouts', JSON.stringify(this.#workouts));
	}

	_getLocalStorage() {
		const data = JSON.parse(localStorage.getItem('workouts'));
		if (!data) {
			buttonDeleteAll.disabled = true;
			return;
		}
		console.log('before rebuild', data);
		this.#workouts = this._rebuildObjects(data);
		// this.#workouts = data; // this objects lost the inherance from workout class, so don't have access to click method anymore
		this.#workouts.forEach(w => this._renderWorkoutList(w));
	}

	_rebuildObjects(data) {
		console.log(data);
		let workouts = [];
		data.forEach(obj => {
			obj.type == 'running'
				? workouts.push(new Running(obj.coords, obj.distance, obj.duration, obj.cadence, obj))
				: workouts.push(new Cycling(obj.coords, obj.distance, obj.duration, obj.elevationGain, obj));
		});
		return workouts;
	}

	_editWorkout(evt) {
		const workout_id = evt.target.closest('.workout-wrapper').dataset.id;
		const editWorkout = this.#workouts.find(w => w.id === workout_id);
		console.log('edit', editWorkout);
		this._showForm(editWorkout);
	}

	_deleteWorkout(evt) {
		// Get div element
		const element = evt.target.closest('.workout-wrapper');

		// Get workout id
		const index = this.#workouts.findIndex(w => w.id === element.dataset.id);

		// Remove marker
		this._removeMarker(this.#workouts[index].coords);

		// Remove DOM element
		element.remove();

		// Delete workout
		this.#workouts.splice(index, 1);

		// Update local storage
		this._setLocalStorage();

		// Close if opened
		this._hideForm();
	}

	_removeMarker(workout) {
		const marker = this.#markers.find(marker => Object.values(marker.getLatLng()).every((val, index) => val === workout[index]));
		this.#map.removeLayer(marker);
	}

	_confirmBox(evt) {
		if (confirm('Are you sure?')) {
			this._deleteWorkout(evt);
			alert('Successful');
		} else return;
	}

	_deleteAllWorkouts() {
		localStorage.removeItem('workouts');
		location.reload();
	}

	_displayAllMarkers() {
		var group = new L.featureGroup(this.#markers);
		this.#map.fitBounds(group.getBounds());
	}
}

const app = new App();
window.app = app;
