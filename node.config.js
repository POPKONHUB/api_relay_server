module.exports = {
  apps: [
    {
      name: 'henesis-relay-server',
      script: './',
      error_file: '../logs/log_err',
      out_file: '../logs/log_out',
      instances: 4,
      instance_var: 'INSTANCE_ID',
      exec_mode: 'cluster',
      log_date_format: 'YYYY-MM-DD_HH-mm-ss',
    },
  ],
};
