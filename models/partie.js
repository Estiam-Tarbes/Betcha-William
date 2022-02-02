const mongoose = require('mongoose');

let partie = new mongoose.Schema({
    name: { type: String, required: true },
    tour: {type: Number, required: true, default: 1},
    player_one: {
        id: { type: String, required: true },
        argent: { type: Number, required: true, default: 100 },
        mise: { type: Number, required: true, default: 0, min: 0, max: 100},
    },
    player_two: {
        id: { type: String, required: true },
        argent: { type: Number, default: 100 },
        mise: { type: Number, required: true, default: 0, min: 0, max: 100},
    },
    state: { type: String, enum: ['WAITING', 'ON_GOING', 'FINISHED'], default: 'WAITING' }
})

module.exports = partie;