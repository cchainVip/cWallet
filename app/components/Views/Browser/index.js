import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { View, Dimensions, Image, Text, StyleSheet  } from 'react-native';
import PropTypes from 'prop-types';
import { createNewTab, closeAllTabs, closeTab, setActiveTab, updateTab } from '../../../actions/browser';
import Tabs from '../../UI/Tabs';
import { getBrowserViewNavbarOptions } from '../../UI/Navbar';
import { captureScreen } from 'react-native-view-shot';
import Logger from '../../../util/Logger';
import Device from '../../../util/device';
import BrowserTab from '../BrowserTab';
import AppConstants from '../../../core/AppConstants';
import { colors, fontStyles, baseStyles } from '../../../styles/common';
 
import TabNavigator from 'react-native-tab-navigator';
import { strings } from '../../../../locales/i18n';
import { DeviceEventEmitter } from 'react-native';
 
const assetIcon = require('../../../images/tabs/asset.png');
const assetActiveIcon = require('../../../images/tabs/asset_active.png');
const ecologyIcon = require('../../../images/tabs/ecology.png');
const ecologyActiveIcon = require('../../../images/tabs/ecology_active.png');
const homeIcon = require('../../../images/tabs/home.png');
const homeActiveIcon = require('../../../images/tabs/home_active.png');
const findIcon = require('../../../images/tabs/find.png');
const findActiveIcon = require('../../../images/tabs/find_active.png');
const myIcon = require('../../../images/tabs/my.png');
const myActiveIcon = require('../../../images/tabs/my_active.png');
const leftIcon = require('../../../images/tabs/left.png');
const leftActiveIcon = require('../../../images/tabs/left_active.png');
const rightIcon = require('../../../images/tabs/right.png');
const rightActiveIcon = require('../../../images/tabs/right_active.png');
const refIcon = require('../../../images/tabs/ref.png');
const refActiveIcon = require('../../../images/tabs/ref_active.png');
const moreIcon = require('../../../images/tabs/more.png');
const moreActiveIcon = require('../../../images/tabs/more_active.png');
 
const margin = 16;
const THUMB_WIDTH = Dimensions.get('window').width / 2 - margin * 2;
const THUMB_HEIGHT = Device.isIos() ? THUMB_WIDTH * 1.81 : THUMB_WIDTH * 1.48;
 
const styles = StyleSheet.create({
    tabBarStyle: {
		height: 49,
		backgroundColor: colors.headerFooterBg,
        borderTopColor: 'black',
        borderTopWidth: 1,
    },
    tabText: {
        color: colors.fontSecondary,
        marginBottom: 6,
    },
    tabTextSel: {
        color: colors.blue,
        marginBottom: 6,
    },
    tabIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    tabIconSel: {
        width: 24,
        height: 24,
        borderRadius: 12,
        // color: colors.fontSecondary,
        // marginBottom: 6,
    },
	tabBadgeView:{
		width: 16,
		height: 16,
		backgroundColor: colors.blue,
		borderWidth: 1,
		marginLeft: 10,
		marginTop: 1,
		borderColor: '#FFF',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
	},
	tabBadgeText:{
		color: '#ffffff',
		fontSize: 8,
	},
});
 
/**
 * PureComponent that wraps all the browser
 * individual tabs and the tabs view
 */
class Browser extends PureComponent {
    static propTypes = {
        /**
         * react-navigation object used to switch between screens
         */
        navigation: PropTypes.object,
        /**
         * Function to create a new tab
         */
        createNewTab: PropTypes.func,
        /**
         * Function to close all the existing tabs
         */
        closeAllTabs: PropTypes.func,
        /**
         * Function to close a specific tab
         */
        closeTab: PropTypes.func,
        /**
         * Function to set the active tab
         */
        setActiveTab: PropTypes.func,
        /**
         * Function to set the update the url of a tab
         */
        updateTab: PropTypes.func,
        /**
         * Array of tabs
         */
        tabs: PropTypes.array,
        /**
         * ID of the active tab
         */
        activeTab: PropTypes.number,
        /**
         * Object that represents the current route info like params passed to it
         */
        route: PropTypes.object,
    };
    static navigationOptions = ({ navigation, route }) => getBrowserViewNavbarOptions(navigation, route);
 
