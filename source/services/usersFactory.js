var _ = require('underscore');
var bcrypt = require('bcrypt');
var ObjectId = require('mongojs').ObjectId;
var db = require('../utils/dbConnector.js').db;

// fields from user metadata of diff services
var metaFromServices = ['id', 'provider', 'username', 'displayName'];

/*
 * Looks for account in db with 2 keys 'id' and 'provider' type
 * Adds new user if does not exist
 * @param token {String} - service token
 * @param tokenSecret {String} - optional secret token
 * @param profile {Object} - passport.js data adopted from service API
 */

function findOrCreateByService (token, tokenSecret, profile, callback) {
	db.users.findOne({ id: profile.id, provider: profile.provider }, function (err, user) {
		if (err) {
			return callback(err);
		}

		if (user) {
			return callback(null, user);
		}

		saveServiceUser();
	});

	function saveServiceUser () {
		var meta = _.pick(profile, metaFromServices);
		var record = _.extend(meta, {
			token: token,
			tokenSecret: tokenSecret,
			registered: new Date(),
			firstTimeUser: true
		});

		db.users.save(record, function (err, saved) {
			if (err || !saved) {
				return callback(err);
			}
			callback(null, saved);
		});
	}
}

/*
 * Local register
 * @param data {Object} - request body, e.g. { username, email, password }
 */
function findOrCreateLocal (data, callback) {
	db.users.findOne({ username: data.username, provider: 'local' }, function (err, user) {
		if (err) {
			return callback(err);
		}

		if (user) {
			bcrypt.compare(data.password, user.password, function (err, res) {
				if (err) {
					return(err);
				}

				if (!res) {
					return callback('Username and password do not match!');
				}

				return callback(null, user);
			});
		} else {
			saveLocalUser();
		}

		function saveLocalUser() {
			var record = {
				username: data.username,
				email: data.email,
				provider: 'local',
				registered: new Date()
			};

			bcrypt.hash(data.password, 10, function (err, hash) {
				record.password = hash;
				db.users.save(record, function (err, saved) {
					if (err) {
						return callback(err);
					}

					callback(null, saved);
				});
			});
		}
	});
}

/*
 * Mandatory first time user setup
 * @param userId {Object} - mongo ObjectId()
 * @param data {Object} - form fields
 */
function accountSetup (userId, data, callback) {
	db.users.findOne({ _id: { $ne: ObjectId(userId) }, username: data.username }, function (err, user) {
		if (err) {
			return callback(err);
		}

		if (user) {
			return callback('User with such username already exists.');
		}

		db.users.update(
			{ _id: ObjectId(userId) },
			{ $set: { username: data.username, email: data.email }, $unset: { firstTimeUser: 1 }},
			updatedUser);

		function updatedUser (err, saved) {
			if (err || !saved) {
				return callback(err);
			}

			callback(null, saved);
		}
	});
}

module.exports = {
	findOrCreateLocal: findOrCreateLocal,
	findOrCreateByService: findOrCreateByService,
	accountSetup: accountSetup
};