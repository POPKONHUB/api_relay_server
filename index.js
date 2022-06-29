'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const JsonRpc = require('@koalex/koa-json-rpc');

const http = {
  http: require('http'),
  https: require('https'),
};
const fs = require('fs');
const path = require('path');
require('dotenv') 
  .config({ path: path.join(process.cwd(), process.env.NODE_ENV === 'production' ? '운영용 환경설정 파일' : '개발용 환경설정 파일') });

const config = require('./config');

const methods = require('./utils/methods');
const get_henesis_response = require('./controllers');
const poll = require('./utils/poll');

const app = new Koa();
const router = new Router();

const jsonrpc = new JsonRpc({
  bodyParser: bodyParser({
    onerror(e, ctx) {
      ctx.status = 200;
      ctx.body = JsonRpc.parseError;
    },
  }),
});

router.post('/내부path', jsonrpc.middleware);
router.get('/ping', (ctx, next) => {
  ctx.body = 'pong';
  next();
});

app.use(router.routes());
app.use(router.allowedMethods());

function setup_jsonrpc_methods() {
  const state = {};

  for (const m of Object.keys(methods)) {
    const method = methods[m];

    jsonrpc.method(m, async (ctx, next) => {
      try {
        console.log(`request method: ${m}`);
        console.log(ctx.jsonrpc.params);

        const req = method.req(state, ctx.jsonrpc.params);

        const backend_resp = await get_henesis_response(m, req);

        const resp = method.resp(state, backend_resp);

        ctx.body = resp || 0;
      } catch (e) {
        console.error(e);
        if (e.code && e.code >= 4000) {
          ctx.body = {
            status: e.code,
            message: e.message,
          };
        } else throw e;
      } finally {
        await next();
      }
    });
  }
}

const _create_server = {
  http: () => {
    return http['http'].createServer(app.callback());
  },
  https: () => {
    const { key, cert } = config.inst().frontend;

    const k = fs.readFileSync(path.resolve(process.cwd(), key)).toString();
    const c = fs.readFileSync(path.resolve(process.cwd(), cert)).toString();

    return http['https'].createServer(
      {
        key: k,
        cert: c,
      },
      app.callback()
    );
  },
};

function create_server() {
  return _create_server[config.inst().frontend.protocol]();
}

async function main() {
  setup_jsonrpc_methods();

  const server = create_server();

  const { port, host } = config.inst().frontend;

  server.listen(port, host);
  console.log(`server listening - ${process.env.NODE_ENV || 'development'}`);
}

(async () => {
  try {
    await main();
    if (process.env.NODE_ENV === 'production' && process.env.INSTANCE_ID !== '0') return;
    await poll();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
