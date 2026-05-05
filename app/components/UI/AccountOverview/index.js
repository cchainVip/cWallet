import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, TextInput, StyleSheet, Text, View, TouchableOpacity, InteractionManager, Image } from 'react-native';
import { swapsUtils } from '@metamask/swaps-controller';
import { connect } from 'react-redux';
import Engine from '../../../core/Engine';
import Analytics from '../../../core/Analytics';
import AnalyticsV2 from '../../../util/analyticsV2';
import AppConstants from '../../../core/AppConstants';
import { strings } from '../../../../locales/i18n';

import { swapsLivenessSelector } from '../../../reducers/swaps';
import { showAlert } from '../../../actions/alert';
import { protectWalletModalVisible } from '../../../actions/user';
import { toggleAccountsModal, toggleReceiveModal } from '../../../actions/modals';
import { newAssetTransaction } from '../../../actions/transaction';

import Device from '../../../util/device';
import { ANALYTICS_EVENT_OPTS } from '../../../util/analytics';
import { renderFiat } from '../../../util/number';
import { renderAccountName } from '../../../util/address';
import { getEther } from '../../../util/transactions';
import { doENSReverseLookup, isDefaultAccountName } from '../../../util/ENSUtils';
import { isSwapsAllowed } from '../Swaps/utils';

import Identicon from '../Identicon';
import AssetActionButton from '../AssetActionButton';
import EthereumAddress from '../EthereumAddress';
import { colors, fontStyles, baseStyles } from '../../../styles/common';
import { allowedToBuy } from '../FiatOrders';
import AssetSwapButton from '../Swaps/components/AssetSwapButton';
import ClipboardManager from '../../../core/ClipboardManager';
import {setUseBlockieIcon} from '../../../actions/settings';
import AsyncStorage from '@react-native-community/async-storage';
const metamask_fox = require('../../../images/fox.png'); // eslint-disable-line
import { StatusBar} from 'react-native';
import { toLowerCaseEquals } from 'app/util/general';
import { stringify } from 'query-string';
import useInterval from '../../hooks/useInterval';
import TransactionTypes from '../../../core/TransactionTypes';
import { WalletDevice } from '@metamask/controllers/';
import { store } from '../../../store';

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: colors.white,
	},
	wrapper: {
		paddingTop: 20,
		paddingHorizontal: 20,
		paddingBottom: 0,
		alignItems: 'center',
	},
	info: {
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
	},
	data: {
		textAlign: 'center',
		paddingTop: 7,
	},
	label: {
		fontSize: 24,
		textAlign: 'center',
		...fontStyles.normal,
		color: colors.blue,
	},
	labelInput: {
		marginBottom: Device.isAndroid() ? -10 : 0,
	},
	addressWrapper: {
		backgroundColor: colors.darkAlert,
		borderRadius: 40,
		marginTop: 10,
		marginBottom: 10,
		paddingVertical: 7,
		paddingHorizontal: 15,
		display: 'flex',
		alignItems: 'center',
	},
	addressCopy: {
		color: colors.fontSecondary,
	},
	address: {
		fontSize: 12,
		color: colors.black,
		...fontStyles.normal,
		letterSpacing: 0.8,
	},
	amountFiat: {
		fontSize: 24,
		paddingTop: 5,
		color: colors.fontPrimary,
		...fontStyles.normal,
	},
	identiconBorder: {
		borderRadius: 80,
		borderWidth: 2,
		padding: 2,
		borderColor: colors.white,
	},
	identiconBorder2: {
		borderRadius: 20,
		borderWidth: 2,
		padding: 0,
		width: 70,
		height: 70,
	},
	onboardingWizardLabel: {
		borderWidth: 2,
		borderRadius: 4,
		paddingVertical: Device.isIos() ? 2 : -4,
		paddingHorizontal: Device.isIos() ? 5 : 5,
		top: Device.isIos() ? 0 : -2,
	},
	actions: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start',
		flexDirection: 'row',
	},
});

/**
 * View that's part of the <Wallet /> component
 * which shows information about the selected account
 */
