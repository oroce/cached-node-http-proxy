cached-node-http-proxy
======================

Using node-http-proxy with cache middleware

why
======================

I have an app (https://bitbucket.org/oroce/elvira-api/wiki/Home) which scrapes the hungarian train schedule website (http://mav-start.hu), under heavy load it's fuckin slow (sometimes the response could be more than 2-3 seconds), mostly between 6-9am and 5-8pm, so I've created this app to proxy requests and cache the response.

but why another app
======================

I know I could use varnish or squid, but I don't want, that's all.


I could even use connect-cache or sg like that, but caching for this service is based on query string/body parameters.

