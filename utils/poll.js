const { update_executed_withdraws } = require('../controllers/transfer');
const { get_transfers_list, flush_money } = require('../controllers/flush');

async function poll() {
  console.log('polling start');
  try {
    await get_transfers_list();

    await flush_money();

    await update_executed_withdraws();
  } catch (e) {
    if (e.code && e.code >= 4000) console.log(e);
    else throw e;
  } finally {
    console.log('polling end');

    setTimeout(() => {
      poll();
    }, 5000);
  }
}

module.exports = poll;
