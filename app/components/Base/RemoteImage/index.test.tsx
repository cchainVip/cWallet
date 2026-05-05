import React from 'react';
import { shallow } from 'enzyme';
import RemoteImage from './';

describe('RemoteImage', () => {
	it('should render correctly', () => {
		const wrapper = shallow(
			<RemoteImage
				source={{
					uri: `https://d2h8jcrpwh6m7t.cloudfront.net/tokens/dai.svg`,
				}}
			/>
		);
		expect(wrapper).toMatchSnapshot();
	});
});
