(function () {
	'use strict';

	var root = document.querySelector('.masareefy-admin');
	if (!root || typeof masareefyAdmin === 'undefined') {
		return;
	}

	var button = root.querySelector('.masareefy-admin__cta');
	var status = root.querySelector('.masareefy-admin__status');

	if (!button || !status) {
		return;
	}

	button.addEventListener('click', function () {
		status.classList.add('is-visible');
		status.textContent = 'Loading…';

		fetch(masareefyAdmin.restUrl, {
			headers: {
				'X-WP-Nonce': masareefyAdmin.nonce
			}
		})
			.then(function (response) {
				return response.json().then(function (data) {
					return {
						ok: response.ok,
						data: data
					};
				});
			})
			.then(function (result) {
				status.textContent = JSON.stringify(result.data, null, 2);
			})
			.catch(function (error) {
				status.textContent = String(error);
			});
	});
}());
