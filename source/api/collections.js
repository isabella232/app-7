var collections = require('../models/collections');
var middleware = require('../middleware');

function collectionsService(app) {
	app.get('/api/collections',
		getCollections);

	app.post('/api/collections',
		middleware.validate('collection'),
		createCollection);

	app.put('/api/collections/:collection/item/:item',
		putToCollection);

	function getCollections(req, res, next) {
		collections.find(req.user, function (err, collections) {
			if (err) {
				return next(err);
			}

			res.json(collections);
		});
	}

	function createCollection(req, res, next) {
		collections.create(req.user, req.body, function (err, collection) {
			if (err) {
				return next(err);
			}

			res.json(collection, 201);
		});
	}

	function putToCollection(req, res, next) {
		var collection = req.params.collection;
		var item = req.params.item;

		collections.add(req.user, collection, item, function (err) {
			if (err) {
				return next(err);
			}

			res.send(201);
		});
	}
}

module.exports = collectionsService;