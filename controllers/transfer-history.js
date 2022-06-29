const history = require('../models/dw-history');
const { check_user_exist, calculate_wei, format_database_timestamp, timestamp_to_date } = require('../utils/common');
const { error_status } = require('../utils/const');

exports.get_transfer_history = async function ({
  user_id, 
  partners_code,
  begin,
  end,
  coin_code,
  row_offset,
  row_count,
  transfer_type,
}) {
  const { status, user_info } = await check_user_exist({ user_id, partners_code });
  if (status && !user_info) return { status: error_status.no_data, message: '존재하지 않는 유저입니다.' };

  if (row_offset < 0) return { status: error_status.wrong_input, message: 'row_offset은 0 이상이어야 합니다.' };
  if (row_count < 0 || row_count > 20) return { status: error_status.wrong_input, message: 'row_count는 0 이상 20 이하여야 합니다.' };

  if (!['withdrawal', 'deposit', 'all'].includes(transfer_type)) return { status: error_status.wrong_input, message: `유효하지 않은 transfer_type입니다 : ${transfer_type}` };

  const [rows, total_count] = await history.get_user_history({
    user_id, 
    partners_code,
    begin,
    end,
    coin_code,
    row_offset,
    row_count,
    transfer_type,
  });

  const mapped_rows = rows.map((el) => {
    const created_at_timestamp = format_database_timestamp(el['생성일']);

    return [
		"row 내역"
    ];
  });

  return {
    row_offset,
    row_count: rows.length,
    total_count,
    data: mapped_rows,
  };
};
