import { tokenListToArray } from './';
import { TokenListToken } from '@metamask/controllers';

const token: TokenListToken = {
	address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
	symbol: 'WBTC',
	decimals: 8,
	occurrences: 12,
	iconUrl: 'https://d2h8jcrpwh6m7t.cloudfront.net/tokens/wbtc.png',
	name: 'Wrapped Bitcoin'
};
const tokenListObject: { [address: string]: TokenListToken } = {
	'0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': token
};

describe('Token utils :: tokenListToArray', () => {
	it('should reduce object into array', () => {
		const tokenListArray = tokenListToArray(tokenListObject);
		expect(tokenListArray).toStrictEqual([token]);
	});
});