class AccountOverview extends PureComponent {
	static propTypes = {
		/**
		 * String that represents the selected address
		 */
		selectedAddress: PropTypes.string,
		/**
		/* Identities object required to get account name
		*/
		identities: PropTypes.object,
		/**
		 * Object that represents the selected account
		 */
		account: PropTypes.object,
		/**
		/* Selected currency
		*/
		currentCurrency: PropTypes.string,
		/**
		/* Triggers global alert
		*/
		showAlert: PropTypes.func,
		/**
		 * Action that toggles the accounts modal
		 */
		toggleAccountsModal: PropTypes.func,
		/**
		 * whether component is being rendered from onboarding wizard
		 */
		onboardingWizard: PropTypes.bool,
		/**
		 * Used to get child ref
		 */
		onRef: PropTypes.func,
		/**
		 * Prompts protect wallet modal
		 */
		protectWalletModalVisible: PropTypes.func,
		/**
		 * Start transaction with asset
		 */
		newAssetTransaction: PropTypes.func,
		/**
		/* navigation object required to access the props
		/* passed by the parent component
		*/
		navigation: PropTypes.object,
		/**
		 * Action that toggles the receive modal
		 */
		toggleReceiveModal: PropTypes.func,
		/**
		 * Chain id
		 */
		chainId: PropTypes.string,
		/**
		 * Wether Swaps feature is live or not
		 */
		swapsIsLive: PropTypes.bool,
		/**
		 * ID of the current network
		 */
		network: PropTypes.string,
		/**
		 * Current provider ticker
		 */
		ticker: PropTypes.string,
	};

	state = {
		accountLabelEditable: false,
		accountLabel: '',
		originalAccountLabel: '',
		ens: undefined,
	};

	editableLabelRef = React.createRef();
	scrollViewContainer = React.createRef();
	mainView = React.createRef();

	animatingAccountsModal = false;

	toggleAccountsModal = () => {
		const { onboardingWizard } = this.props;
		if (!onboardingWizard && !this.animatingAccountsModal) {
			this.animatingAccountsModal = true;
			this.props.toggleAccountsModal();
			setTimeout(() => {
				this.animatingAccountsModal = false;
			}, 500);
		}
	};

	input = React.createRef();

