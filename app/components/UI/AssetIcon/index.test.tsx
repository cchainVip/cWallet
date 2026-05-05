import React from 'react';
import { shallow } from 'enzyme';
import AssetIcon from './';
const sampleLogo = 'https://d2h8jcrpwh6m7t.cloudfront.net/tokens/wbtc.png';

describe('AssetIcon', () => {
	it('should render correctly', () => {
		const wrapper = shallow(<AssetIcon logo={sampleLogo} />);
		expect(wrapper).toMatchSnapshot();
	});
});
