define(function (require) {
	'use strict';

	var config = require('config').dashboard;

	function TwitterController ($scope, appLoader, api) {
		appLoader.loading();

		$scope.page = 1;
		$scope.haveMore = true;
		$scope.items = [];

		$scope.showMore = function () {
			appLoader.loading();
			$scope.page += 1;
			api.query({ resource: 'items', target: 'twitter', page: $scope.page }, function (res) {
				$scope.items = $scope.items.concat(res);
				$scope.haveMore = res.length === config.limit;
				appLoader.ready();
			});

		};

		$scope.title = 'Twitter';
		api.query({ resource: 'items', target: 'twitter', page: $scope.page }, function (res) {
			$scope.items = res;
			appLoader.ready();
		});
	}

	return TwitterController;
});