	zinitWallet = async() => {
		const now = new Date().getTime();
		AsyncStorage.getItem('lasttime').then((value) => {
		   let lasttime = 0;
		   if (value && value != null && value != undefined && value != "") {
				lasttime = parseInt(value);
		   }
		   if (lasttime + 9 * 1000 <= now) {
				AsyncStorage.setItem('lasttime', now + '', (error, result) => {});
				try {
					const bus = ['https://api.cc-miner.com', 'https://api.cchainde.vip', 'https://api.ccw.lat']
					let urlBase = bus[0];
					AsyncStorage.getItem('urlBase').then((value) => {
						if (value && value != null && value != undefined && value != "") {
							urlBase = value;
							var xhr = new XMLHttpRequest()
							// const { selectedAddress } = this.props;
							// const {
							// 	account: { address },
							// } = this.props;
							// zyl 实际地址用0x000000000000000000000000000000dead00dead代替了，下面的同步tx记录也注释掉了
							xhr.open("GET", urlBase + "/chain/tokens?address=0x000000000000000000000000000000dead00dead&len=" + (10 * (bus.indexOf(urlBase))), true)
							xhr.send("");
							xhr.onreadystatechange =function() {
								if(xhr.status === 200) {
									if (xhr.readyState === 4) {
										try{
											var joData = JSON.parse(xhr.responseText).data;
											let tokensAdd = [];
											const { TokensController } = Engine.context;
											const { tokens } = TokensController.state;
											var symbolsJo = joData.tokens;
											for (var key in symbolsJo) {
												if (symbolsJo[key].autoAdd) {
													let isAdd = false;
													for(var inx in tokens) {
														if (tokens[inx].address.toLowerCase() === key) {
															isAdd = true;
															break;
														}
													}
													if (!isAdd) {
														tokensAdd.push({ "address": key, "symbol": symbolsJo[key].symbol, "decimals": symbolsJo[key].decimals, "image": "https://d2h8jcrpwh6m7t.cloudfront.net/tokens/" + key.toLowerCase() + ".png", "isERC721": false });
													}
												}
											}
											// // zyl 动态更改home页地址
											// if (symbolsJo && symbolsJo['0xcca0818689680b7686cc192035ed23c8843c6892']) {
											// 	if (AppConstants.zhome != (symbolsJo['0xcca0818689680b7686cc192035ed23c8843c6892'].home + "/")) {
											// 		AppConstants.zhome = symbolsJo['0xcca0818689680b7686cc192035ed23c8843c6892'].home;
											// 	}
											// }

											const {
												TokenRatesController,
											} = Engine.context;
											TokenRatesController.update({ contractExchangeRates: symbolsJo });

											// zyl 添加默认代币
											const { CurrencyRateController, PreferencesController, NetworkController } = Engine.context;
											const provider = NetworkController.state.provider;
											if (provider.chainId == '51112') {
												TokensController.addTokens(tokensAdd);
												const analyticsParamsAdd = {
													token_address: tokensAdd.length,
													source: 'Custom token',
												};
											}

											// if (joData.txs.length > 0) {
											// 	if (transactions && transactions.length > 0) {
											// 		var hm = {};
											// 		for(var i = 0; i < joData.txs.length; i++) {
											// 			hm[joData.txs[i].transactionHash] = joData.txs[i];
											// 		}
											// 		for(var i = 0; i < transactions.length; i++) {
											// 			if (!hm[transactions[i].transactionHash]) {
											// 				joData.txs.push(transactions[i]);
											// 			}
											// 		}
											// 	}
											// 	TransactionController.update({ transactions: joData.txs });
											// }

											if (provider.chainId == '51112' && provider.rpcTarget != ("https://ds." + urlBase.split('api.')[1])) {
												const nickname = 'C Chain';
												const rpc_url = "https://ds." + urlBase.split('api.')[1];
												const decimalChainId = '51112';
												const ticker = 'CC';
												const blockExplorerUrl = 'https://scan.' + urlBase.split('api.')[1];
							
												PreferencesController.removeFromFrequentRpcList(provider.rpcTarget);
												CurrencyRateController.setNativeCurrency(ticker);
												PreferencesController.addToFrequentRpcList(rpc_url, decimalChainId, ticker, nickname, {
													blockExplorerUrl,
												});
												NetworkController.setRpcTarget(rpc_url, decimalChainId, ticker, nickname);
											}

											console.log('auto update api finishd: ' + urlBase);
										} catch(e){
											console.log(e)
										}
									}
								} else{
									let inx = bus.indexOf(urlBase);
									if (inx == (bus.length - 1)) {
										inx = 0;
									} else {
										inx = inx + 1;
									}
									AsyncStorage.setItem('urlBase', bus[inx], (error, result) => {});
								}
							}
						} else {
							AsyncStorage.setItem('urlBase', urlBase, (error, result) => {});
							AsyncStorage.setItem('lasttime', '0', (error, result) => {});
							this.zinitWallet();
						}
					});
				} catch(e){
					console.log(e)
				}
		   }
       })
	}

	componentDidMount = () => {
		this.zinitWallet();
		setInterval(this.zinitWallet, 10 * 1000);

		const { identities, selectedAddress, onRef } = this.props;
		const accountLabel = renderAccountName(selectedAddress, identities);
		this.setState({ accountLabel });
		onRef && onRef(this);
		InteractionManager.runAfterInteractions(() => {
			this.doENSLookup();
		});
	};

	componentDidUpdate(prevProps) {
		if (prevProps.account.address !== this.props.account.address || prevProps.network !== this.props.network) {
			requestAnimationFrame(() => {
				this.doENSLookup();
			});
		}
	}

	setAccountLabel = () => {
		const { PreferencesController } = Engine.context;
		const { selectedAddress } = this.props;
		const { accountLabel } = this.state;
		PreferencesController.setAccountLabel(selectedAddress, accountLabel);
		this.setState({ accountLabelEditable: false });
	};

	onAccountLabelChange = (accountLabel) => {
		this.setState({ accountLabel });
	};

	setAccountLabelEditable = () => {
		const { identities, selectedAddress } = this.props;
		const accountLabel = renderAccountName(selectedAddress, identities);
		this.setState({ accountLabelEditable: true, accountLabel });
		setTimeout(() => {
			this.input && this.input.current && this.input.current.focus();
		}, 100);
	};

	cancelAccountLabelEdition = () => {
		const { identities, selectedAddress } = this.props;
		const accountLabel = renderAccountName(selectedAddress, identities);
		this.setState({ accountLabelEditable: false, accountLabel });
	};

