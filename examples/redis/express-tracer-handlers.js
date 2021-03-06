'use strict';

const api = require('@opentelemetry/api');

function getMiddlewareTracer(tracer) {
  return (req, res, next) => {
    const span = tracer.startSpan(`express.middleware.tracer(${req.method} ${req.path})`, {
      kind: api.SpanKind.SERVER,
    });

    // End this span before sending out the response
    const originalSend = res.send;
    res.send = function send(...args) {
      span.end();
      originalSend.apply(res, args);
    };

    api.context.with(api.setSpan(api.ROOT_CONTEXT, span), next);
  };
}

function getErrorTracer(tracer) {
  return (err, _req, res, _next) => {
    console.error('Caught error', err.message);
    const span = tracer.getCurrentSpan();
    if (span) {
      span.setStatus({ code: api.StatusCode.ERROR, message: err.message });
    }
    res.status(500).send(err.message);
  };
}

module.exports = {
  getMiddlewareTracer, getErrorTracer,
};