    componentDidMount() {
        if (!this.props.tabs.length) {
            this.newTab();
        }
 
        const activeTab = this.props.tabs.find((tab) => tab.id === this.props.activeTab);
        if (activeTab) {
            this.switchToTab(activeTab);
        } else {
            this.props.tabs.length > 0 && this.switchToTab(this.props.tabs[0]);
        }
 
        const currentUrl = this.props.route.params?.newTabUrl;
        if (currentUrl) this.goToNewTab(currentUrl);
    }
 
    componentDidUpdate(prevProps) {
        const prevRoute = prevProps.route;
        const { route } = this.props;
 
        if (prevRoute && route) {
            const prevUrl = prevRoute.params?.newTabUrl;
            const currentUrl = route.params?.newTabUrl;
 
            if (currentUrl && prevUrl !== currentUrl) {
                this.goToNewTab(currentUrl);
            }
        }
    }
 
    goToNewTab = (url) => {
        this.newTab(url);
        this.props.navigation.setParams({
            ...this.props.route.params,
            newTabUrl: null,
        });
    };
 
    showTabs = async () => {
        try {
            const activeTab = this.props.tabs.find((tab) => tab.id === this.props.activeTab);
            await this.takeScreenshot(activeTab.url, activeTab.id);
        } catch (e) {
            Logger.error(e);
        }
 
        this.props.navigation.setParams({
            ...this.props.route.params,
            showTabs: true,
        });
    };
 
    hideTabsAndUpdateUrl = (url) => {
        this.props.navigation.setParams({
            ...this.props.route.params,
            showTabs: false,
            url,
            silent: false,
        });
    };
 
    closeAllTabs = () => {
        if (this.props.tabs.length) {
            this.props.closeAllTabs();
            this.props.navigation.setParams({
                ...this.props.route.params,
                url: null,
                silent: true,
            });
        }
    };
 
    newTab = (url) => {
        this.props.createNewTab(url || AppConstants.zhome);
        setTimeout(() => {
            const { tabs } = this.props;
            this.switchToTab(tabs[tabs.length - 1]);
        }, 100);
    };
 
    closeTab = (tab) => {
        const { activeTab, tabs } = this.props;
 
        // If the tab was selected we have to select
        // the next one, and if there's no next one,
        // we select the previous one.
        if (tab.id === activeTab) {
            if (tabs.length > 1) {
                tabs.forEach((t, i) => {
                    if (t.id === tab.id) {
                        let newTab = tabs[i - 1];
                        if (tabs[i + 1]) {
                            newTab = tabs[i + 1];
                        }
                        this.props.setActiveTab(newTab.id);
                        this.props.navigation.setParams({
                            ...this.props.route.params,
                            url: newTab.url,
                            silent: true,
                        });
                    }
                });
            } else {
                this.props.navigation.setParams({
                    ...this.props.route.params,
                    url: null,
                    silent: true,
                });
            }
        }
 
        this.props.closeTab(tab.id);
    };
 
    closeTabsView = () => {
        if (this.props.tabs.length) {
            this.props.navigation.setParams({
                ...this.props.route.params,
                showTabs: false,
                silent: true,
            });
        }
    };
 
    switchToTab = (tab) => {
        this.props.setActiveTab(tab.id);
        this.hideTabsAndUpdateUrl(tab.url);
        this.updateTabInfo(tab.url, tab.id);
    };
 
    renderTabsView() {
        const { tabs, activeTab } = this.props;
        const showTabs = this.props.route.params?.showTabs;
        if (showTabs) {
            return (
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    switchToTab={this.switchToTab}
                    newTab={this.newTab}
                    closeTab={this.closeTab}
                    closeTabsView={this.closeTabsView}
                    closeAllTabs={this.closeAllTabs}
                />
            );
        }
        return null;
    }
 
    updateTabInfo = (url, tabID) =>
        this.props.updateTab(tabID, {
            url,
        });
 
    takeScreenshot = (url, tabID) =>
        new Promise((resolve, reject) => {
            captureScreen({
                format: 'jpg',
                quality: 0.2,
                THUMB_WIDTH,
                THUMB_HEIGHT,
            }).then(
                (uri) => {
                    const { updateTab } = this.props;
 
                    updateTab(tabID, {
                        url,
                        image: uri,
                    });
                    resolve(true);
                },
                (error) => {
                    Logger.error(error, `Error saving tab ${url}`);
                    reject(error);
                }
            );
        });
 
    renderBrowserTabs = () =>
        this.props.tabs.map((tab) => (
            <BrowserTab
                id={tab.id}
                key={`tab_${tab.id}`}
                initialUrl={tab.url || AppConstants.zhome}
                updateTabInfo={this.updateTabInfo}
                showTabs={this.showTabs}
                newTab={this.newTab}
            />
        ));
 
