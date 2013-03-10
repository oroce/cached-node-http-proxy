var
	httpProxy = require( "http-proxy" ),
	http = require( "http" ),
	cache = require( "./lib/cache" ),
	express = require( "express"),
	restreamer= require( "connect-restreamer" ),
	app = express();

var hostForPath = {
	"/elvira.dll/uf": {
		host: "elvira.mav-start.hu",
		port: 80,
		keyGen: function( req ){
			return req.param( "e" )+req.param( "i" );
		}
	},
	"/elvira.dll/xslvzs/": {
		host: "elvira.mav-start.hu",
		port: 80
	},
	"/map.aspx/getData": {
		host: "vonatinfo.mav-start.hu",
		port: 80
	},
	"/fontgif": {
		host: "elvira.mav-start.hu",
		port: 80
	}
};


app.use( express.bodyParser() );

app.use(function( req, res, next ){
	var host = hostForPath[ req.path ];
	if( !host ){
		return res.send( 404 );
	}
	req.proxyHost = host;
	next();
});

app.use(
	cache({
		prefix: "proxy-cache:",
		keyGen: function( req ){
			return ( req.proxyHost.keyGen||cache.keyGen )( req );
		}
	})
);

app.use( restreamer() );

var routingProxy = new httpProxy.RoutingProxy();
app.use(function( req, res, next ){
	routingProxy.proxyRequest( req, res, req.proxyHost );
});

var server = http.createServer( app );
server.listen( 5555, function( err ){
	if( err ){
		return console.error( "could not start proxy server:", err );
	}
	console.log( "proxy server is running:", server.address() );
});