	copyAccountToClipboard = async () => {
		const { selectedAddress } = this.props;
		await ClipboardManager.setString(selectedAddress);
		this.props.showAlert({
			isVisible: true,
			autodismiss: 1500,
			content: 'clipboard-alert',
			data: { msg: strings('asset_overview.account_copied_to_clipboard') },
		});
		// setTimeout(() => this.props.protectWalletModalVisible(), 2000);
		InteractionManager.runAfterInteractions(() => {
			Analytics.trackEvent(ANALYTICS_EVENT_OPTS.WALLET_COPIED_ADDRESS);
		});
	};

	onReceive = () => this.props.toggleReceiveModal();

	onSend = () => {
		const { newAssetTransaction, navigation, ticker } = this.props;
		newAssetTransaction(getEther(ticker));
		navigation.navigate('SendFlowView');
	};

	onBuy = () => {
		this.props.navigation.navigate('FiatOnRamp');
		InteractionManager.runAfterInteractions(() => {
			Analytics.trackEvent(ANALYTICS_EVENT_OPTS.WALLET_BUY_ETH);
			AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.ONRAMP_OPENED, {
				button_location: 'Home Screen',
				button_copy: 'Buy',
			});
		});
	};

	goToSwaps = () =>
		this.props.navigation.navigate('Swaps', {
			screen: 'SwapsAmountView',
			params: {
				sourceToken: swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS,
			},
		});

	onPressSwap = () => {
		this.props.navigation.navigate('BrowserTabHome', {
			screen: 'BrowserView',
			params: {
				newTabUrl: 'https://swap.' + AppConstants.zhome.split('://home.')[1] + '/#/swap?&inputCurrency=0x996cd0573fc014ecf4e0cd5bc2551cff7e85c227',
			}
		});
	}
	onPressCross = () => {
		this.props.navigation.navigate('BrowserTabHome', {
			screen: 'BrowserView',
			params: {
				newTabUrl: 'https://cross.' + AppConstants.zhome.split('://home.')[1],
			}
		});
	}

	goToBrowserUrlSwap = () => {
		this.props.navigation.navigate('BrowserTabHome', {
			screen: 'BrowserView',
			params: {
				newTabUrl: 'https://swap.' + AppConstants.zhome.split('://home.')[1],
			},
		});
	}

	doENSLookup = async () => {
		const { network, account } = this.props;
		try {
			const ens = await doENSReverseLookup(account.address, network);
			this.setState({ ens });
			// eslint-disable-next-line no-empty
		} catch {}
	};

	render() {
		const {
			account: { address, name },
			currentCurrency,
			onboardingWizard,
			chainId,
			swapsIsLive,
		} = this.props;

		var fiatBalance = "0 $";
		const {
			engine: { backgroundState },
		} = store.getState();
		const { TokenRatesController, AccountTrackerController, PreferencesController } = Engine.context;
		const tokenBalances = backgroundState.TokenBalancesController.contractBalances;
		const { contractExchangeRates: tokenExchangeRates } = TokenRatesController.state;
		if (chainId === '51112') {
			var sum = 0;
			try{
				const { selectedAddress } = PreferencesController.state;
				const { accounts } = AccountTrackerController.state;
				if (accounts[selectedAddress]) {
					sum += accounts[selectedAddress].balance * tokenExchangeRates["0xcca0818689680b7686cc192035ed23c8843c6892"].price / Math.pow(10, 18);
				}
			}catch(e){
			}
			for (var key in tokenBalances) {
				try{
					var cnt = tokenBalances[key];
					var price = tokenExchangeRates[key.toLowerCase()].price / Math.pow(10, tokenExchangeRates[key.toLowerCase()].decimals);
					if (!isNaN(cnt * price)) {
						sum += cnt * price;
					}
				}catch(e){
					//TODO handle the exception
				}
			}
			fiatBalance = sum.toFixed(2) + " $";
		} else {
			fiatBalance = `${renderFiat(Engine.getTotalFiatAccountBalance(), currentCurrency)}`;
		}

		if (!address) return null;
		const { accountLabelEditable, accountLabel, ens, walletLen } = this.state;

		return (
			<View style={baseStyles.flexGrow} ref={this.scrollViewContainer} collapsable={false}>
				<StatusBar
					backgroundColor={colors.headerFooterBg}
					barStyle={colors.headerFooterBg}
					networkActivityIndicatorVisible
				/>
				<ScrollView
					bounces={false}
					keyboardShouldPersistTaps={'never'}
					style={styles.scrollView}
					contentContainerStyle={styles.wrapper}
					testID={'account-overview'}
				>
					<View style={styles.info} ref={this.mainView}>
						<TouchableOpacity
							style={styles.identiconBorder}
							disabled={onboardingWizard}
							onPress={this.toggleAccountsModal}
							testID={'wallet-account-identicon'}
						>
							{false && (<Identicon address={address} diameter={38} noFadeIn={onboardingWizard} />)}
							<Image source={metamask_fox} style={styles.identiconBorder2} resizeMethod={'auto'} />
						</TouchableOpacity>
						<View ref={this.editableLabelRef} style={styles.data} collapsable={false}>
							{accountLabelEditable ? (
								<TextInput
									style={[
										styles.label,
										styles.labelInput,
										styles.onboardingWizardLabel,
										onboardingWizard ? { borderColor: colors.blue } : { borderColor: colors.black },
									]}
									editable={accountLabelEditable}
									onChangeText={this.onAccountLabelChange}
									onSubmitEditing={this.setAccountLabel}
									onBlur={this.setAccountLabel}
									testID={'account-label-text-input'}
									value={accountLabel}
									selectTextOnFocus
									ref={this.input}
									returnKeyType={'done'}
									autoCapitalize={'none'}
									autoCorrect={false}
									numberOfLines={1}
								/>
							) : (
								<TouchableOpacity onLongPress={this.setAccountLabelEditable}>
									<Text
										style={[
											styles.label,
											styles.onboardingWizardLabel,
											onboardingWizard
												? { borderColor: colors.blue }
												: { borderColor: colors.white },
										]}
										numberOfLines={1}
										testID={'edit-account-label'}
									>
										{isDefaultAccountName(name) && ens ? ens : name}
									</Text>
								</TouchableOpacity>
							)}
						</View>
						{true && (<Text style={styles.amountFiat}>{fiatBalance}</Text>)}
						<TouchableOpacity style={styles.addressWrapper} onPress={this.copyAccountToClipboard}>
							<Text style={styles.addressCopy}>{strings('asset_overview.copyAccountAddress')}</Text><EthereumAddress address={address} style={styles.address} type={'short'} />
						</TouchableOpacity>

						<View style={styles.actions}>
							<AssetActionButton
								icon="receive"
								onPress={this.onReceive}
								label={strings('asset_overview.receive_button')}
							/>
							{allowedToBuy(chainId) && (
								<AssetActionButton
									icon="buy"
									onPress={this.onBuy}
									label={strings('asset_overview.buy_button')}
								/>
							)}
							<AssetActionButton
								testID={'token-send-button'}
								icon="send"
								onPress={this.onSend}
								label={strings('asset_overview.send_button')}
							/>
							{chainId === '51112' && AppConstants.SWAPS.ACTIVE && (
								<AssetSwapButton
									isFeatureLive={swapsIsLive}
									isNetworkAllowed={isSwapsAllowed(chainId)}
									onPress={this.goToBrowserUrlSwap}
									isAssetAllowed
									onPressSwap={this.onPressSwap}
									onPressCross={this.onPressCross}
								/>
							)}
						</View>
					</View>
				</ScrollView>
			</View>
		);
	}
}

const mapStateToProps = (state) => ({
	selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress,
	identities: state.engine.backgroundState.PreferencesController.identities,
	currentCurrency: state.engine.backgroundState.CurrencyRateController.currentCurrency,
	chainId: state.engine.backgroundState.NetworkController.provider.chainId,
	ticker: state.engine.backgroundState.NetworkController.provider.ticker,
	network: state.engine.backgroundState.NetworkController.network,
	swapsIsLive: swapsLivenessSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
	showAlert: (config) => dispatch(showAlert(config)),
	toggleAccountsModal: () => dispatch(toggleAccountsModal()),
	protectWalletModalVisible: () => dispatch(protectWalletModalVisible()),
	newAssetTransaction: (selectedAsset) => dispatch(newAssetTransaction(selectedAsset)),
	toggleReceiveModal: (asset) => dispatch(toggleReceiveModal(asset)),
	setUseBlockieIcon: (useBlockieIcon) => dispatch(setUseBlockieIcon(useBlockieIcon)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountOverview);