    showWallet = () =>
        this.props.navigation.navigate('WalletTabHome');
 
    showMy = () =>
        this.props.navigation.openDrawer();
 
    render() {
		// zyl 是否显示发现底部的导航栏
        return false ? (<View style={baseStyles.flexGrow} testID={'browser-screen'}>
                    {this.renderBrowserTabs()}
                    {this.renderTabsView()}
                </View>) : (
            <TabNavigator tabBarStyle={styles.tabBarStyle}>
              <TabNavigator.Item
                selected={false}
				// selectedTitleStyle={styles.tabTextSel}
                // title={strings('zyl.wallet')}
				// titleStyle={styles.tabText}
                renderIcon={() => <Image style={styles.tabIcon} source={homeActiveIcon} />}
                renderSelectedIcon={() => <Image style={styles.tabIconSel} source={homeIcon} />}
                onPress={() => this.showWallet()}>
                <View />
              </TabNavigator.Item>
              <TabNavigator.Item
                selected={false}
				// selectedTitleStyle={styles.tabTextSel}
                // title={strings('zyl.wallet')}
				// titleStyle={styles.tabText}
                renderIcon={() => <Image style={styles.tabIcon} source={leftIcon} />}
                renderSelectedIcon={() => <Image style={styles.tabIconSel} source={leftActiveIcon} />}
                onPress={() => DeviceEventEmitter.emit('zoperation', "left")}>
                <View />
              </TabNavigator.Item>
              <TabNavigator.Item
                selected={false}
				// selectedTitleStyle={styles.tabTextSel}
                // title={strings('zyl.wallet')}
				// titleStyle={styles.tabText}
                renderIcon={() => <Image style={styles.tabIcon} source={rightIcon} />}
                renderSelectedIcon={() => <Image style={styles.tabIconSel} source={rightActiveIcon} />}
                onPress={() => DeviceEventEmitter.emit('zoperation', "right")}>
                <View />
              </TabNavigator.Item>
              <TabNavigator.Item
                selected={true}
				// selectedTitleStyle={styles.tabTextSel}
                // title={strings('zyl.find')}
				// titleStyle={styles.tabText}
                renderIcon={() => <Image style={styles.tabIcon} source={refActiveIcon} />}
			    renderSelectedIcon={() => <Image style={styles.tabIconSel} source={refIcon} />}
				// renderBadge={()=><View style={styles.tabBadgeView}><Text style={styles.tabBadgeText}>新</Text></View>}
                onPress={() => DeviceEventEmitter.emit('zoperation', "refresh")}>
                <View style={baseStyles.flexGrow} testID={'browser-screen'}>
                    {this.renderBrowserTabs()}
                    {this.renderTabsView()}
                </View>
              </TabNavigator.Item>
              <TabNavigator.Item
                selected={false}
				// selectedTitleStyle={styles.tabTextSel}
                // title={strings('tabMore')}
				// titleStyle={styles.tabText}
                renderIcon={() => <Image style={styles.tabIcon} source={assetActiveIcon} />}
                renderSelectedIcon={() => <Image style={styles.tabIconSel} source={assetIcon} />}
                onPress={() => DeviceEventEmitter.emit('zoperation', "home")}>
                <View />
              </TabNavigator.Item>
              <TabNavigator.Item
                selected={false}
				// selectedTitleStyle={styles.tabTextSel}
                // title={strings('tabMore')}
				// titleStyle={styles.tabText}
                renderIcon={() => <Image style={styles.tabIcon} source={moreIcon} />}
                renderSelectedIcon={() => <Image style={styles.tabIconSel} source={moreActiveIcon} />}
                onPress={() => DeviceEventEmitter.emit('zshowSwitch', "toggle")}>
                <View />
              </TabNavigator.Item>
            </TabNavigator>
        );
    }
}
 
const mapStateToProps = (state) => ({
    tabs: state.browser.tabs,
    activeTab: state.browser.activeTab,
});
 
const mapDispatchToProps = (dispatch) => ({
    createNewTab: (url) => dispatch(createNewTab(url)),
    closeAllTabs: () => dispatch(closeAllTabs()),
    closeTab: (id) => dispatch(closeTab(id)),
    setActiveTab: (id) => dispatch(setActiveTab(id)),
    updateTab: (id, url) => dispatch(updateTab(id, url)),
});
 
export default connect(mapStateToProps, mapDispatchToProps)(Browser);
