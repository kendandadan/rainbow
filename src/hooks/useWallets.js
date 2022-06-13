import { toLower } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { findLatestBackUp } from '../model/backup';
import {
  addressSetSelected,
  setIsWalletLoading as rawSetIsWalletLoading,
  walletsSetSelected,
} from '../redux/wallets';
import useInitializeWallet from './useInitializeWallet';
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import logger from 'logger';

const walletSelector = createSelector(
  ({ wallets: { isWalletLoading, selected = {}, walletNames, wallets } }) => ({
    isWalletLoading,
    selectedWallet: selected,
    walletNames,
    wallets,
  }),
  ({ isWalletLoading, selectedWallet, walletNames, wallets }) => ({
    isWalletLoading,
    latestBackup: findLatestBackUp(wallets) || false,
    selectedWallet,
    walletNames,
    wallets,
  })
);

export default function useWallets() {
  const initializeWallet = useInitializeWallet();
  const dispatch = useDispatch();
  const {
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  } = useSelector(walletSelector);

  const setIsWalletLoading = useCallback(
    isLoading => dispatch(rawSetIsWalletLoading(isLoading)),
    [dispatch]
  );

  const isDamaged = useMemo(() => {
    const bool = selectedWallet?.damaged;
    if (bool) {
      logger.sentry('Wallet is damaged. Check values below:');
      logger.sentry('selectedWallet: ', selectedWallet);
      logger.sentry('wallets: ', wallets);
    }
    return bool;
  }, [selectedWallet, wallets]);

  const switchToWalletWithAddress = async address => {
    const walletKey = Object.keys(wallets).find(key => {
      // Addresses
      return wallets[key].addresses.find(
        account => toLower(account.address) === toLower(address)
      );
    });

    if (!walletKey) return;
    const p1 = dispatch(walletsSetSelected(wallets[walletKey]));
    const p2 = dispatch(addressSetSelected(toChecksumAddress(address)));
    await Promise.all([p1, p2]);
    return initializeWallet(null, null, false, false, null, null, null, true);
  };

  return {
    isDamaged,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    setIsWalletLoading,
    switchToWalletWithAddress,
    walletNames,
    wallets,
  };
}
