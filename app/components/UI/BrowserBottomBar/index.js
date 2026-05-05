import React, { PureComponent } from 'react';
import { Platform, TouchableOpacity, StyleSheet, Image } from 'react-native';
import PropTypes from 'prop-types';
import ElevatedView from 'react-native-elevated-view';
import TabCountIcon from '../Tabs/TabCountIcon';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import FeatherIcons from 'react-native-vector-icons/Feather';
import AnalyticsV2 from '../../../util/analyticsV2';
import Device from '../../../util/device';
import { colors } from '../../../styles/common';
import { getBrowserViewNavbarOptions } from '../../UI/Navbar';
const assetActiveIcon = require('../../../images/tabs/asset.png');
import { DeviceEventEmitter } from 'react-native';

const HOME_INDICATOR_HEIGHT = 18;
const defaultBottomBarPadding = 0;

const styles = StyleSheet.create({
	bottomBar: {
		backgroundColor: Device.isAndroid() ? colors.headerFooterBg : colors.grey000,
		flexDirection: 'row',
		paddingBottom:
			Device.isIphoneX() && Device.isIos()
				? defaultBottomBarPadding + HOME_INDICATOR_HEIGHT
				: defaultBottomBarPadding,
		flex: 0,
		borderTopWidth: Device.isAndroid() ? 0 : StyleSheet.hairlineWidth,
		borderColor: colors.grey200,
		justifyContent: 'space-between',
	},
	iconButton: {
		height: 24,
		width: 24,
		justifyContent: 'space-around',
		alignItems: 'center',
		textAlign: 'center',
		flex: 1,
		paddingTop: 30,
		paddingBottom: 30,
	},
	tabIcon: {
		marginTop: 0,
		width: 24,
		height: 24,
	},
	disabledIcon: {
		color: colors.fontSecondary,
	},
	icon: {
		width: 24,
		height: 24,
		color: colors.blue,
	},
});

/**
 * Browser bottom bar that contains icons for navigatio
 * tab management, url change and other options
 */
export default class BrowserBottomBar extends PureComponent {
	static propTypes = {
		/**
		 * Boolean that determines if you can navigate back
		 */
		canGoBack: PropTypes.bool,
		/**
		 * Boolean that determines if you can navigate forward
		 */
		canGoForward: PropTypes.bool,
		/**
		 * Function that allows you to navigate back
		 */
		goBack: PropTypes.func,
		/**
		 * Function that allows you to navigate forward
		 */
		goForward: PropTypes.func,
		/**
		 * Function that triggers the tabs view
		 */
		showTabs: PropTypes.func,
		/**
		 * Function that triggers the change url modal view
		 */
		showUrlModal: PropTypes.func,
		/**
		 * Function that redirects to the home screen
		 */
		goHome: PropTypes.func,
		/**
		 * Function that toggles the options menu
		 */
		toggleOptions: PropTypes.func,
		/**
		 * Function that go to the wallet screen
		 */
		goWallet: PropTypes.func,
		zrefresh: PropTypes.func,
	};

	static navigationOptions = ({ navigation, route }) => getBrowserViewNavbarOptions(navigation, route);

	trackSearchEvent = () => {
		AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.BROWSER_SEARCH_USED, {
			option_chosen: 'Browser Bottom Bar Menu',
			number_of_tabs: undefined,
		});
	};

	trackNavigationEvent = (navigationOption) => {
		AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.BROWSER_NAVIGATION, {
			option_chosen: navigationOption,
			os: Platform.OS,
		});
	};

	// zyl 精简底部导航时间监听处理
	componentDidMount() {
	    //收到监听
	    this.listener = DeviceEventEmitter.addListener('zshowSwitch', (msg) => {
			const { canGoBack, goBack, canGoForward, goForward, showTabs, goHome, showUrlModal, toggleOptions, goWallet, zrefresh } =
				this.props;
			if (msg === "toggle") {
				toggleOptions();
			} else if (msg === "refresh") {
				zrefresh();
			}
	    })
	}
	componentWillUnmount() {
	    //移除监听
	    if (this.listener) {
	      this.listener.remove();
	    }
	  }

	render() {
		const { canGoBack, goBack, canGoForward, goForward, showTabs, goHome, showUrlModal, toggleOptions, goWallet } =
			this.props;

		const onSearchPress = () => {
			showUrlModal();
			this.trackSearchEvent();
		};

		const onBackPress = () => {
			goBack();
			this.trackNavigationEvent('Go Back');
		};

		const onForwardPress = () => {
			goForward();
			this.trackNavigationEvent('Go Forward');
		};

		const onHomePress = () => {
			goHome();
			this.trackNavigationEvent('Go Home');
		};

		const onWalletPress = () => {
			goWallet();
		}

		const zshow = () => {
			return (
			<ElevatedView elevation={11} style={styles.bottomBar}>
				<TouchableOpacity
					onPress={onWalletPress}
					style={styles.iconButton}
					testID={'go-back-button'}
				>
					<Image style={styles.icon} size={24} source={assetActiveIcon} />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onBackPress}
					style={styles.iconButton}
					testID={'go-back-button'}
					disabled={!canGoBack}
				>
					<Icon name="angle-left" size={24} style={[styles.icon, !canGoBack ? styles.disabledIcon : {}]} />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onForwardPress}
					style={styles.iconButton}
					testID={'go-forward-button'}
					disabled={!canGoForward}
				>
					<Icon
						name="angle-right"
						size={24}
						style={[styles.icon, !canGoForward ? styles.disabledIcon : {}]}
					/>
				</TouchableOpacity>
				<TouchableOpacity onPress={onSearchPress} style={styles.iconButton} testID={'search-button'}>
					<FeatherIcons name="search" size={24} style={styles.icon} />
				</TouchableOpacity>

				<TouchableOpacity onPress={showTabs} style={styles.iconButton} testID={'show-tabs-button'}>
					<TabCountIcon style={styles.tabIcon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={onHomePress} style={styles.iconButton} testID={'home-button'}>
					<SimpleLineIcons name="home" size={22} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={toggleOptions} style={styles.iconButton} testID={'options-button'}>
					<MaterialIcon name="more-horiz" size={22} style={styles.icon} />
				</TouchableOpacity>
			</ElevatedView>
		)
		}

		// onPress={onWalletPress}
		return zshow;
	}
}
