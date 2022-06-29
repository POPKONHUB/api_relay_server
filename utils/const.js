
const BigNumber = require('bignumber.js');

module.exports = {
  coins: [
    {
      code: 'ETH',
      id: 'ETH ID',
    },
    {
      code: 'EVT',
      id: 'EVT ID',
    },
    {
      code: 'POPK',
      id: 'POPK ID',
    },
  ],
  main_coin: 'POPK', 
  error_status: {
    no_data: 10010,
    wrong_input: 10030,
  },
  wei_coefficient: new BigNumber(10).pow(18).toNumber(),
};
