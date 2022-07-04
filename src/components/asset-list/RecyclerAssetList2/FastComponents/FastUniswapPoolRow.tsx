import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../../../animations';
import FastCoinIcon from './FastCoinIcon';
import FastPoolValue from './FastPoolValue';
import { Text } from '@rainbow-me/design-system';
import { supportedNativeCurrencies } from '@rainbow-me/references';

interface UniswapCoinRowItem {
  onPress: () => void;
  tokens: any[];
  theme: any;
  tokenNames: string;
  symbol: string;
  value: number;
  attribute: string;
  nativeCurrency: keyof typeof supportedNativeCurrencies;
}

export default React.memo(function UniswapCoinRow({
  item,
}: {
  item: UniswapCoinRowItem;
}) {
  return (
    <View style={[sx.rootContainer, sx.nonEditMode]}>
      <View style={sx.flex}>
        <ButtonPressAnimation
          onPress={item.onPress}
          scaleTo={0.96}
          testID="balance-coin-row"
        >
          <View style={sx.container}>
            <View style={sx.reverseRow}>
              <View style={sx.translateX}>
                <FastCoinIcon
                  address={item.tokens[1].address.toLowerCase()}
                  symbol={item.tokens[1].symbol}
                  theme={item.theme}
                />
              </View>
              <FastCoinIcon
                address={item.tokens[0].address.toLowerCase()}
                symbol={item.tokens[0].symbol}
                theme={item.theme}
              />
            </View>
            <View style={sx.innerContainer}>
              <View style={sx.row}>
                <Text
                  align="right"
                  numberOfLines={1}
                  size="16px"
                  weight="regular"
                >
                  {item.tokenNames}
                </Text>
              </View>
              <View style={[sx.row, sx.bottom]}>
                <Text
                  color={{ custom: item.theme.colors.blueGreyDark50 }}
                  size="14px"
                >
                  {item.symbol}
                </Text>
              </View>
            </View>
            <View style={sx.poolValue}>
              <FastPoolValue
                nativeCurrency={item.nativeCurrency}
                theme={item.theme}
                type={item.attribute}
                value={item.value}
              />
            </View>
          </View>
        </ButtonPressAnimation>
      </View>
    </View>
  );
});

const sx = StyleSheet.create({
  bottom: {
    marginTop: 17,
  },
  container: {
    flexDirection: 'row',
    marginRight: 19,
  },
  flex: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    marginLeft: 14,
    marginTop: 14,
  },
  nonEditMode: {
    paddingLeft: 19,
  },
  poolValue: {
    marginTop: 8,
  },
  reverseRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    width: 66,
  },
  rootContainer: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  translateX: {
    transform: [{ translateX: -10 }],
  },
});
