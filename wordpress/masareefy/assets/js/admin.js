(function () {
	'use strict';

	var root = document.querySelector('.masareefy-admin');
	if (!root || typeof masareefyAdmin === 'undefined') {
		return;
	}

	var listEl = document.getElementById('masareefy-work-log-list');
	var form = document.getElementById('masareefy-work-log-form');
	var syncNotion = document.getElementById('masareefy-sync-notion');
	var syncGoogle = document.getElementById('masareefy-sync-google');
	var i18n = masareefyAdmin.i18n || {};

	function headers() {
		return {
			'Content-Type': 'application/json',
			'X-WP-Nonce': masareefyAdmin.nonce
		};
	}

	function api(path, options) {
		return fetch(masareefyAdmin.restUrl + path, options).then(function (response) {
			return response.json().then(function (data) {
				if (!response.ok) {
					throw new Error(data.message || i18n.error || 'Error');
				}
				return data;
			});
		});
	}

	function renderRows(rows) {
		if (!listEl) {
			return;
		}
		if (!rows || !rows.length) {
			listEl.innerHTML = '<p>' + (i18n.loading || 'No entries yet.') + '</p>';
			return;
		}
		var html = '<table class="widefat striped"><thead><tr>' +
			'<th>' + (i18n.date || 'Date') + '</th>' +
			'<th>' + (i18n.title || 'Title') + '</th>' +
			'<th>' + (i18n.status || 'Status') + '</th>' +
			'<th>' + (i18n.hours || 'Hours') + '</th>' +
			'<th>' + (i18n.description || 'Description') + '</th>' +
			'</tr></thead><tbody>';
		rows.forEach(function (row) {
			html += '<tr>' +
				'<td>' + escapeHtml(row.worked_on || '') + '</td>' +
				'<td>' + escapeHtml(row.title || '') + '</td>' +
				'<td>' + escapeHtml(row.status || '') + '</td>' +
				'<td>' + escapeHtml(row.hours != null ? String(row.hours) : '') + '</td>' +
				'<td>' + escapeHtml(row.description || '') + '</td>' +
				'</tr>';
		});
		html += '</tbody></table>';
		listEl.innerHTML = html;
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function loadWorkLog() {
		if (!listEl) {
			return;
		}
		listEl.textContent = i18n.loading || 'Loading…';
		api('work-log', { headers: headers() })
			.then(renderRows)
			.catch(function (error) {
				listEl.textContent = error.message;
			});
	}

	if (form) {
		form.addEventListener('submit', function (event) {
			event.preventDefault();
			var data = new FormData(form);
			api('work-log', {
				method: 'POST',
				headers: headers(),
				body: JSON.stringify({
					title: data.get('title'),
					description: data.get('description'),
					worked_on: data.get('worked_on'),
					hours: data.get('hours') ? Number(data.get('hours')) : null,
					status: data.get('status')
				})
			})
				.then(function () {
					form.reset();
					loadWorkLog();
				})
				.catch(function (error) {
					window.alert(error.message);
				});
		});
	}

	if (syncNotion) {
		syncNotion.addEventListener('click', function () {
			api('sync/notion/pull', { method: 'POST', headers: headers() })
				.then(function (result) {
					loadWorkLog();
					window.alert((i18n.saved || 'Imported') + ': ' + (result.imported || 0));
				})
				.catch(function (error) {
					window.alert(error.message);
				});
		});
	}

	if (syncGoogle) {
		syncGoogle.addEventListener('click', function () {
			api('sync/google/push', { method: 'POST', headers: headers() })
				.then(function () {
					window.alert(i18n.saved || 'Synced to Google Sheets');
				})
				.catch(function (error) {
					window.alert(error.message);
				});
		});
	}

	loadWorkLog();
}());
