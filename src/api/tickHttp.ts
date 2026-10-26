/**
 * TickTick session HTTP helpers (#66 / TECH-API-1).
 * Extracted from Tick — behavior unchanged.
 */
import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from 'obsidian';
import log from '@/utils/logger';
import { noteHttpCall } from '@/sync/perf';

const _userAgent = window['navigator']['userAgent'];

export interface TickHttpHost {
	token: string;
	cookieHeader: string;
	cookies: string[];
	userAgent: string;
	deviceAgent: string;
	originUrl: string;
	lastError: unknown;
}

function httpStatusOf(error: unknown): number | undefined {
	if (!error || typeof error !== 'object') return undefined;
	const status = (error as { status?: unknown }).status;
	if (typeof status === 'number') return status;
	const nested = (error as { response?: { status?: unknown } }).response?.status;
	return typeof nested === 'number' ? nested : undefined;
}

export async function tickMakeRequest(host: TickHttpHost, operation: string, url: string, method: string, body: unknown = undefined): Promise<unknown> {

	host.lastError = undefined;
	let noted = false;
	try {
		let requestOptions: RequestUrlParam | undefined;
		if (operation == 'Login') {
			requestOptions = createLoginRequestOptions(host, url, body);
		} else {
			if (!host.cookieHeader) {
				host.cookieHeader = window.localStorage.getItem('TTS_Cookies') ?? '';
			}
			requestOptions = createRequestOptions(host, method, url, body);
		}
		const result = await requestUrl(requestOptions);
		noteHttpCall(operation, url, result?.status);
		noted = true;
		if (result.status != 200) {
			tickSetError(host, operation, result, null);
			return null;
		}
		host.cookies =
			(result.headers['set-cookie'] as unknown as string[]) ?? [];
		host.cookieHeader = host.cookies.join('; ') + ';';
		window.localStorage.setItem('TTS_Cookies', host.cookieHeader);
		// Comment create (and some DELETEs) return HTTP 200 with an empty body.
		// Accessing `result.json` then throws and used to look like a hard failure.
		const text = typeof result.text === 'string' ? result.text : '';
		if (!text.trim()) return {};
		try {
			return result.json;
		} catch {
			try {
				return JSON.parse(text);
			} catch (parseErr) {
				tickSetError(host, operation, result, parseErr);
				return null;
			}
		}
	} catch (error) {
		if (!noted) noteHttpCall(operation, url, httpStatusOf(error));
		tickSetError(host, operation, null, error);
		log.error(error);
		return null;
	}

}

export function createLoginRequestOptions(host: TickHttpHost, url: string, body: unknown) {
	const headers = {
		'Accept': '*/*',
		'x-device': host.deviceAgent,
		'Content-Type': 'application/json',
		'X-Requested-With': 'XMLHttpRequest',
		'User-Agent': host.userAgent,
		'Origin': host.originUrl,
		'Referer': `${host.originUrl}/signin`
	};

	const options: RequestUrlParam = {
		method: 'POST',
		url: url,
		headers: headers,
		contentType: 'application/json',
		body: body ? JSON.stringify(body) : undefined,
		throw: false
	};
	return options;
}

export function createRequestOptions(host: TickHttpHost, method: string, url: string, body: unknown) {
	let headers = {
		'Content-Type': 'application/json',
		'User-Agent': `${host.userAgent}`,
		'x-device': `${host.deviceAgent}`,
		'Cookie': 't=' + `${host.token}` + ';' + host.cookieHeader,
		't': `${host.token}`
	};
	const options: RequestUrlParam = {
		method: method,
		url: url,
		headers: headers,
		contentType: 'application/json',
		body: body ? JSON.stringify(body) : undefined,
		throw: false
	};
	return options;
}

export function tickSetError(host: TickHttpHost, operation: string,
				 response: RequestUrlResponse | null,
				 error: unknown) {
	if (response) {
		const statusCode = response.status;
		let errorMessage: unknown;
		if (statusCode == 429) {
			errorMessage = 'Error: ' + statusCode + ' TickTick reporting too many requests.';
			host.lastError = { operation, statusCode, errorMessage };
		} else {
			try {
				errorMessage = response.json;
			} catch {
				log.debug('Bad JSON response');
				log.debug('Trying Text.');
				try {
					errorMessage = extractTitleContent(response.text);
					log.error('Error: ', errorMessage);
				} catch {
					log.debug('Bad text response');
					log.debug('No error message.');
					errorMessage = 'No Error message received.';
				}
			}
			host.lastError = { operation, statusCode, errorMessage };
		}
	} else {
		let errorMessage: unknown;
		let statusCode = 666;

		if (error) {
			errorMessage = error;
		} else {
			errorMessage = 'Unknown Error';
		}
		log.error(operation, errorMessage);
		host.lastError = { operation, statusCode, errorMessage };
	}
}


export function extractTitleContent(inputString: string) {
	const startTag = '<title>';
	const endTag = '</title>';
	const startIndex = inputString.indexOf(startTag) + startTag.length;
	const endIndex = inputString.indexOf(endTag);

	return inputString.substring(startIndex, endIndex);
}

export function getTickUserAgent(): string {
	return _userAgent;
}

export function getTickXDevice(): string {
	const randomID = generateTickDeviceId();
	const randomVersion = 6070;

	let xDeviceObject = {
		platform: 'web',
		os: 'Windows 10',
		device: 'Firefox 117.0',
		name: '',
		version: randomVersion,
		id: randomID,
		channel: 'website',
		campaign: '',
		websocket: ''
	};

	return JSON.stringify(xDeviceObject);
}


export function generateTickDeviceId(): string {

	let result = window.localStorage.getItem('TTS_UniqueID');

	if (result) {
		if (result.includes('-')) {
			window.localStorage.removeItem('TTS_UniqueID');
			result = null;
		}
	}

	if (!result) {
		const prefix = '66';
		const length = 24;
		const characters = '0123456789abcdef';

		result = prefix;

		const remainingLength = length - prefix.length;

		for (let i = 0; i < remainingLength; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			result += characters[randomIndex];
		}
		window.localStorage.setItem('TTS_UniqueID', result);
	}

	return result;
}


