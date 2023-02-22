/*
 * Copyright (c) 2022 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const debug = false;

// developers.cloudflare.com/workers/runtime-apis/fetch-event/#syntax-module-worker
export default {
  async fetch(r, env, ctx) {
    return handleRequest(r);
  },
};

async function handleRequest(request) {
  if (debug) logr(request)

  return requiresJson(request) ? dohJson(request) : doh(request)
}

function requiresJson(r) {
  return r.method === "GET" &&
    r.headers.get("accept") !== "application/dns-message"
}

async function dohJson(request) {
  return forwardDnsJsonMessage(request)

  // TODO: It is not possible to remove cf headers
  // let u = new URL(request.url)
  // res = new Response(res.body, res)
  // res.headers.set('Access-Control-Allow-Origin', u.origin)
  // res.headers.append('Vary', 'Origin')
  // res.headers.set('x-server', 'bravedns')
  // res.headers.set('expect-ct', '')
  // res.headers.set('content-type', 'application/dns-json')
  // res.headers.set('content-encoding', 'gzip')
  // const s = res.headers.get('cache-control')
  // if (s) res.headers.set('cache-control', s)
  // res.headers.delete('expect-ct')
  // res.headers.delete('cf-ray')
  // res.headers.delete('set-cookie')
  // res.headers.delete('report-to')
  // return res;
}

async function doh(request) {
  return forwardDnsMessage(request)

  // TODO: cors headers
  // let u = new URL(request.url)
  // res = new Response(res.body, res)
  // res.headers.set('Access-Control-Allow-Origin', u.origin)
  // res.headers.append('Vary', 'Origin')
  // res.headers.set('server', 'bravedns')
  // res.headers.delete('expect-ct')
  // res.headers.delete('cf-ray')
  // return res
}

async function forwardDnsMessage(request) {
  const u1 = new URL(request.url)
  u1.hostname = "cloudflare-dns.com"
  u1.pathname = "dns-query"
  const req1 = new Request(u1.href, request)
  req1.headers.set('accept', 'application/dns-message')
  req1.headers.set('content-type', 'application/dns-message')
  req1.headers.set('Origin', u1.origin)

  const u2 = new URL(request.url)
  u2.hostname = "dns.google"
  u2.pathname = "dns-query"
  const req2 = new Request(u2.href, request)
  req2.headers.set('accept', 'application/dns-message')
  req2.headers.set('content-type', 'application/dns-message')
  req2.headers.set('Origin', u2.origin)

  return Promise.any([fetch(req1), fetch(req2)])
}

async function forwardDnsJsonMessage(request) {
  const u1 = new URL(request.url)
  u1.hostname = "cloudflare-dns.com"
  u1.pathname = "dns-query"
  const req1 = new Request(u1.href, request)
  req1.headers.set('accept', 'application/dns-json')
  req1.headers.set('Origin', u1.origin)

  const u2 = new URL(request.url)
  u2.hostname = "dns.google"
  u2.pathname = "dns-query"
  const req2 = new Request(u2.href, request)
  req2.headers.set('accept', 'application/dns-json')
  req2.headers.set('Origin', u2.origin)

  return Promise.any([fetch(req1), fetch(req2)])
}

function getParam(url, key) {
  return url.searchParams.get(key)
}

function logh(h) {
  for (let p of h) console.log(p)
}

function logr(r) {
  for (i in r) console.log(i, r[i])
}

